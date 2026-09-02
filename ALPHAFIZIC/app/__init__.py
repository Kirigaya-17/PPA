import logging
from flask import Flask, render_template, jsonify, request
from config import Config
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_wtf import CSRFProtect
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

app = Flask(__name__)
app.config.from_object(Config)

db = SQLAlchemy(app)
migrate = Migrate(app, db)

# ---------------------------------------------------------------------------
# CSRF Protection (Flask-WTF) - protege todos os POST/PUT/PATCH/DELETE que
# usam formulários HTML por padrão.
# ---------------------------------------------------------------------------
csrf = CSRFProtect(app)

# ---------------------------------------------------------------------------
# Rate limiting - protege endpoints sensíveis a abuso (login, cadastro,
# recuperação de senha) contra força bruta / spam.
# ---------------------------------------------------------------------------
limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    default_limits=["200 per hour"],
    storage_uri="memory://",
)

# ---------------------------------------------------------------------------
# Logging: nunca logar corpo de requisições/senhas. Apenas metadados básicos.
# ---------------------------------------------------------------------------
if not app.debug:
    logging.basicConfig(level=logging.INFO)


@app.after_request
def set_security_headers(response):
    """Headers de segurança HTTP.

    CSP é propositalmente moderado (permite inline <script>/<style> que já
    existem nos templates atuais) para não quebrar o frontend existente;
    o ideal a médio prazo é migrar os poucos trechos de JS inline para
    arquivos externos e endurecer o CSP removendo 'unsafe-inline'.
    """
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "img-src 'self' data:; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline'; "
        "object-src 'none'; "
        "base-uri 'self'; "
        "frame-ancestors 'none'"
    )
    if request.is_secure:
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response


# ---------------------------------------------------------------------------
# Tratamento de erros: nunca vazar stack trace / detalhes internos ao cliente.
# ---------------------------------------------------------------------------
def _wants_json():
    return request.path.startswith('/api/') or request.accept_mimetypes.best == 'application/json'


@app.errorhandler(400)
def bad_request(e):
    if _wants_json():
        return jsonify({'erro': 'Requisição inválida.'}), 400
    return render_template('erro.html', codigo=400, mensagem='Requisição inválida.'), 400


@app.errorhandler(401)
def unauthorized(e):
    if _wants_json():
        return jsonify({'erro': 'Não autorizado.'}), 401
    return render_template('erro.html', codigo=401, mensagem='É necessário fazer login para acessar esta página.'), 401


@app.errorhandler(403)
def forbidden(e):
    if _wants_json():
        return jsonify({'erro': 'Acesso negado.'}), 403
    return render_template('erro.html', codigo=403, mensagem='Você não tem permissão para acessar este recurso.'), 403


@app.errorhandler(404)
def not_found(e):
    if _wants_json():
        return jsonify({'erro': 'Recurso não encontrado.'}), 404
    return render_template('erro.html', codigo=404, mensagem='Página não encontrada.'), 404


@app.errorhandler(413)
def payload_too_large(e):
    if _wants_json():
        return jsonify({'erro': 'Payload excede o tamanho máximo permitido.'}), 413
    return render_template('erro.html', codigo=413, mensagem='Arquivo/requisição excede o tamanho máximo permitido.'), 413


@app.errorhandler(429)
def ratelimited(e):
    if _wants_json():
        return jsonify({'erro': 'Muitas requisições. Tente novamente mais tarde.'}), 429
    return render_template('erro.html', codigo=429, mensagem='Muitas tentativas. Aguarde um momento e tente novamente.'), 429


@app.errorhandler(500)
def internal_error(e):
    # IMPORTANTE: nunca renderizar str(e) para o cliente -- vazaria detalhes
    # internos (SQL, caminhos, stack trace). O erro completo vai só pro log.
    app.logger.exception('Erro interno não tratado')
    if _wants_json():
        return jsonify({'erro': 'Erro interno do servidor.'}), 500
    return render_template('erro.html', codigo=500, mensagem='Ocorreu um erro interno. Tente novamente mais tarde.'), 500


from app import routes, models  # noqa: E402,F401
