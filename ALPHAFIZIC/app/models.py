"""
Modelos SQLAlchemy alinhados ao schema REAL do banco MySQL existente
(ver EER_29082026_01.mwb). Principais correções em relação à versão anterior:

  * FKs apontavam para 'usuarios.id', 'turmas.id', 'alunos.id', 'atividades.id'
    -- colunas que NÃO existem no banco (as PKs reais são id_usuario, id_turma,
    id_aluno, id_atividade). Isso quebraria qualquer query/JOIN em produção.
  * Tabela 'atividades_alunos' (plural) não existe; o banco tem 'atividades_aluno'.
  * Enum tipo_usuario tinha 'administrador'; o banco aceita apenas 'admin'.
  * Coluna 'senha' era VARCHAR(120); hashes bcrypt/werkzeug (scrypt) passam de
    120 caracteres e seriam truncados silenciosamente -> ajustado para 255
    (mesmo tamanho já existente na coluna do banco).
  * 'nome' tinha unique=True, mas não existe índice UNIQUE em 'usuarios.nome'
    no banco -- removido para não gerar erro ao tentar criar essa constraint.
  * Faltavam colunas existentes no banco: usuarios.status, professores.bio,
    atividades.data_limite.
  * Modelo 'conteudo' relacionava-se com 'professores' via professor_id,
    mas a coluna real em 'conteudos' é id_turma (FK para turmas). Ou seja,
    no banco existente o conteúdo pertence a uma TURMA, não diretamente a um
    professor. Mantive fiel ao banco (não alterei a tabela) -- ver relatório,
    seção B, para a explicação completa dessa divergência estrutural.
"""

from datetime import datetime, date
from werkzeug.security import generate_password_hash, check_password_hash
import sqlalchemy as sa
import sqlalchemy.orm as so
from sqlalchemy.dialects import mysql
from app import db

TIPOS_USUARIO = ('aluno', 'professor', 'admin')
DIFICULDADES = ('facil', 'medio', 'dificil')


class Usuario(db.Model):
    __tablename__ = 'usuarios'

    id_usuario = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    senha = db.Column(db.String(255), nullable=False)
    tipo_usuario = db.Column(db.Enum(*TIPOS_USUARIO), nullable=False)
    genero = db.Column(db.String(50), nullable=True)
    data_nascimento = db.Column(db.Date, nullable=True)
    foto = db.Column(db.String(255), nullable=True)
    data_cadastro = db.Column(db.DateTime, nullable=True, server_default=sa.func.now())
    status = db.Column(mysql.TINYINT(1), nullable=True, server_default=sa.text('1'))

    def set_senha(self, senha_plana: str) -> None:
        """Gera hash seguro (Werkzeug/scrypt) - nunca armazenar senha em texto puro."""
        self.senha = generate_password_hash(senha_plana)

    def check_senha(self, senha_plana: str) -> bool:
        if not self.senha:
            return False
        return check_password_hash(self.senha, senha_plana)

    @property
    def is_admin(self) -> bool:
        return self.tipo_usuario == 'admin'

    def __repr__(self):
        return '<Usuario {}>'.format(self.nome)


class Professor(db.Model):
    __tablename__ = 'professores'

    id_professor = db.Column(db.Integer, primary_key=True)
    # Nome do atributo Python continua "usuario_id" por compatibilidade com o
    # restante do código, mas mapeado para a coluna REAL do banco: id_usuario.
    usuario_id = db.Column('id_usuario', db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=False)
    area = db.Column(db.String(100), nullable=True)
    titulacao = db.Column(db.String(100), nullable=True)
    bio = db.Column(db.String(500), nullable=True)

    usuario = so.relationship('Usuario', backref=so.backref('professor', uselist=False))

    def __repr__(self):
        return '<Professor {}>'.format(self.usuario.nome if self.usuario else self.id_professor)


class Aluno(db.Model):
    __tablename__ = 'alunos'

    id_aluno = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column('id_usuario', db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=False)
    matricula = db.Column(db.String(20), nullable=True)  # sem UNIQUE no banco atual

    usuario = so.relationship('Usuario', backref=so.backref('aluno', uselist=False))

    def __repr__(self):
        return '<Aluno {}>'.format(self.usuario.nome if self.usuario else self.id_aluno)


