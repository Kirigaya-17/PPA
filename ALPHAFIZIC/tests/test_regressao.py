"""Testes de regressão: garantem que o fluxo normal da aplicação continua
funcionando após o hardening de segurança."""
import os
import sys
import re

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from sqlalchemy import text


@pytest.fixture(scope='function')
def app():
    from app import app as flask_app, db, limiter
    flask_app.config['TESTING'] = True
    flask_app.config['WTF_CSRF_ENABLED'] = True
    limiter.reset()
    with flask_app.app_context():
        for tbl in ['atividades_aluno', 'aluno_turma', 'mensagens', 'atividades',
            'turmas', 'professores', 'alunos', 'usuarios']:
            db.session.execute(text(f'DELETE FROM {tbl}'))
        db.session.commit()
    yield flask_app


@pytest.fixture
def client(app):
    return app.test_client()


def token(html, name='csrf_token'):
    if name == 'csrf_token':
        m = re.search(r'name="csrf_token" value="([^"]+)"', html)
    else:
        m = re.search(r'name="csrf-token" content="([^"]+)"', html)
    return m.group(1)


class TestRegressao:

    def test_pagina_inicial_carrega(self, client):
        assert client.get('/').status_code == 200

    def test_cadastro_professor_completo(self, client, app):
        r = client.get('/cadastro2?tipo=professor')
        t = token(r.get_data(as_text=True))
        resp = client.post('/cadastro2?tipo=professor', data={
            'csrf_token': t, 'nome': 'Maria Professora', 'email': 'maria@escola.com',
            'cpf': '12345678901', 'senha': 'SenhaForte123', 'tipo': 'professor',
        }, follow_redirects=True)
        assert resp.status_code == 200
        from app.models import Usuario, Professor
        with app.app_context():
            u = Usuario.query.filter_by(email='maria@escola.com').first()
            assert u is not None
            assert u.tipo_usuario == 'professor'
            p = Professor.query.filter_by(usuario_id=u.id_usuario).first()
            assert p is not None

    def test_cadastro_aluno_completo(self, client, app):
        r = client.get('/cadastro2?tipo=aluno')
        t = token(r.get_data(as_text=True))
        resp = client.post('/cadastro2?tipo=aluno', data={
            'csrf_token': t, 'nome': 'Joao Aluno', 'email': 'joao@escola.com',
            'cpf': '98765432100', 'senha': 'SenhaForte123', 'tipo': 'aluno',
        }, follow_redirects=True)
        assert resp.status_code == 200
        from app.models import Usuario, Aluno
        with app.app_context():
            u = Usuario.query.filter_by(email='joao@escola.com').first()
            assert u is not None
            assert u.tipo_usuario == 'aluno'
            a = Aluno.query.filter_by(usuario_id=u.id_usuario).first()
            assert a is not None

    def test_login_logout_fluxo_completo(self, client):
        r = client.get('/cadastro2?tipo=professor')
        t = token(r.get_data(as_text=True))
        client.post('/cadastro2?tipo=professor', data={
            'csrf_token': t, 'nome': 'Carlos', 'email': 'carlos@escola.com',
            'cpf': '11122233344', 'senha': 'SenhaForte123', 'tipo': 'professor',
        }, follow_redirects=True)

        r2 = client.get('/login')
        t2 = token(r2.get_data(as_text=True))
        login_resp = client.post('/login', data={
            'csrf_token': t2, 'email': 'carlos@escola.com', 'senha': 'SenhaForte123',
        }, follow_redirects=True)
        assert login_resp.status_code == 200
        assert 'Carlos' in login_resp.get_data(as_text=True) or 'CARLOS' in login_resp.get_data(as_text=True).upper()

        menu = client.get('/professorMenu')
        assert menu.status_code == 200

        logout_resp = client.get('/logout', follow_redirects=True)
        assert logout_resp.status_code == 200

        # Depois do logout, a área protegida deve voltar a exigir login.
        menu2 = client.get('/professorMenu')
        assert menu2.status_code == 401

    def test_login_senha_errada_nao_autentica(self, client):
        r = client.get('/cadastro2?tipo=professor')
        t = token(r.get_data(as_text=True))
        client.post('/cadastro2?tipo=professor', data={
            'csrf_token': t, 'nome': 'Ana', 'email': 'ana@escola.com',
            'cpf': '55566677788', 'senha': 'SenhaForte123', 'tipo': 'professor',
        }, follow_redirects=True)

        r2 = client.get('/login')
        t2 = token(r2.get_data(as_text=True))
        resp = client.post('/login', data={
            'csrf_token': t2, 'email': 'ana@escola.com', 'senha': 'senhaerrada',
        }, follow_redirects=True)
        assert 'incorretos' in resp.get_data(as_text=True)

    def test_editar_nome_perfil(self, client, app):
        r = client.get('/cadastro2?tipo=professor')
        t = token(r.get_data(as_text=True))
        client.post('/cadastro2?tipo=professor', data={
            'csrf_token': t, 'nome': 'Pedro', 'email': 'pedro@escola.com',
            'cpf': '99988877766', 'senha': 'SenhaForte123', 'tipo': 'professor',
        }, follow_redirects=True)
        r2 = client.get('/login')
        t2 = token(r2.get_data(as_text=True))
        client.post('/login', data={'csrf_token': t2, 'email': 'pedro@escola.com', 'senha': 'SenhaForte123'})

        menu = client.get('/professorMenu')
        t3 = token(menu.get_data(as_text=True), name='meta')
        client.post('/atualizar-perfil-inline', data={'csrf_token': t3, 'nome': 'Pedro Silva'}, follow_redirects=True)

        from app.models import Usuario
        with app.app_context():
            u = Usuario.query.filter_by(email='pedro@escola.com').first()
            assert u.nome == 'Pedro Silva'

    def test_editar_senha_perfil_e_novo_login_funciona(self, client, app):
        r = client.get('/cadastro2?tipo=professor')
        t = token(r.get_data(as_text=True))
        client.post('/cadastro2?tipo=professor', data={
            'csrf_token': t, 'nome': 'Lucia', 'email': 'lucia@escola.com',
            'cpf': '44433322211', 'senha': 'SenhaAntiga123', 'tipo': 'professor',
        }, follow_redirects=True)
        r2 = client.get('/login')
        t2 = token(r2.get_data(as_text=True))
        client.post('/login', data={'csrf_token': t2, 'email': 'lucia@escola.com', 'senha': 'SenhaAntiga123'})

        menu = client.get('/professorMenu')
        t3 = token(menu.get_data(as_text=True), name='meta')
        client.post('/atualizar-perfil-inline', data={'csrf_token': t3, 'senha': 'SenhaNova456'}, follow_redirects=True)

        client.get('/logout')
        r3 = client.get('/login')
        t4 = token(r3.get_data(as_text=True))
        resp = client.post('/login', data={'csrf_token': t4, 'email': 'lucia@escola.com', 'senha': 'SenhaNova456'}, follow_redirects=True)
        assert 'sucesso' in resp.get_data(as_text=True).lower() or resp.status_code == 200
        menu2 = client.get('/professorMenu')
        assert menu2.status_code == 200

    def test_email_duplicado_bloqueado_no_cadastro(self, client):
        r = client.get('/cadastro2?tipo=professor')
        t = token(r.get_data(as_text=True))
        client.post('/cadastro2?tipo=professor', data={
            'csrf_token': t, 'nome': 'Original', 'email': 'dup@escola.com',
            'cpf': '11111111111', 'senha': 'SenhaForte123', 'tipo': 'professor',
        }, follow_redirects=True)

        r2 = client.get('/cadastro2?tipo=professor')
        t2 = token(r2.get_data(as_text=True))
        resp = client.post('/cadastro2?tipo=professor', data={
            'csrf_token': t2, 'nome': 'Duplicado', 'email': 'dup@escola.com',
            'cpf': '22222222222', 'senha': 'OutraSenha123', 'tipo': 'professor',
        }, follow_redirects=True)
        assert 'já cadastrado' in resp.get_data(as_text=True)

    def test_conexao_com_banco_relacional_funciona_com_relacionamentos(self, app):
        """Testa a integração real com MySQL: cria usuário+professor, turma
        vinculada, atividade vinculada à turma -- percorrendo os
        relacionamentos SQLAlchemy corrigidos."""
        from app import db
        from app.models import Usuario, Professor, Turma, Atividade
        with app.app_context():
            u = Usuario(nome='Prof Integra', email='integra@escola.com', tipo_usuario='professor')
            u.set_senha('SenhaForte123')
            db.session.add(u)
            db.session.flush()

            p = Professor(usuario_id=u.id_usuario, area='Matemática')
            db.session.add(p)
            db.session.flush()

            t = Turma(nome_turma='9º Ano A', codigo_turma='9A-2026', professor_id=p.id_professor)
            db.session.add(t)
            db.session.flush()

            a = Atividade(titulo='Prova de Frações', dificuldade='medio', id_turma=t.id_turma)
            db.session.add(a)
            db.session.commit()

            # Percorre os relacionamentos de volta (isso teria quebrado com
            # as FKs erradas do models.py original)
            assert t.professor.usuario.nome == 'Prof Integra'
            assert a.turma.nome_turma == '9º Ano A'
            assert list(p.turmas) == [t]

    def test_rotas_administrativas_inexistentes_nao_expostas(self, client):
        """Não existe rota /admin nesta versão do projeto -- confirma que
        nenhuma rota administrativa ficou acidentalmente exposta sem
        proteção (404, não 200)."""
        resp = client.get('/admin')
        assert resp.status_code == 404


if __name__ == '__main__':
    sys.exit(pytest.main([__file__, '-v']))
