import os
from dotenv import load_dotenv

load_dotenv()

basedir = os.path.abspath(os.path.dirname(__file__))


def _require_env(name: str, allow_empty_in_testing: bool = False) -> str:
    """Lê uma variável de ambiente obrigatória.

    Nunca inventa um valor padrão para segredos/credenciais: se a variável
    não existir, a aplicação falha explicitamente ao iniciar, em vez de
    subir com uma configuração insegura por padrão.
    """
    value = os.environ.get(name)
    if not value:
        if os.environ.get('FLASK_TESTING') == '1' and allow_empty_in_testing:
            return ''
        raise RuntimeError(
            f"Variável de ambiente obrigatória '{name}' não definida. "
            f"Configure-a no arquivo .env (veja .env.example)."
        )
    return value


class Config:
    # SECRET_KEY é obrigatória e NUNCA deve ficar hardcoded no código-fonte
    # (estava fixa em av.py como 'alphafizic_secret_2025_change_this_in_production').
    SECRET_KEY = _require_env('SECRET_KEY')

    SQLALCHEMY_DATABASE_URI = _require_env('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,  # evita erros com conexões MySQL "stale"
    }

    # DEBUG deve estar SEMPRE desligado por padrão; só é ligado explicitamente
    # via variável de ambiente em desenvolvimento local.
    DEBUG = os.environ.get('FLASK_DEBUG', '0') == '1'
    TESTING = os.environ.get('FLASK_TESTING', '0') == '1'

    # Cookies de sessão seguros
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    # Secure exige HTTPS; ligue via variável de ambiente quando estiver atrás de TLS.
    SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', '0') == '1'
    PERMANENT_SESSION_LIFETIME = int(os.environ.get('SESSION_LIFETIME_SECONDS', '3600'))

    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH_BYTES', str(2 * 1024 * 1024)))  # 2 MB padrão

    RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
