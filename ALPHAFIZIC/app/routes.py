from functools import wraps
from app import _wants_json, app, db, limiter
from flask import (render_template, request, redirect, url_for, flash,
                    session, jsonify, send_from_directory, abort)                     
import os
import re
from werkzeug.utils import secure_filename
from app.models import Usuario, Professor, Aluno, TIPOS_USUARIO, Turma, Conteudo
# ---------------------------------------------------------------------------
# E-mail (Resend) - chave lida via config, nunca hardcoded no código-fonte.
# A função é isolada para que uma falha no provedor de e-mail nunca vaze
# detalhes internos (stack trace) para o usuário final.
# ---------------------------------------------------------------------------

PASTA_UPLOADS = os.path.join(app.root_path, 'static', 'arquivos')
os.makedirs(PASTA_UPLOADS, exist_ok=True)


def enviar_email_recuperacao(destinatario: str) -> None:
    api_key = app.config.get('RESEND_API_KEY')
    if not api_key:
        app.logger.warning('RESEND_API_KEY não configurada; e-mail de recuperação não enviado.')
        return
    try:
        import resend
        resend.api_key = api_key
        resend.Emails.send({
            "from": "no-reply@alphafizic.example",
            "to": destinatario,
            "subject": "Recuperação de senha - ALPHAFIZIC",
            "html": "<p>Se você solicitou a recuperação de senha, siga as instruções enviadas pela equipe.</p>",
        })
    except Exception:
        # Nunca deixa uma falha no provedor de e-mail derrubar a rota com
        # stack trace exposto; loga internamente e segue o fluxo normal.
        app.logger.exception('Falha ao enviar e-mail de recuperação')


# ---------------------------------------------------------------------------
# Validações de entrada (servidor nunca confia em validação só de frontend)
# ---------------------------------------------------------------------------
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')


def validar_email(email):
    return bool(email) and bool(EMAIL_REGEX.match(email))


def validar_cpf(cpf):
    if not cpf:
        return False
    cpf = cpf.replace('.', '').replace('-', '')
    return len(cpf) == 11 and cpf.isdigit()


def validar_senha_forte(senha):
    # Regra mínima de robustez; ajustável conforme política da equipe.
    return bool(senha) and len(senha) >= 8


# ---------------------------------------------------------------------------
# Autenticação / Autorização
#
# Regra de segurança: nunca tratar uma URL "escondida" como controle de
# acesso. Toda rota protegida verifica, no servidor, se o usuário está
# autenticado (401) e se possui o papel necessário (403) -- mesmo que a
# pessoa descubra a URL manualmente.
# ---------------------------------------------------------------------------
def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if 'usuario_id' not in session:
            abort(401)
        return view(*args, **kwargs)
    return wrapped


def roles_required(*papeis):
    def decorator(view):
        @wraps(view)
        def wrapped(*args, **kwargs):
            if 'usuario_id' not in session:
                abort(401)
            usuario = usuario_logado()
            if usuario is None:
                session.clear()
                abort(401)
            if usuario.tipo_usuario not in papeis:
                abort(403)
            return view(*args, **kwargs)
        return wrapped
    return decorator


def usuario_logado():
    """Carrega o usuário autenticado a partir do banco (nunca confia em
    dados de sessão para além do id -- nome/tipo/etc. são sempre lidos
    de novo do banco quando precisam ser autoritativos)."""
    uid = session.get('usuario_id')
    if not uid:
        return None
    return db.session.get(Usuario, uid)


def iniciar_sessao(usuario: Usuario):
    """Cria uma sessão nova para o usuário autenticado.

    session.clear() é chamado ANTES de popular os novos dados para reduzir
    o risco de reaproveitamento de estado de uma sessão anterior (mitigação
    de session fixation possível com o backend de sessão padrão do Flask,
    que é um cookie assinado no cliente). Para proteção mais forte contra
    fixation, recomenda-se migrar para um backend de sessão server-side
    (ex.: Flask-Session com Redis), documentado no relatório final.
    """
    session.clear()
    session.permanent = True
    session['usuario_id'] = usuario.id_usuario
    session['tipo_usuario'] = usuario.tipo_usuario
    session['nome_usuario'] = usuario.nome


@app.route('/')
@app.route('/index')
def index():
    return render_template('index.html')

def destino_pos_login(usuario: Usuario):
    # """Cada papel tem sua própria área -- aluno vai para o módulo do
    # AlphaFizic (/aluno), professor/admin continuam em professorMenu."""
    if usuario.tipo_usuario == 'aluno':
        return redirect(url_for('aluno_menu'))
    return redirect(url_for('professorMenu'))

