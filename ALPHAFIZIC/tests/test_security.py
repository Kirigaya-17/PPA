"""
Suite de testes de segurança e regressão para o ALPHAFIZIC.

Executa contra um banco MySQL/MariaDB real (definido em DATABASE_URL),
usando o test_client do Flask (sem precisar de um servidor HTTP externo).

Uso:
    FLASK_TESTING=1 pytest -v test_security.py
"""
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
    flask_app.config['WTF_CSRF_ENABLED'] = True  # queremos testar o CSRF de verdade

    # Reseta o storage do rate limiter a cada teste para que um teste não
    # "contamine" o contador de outro (o storage em memória é compartilhado
    # por todo o processo pytest).
    limiter.reset()

    # IMPORTANTE: o app_context de limpeza é aberto e FECHADO aqui, antes do
    # yield. Se ficasse aberto durante todo o teste (ambiente/"ambient
    # context"), o Flask-WTF cacheia o token CSRF em flask.g -- que vive no
    # nível do app context, não do request -- e isso faz requisições
    # feitas pelo test client dentro do mesmo teste contaminarem umas às
    # outras ("The CSRF session token is missing"). Cada chamada do test
    # client deve criar seu próprio request/app context do zero.
    with flask_app.app_context():
        for tbl in ['atividades_aluno', 'aluno_turma', 'mensagens', 'atividades',
            'turmas', 'professores', 'alunos', 'usuarios']:
            db.session.execute(text(f'DELETE FROM {tbl}'))

    yield flask_app


@pytest.fixture
def client(app):
    return app.test_client()


def get_csrf_token(html: str) -> str:
    m = re.search(r'name="csrf_token" value="([^"]+)"', html)
    assert m, "Token CSRF não encontrado na página"
    return m.group(1)


def get_csrf_token_from_meta(html: str) -> str:
    """A página professorMenu.html é um SPA: os formulários (nome/bio/senha)
    só são injetados dinamicamente pelo JS (perfil.js), então não existem
    como <form> no HTML renderizado pelo servidor. O token CSRF fica
    disponível ali via <meta name="csrf-token">, exatamente como o próprio
    perfil.js lê para montar esses formulários no navegador real."""
    m = re.search(r'name="csrf-token" content="([^"]+)"', html)
    assert m, "Meta csrf-token não encontrada na página"
    return m.group(1)


def registrar_usuario(client, nome, email, senha, tipo='professor', cpf='12345678901'):
    resp = client.get(f'/cadastro2?tipo={tipo}')
    token = get_csrf_token(resp.get_data(as_text=True))
    return client.post(f'/cadastro2?tipo={tipo}', data={
        'csrf_token': token,
        'nome': nome,
        'email': email,
        'cpf': cpf,
        'contato': '11999999999',
        'senha': senha,
        'tipo': tipo,
    }, follow_redirects=True)


def login(client, email, senha):
    resp = client.get('/login')
    token = get_csrf_token(resp.get_data(as_text=True))
    return client.post('/login', data={
        'csrf_token': token,
        'email': email,
        'senha': senha,
    }, follow_redirects=False)


# ===========================================================================
# TESTE 1 — SQL Injection
# ===========================================================================
class TestSQLInjection:

    def test_login_sql_injection_classico(self, client):
        """Payload clássico ' OR '1'='1 não deve autenticar nem quebrar a app."""
        registrar_usuario(client, 'Prof Teste', 'prof1@teste.com', 'SenhaForte123')

        resp = client.post('/login', data={
            'csrf_token': get_csrf_token(client.get('/login').get_data(as_text=True)),
            'email': "' OR '1'='1",
            'senha': "' OR '1'='1",
        }, follow_redirects=True)

        assert resp.status_code == 200
        texto = resp.get_data(as_text=True)
        assert 'incorretos' in texto or 'incorreto' in texto.lower()
        # Não deve ter havido bypass (não estamos na professorMenu)
        assert 'PERFIL' not in texto or 'contentArea' not in texto

    def test_login_sql_injection_comentario(self, client):
        """Payload com comentário SQL (--) não deve autenticar."""
        registrar_usuario(client, 'Prof Teste', 'prof2@teste.com', 'SenhaForte123')
        resp = client.post('/login', data={
            'csrf_token': get_csrf_token(client.get('/login').get_data(as_text=True)),
            'email': "prof2@teste.com'--",
            'senha': "qualquer",
        }, follow_redirects=True)
        assert resp.status_code == 200
        assert b'incorretos' in resp.data or 'incorretos'.encode() in resp.data

    def test_cadastro_sql_injection_no_nome(self, client, app):
        """SQLi via campo 'nome' no cadastro não deve corromper o banco
        (ORM usa bind parameters -- string é armazenada literalmente)."""
        payload = "Robert'); DROP TABLE usuarios;--"
        resp = registrar_usuario(client, payload, 'dropper@teste.com', 'SenhaForte123')
        assert resp.status_code == 200

        from app import db
        from app.models import Usuario
        with app.app_context():
            # Se a tabela ainda existe e o registro foi criado normalmente,
            # o ataque não teve efeito algum.
            u = Usuario.query.filter_by(email='dropper@teste.com').first()
            assert u is not None
            assert u.nome == payload  # armazenado como texto puro, não executado


