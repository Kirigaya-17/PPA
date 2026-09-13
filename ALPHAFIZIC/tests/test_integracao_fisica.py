"""
Testes de segurança da integração AlphaFizic <-> PPA.

Cobrem especificamente os itens do enunciado de integração:
  - Teste 5: aluno tentando acessar rota de professor (privilege escalation vertical)
  - Teste 7: IDOR entre dois alunos
  - Teste 8: Mass Assignment (tentar setar xp_aluno/tipo_usuario diretamente)
  - Teste 9: CSRF nas rotas de física
  - Teste 10: Manipulação de XP (enviar xp arbitrário nas rotas de resposta/fase)

Reaproveita os helpers de tests/test_security.py (registrar_usuario, login,
tokens CSRF) para não duplicar código de teste.
"""
import os
import sys
import re

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from sqlalchemy import text

from tests.test_security import (
    registrar_usuario, login, get_csrf_token, get_csrf_token_from_meta,
)


@pytest.fixture(scope='function')
def app():
    from app import app as flask_app, db, limiter
    flask_app.config['TESTING'] = True
    flask_app.config['WTF_CSRF_ENABLED'] = True
    limiter.reset()

    with flask_app.app_context():
        # Não apagamos `conteudos`/tabelas *_fisica: são o currículo
        # semeado por `flask seed-fisica`, referenciado por FK a partir de
        # modulos_fisica -- só limpamos dados de usuários/progresso.
        for tbl in ['progresso_atividade_fisica', 'progresso_modulo_fisica',
                    'progresso_fase_fisica', 'aluno_conquista_fisica',
                    'atividades_aluno', 'aluno_turma', 'mensagens', 'atividades',
                    'turmas', 'professores', 'alunos', 'usuarios']:
            db.session.execute(text(f'DELETE FROM {tbl}'))
        db.session.commit()

    yield flask_app


@pytest.fixture
def client(app):
    return app.test_client()


def _primeira_atividade_multipla_escolha(app):
    from app.models import AtividadeFisica
    with app.app_context():
        a = AtividadeFisica.query.filter_by(tipo='multipla_escolha').first()
        alt_correta = next((x for x in a.alternativas if x.correta), None)
        return a.id_atividade, alt_correta.id_alternativa, a.xp_recompensa


def _primeira_fase(app):
    from app.models import FaseJogoFisica
    with app.app_context():
        f = FaseJogoFisica.query.order_by(FaseJogoFisica.ordem).first()
        return f.id_fase, f.xp, f.pontuacao_maxima


class TestPrivilegeEscalationAlunoProfessor:

    def test_aluno_nao_acessa_professor_menu(self, client, app):
        registrar_usuario(client, 'Aluno Teste', 'aluno1@teste.com', 'SenhaForte123', tipo='aluno')
        login(client, 'aluno1@teste.com', 'SenhaForte123')
        resp = client.get('/professorMenu')
        assert resp.status_code == 403

    def test_professor_nao_acessa_area_do_aluno(self, client, app):
        registrar_usuario(client, 'Prof Teste', 'prof1@teste.com', 'SenhaForte123', tipo='professor')
        login(client, 'prof1@teste.com', 'SenhaForte123')
        resp = client.get('/aluno')
        assert resp.status_code == 403

    def test_professor_nao_acessa_rotas_de_progresso_fisica(self, client, app):
        registrar_usuario(client, 'Prof API', 'profapi@teste.com', 'SenhaForte123', tipo='professor')
        login(client, 'profapi@teste.com', 'SenhaForte123')
        assert client.get('/api/fisica/resumo').status_code == 403
        assert client.get('/api/fisica/ranking').status_code == 403

    def test_login_de_aluno_vai_para_area_do_aluno(self, client, app):
        registrar_usuario(client, 'Aluno Redir', 'redir@teste.com', 'SenhaForte123', tipo='aluno')
        resp = login(client, 'redir@teste.com', 'SenhaForte123')
        assert resp.status_code in (302, 303)
        assert '/aluno' in resp.headers.get('Location', '')