@app.route('/login', methods=['GET', 'POST'])
@limiter.limit("10 per minute")
def login():
    if 'usuario_id' in session:
        usuario_sessao = usuario_logado()
        if usuario_sessao is not None:
            return destino_pos_login(usuario_sessao)
        session.clear()

    if request.method == 'POST':
        email = (request.form.get('email') or '').strip().lower()
        senha = request.form.get('senha') or ''
        usuario = Usuario.query.filter_by(email=email).first()

        if usuario is None or not usuario.check_senha(senha):
            flash('E-mail ou senha incorretos.', 'erro')
            return render_template('login.html')

        if usuario.status == 0:
            flash('Esta conta está desativada. Contate o suporte.', 'erro')
            return render_template('login.html')

        iniciar_sessao(usuario)
        flash('Login realizado com sucesso!', 'sucesso')
        return destino_pos_login(usuario)

    return render_template('login.html')

@app.route('/cadastro')
def cadastro():
    return render_template('cadastro.html')


@app.route('/cadastro2', methods=['GET', 'POST'])
@limiter.limit("10 per minute")
def cadastro2():
    if request.method == 'POST':
        nome = (request.form.get('nome') or '').strip()
        email = (request.form.get('email') or '').strip().lower()
        cpf = request.form.get('cpf')
        senha = request.form.get('senha')
        
        # 1. CORREÇÃO: A linha abaixo estava incompleta ("request.f")
        genero = request.form.get('genero')

        # Allowlist explícita: 'tipo' só pode ser um dos valores permitidos.
        tipo = request.args.get('tipo') or request.form.get('tipo')
        if tipo not in ('aluno', 'professor'):
            flash('Selecione se deseja se cadastrar como aluno ou professor.', 'erro')
            return render_template('cadastro2.html')

        if not nome or not email or not cpf or not senha:
            flash('Todos os campos obrigatórios devem ser preenchidos.', 'erro')
            return render_template('cadastro2.html')

        if not validar_email(email):
            flash('E-mail inválido.', 'erro')
            return render_template('cadastro2.html')

        if not validar_cpf(cpf):
            flash('CPF inválido. Verifique o formato.', 'erro')
            return render_template('cadastro2.html')

        if not validar_senha_forte(senha):
            flash('A senha deve ter pelo menos 8 caracteres.', 'erro')
            return render_template('cadastro2.html')

        if Usuario.query.filter_by(email=email).first() is not None:
            flash('E-mail já cadastrado.', 'erro')
            return render_template('cadastro2.html')

        # 2. CORREÇÃO: Adicionando o 'genero=genero' ao criar o Usuario
        novo_usuario = Usuario(nome=nome, email=email, tipo_usuario=tipo, genero=genero)
        novo_usuario.set_senha(senha)  # nunca armazenar senha em texto puro
        db.session.add(novo_usuario)
        db.session.flush()  # obtém id_usuario antes do commit final

        if tipo == 'professor':
            db.session.add(Professor(usuario_id=novo_usuario.id_usuario))
        else:
            db.session.add(Aluno(usuario_id=novo_usuario.id_usuario))

        db.session.commit()

        flash('Cadastro realizado com sucesso!', 'sucesso')
        return redirect(url_for('login'))

    return render_template('cadastro2.html')


@app.route('/esqueci-senha', methods=['GET', 'POST'])
@limiter.limit("5 per minute")
def esqueci_senha():
    if request.method == 'POST':
        email = (request.form.get('email') or '').strip().lower()

        if not validar_email(email):
            flash('E-mail inválido.', 'erro')
            return render_template('esqueciSenha.html')

        usuario = Usuario.query.filter_by(email=email).first()
        if usuario is not None:
            enviar_email_recuperacao(email)

        # Mensagem SEMPRE igual, exista ou não o e-mail, para não permitir
        # que um atacante descubra quais e-mails estão cadastrados
        # (user enumeration). O fluxo de token real de reset (JWT/expiração)
        # ainda não está implementado -- ver recomendações no relatório.
        flash('Se este e-mail estiver cadastrado, um link de recuperação foi enviado.', 'sucesso')

    return render_template('esqueciSenha.html')


@app.route('/logout')
def logout():
    session.clear()
    flash('Você saiu da sua conta.', 'sucesso')
    return redirect(url_for('login'))


@app.route('/professorMenu')
@roles_required('professor', 'admin')
def professorMenu():
    usuario = usuario_logado()
    if usuario is None:
        session.clear()
        abort(401)

    bio = ''
    if usuario.tipo_usuario == 'professor' and usuario.professor:
        bio = usuario.professor.bio or ''

    return render_template('professorMenu.html', usuario=usuario, bio=bio)