# ===========================================================================
# TESTE 2 — XSS (armazenado)
# ===========================================================================
class TestXSS:

    def test_bio_payload_nao_executa_e_fica_escapado_no_html(self, client, app):
        """Um payload de XSS salvo na bio não deve aparecer sem escaping em
        nenhuma página renderizada pelo servidor."""
        registrar_usuario(client, 'Prof XSS', 'xss@teste.com', 'SenhaForte123')
        login(client, 'xss@teste.com', 'SenhaForte123')

        payload = "<script>alert('XSS')</script>"
        resp_menu = client.get('/professorMenu')
        token = get_csrf_token_from_meta(resp_menu.get_data(as_text=True))

        client.post('/atualizar-perfil-inline', data={
            'csrf_token': token,
            'bio': payload,
        }, follow_redirects=True)

        resp = client.get('/professorMenu')
        html = resp.get_data(as_text=True)

        # O payload NUNCA deve aparecer como tag executável crua no HTML.
        assert '<script>alert' not in html
        # Deve aparecer apenas serializado com segurança pelo filtro |tojson
        # (barras invertidas + \u003c em vez de < literal), nunca como uma
        # tag <script> executável fora do bloco de dados do Jinja.
        assert '\\u003cscript\\u003e' in html

    def test_nome_com_payload_html_e_armazenado_mas_nao_quebra_pagina(self, client):
        payload = '"><img src=x onerror=alert(1)>'
        resp = registrar_usuario(client, payload, 'xss2@teste.com', 'SenhaForte123')
        assert resp.status_code == 200
        login_resp = login(client, 'xss2@teste.com', 'SenhaForte123')
        assert login_resp.status_code in (302, 303)
        menu = client.get('/professorMenu', follow_redirects=True)
        html = menu.get_data(as_text=True)
        assert '<img src=x onerror=alert(1)>' not in html


# ===========================================================================
# TESTE 3 — Acesso sem autenticação
# ===========================================================================
class TestAuthBypass:

    def test_professor_menu_sem_login_retorna_401(self, client):
        resp = client.get('/professorMenu')
        assert resp.status_code == 401

    def test_turmas_sem_login_retorna_401(self, client):
        resp = client.get('/turmas')
        assert resp.status_code == 401

    def test_api_dados_sem_login_retorna_401(self, client):
        resp = client.get('/api/dados')
        assert resp.status_code == 401

    def test_atualizar_perfil_sem_login_retorna_401(self, client):
        # Sem token CSRF, o Flask-WTF (hook global, executa antes de
        # qualquer view) já bloqueia com 400 antes mesmo de chegar no
        # decorator de login -- ambos os status significam que a ação NÃO
        # foi executada sem autenticação, que é a garantia que importa aqui.
        resp = client.post('/atualizar-perfil-inline', data={'nome': 'x'})
        assert resp.status_code in (400, 401)


# ===========================================================================
# TESTE 4 — Escalação de privilégio (vertical) via Mass Assignment
# ===========================================================================
class TestPrivilegeEscalation:

    def test_nao_consegue_virar_admin_via_campo_extra_no_cadastro(self, client, app):
        """Envia tipo_usuario=admin diretamente no POST (campo não usado
        pelo allowlist) -- não deve ter efeito algum."""
        resp = client.get('/cadastro2?tipo=aluno')
        token = get_csrf_token(resp.get_data(as_text=True))
        client.post('/cadastro2?tipo=aluno', data={
            'csrf_token': token,
            'nome': 'Aluno Malicioso',
            'email': 'malicioso@teste.com',
            'cpf': '98765432100',
            'senha': 'SenhaForte123',
            'tipo': 'aluno',
            'tipo_usuario': 'admin',   # <- tentativa de mass assignment
            'status': '1',
        }, follow_redirects=True)

        from app.models import Usuario
        with app.app_context():
            u = Usuario.query.filter_by(email='malicioso@teste.com').first()
            assert u is not None
            assert u.tipo_usuario == 'aluno'   # NÃO virou admin

    def test_nao_consegue_alterar_tipo_usuario_via_atualizar_perfil(self, client, app):
        """Usuário autenticado tenta se promover a admin via o endpoint de
        atualização de perfil, que não expõe esse campo (allowlist)."""
        registrar_usuario(client, 'Prof Comum', 'comum@teste.com', 'SenhaForte123')
        login(client, 'comum@teste.com', 'SenhaForte123')

        resp = client.get('/professorMenu')
        token = get_csrf_token_from_meta(resp.get_data(as_text=True))
        client.post('/atualizar-perfil-inline', data={
            'csrf_token': token,
            'nome': 'Prof Comum',
            'tipo_usuario': 'admin',
        }, follow_redirects=True)

        from app.models import Usuario
        with app.app_context():
            u = Usuario.query.filter_by(email='comum@teste.com').first()
            assert u.tipo_usuario == 'professor'


