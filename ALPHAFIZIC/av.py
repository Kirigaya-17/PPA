from app import app

# A SECRET_KEY agora vem exclusivamente de Config (variável de ambiente
# SECRET_KEY), nunca mais hardcoded no código-fonte.
# Antes: app.secret_key = 'alphafizic_secret_2025_change_this_in_production'

if __name__ == '__main__':
    # debug/host controlados por variável de ambiente; nunca "True" fixo.
    # host 0.0.0.0 só é apropriado dentro de um container/rede controlada
    # durante o desenvolvimento -- em produção, prefira rodar atrás de um
    # WSGI server (gunicorn/uwsgi) + proxy reverso.
    import os
    app.run(
        debug=app.config['DEBUG'],
        host=os.environ.get('FLASK_RUN_HOST', '127.0.0.1'),
        port=int(os.environ.get('FLASK_RUN_PORT', '5000')),
    )