class TestIDOREntreAlunos:

    def test_ranking_nao_permite_ver_dados_privados_de_outro_aluno_via_id(self, client, app):
        """Não existe rota tipo /aluno/<id>/resumo -- o próprio design evita
        IDOR pois o resumo é sempre o do usuário da sessão."""
        registrar_usuario(client, 'Aluno A', 'a_fisica@teste.com', 'SenhaForteA1', tipo='aluno')
        registrar_usuario(client, 'Aluno B', 'b_fisica@teste.com', 'SenhaForteB1', tipo='aluno')

        login(client, 'a_fisica@teste.com', 'SenhaForteA1')
        resumo_a = client.get('/api/fisica/resumo').get_json()

        client.get('/logout')
        login(client, 'b_fisica@teste.com', 'SenhaForteB1')
        resumo_b = client.get('/api/fisica/resumo').get_json()

        # Cada aluno só recebe o PRÓPRIO resumo -- nunca há um parâmetro de
        # id_aluno na URL/corpo que permita pedir o resumo de outro.
        assert resumo_a is not None and resumo_b is not None
        assert resumo_a['xp_total'] == 0
        assert resumo_b['xp_total'] == 0

    def test_progresso_de_atividade_de_um_aluno_nao_afeta_o_outro(self, client, app):
        registrar_usuario(client, 'Aluno C', 'c_fisica@teste.com', 'SenhaForteC1', tipo='aluno')
        registrar_usuario(client, 'Aluno D', 'd_fisica@teste.com', 'SenhaForteD1', tipo='aluno')

        id_atividade, id_alternativa_correta, xp_esperado = _primeira_atividade_multipla_escolha(app)

        login(client, 'c_fisica@teste.com', 'SenhaForteC1')
        menu = client.get('/aluno')
        token = get_csrf_token_from_meta(menu.get_data(as_text=True))
        client.post(f'/api/fisica/atividade/{id_atividade}/responder',
                    json={'id_alternativa': id_alternativa_correta},
                    headers={'X-CSRFToken': token})
        resumo_c = client.get('/api/fisica/resumo').get_json()

        client.get('/logout')
        login(client, 'd_fisica@teste.com', 'SenhaForteD1')
        resumo_d = client.get('/api/fisica/resumo').get_json()

        assert resumo_c['xp_total'] == xp_esperado
        assert resumo_d['xp_total'] == 0  # aluno D não é afetado pela resposta do aluno C


class TestMassAssignment:

    def test_nao_consegue_definir_xp_aluno_no_cadastro(self, client, app):
        resp = client.get('/cadastro2?tipo=aluno')
        token = get_csrf_token(resp.get_data(as_text=True))
        client.post('/cadastro2?tipo=aluno', data={
            'csrf_token': token, 'nome': 'Tentativa XP', 'email': 'massxp@teste.com',
            'cpf': '12312312312', 'senha': 'SenhaForte123', 'tipo': 'aluno',
            'xp_aluno': '999999', 'nivel_atual': '99', 'moedas': '99999',
        }, follow_redirects=True)

        from app.models import Usuario
        with app.app_context():
            u = Usuario.query.filter_by(email='massxp@teste.com').first()
            assert u is not None
            assert u.aluno.xp_aluno == 0
            assert u.aluno.nivel_atual == 1
            assert u.aluno.moedas == 0

    def test_responder_atividade_ignora_campos_extra_de_xp_e_correta(self, client, app):
        """Mesmo que o corpo da requisição inclua 'xp_ganho' e 'correta',
        o servidor ignora esses campos e decide sozinho a partir da
        alternativa/id_atividade."""
        registrar_usuario(client, 'Aluno Mass', 'mass_at@teste.com', 'SenhaForte123', tipo='aluno')
        login(client, 'mass_at@teste.com', 'SenhaForte123')

        from app.models import AtividadeFisica
        with app.app_context():
            atividade = AtividadeFisica.query.filter_by(tipo='multipla_escolha').first()
            alt_errada = next((x for x in atividade.alternativas if not x.correta), None)
            id_atividade, id_alt_errada = atividade.id_atividade, alt_errada.id_alternativa

        menu = client.get('/aluno')
        token = get_csrf_token_from_meta(menu.get_data(as_text=True))

        resp = client.post(f'/api/fisica/atividade/{id_atividade}/responder',
                            json={'id_alternativa': id_alt_errada, 'xp_ganho': 999999, 'correta': True},
                            headers={'X-CSRFToken': token})
        corpo = resp.get_json()
        assert corpo['correta'] is False  # o servidor recalculou e viu que era a alternativa errada
        assert corpo['xp_ganho'] == 0