# ===========================================================================
# TESTE 5 — IDOR / Acesso horizontal a dados de outro usuário
# ===========================================================================
class TestIDOR:

    def test_dados_do_usuario_a_nao_vazam_para_usuario_b(self, client, app):
        """Como /api/dados e /professorMenu identificam o usuário
        exclusivamente pela sessão do servidor (nunca por um ID vindo do
        cliente), o usuário B nunca consegue ver dados do usuário A trocando
        parâmetros -- não existe referência direta a objeto exposta."""
        registrar_usuario(client, 'Usuario A', 'a@teste.com', 'SenhaForteA123')
        registrar_usuario(client, 'Usuario B', 'b@teste.com', 'SenhaForteB123')

        login(client, 'a@teste.com', 'SenhaForteA123')
        menu_a = client.get('/professorMenu').get_data(as_text=True)
        assert 'Usuario A' in menu_a or 'USUARIO A' in menu_a.upper()

        client.get('/logout')

        login(client, 'b@teste.com', 'SenhaForteB123')
        menu_b = client.get('/professorMenu').get_data(as_text=True)
        assert 'Usuario A' not in menu_b

    def test_sessao_nao_permite_forjar_usuario_id(self, client, app):
        """Mesmo manipulando o cookie de sessão para apontar para outro
        usuario_id, a sessão é assinada com SECRET_KEY -- alterações não
        assinadas corretamente são rejeitadas pelo Flask."""
        registrar_usuario(client, 'Vitima', 'vitima@teste.com', 'SenhaForte123')
        with client.session_transaction() as sess:
            # Simula um cookie adulterado tentando apontar para outro id
            sess['usuario_id'] = 99999
            sess['tipo_usuario'] = 'professor'
        resp = client.get('/professorMenu')
        # Como o id 99999 não existe no banco, a aplicação deve encerrar a
        # sessão e negar acesso -- nunca "vazar" um usuário aleatório.
        assert resp.status_code == 401


# ===========================================================================
# TESTE 6 — CSRF
# ===========================================================================
class TestCSRF:

    def test_login_sem_csrf_token_e_rejeitado(self, client):
        resp = client.post('/login', data={
            'email': 'qualquer@teste.com',
            'senha': 'qualquer',
        })
        assert resp.status_code == 400  # Flask-WTF rejeita com 400 (Bad Request)

    def test_atualizar_perfil_sem_csrf_e_rejeitado(self, client):
        registrar_usuario(client, 'Prof CSRF', 'csrf@teste.com', 'SenhaForte123')
        login(client, 'csrf@teste.com', 'SenhaForte123')
        resp = client.post('/atualizar-perfil-inline', data={'nome': 'Hackeado'})
        assert resp.status_code == 400

    def test_cadastro_sem_csrf_e_rejeitado(self, client):
        resp = client.post('/cadastro2?tipo=aluno', data={
            'nome': 'Sem Token',
            'email': 'semtoken@teste.com',
            'cpf': '11111111111',
            'senha': 'SenhaForte123',
            'tipo': 'aluno',
        })
        assert resp.status_code == 400


