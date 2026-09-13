"""
Comando `flask seed-fisica`: popula as tabelas do currículo de Física
(modulos_fisica, formulas_fisica, exemplos_fisica, atividades_fisica,
alternativas_fisica, dicas_fisica, fases_jogo_fisica, niveis_fisica,
conquistas_fisica) a partir de app/dados/curriculo_fisica.json.

Esse JSON contém os MESMOS dados reais originalmente presentes em
`alphafizic/js/demo-data.js` (extraídos programaticamente com json.loads,
nunca digitados/inventados à mão) -- ver relatório de integração.

Idempotente: pode ser rodado várias vezes sem duplicar linhas (usa
merge/upsert por chave primária).
"""
import json
import os

import click
from flask.cli import with_appcontext

from app import db
from app.models import (
    ModuloFisica, FormulaFisica, ExemploFisica, AtividadeFisica,
    AlternativaFisica, DicaFisica, FaseJogoFisica, NivelFisica,
    ConquistaFisica, Conteudo,
)

DADOS_PATH = os.path.join(os.path.dirname(__file__), 'dados', 'curriculo_fisica.json')


def _carregar_json():
    with open(DADOS_PATH, encoding='utf-8') as f:
        return json.load(f)


@click.command('seed-fisica')
@with_appcontext
def seed_fisica_command():
    """Popula (ou atualiza) o currículo de Física a partir do JSON extraído do AlphaFizic."""
    data = _carregar_json()

    # 1) Conteúdo "pai" (tabela já existente no PPA: conteudos).
    #    Reaproveita se já existir um conteúdo com o mesmo título; senão cria.
    conteudo_json = data['conteudo']
    conteudo = Conteudo.query.filter_by(titulo=conteudo_json['titulo']).first()
    if conteudo is None:
        conteudo = Conteudo(
            titulo=conteudo_json['titulo'],
            descricao=conteudo_json.get('descricao'),
            tipo='fisica_interativa',
        )
        db.session.add(conteudo)
        db.session.flush()
    id_conteudo = conteudo.id_conteudo

    # 2) Módulos
    for m in data['modulos']:
        obj = db.session.get(ModuloFisica, m['id_modulo']) or ModuloFisica(id_modulo=m['id_modulo'])
        obj.id_conteudo = id_conteudo
        obj.ordem = m.get('ordem')
        obj.dificuldade = m.get('dificuldade')
        obj.ativo = bool(m.get('ativo', True))
        obj.titulo = m['titulo']
        obj.descricao = m.get('descricao')
        obj.icone = m.get('icone')
        obj.area = m.get('area')
        obj.corpo = m.get('corpo')
        db.session.merge(obj)

    # 3) Fórmulas
    for fo in data['formulas']:
        obj = db.session.get(FormulaFisica, fo['id_formula']) or FormulaFisica(id_formula=fo['id_formula'])
        obj.id_modulo = fo['id_modulo']
        obj.ordem = fo.get('ordem')
        obj.nome = fo['nome']
        obj.expressao = fo.get('expressao')
        obj.descricao = fo.get('descricao')
        obj.unidade = fo.get('unidade')
        obj.calc = fo.get('calc')
        db.session.merge(obj)

    # 4) Exemplos (estrutura variável -> guardado como JSON bruto)
    for ex in data['exemplos']:
        eid = ex.get('id_exemplo') or ex.get('id')
        if eid is None:
            continue
        obj = db.session.get(ExemploFisica, eid) or ExemploFisica(id_exemplo=eid)
        obj.id_modulo = ex.get('id_modulo')
        obj.ordem = ex.get('ordem')
        obj.dados = ex
        db.session.merge(obj)

    # 5) Atividades + alternativas + dicas
    for at in data['atividades']:
        obj = db.session.get(AtividadeFisica, at['id_atividade']) or AtividadeFisica(id_atividade=at['id_atividade'])
        obj.id_modulo = at['id_modulo']
        obj.titulo = at.get('titulo')
        obj.dificuldade = at.get('dificuldade')
        obj.xp_recompensa = at.get('xp_recompensa', 0)
        obj.tipo = at['tipo']
        obj.enunciado = at.get('enunciado')
        obj.resposta_correta = at.get('resposta_correta')
        obj.tolerancia = at.get('tolerancia')
        obj.unidade = at.get('unidade')
        db.session.merge(obj)

        for alt in at.get('alternativas', []) or []:
            aobj = db.session.get(AlternativaFisica, alt['id_alternativa']) or AlternativaFisica(id_alternativa=alt['id_alternativa'])
            aobj.id_atividade = at['id_atividade']
            aobj.texto = alt['texto']
            aobj.correta = bool(alt.get('correta', False))
            db.session.merge(aobj)

        for i, dica in enumerate(at.get('dicas', []) or []):
            # dicas não têm id próprio no JSON original -> chave composta por
            # (id_atividade, ordem) simulada via busca manual (idempotência)
            existente = DicaFisica.query.filter_by(id_atividade=at['id_atividade'], ordem=i).first()
            if existente is None:
                existente = DicaFisica(id_atividade=at['id_atividade'], ordem=i)
            existente.texto = dica['texto']
            db.session.add(existente)

    # 6) Fases do laboratório
    for fa in data['fasesJogo']:
        obj = db.session.get(FaseJogoFisica, fa['id_fase']) or FaseJogoFisica(id_fase=fa['id_fase'])
        obj.id_atividade = fa.get('id_atividade')
        obj.ordem = fa.get('ordem')
        obj.dificuldade = fa.get('dificuldade')
        obj.xp = fa.get('xp', 0)
        obj.pontuacao_maxima = fa.get('pontuacao_maxima')
        obj.titulo = fa.get('titulo')
        obj.tipo = fa['tipo']
        obj.descricao = fa.get('descricao')
        obj.objetivo = fa.get('objetivo')
        obj.configuracao = fa.get('configuracao')
        db.session.merge(obj)

    # 7) Níveis
    for nv in data['niveis']:
        obj = db.session.get(NivelFisica, nv['id_nivel']) or NivelFisica(id_nivel=nv['id_nivel'])
        obj.nivel = nv['nivel']
        obj.xp_necessario = nv['xp_necessario']
        obj.recompensa_moedas = nv.get('recompensa_moedas', 0)
        db.session.merge(obj)

    # 8) Conquistas
    for cq in data['conquistas']:
        obj = db.session.get(ConquistaFisica, cq['id_conquista']) or ConquistaFisica(id_conquista=cq['id_conquista'])
        obj.criterio = cq['criterio']
        obj.titulo = cq.get('titulo')
        obj.descricao = cq.get('descricao')
        obj.icone = cq.get('icone')
        obj.xp_recompensa = cq.get('xp_recompensa', 0)
        db.session.merge(obj)

    db.session.commit()

    click.echo(
        f"Seed concluído: {len(data['modulos'])} módulos, {len(data['formulas'])} fórmulas, "
        f"{len(data['exemplos'])} exemplos, {len(data['atividades'])} atividades, "
        f"{len(data['fasesJogo'])} fases, {len(data['niveis'])} níveis, "
        f"{len(data['conquistas'])} conquistas."
    )
