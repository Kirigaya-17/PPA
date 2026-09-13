# """
# Rotas do lado do aluno -- integração AlphaFizic.

# Princípios de segurança aplicados (ver relatório de integração):
#   * Toda rota de leitura/escrita de progresso exige login E papel 'aluno'
#     (roles_required) -- nunca "esconder" a rota apenas na interface.
#   * O id_aluno usado em toda gravação vem SEMPRE da sessão do servidor
#     (usuario_logado().aluno.id_aluno), nunca de um campo enviado pelo
#     cliente -- isso é o que impede IDOR entre alunos.
#   * XP NUNCA é aceito como valor enviado pelo cliente. O servidor sempre
#     recalcula a partir da definição oficial da atividade/fase (tabelas
#     atividades_fisica / fases_jogo_fisica) e da resposta enviada.
# """
from flask import jsonify, request, render_template, abort

from app import app, db
from app.routes import login_required, roles_required, usuario_logado
from app.models import (
    ModuloFisica, FormulaFisica, ExemploFisica, AtividadeFisica,
    FaseJogoFisica, NivelFisica, ConquistaFisica,
    ProgressoAtividadeFisica, ProgressoModuloFisica, ProgressoFaseFisica,
    AlunoConquistaFisica,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def aluno_atual():
    """Retorna o registro `Aluno` do usuário logado, ou aborta com 403 se o
    usuário logado não for um aluno (nunca confia no papel vindo do cliente;
    sempre relê do banco através da sessão do servidor)."""
    usuario = usuario_logado()
    if usuario is None or usuario.tipo_usuario != 'aluno' or usuario.aluno is None:
        abort(403)
    return usuario.aluno


def calcular_nivel(xp_total: int):
    niveis = NivelFisica.query.order_by(NivelFisica.xp_necessario).all()
    if not niveis:
        return None, None
    atual, proximo = niveis[0], None
    for i, n in enumerate(niveis):
        if xp_total >= n.xp_necessario:
            atual = n
            proximo = niveis[i + 1] if i + 1 < len(niveis) else None
    return atual, proximo


def conceder_xp(aluno, quantidade: int):
    """Única função autorizada a alterar aluno.xp_aluno. `quantidade` deve
    sempre vir de um cálculo feito neste arquivo a partir de dados oficiais
    (nunca diretamente de request.json)."""
    if quantidade <= 0:
        return {'xp_ganho': 0, 'subiu_nivel': False}

    nivel_antes, _ = calcular_nivel(aluno.xp_aluno)
    aluno.xp_aluno = (aluno.xp_aluno or 0) + quantidade
    nivel_depois, proximo = calcular_nivel(aluno.xp_aluno)

    subiu_nivel = bool(nivel_antes and nivel_depois and nivel_depois.nivel > nivel_antes.nivel)
    if subiu_nivel:
        aluno.nivel_atual = nivel_depois.nivel
        aluno.moedas = (aluno.moedas or 0) + (nivel_depois.recompensa_moedas or 0)

    return {
        'xp_ganho': quantidade,
        'subiu_nivel': subiu_nivel,
        'nivel_atual': aluno.nivel_atual,
        'xp_total': aluno.xp_aluno,
    }


def modulo_para_json(m: ModuloFisica):
    return {
        'id_modulo': m.id_modulo, 'id_conteudo': m.id_conteudo, 'ordem': m.ordem,
        'dificuldade': m.dificuldade, 'ativo': m.ativo, 'titulo': m.titulo,
        'descricao': m.descricao, 'icone': m.icone, 'area': m.area, 'corpo': m.corpo,
    }


# ---------------------------------------------------------------------------
# Página (shell SPA do aluno -- equivalente ao index.html do AlphaFizic,
# incorporado à mesma arquitetura de menu do professorMenu.html)
# ---------------------------------------------------------------------------
@app.route('/aluno')
@roles_required('aluno')
def aluno_menu():
    aluno = aluno_atual()
    nivel_atual, proximo = calcular_nivel(aluno.xp_aluno)
    estado_inicial = {
        'usuario': {'nome': aluno.usuario.nome, 'foto': aluno.usuario.foto, 'tipo_usuario': 'aluno'},
        'aluno': {
            'id_aluno': aluno.id_aluno,
            'xp_total': aluno.xp_aluno,
            'nivel_atual': aluno.nivel_atual,
            'moedas': aluno.moedas,
        },
    }
    return render_template('alunoMenu.html', estado_inicial=estado_inicial)


# ---------------------------------------------------------------------------
# Currículo (leitura) -- qualquer usuário autenticado pode consultar
# conteúdo pedagógico; a escrita de progresso é restrita a 'aluno'.
# ---------------------------------------------------------------------------
@app.route('/api/fisica/modulos')
@login_required
def fisica_modulos():
    modulos = ModuloFisica.query.filter_by(ativo=True).order_by(ModuloFisica.ordem).all()
    return jsonify([modulo_para_json(m) for m in modulos])


@app.route('/api/fisica/modulo/<int:id_modulo>')
@login_required
def fisica_modulo(id_modulo):
    m = db.session.get(ModuloFisica, id_modulo)
    if m is None:
        abort(404)
    return jsonify(modulo_para_json(m))


@app.route('/api/fisica/modulo/<int:id_modulo>/formulas')
@login_required
def fisica_formulas(id_modulo):
    formulas = FormulaFisica.query.filter_by(id_modulo=id_modulo).order_by(FormulaFisica.ordem).all()
    return jsonify([{
        'id_formula': f.id_formula, 'id_modulo': f.id_modulo, 'ordem': f.ordem,
        'nome': f.nome, 'expressao': f.expressao, 'descricao': f.descricao,
        'unidade': f.unidade, 'calc': f.calc,
    } for f in formulas])


@app.route('/api/fisica/modulo/<int:id_modulo>/exemplos')
@login_required
def fisica_exemplos(id_modulo):
    exemplos = ExemploFisica.query.filter_by(id_modulo=id_modulo).order_by(ExemploFisica.ordem).all()
    return jsonify([e.dados for e in exemplos])


@app.route('/api/fisica/modulo/<int:id_modulo>/atividades')
@login_required
def fisica_atividades_do_modulo(id_modulo):
    """Retorna as atividades SEM o campo de resposta correta -- o aluno
    nunca recebe o gabarito antes de responder."""
    atividades = AtividadeFisica.query.filter_by(id_modulo=id_modulo).all()
    return jsonify([_atividade_publica(a) for a in atividades])


def _atividade_publica(a: AtividadeFisica):
    payload = {
        'id_atividade': a.id_atividade, 'id_modulo': a.id_modulo, 'titulo': a.titulo,
        'dificuldade': a.dificuldade, 'xp_recompensa': a.xp_recompensa, 'tipo': a.tipo,
        'enunciado': a.enunciado, 'unidade': a.unidade,
        'dicas': [{'texto': d.texto} for d in a.dicas.order_by('ordem')],
    }
    if a.tipo == 'multipla_escolha':
        # id_alternativa e texto vão; `correta` NUNCA é exposta aqui.
        payload['alternativas'] = [{'id_alternativa': alt.id_alternativa, 'texto': alt.texto} for alt in a.alternativas]
    return payload


@app.route('/api/fisica/fases')
@login_required
def fisica_fases():
    fases = FaseJogoFisica.query.order_by(FaseJogoFisica.ordem).all()
    return jsonify([{
        'id_fase': f.id_fase, 'id_atividade': f.id_atividade, 'ordem': f.ordem,
        'dificuldade': f.dificuldade, 'xp': f.xp, 'pontuacao_maxima': f.pontuacao_maxima,
        'titulo': f.titulo, 'tipo': f.tipo, 'descricao': f.descricao,
        'objetivo': f.objetivo, 'configuracao': f.configuracao,
    } for f in fases])


@app.route('/api/fisica/niveis')
@login_required
def fisica_niveis():
    niveis = NivelFisica.query.order_by(NivelFisica.nivel).all()
    return jsonify([{'id_nivel': n.id_nivel, 'nivel': n.nivel, 'xp_necessario': n.xp_necessario,
                      'recompensa_moedas': n.recompensa_moedas} for n in niveis])


@app.route('/api/fisica/conquistas')
@login_required
def fisica_conquistas():
    aluno = None
    usuario = usuario_logado()
    if usuario and usuario.tipo_usuario == 'aluno':
        aluno = usuario.aluno
    desbloqueadas = set()
    if aluno:
        desbloqueadas = {c.id_conquista for c in AlunoConquistaFisica.query.filter_by(id_aluno=aluno.id_aluno)}
    conquistas = ConquistaFisica.query.all()
    return jsonify([{
        'id_conquista': c.id_conquista, 'criterio': c.criterio, 'titulo': c.titulo,
        'descricao': c.descricao, 'icone': c.icone, 'xp_recompensa': c.xp_recompensa,
        'desbloqueada': c.id_conquista in desbloqueadas,
    } for c in conquistas])


# ---------------------------------------------------------------------------
# Progresso (escrita) -- exige papel 'aluno'; id_aluno sempre da sessão.
# ---------------------------------------------------------------------------
@app.route('/api/fisica/resumo')
@roles_required('aluno')
def fisica_resumo():
    aluno = aluno_atual()
    nivel_atual, proximo = calcular_nivel(aluno.xp_aluno)
    total_atividades = ProgressoAtividadeFisica.query.filter_by(id_aluno=aluno.id_aluno).count()
    total_fases = ProgressoFaseFisica.query.filter_by(id_aluno=aluno.id_aluno).count()
    total_modulos = ProgressoModuloFisica.query.filter_by(id_aluno=aluno.id_aluno, concluido=True).count()
    total_conquistas = AlunoConquistaFisica.query.filter_by(id_aluno=aluno.id_aluno).count()
    return jsonify({
        'nivel': nivel_atual.nivel if nivel_atual else 1,
        'xp_total': aluno.xp_aluno,
        'xp_no_nivel': aluno.xp_aluno - (nivel_atual.xp_necessario if nivel_atual else 0),
        'xp_para_proximo': (proximo.xp_necessario - nivel_atual.xp_necessario) if (proximo and nivel_atual) else None,
        'moedas': aluno.moedas,
        'atividades_concluidas': total_atividades,
        'fases_concluidas': total_fases,
        'modulos_concluidos': total_modulos,
        'conquistas_desbloqueadas': total_conquistas,
    })


@app.route('/api/fisica/atividade/<int:id_atividade>/responder', methods=['POST'])
@roles_required('aluno')
def fisica_responder_atividade(id_atividade):
    """Corrige a resposta e concede XP -- TUDO calculado no servidor.

    Mitiga diretamente o teste de "Manipulação de XP" e "Mass Assignment":
    o corpo da requisição só pode conter a resposta do aluno
    (id_alternativa OU valor numérico); nenhum campo de XP, nota ou
    "correta" enviado pelo cliente é lido em momento algum.
    """
    aluno = aluno_atual()
    atividade = db.session.get(AtividadeFisica, id_atividade)
    if atividade is None:
        abort(404)

    corpo = request.get_json(silent=True) or {}
    correta = False

    if atividade.tipo == 'multipla_escolha':
        id_alternativa = corpo.get('id_alternativa')
        if id_alternativa is not None:
            alt = next((a for a in atividade.alternativas if a.id_alternativa == int(id_alternativa)), None)
            correta = bool(alt and alt.correta)
    elif atividade.tipo == 'numerica':
        valor = corpo.get('valor')
        if valor is not None and atividade.resposta_correta is not None:
            try:
                valor = float(valor)
                tolerancia = atividade.tolerancia or 0
                correta = abs(valor - atividade.resposta_correta) <= tolerancia
            except (TypeError, ValueError):
                correta = False
    else:
        abort(400)

    xp_ganho = atividade.xp_recompensa if correta else 0

    registro = ProgressoAtividadeFisica.query.filter_by(id_aluno=aluno.id_aluno, id_atividade=id_atividade).first()
    if registro is None:
        registro = ProgressoAtividadeFisica(id_aluno=aluno.id_aluno, id_atividade=id_atividade, tentativas=0)
        db.session.add(registro)
    registro.tentativas = (registro.tentativas or 0) + 1
    if correta and (registro.status != 'concluida'):
        registro.status = 'concluida'
        registro.nota = 10.0
        registro.xp_ganho = xp_ganho
        info_xp = conceder_xp(aluno, xp_ganho)
    else:
        info_xp = {'xp_ganho': 0, 'subiu_nivel': False}
        if not correta:
            registro.status = 'tentativa'

    db.session.commit()

    return jsonify({'correta': correta, **info_xp})


@app.route('/api/fisica/fase/<int:id_fase>/concluir', methods=['POST'])
@roles_required('aluno')
def fisica_concluir_fase(id_fase):
    """Registra conclusão de uma fase do Laboratório Elétrico.

    O XP concedido é SEMPRE `fase.xp` (valor oficial cadastrado no
    servidor) -- mesmo que o cliente envie um campo "xp" no corpo da
    requisição, ele é ignorado. Apenas `pontuacao` (usada para calcular
    estrelas, não XP) é lida do cliente, pois é o resultado de uma
    simulação client-side; ainda assim é limitada ao teto conhecido da
    fase para evitar valores absurdos.
    """
    aluno = aluno_atual()
    fase = db.session.get(FaseJogoFisica, id_fase)
    if fase is None:
        abort(404)

    corpo = request.get_json(silent=True) or {}
    pontuacao_bruta = corpo.get('pontuacao', 0)
    try:
        pontuacao_bruta = int(pontuacao_bruta)
    except (TypeError, ValueError):
        pontuacao_bruta = 0
    pontuacao_maxima = fase.pontuacao_maxima or 0
    pontuacao = max(0, min(pontuacao_bruta, pontuacao_maxima)) if pontuacao_maxima else max(0, pontuacao_bruta)

    if pontuacao_maxima:
        pct = pontuacao / pontuacao_maxima
        estrelas = 3 if pct >= 0.9 else 2 if pct >= 0.6 else 1
    else:
        estrelas = 1

    ja_concluida = ProgressoFaseFisica.query.filter_by(id_aluno=aluno.id_aluno, id_fase=id_fase).first()
    xp_concedido = 0
    if ja_concluida is None:
        # XP só é concedido na primeira conclusão da fase (evita farm de XP
        # reenviando a mesma fase repetidamente).
        xp_concedido = fase.xp
        registro = ProgressoFaseFisica(id_aluno=aluno.id_aluno, id_fase=id_fase,
                                        pontuacao=pontuacao, estrelas=estrelas, xp=xp_concedido)
        db.session.add(registro)
    else:
        registro = ja_concluida
        if pontuacao > (registro.pontuacao or 0):
            registro.pontuacao = pontuacao
            registro.estrelas = estrelas

    info_xp = conceder_xp(aluno, xp_concedido)
    db.session.commit()

    return jsonify({'estrelas': estrelas, 'pontuacao': pontuacao, **info_xp})


@app.route('/api/fisica/modulo/<int:id_modulo>/progresso', methods=['POST'])
@roles_required('aluno')
def fisica_atualizar_progresso_modulo(id_modulo):
    """Progresso percentual de leitura de um módulo (0-100). Não concede
    XP por si só (a leitura de teoria não é recompensada com XP no
    AlphaFizic original -- apenas atividades e fases concedem)."""
    aluno = aluno_atual()
    corpo = request.get_json(silent=True) or {}
    try:
        progresso = max(0, min(100, int(corpo.get('progresso', 0))))
    except (TypeError, ValueError):
        abort(400)

    registro = ProgressoModuloFisica.query.filter_by(id_aluno=aluno.id_aluno, id_modulo=id_modulo).first()
    if registro is None:
        registro = ProgressoModuloFisica(id_aluno=aluno.id_aluno, id_modulo=id_modulo)
        db.session.add(registro)
    registro.progresso = progresso
    registro.concluido = progresso >= 100
    db.session.commit()
    return jsonify({'progresso': registro.progresso, 'concluido': registro.concluido})


@app.route('/api/fisica/ranking')
@roles_required('aluno')
def fisica_ranking():
    """Ranking simples por XP entre alunos (somente leitura, sem dados
    sensíveis além do nome e da pontuação)."""
    from app.models import Aluno
    aluno_atual_obj = aluno_atual()
    alunos = Aluno.query.order_by(Aluno.xp_aluno.desc()).limit(20).all()
    return jsonify([{
        'posicao': i + 1,
        'nome': a.usuario.nome if a.usuario else 'Aluno',
        'pontuacao': a.xp_aluno,
        'is_current_user': a.id_aluno == aluno_atual_obj.id_aluno,
    } for i, a in enumerate(alunos)])