@app.route('/atualizar-perfil-inline', methods=['POST'])
@login_required
def atualizar_perfil_inline():
    usuario = usuario_logado()
    if usuario is None:
        session.clear()
        abort(401)
    # ... (o resto da função continua exatamente como já está no seu arquivo)

    # Allowlist explícita de campos editáveis pelo próprio usuário.
    # Nenhum campo sensível (id_usuario, email, tipo_usuario, status) pode
    # ser alterado por aqui.
    novo_nome = request.form.get('nome')
    nova_senha = request.form.get('senha')
    nova_bio = request.form.get('bio')

    if novo_nome:
        novo_nome = novo_nome.strip()[:150]
        usuario.nome = novo_nome
        session['nome_usuario'] = novo_nome

    if nova_bio is not None:
        # 'bio' pertence à tabela professores no banco real (não existe
        # coluna de bio em 'usuarios'). Só é persistida para professores.
        if usuario.tipo_usuario == 'professor':
            if usuario.professor is None:
                db.session.add(Professor(usuario_id=usuario.id_usuario, bio=nova_bio[:500]))
            else:
                usuario.professor.bio = nova_bio[:500]

    if nova_senha:
        if not validar_senha_forte(nova_senha):
            flash('A nova senha deve ter pelo menos 8 caracteres.', 'erro')
            return redirect(url_for('professorMenu'))
        usuario.set_senha(nova_senha)
        flash('Senha alterada com sucesso!', 'sucesso')
    else:
        flash('Perfil atualizado com sucesso!', 'sucesso')

    db.session.commit()
    return redirect(url_for('professorMenu'))

@app.route('/turmas')
@login_required
def turmas():
    return render_template('turma.html')


# ==========================================
# ROTAS DE API PARA O JAVASCRIPT (FETCH)
# ==========================================

@app.route('/api/dados', methods=['GET'])
@login_required
def obter_dados():
    usuario = usuario_logado()
    
    # Se não for professor ou houver algum problema, retorna vazio por segurança
    if not usuario or usuario.tipo_usuario != 'professor' or not usuario.professor:
        return jsonify({'turmas': [], 'conteudos': []})

    # 1. BUSCAR AS TURMAS DESTE PROFESSOR NO BANCO
    turmas_do_banco = Turma.query.filter_by(professor_id=usuario.professor.id_professor).all()
    lista_turmas_formatadas = []
    
    for t in turmas_do_banco:
        lista_turmas_formatadas.append({
            'id': t.id_turma,
            'nome': t.nome_turma,
            'alunos': [],  # Fica vazio por enquanto, até resolvermos a questão dos usuários/alunos
            'conteudosLiberados': [],
            'notas': {},
            'desempenhoQuestoes': {}
        })

    # 2. BUSCAR OS CONTEÚDOS NO BANCO -- SOMENTE das turmas deste professor.
    #    Antes disso, era `Conteudo.query.all()`, ou seja, todo professor via
    #    o conteúdo de TODOS os outros professores -- corrigido aqui: um
    #    conteúdo só é retornado se pertencer (via id_turma) a uma turma que
    #    é deste professor.
    ids_turmas_do_professor = [t.id_turma for t in turmas_do_banco]
    conteudos_do_banco = (
        Conteudo.query.filter(Conteudo.id_turma.in_(ids_turmas_do_professor)).all()
        if ids_turmas_do_professor else []
    )
    lista_conteudos_formatados = []
    
    for c in conteudos_do_banco:
        lista_conteudos_formatados.append({
            'id': c.id_conteudo,
            'id_turma': c.id_turma,       # <- novo campo
            'titulo': c.titulo,
            'descricao': c.descricao,
            'questoes': []  # Fica vazio por enquanto, até a tabela de questões ser criada no banco
        })

    # 3. ENVIAR PARA O JAVASCRIPT (FRONTEND)
    return jsonify({
        'turmas': lista_turmas_formatadas,
        'conteudos': lista_conteudos_formatados
    })