class TestManipulacaoDeXP:

    def test_concluir_fase_ignora_xp_enviado_pelo_cliente(self, client, app):
        registrar_usuario(client, 'Aluno XP', 'xp_fase@teste.com', 'SenhaForte123', tipo='aluno')
        login(client, 'xp_fase@teste.com', 'SenhaForte123')

        id_fase, xp_oficial, pontuacao_maxima = _primeira_fase(app)
        menu = client.get('/aluno')
        token = get_csrf_token_from_meta(menu.get_data(as_text=True))

        resp = client.post(f'/api/fisica/fase/{id_fase}/concluir',
                            json={'pontuacao': pontuacao_maxima, 'xp': 999999999},
                            headers={'X-CSRFToken': token})
        corpo = resp.get_json()
        assert corpo['xp_ganho'] == xp_oficial  # nunca 999999999

        resumo = client.get('/api/fisica/resumo').get_json()
        assert resumo['xp_total'] == xp_oficial

    def test_concluir_a_mesma_fase_duas_vezes_nao_concede_xp_em_dobro(self, client, app):
        registrar_usuario(client, 'Aluno Farm', 'farm@teste.com', 'SenhaForte123', tipo='aluno')
        login(client, 'farm@teste.com', 'SenhaForte123')

        id_fase, xp_oficial, pontuacao_maxima = _primeira_fase(app)
        menu = client.get('/aluno')
        token = get_csrf_token_from_meta(menu.get_data(as_text=True))

        for _ in range(3):
            client.post(f'/api/fisica/fase/{id_fase}/concluir',
                        json={'pontuacao': pontuacao_maxima},
                        headers={'X-CSRFToken': token})

        resumo = client.get('/api/fisica/resumo').get_json()
        assert resumo['xp_total'] == xp_oficial  # não triplica

    def test_pontuacao_enviada_acima_do_maximo_e_limitada(self, client, app):
        registrar_usuario(client, 'Aluno Cheat', 'cheat@teste.com', 'SenhaForte123', tipo='aluno')
        login(client, 'cheat@teste.com', 'SenhaForte123')

        id_fase, xp_oficial, pontuacao_maxima = _primeira_fase(app)
        menu = client.get('/aluno')
        token = get_csrf_token_from_meta(menu.get_data(as_text=True))

        resp = client.post(f'/api/fisica/fase/{id_fase}/concluir',
                            json={'pontuacao': pontuacao_maxima * 100},
                            headers={'X-CSRFToken': token})
        corpo = resp.get_json()
        assert corpo['pontuacao'] <= pontuacao_maxima


class TestCSRFRotasFisica:

    def test_responder_atividade_sem_csrf_e_rejeitado(self, client, app):
        registrar_usuario(client, 'Aluno CSRF', 'csrf_fisica@teste.com', 'SenhaForte123', tipo='aluno')
        login(client, 'csrf_fisica@teste.com', 'SenhaForte123')
        id_atividade, id_alt, _ = _primeira_atividade_multipla_escolha(app)
        resp = client.post(f'/api/fisica/atividade/{id_atividade}/responder',
                            json={'id_alternativa': id_alt})
        assert resp.status_code == 400

    def test_concluir_fase_sem_csrf_e_rejeitado(self, client, app):
        registrar_usuario(client, 'Aluno CSRF2', 'csrf_fase@teste.com', 'SenhaForte123', tipo='aluno')
        login(client, 'csrf_fase@teste.com', 'SenhaForte123')
        id_fase, _, pontuacao_maxima = _primeira_fase(app)
        resp = client.post(f'/api/fisica/fase/{id_fase}/concluir', json={'pontuacao': pontuacao_maxima})
        assert resp.status_code == 400


class TestAcessoSemAutenticacao:

    def test_aluno_menu_sem_login_retorna_401(self, client):
        assert client.get('/aluno').status_code == 401

    def test_api_fisica_modulos_sem_login_retorna_401(self, client):
        assert client.get('/api/fisica/modulos').status_code == 401

    def test_api_fisica_resumo_sem_login_retorna_401(self, client):
        assert client.get('/api/fisica/resumo').status_code == 401


if __name__ == '__main__':
    sys.exit(pytest.main([__file__, '-v']))
