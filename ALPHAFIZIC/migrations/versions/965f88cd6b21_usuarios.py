"""baseline - schema real existente (nao-destrutiva)

Revision ID: 965f88cd6b21
Revises:
Create Date: 2026-08-28 18:37:40.091104

=== IMPORTANTE - LEIA ANTES DE RODAR QUALQUER COMANDO DE MIGRATION ===

A migration original gerada aqui (via `flask db migrate` rodado sem que o
metadata do SQLAlchemy estivesse alinhado ao banco real) tinha um upgrade()
que APAGAVA todas as tabelas de negócio existentes (turmas, atividades,
alunos, professores, mensagens, conteudos, aluno_turma, atividades_aluno,
tabelas de gamificação) e criava no lugar uma tabela genérica `user` vazia.
Rodar `flask db upgrade` com aquele arquivo destruiria os dados reais.

Esta versão substitui aquele arquivo por uma migration "baseline": ela NÃO
executa nenhum DDL (upgrade/downgrade são no-ops), porque o banco já existe
com essa estrutura -- o objetivo aqui é apenas registrar essa revisão como
o ponto de partida do histórico do Alembic.

Além disso, esta migration reflete o schema ATUAL, conforme o modelo
EER_29082026_01.mwb (mais recente que a versão anterior deste projeto).
Diferenças notadas em relação ao que a migration antiga descrevia:
  * As tabelas de gamificação (niveis, conquistas, ranking, aluno_conquista)
    e as colunas xp_total/moedas/nivel_atual (em alunos), xp_recompensa (em
    atividades) e xp_ganho/status (em atividades_aluno) NÃO existem mais no
    banco atual -- foram removidas em uma iteração posterior do esquema.
    Não foi possível determinar, a partir dos arquivos fornecidos, se essa
    remoção foi intencional ou se os dados dessas tabelas ainda existem em
    algum outro ambiente; confirme com o time antes de assumir que podem
    ser descartadas definitivamente.

COMO APLICAR ISSO NO BANCO DE PRODUÇÃO EXISTENTE (sem perder dados):

    flask db stamp head

`stamp` apenas grava a revisão atual na tabela `alembic_version` -- não
executa nenhum DDL. NUNCA rode `flask db upgrade` a partir do estado
"vazio" do Alembic neste projeto sem antes conferir o conteúdo de cada
migration, exatamente pelo motivo descrito acima.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '965f88cd6b21'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Intencionalmente vazio: o banco já existe com esta estrutura.
    # Use `flask db stamp head` para registrar esta revisão sem executar DDL.
    pass


def downgrade():
    # Intencionalmente vazio (ver nota acima).
    pass