@app.route('/api/dados', methods=['POST'])
@login_required
def salvar_dados():
    usuario = usuario_logado()

    # Garante que só professores podem salvar dados de turmas/conteúdos
    if not usuario or usuario.tipo_usuario != 'professor' or not usuario.professor:
        if _wants_json():
            return jsonify({'erro': 'Apenas professores podem salvar dados.'}), 403
        abort(403)

    dados_recebidos = request.get_json()

    # Conjunto de ids de turma que pertencem a ESTE professor -- usado tanto
    # para turmas quanto para conteúdos, já que a posse de um conteúdo é
    # sempre determinada através da turma à qual ele pertence.
    ids_turmas_do_professor = {
        t.id_turma for t in Turma.query.filter_by(professor_id=usuario.professor.id_professor).all()
    }

    # Ids reais gerados nesta requisição para itens que chegaram com "id"
    # nulo (criados agora pela primeira vez). Devolvidos na resposta para o
    # frontend substituir o id local fictício pelo id real do banco.
    turmas_criadas = []
    conteudos_criados = []

    try:
        # 1. SALVANDO AS TURMAS
        for posicao, turma_front in enumerate(dados_recebidos.get('turmas', [])):
            id_enviado = turma_front.get('id')
            # Só procura uma turma existente se um id de verdade foi
            # enviado -- um id nulo/ausente significa SEMPRE "turma nova".
            turma_db = Turma.query.filter_by(id_turma=id_enviado).first() if id_enviado else None

            if turma_db is not None:
                if turma_db.professor_id != usuario.professor.id_professor:
                    continue  # não é dono dessa turma: ignora silenciosamente
                turma_db.nome_turma = turma_front.get('nome')
            else:
                turma_db = Turma(nome_turma=turma_front.get('nome'), professor_id=usuario.professor.id_professor)
                db.session.add(turma_db)
                db.session.flush()  # obtém id_turma antes de qualquer conteúdo novo referenciá-la
                ids_turmas_do_professor.add(turma_db.id_turma)
                turmas_criadas.append({'posicao': posicao, 'id': turma_db.id_turma})

        # 2. SALVANDO OS CONTEÚDOS
        for posicao, cont_front in enumerate(dados_recebidos.get('conteudos', [])):
            id_turma_do_conteudo = cont_front.get('id_turma')
            id_enviado = cont_front.get('id')
            conteudo_db = Conteudo.query.filter_by(id_conteudo=id_enviado).first() if id_enviado else None

            if conteudo_db is not None:
                if conteudo_db.id_turma not in ids_turmas_do_professor:
                    continue  # não é dono: ignora silenciosamente
                
                conteudo_db.titulo = cont_front.get('titulo')
                conteudo_db.descricao = cont_front.get('descricao', '')
                
                # NOVOS CAMPOS SALVOS AQUI:
                conteudo_db.material_texto = cont_front.get('materialTexto', '')
                conteudo_db.arquivo_anexo = cont_front.get('arquivo', '')
                
            else:
                 # Conteúdo novo: exige uma turma válida E pertencente a este
                # professor -- nunca aceitamos criar conteúdo "solto" (sem
                # turma) nem numa turma de outro professor.
                if id_turma_do_conteudo not in ids_turmas_do_professor:
                    continue  # turma inexistente ou não pertence a este professor
                
                conteudo_db = Conteudo(
                    titulo=cont_front.get('titulo'),
                    descricao=cont_front.get('descricao', ''),
                    tipo='geral',
                    id_turma=id_turma_do_conteudo,
                    
                    # NOVOS CAMPOS SALVOS AQUI TAMBÉM:
                    material_texto=cont_front.get('materialTexto', ''),
                    arquivo_anexo=cont_front.get('arquivo', '')
                )
                db.session.add(conteudo_db)
                db.session.flush()  # obtém id_conteudo real antes de responder
                conteudos_criados.append({'posicao': posicao, 'id': conteudo_db.id_conteudo})

            # NOTA: Não estamos salvando as "Questões" porque a tabela de
            # questões não existe no models.py do banco de dados.

        db.session.commit()
        return jsonify({
            'status': 'sucesso',
            'mensagem': 'Turmas e Conteúdos salvos no banco!',
            'turmas_criadas': turmas_criadas,
            'conteudos_criados': conteudos_criados,
        }), 200

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Erro ao salvar dados: {e}")
        return jsonify({'erro': 'Falha ao salvar no banco de dados.'}), 500

@app.route('/salvar_material', methods=['POST'])
@roles_required('professor', 'admin')
def salvar_material_arquivo():
    # Verifica se a requisição tem o arquivo anexado
    if 'arquivo' not in request.files:
        return jsonify({'erro': 'Nenhum arquivo enviado'}), 400
        
    arquivo_fisico = request.files['arquivo']
    id_conteudo = request.form.get('id_conteudo', 'novo')
    
    if arquivo_fisico.filename != '':
        # secure_filename remove acentos e espaços, evitando erros no servidor
        nome_seguro = secure_filename(arquivo_fisico.filename)
        
        # Coloca o ID do conteúdo na frente do nome para evitar arquivos duplicados
        nome_final = f"cont_{id_conteudo}_{nome_seguro}"
        
        # Salva o arquivo na pasta app/static/arquivos/
        caminho_completo = os.path.join(PASTA_UPLOADS, nome_final)
        arquivo_fisico.save(caminho_completo)
        
        # Cria o "ponteiro" que o navegador vai usar para baixar o arquivo
        ponteiro_banco = f'/static/arquivos/{nome_final}'
        
        # Devolve o caminho para o JavaScript colocar no estado (state)
        return jsonify({'caminho': ponteiro_banco}), 200
        
    return jsonify({'erro': 'Arquivo em branco'}), 400

# ==========================================
# ROTAS PARA O FAVICON - icon do site
# ==========================================

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static', 'img'),
                                'loboauu.png', mimetype='image/png')
                               