# ===========================================================================
# TESTES ADICIONAIS
# ===========================================================================
class TestAdicionais:

    def test_senha_nunca_armazenada_em_texto_puro(self, client, app):
        registrar_usuario(client, 'Prof Hash', 'hash@teste.com', 'SenhaForte123')
        from app.models import Usuario
        with app.app_context():
            u = Usuario.query.filter_by(email='hash@teste.com').first()
            assert u.senha != 'SenhaForte123'
            assert len(u.senha) > 20  # hash, não texto puro
            assert u.check_senha('SenhaForte123')
            assert not u.check_senha('senhaerrada')

    def test_http_method_tampering_login_get_only_nao_autentica(self, client):
        """GET não deve autenticar (apenas exibe o form)."""
        resp = client.get('/login?email=a@a.com&senha=123')
        assert b'form' in resp.data.lower()

    def test_metodo_nao_permitido_retorna_405(self, client):
        resp = client.delete('/login')
        assert resp.status_code == 405

    def test_rate_limiting_login(self, client, app):
        """Após várias tentativas de login em curto período, deve haver
        rate limiting (429)."""
        registrar_usuario(client, 'Prof RL', 'ratelimit@teste.com', 'SenhaForte123')
        ultimo_status = None
        for _ in range(15):
            resp = client.post('/login', data={
                'csrf_token': get_csrf_token(client.get('/login').get_data(as_text=True)),
                'email': 'ratelimit@teste.com',
                'senha': 'errada',
            })
            ultimo_status = resp.status_code
            if ultimo_status == 429:
                break
        assert ultimo_status == 429

    def test_information_disclosure_debug_desligado(self, app):
        assert app.config['DEBUG'] is False

    def test_erro_500_nao_vaza_stacktrace(self, client, app, monkeypatch):
        from app import routes
        # TESTING=True faz o Flask propagar exceções cruas ao invés de usar
        # os error handlers -- desligamos isso apenas aqui para simular
        # fielmente o comportamento real de produção diante de um erro 500.
        app.config['TESTING'] = False
        app.config['PROPAGATE_EXCEPTIONS'] = False
        app.config['DEBUG'] = False
        try:
            def _boom():
                raise RuntimeError("segredo interno: caminho /etc/senha.txt")
            monkeypatch.setattr(routes, 'usuario_logado', _boom)
            registrar_usuario(client, 'Prof Erro', 'erro@teste.com', 'SenhaForte123')
            login(client, 'erro@teste.com', 'SenhaForte123')
            resp = client.get('/professorMenu')
            assert resp.status_code == 500
            html = resp.get_data(as_text=True)
            assert 'segredo interno' not in html
            assert 'Traceback' not in html
        finally:
            app.config['TESTING'] = True

    def test_email_enumeration_esqueci_senha_mensagem_generica(self, client):
        registrar_usuario(client, 'Prof Existe', 'existe@teste.com', 'SenhaForte123')

        resp = client.get('/esqueci-senha')
        token = get_csrf_token(resp.get_data(as_text=True))
        r1 = client.post('/esqueci-senha', data={'csrf_token': token, 'email': 'existe@teste.com'}, follow_redirects=True)

        resp2 = client.get('/esqueci-senha')
        token2 = get_csrf_token(resp2.get_data(as_text=True))
        r2 = client.post('/esqueci-senha', data={'csrf_token': token2, 'email': 'naoexiste@teste.com'}, follow_redirects=True)

        t1 = r1.get_data(as_text=True)
        t2 = r2.get_data(as_text=True)
        assert 'não encontrado' not in t1.lower()
        assert 'não encontrado' not in t2.lower()

    def test_mass_assignment_nome_truncado_no_limite(self, client, app):
        """Nome muito longo é truncado no servidor (não confia só no
        maxlength do HTML, que é só client-side)."""
        registrar_usuario(client, 'Prof Trunc', 'trunc@teste.com', 'SenhaForte123')
        login(client, 'trunc@teste.com', 'SenhaForte123')
        resp = client.get('/professorMenu')
        token = get_csrf_token_from_meta(resp.get_data(as_text=True))
        nome_gigante = 'A' * 5000
        client.post('/atualizar-perfil-inline', data={
            'csrf_token': token,
            'nome': nome_gigante,
        }, follow_redirects=True)
        from app.models import Usuario
        with app.app_context():
            u = Usuario.query.filter_by(email='trunc@teste.com').first()
            assert len(u.nome) <= 150

    def test_cookie_de_sessao_e_httponly(self, client):
        registrar_usuario(client, 'Prof Cookie', 'cookie@teste.com', 'SenhaForte123')
        resp = login(client, 'cookie@teste.com', 'SenhaForte123')
        set_cookie = resp.headers.get('Set-Cookie', '')
        assert 'HttpOnly' in set_cookie

    def test_headers_de_seguranca_presentes(self, client):
        resp = client.get('/')
        assert resp.headers.get('X-Content-Type-Options') == 'nosniff'
        assert resp.headers.get('X-Frame-Options') == 'DENY'
        assert 'Content-Security-Policy' in resp.headers

    def test_payload_json_excessivamente_grande_e_rejeitado(self, client, app):
        registrar_usuario(client, 'Prof Big', 'big@teste.com', 'SenhaForte123')
        login(client, 'big@teste.com', 'SenhaForte123')
        payload_grande = 'x' * (3 * 1024 * 1024)  # 3MB > limite de 2MB
        resp = client.post('/api/dados', data=payload_grande,
                            content_type='application/json',
                            headers={'X-CSRFToken': 'irrelevante-json-exempt-or-not'})
        assert resp.status_code in (413, 400)


if __name__ == '__main__':
    sys.exit(pytest.main([__file__, '-v']))