class Mensagem(db.Model):
    __tablename__ = 'mensagens'

    id_mensagem = db.Column(db.Integer, primary_key=True)
    remetente_id = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=True)
    destinatario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=True)
    mensagem = db.Column(db.Text, nullable=True)
    data_envio = db.Column(db.DateTime, nullable=True, server_default=sa.func.now())

    remetente = so.relationship('Usuario', foreign_keys=[remetente_id],
                                 backref=so.backref('mensagens_enviadas', lazy='dynamic'))
    destinatario = so.relationship('Usuario', foreign_keys=[destinatario_id],
                                    backref=so.backref('mensagens_recebidas', lazy='dynamic'))

    def __repr__(self):
        return '<Mensagem {} -> {}>'.format(self.remetente_id, self.destinatario_id)


class Turma(db.Model):
    __tablename__ = 'turmas'

    id_turma = db.Column(db.Integer, primary_key=True)
    nome_turma = db.Column(db.String(100), nullable=True)
    codigo_turma = db.Column(db.String(20), unique=True, nullable=True)
    disciplina = db.Column(db.String(100), nullable=True)
    ano_letivo = db.Column(db.Integer, nullable=True)
    # Coluna real no banco é id_professor (não professor_id) e referencia
    # professores.id_professor (não professores.id).
    professor_id = db.Column('id_professor', db.Integer, db.ForeignKey('professores.id_professor'), nullable=True)

    professor = so.relationship('Professor', backref=so.backref('turmas', lazy='dynamic'))

    def __repr__(self):
        return '<Turma {}>'.format(self.nome_turma)


class Atividade(db.Model):
    __tablename__ = 'atividades'

    id_atividade = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(150), nullable=True)
    descricao = db.Column(db.Text, nullable=True)
    dificuldade = db.Column(db.Enum(*DIFICULDADES), nullable=True)
    data_limite = db.Column(db.Date, nullable=True)
    id_turma = db.Column(db.Integer, db.ForeignKey('turmas.id_turma'), nullable=True)
    data_criacao = db.Column(db.DateTime, nullable=True, server_default=sa.func.now())

    turma = so.relationship('Turma', backref=so.backref('atividades', lazy='dynamic'))

    def __repr__(self):
        return '<Atividade {}>'.format(self.titulo)


class AtividadeAluno(db.Model):
    # Nome real da tabela no banco é singular: atividades_aluno
    __tablename__ = 'atividades_aluno'

    id = db.Column(db.Integer, primary_key=True)
    id_aluno = db.Column(db.Integer, db.ForeignKey('alunos.id_aluno'), nullable=True)
    id_atividade = db.Column(db.Integer, db.ForeignKey('atividades.id_atividade'), nullable=True)
    nota = db.Column(db.Numeric(5, 2), nullable=True)
    data_entrega = db.Column(db.DateTime, nullable=True)

    atividade = so.relationship('Atividade', backref=so.backref('entregas', lazy='dynamic'))
    aluno = so.relationship('Aluno', backref=so.backref('entregas', lazy='dynamic'))

    def __repr__(self):
        return '<AtividadeAluno atividade={} aluno={}>'.format(self.id_atividade, self.id_aluno)


class AlunoTurma(db.Model):
    __tablename__ = 'aluno_turma'

    id = db.Column(db.Integer, primary_key=True)
    id_aluno = db.Column(db.Integer, db.ForeignKey('alunos.id_aluno'), nullable=True)
    id_turma = db.Column(db.Integer, db.ForeignKey('turmas.id_turma'), nullable=True)
    data_entrada = db.Column(db.Date, nullable=True)

    aluno = so.relationship('Aluno', backref=so.backref('turmas_vinculadas', lazy='dynamic'))
    turma = so.relationship('Turma', backref=so.backref('alunos_vinculados', lazy='dynamic'))

    def __repr__(self):
        return '<AlunoTurma aluno={} turma={}>'.format(self.id_aluno, self.id_turma)


class Conteudo(db.Model):
    __tablename__ = 'conteudos'

    id_conteudo = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(150), nullable=True)
    descricao = db.Column(db.Text, nullable=True)
    tipo = db.Column(db.String(50), nullable=True)
    arquivo = db.Column(db.String(255), nullable=True)
    data_publicacao = db.Column(db.Date, nullable=True)
    # No banco real, conteúdo pertence a uma turma (não a um professor
    # diretamente). Ver nota no topo do arquivo.
    id_turma = db.Column(db.Integer, db.ForeignKey('turmas.id_turma'), nullable=True)

    turma = so.relationship('Turma', backref=so.backref('conteudos', lazy='dynamic'))

    def __repr__(self):
        return '<Conteudo {}>'.format(self.titulo)
