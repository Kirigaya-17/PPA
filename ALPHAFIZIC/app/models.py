from symtable import Class
from typing import Optional
import sqlalchemy as sa
import sqlalchemy.orm as so
from app import db

class Usuario(db.Model):
    __tablename__ = 'usuarios'
    id_usuario = db.Column(db.Integer, primary_key=True)

    nome = db.Column(db.String(80), unique=True, nullable=False)
             
    email = db.Column(db.String(120), unique=True, nullable=False)
           
    senha = db.Column(db.String(120), nullable=False)

    tipo_usuario = db.Column(db.String(20), nullable=False)

    genero = db.Column(db.String(20), nullable=True)

    data_nascimento = db.Column(db.Date, nullable=True)

    foto = db.Column(db.String(200), nullable=True)

    data_cadastro = db.Column(db.DateTime, nullable=False, default=sa.func.now())

    
    def __repr__(self):
        return '<User {}>'.format(self.username)

class Professor(db.Model):

    __tablename__ = 'professores'

    id_professor = db.Column(db.Integer, primary_key=True)

    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)

    usuario = so.relationship('Usuario', backref=so.backref('professor', uselist=False))

    area = db.Column(db.String(100), nullable=True)

    titulacao = db.Column(db.String(100), nullable=True)

    bio = db.Column(db.String(500), nullable=True)

    def __repr__(self):
        return '<Professor {}>'.format(self.usuario.username)

class mensagens(db.Model):

    __tablename__ = 'mensagens'

    id_mensagem = db.Column(db.Integer, primary_key=True)

    remetente_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)

    destinatario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)

    mensagem = db.Column(db.String(1000), nullable=False)

    data_envio = db.Column(db.DateTime, nullable=False, default=sa.func.now())

    remetente = so.relationship('Usuario', foreign_keys=[remetente_id], backref=so.backref('mensagens_enviadas', lazy='dynamic'))

    destinatario = so.relationship('Usuario', foreign_keys=[destinatario_id], backref=so.backref('mensagens_recebidas', lazy='dynamic'))

    def __repr__(self):
        return '<Mensagem de {} para {}>'.format(self.remetente.username, self.destinatario.username)

class Aluno(db.Model):

    __tablename__ = 'alunos'

    id_aluno = db.Column(db.Integer, primary_key=True)

    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)

    usuario = so.relationship('Usuario', backref=so.backref('aluno', uselist=False))

    def __repr__(self):
        return '<Aluno {}>'.format(self.usuario.username)

class atividades(db.Model):

    __tablename__ = 'atividades'

    id_atividade = db.Column(db.Integer, primary_key=True)

    titulo = db.Column(db.String(200), nullable=False)

    descricao = db.Column(db.String(1000), nullable=True)

    data_criacao = db.Column(db.DateTime, nullable=False, default=sa.func.now())

    professor_id = db.Column(db.Integer, db.ForeignKey('professores.id'), nullable=False)

    professor = so.relationship('Professor', backref=so.backref('atividades', lazy='dynamic'))

    def __repr__(self):
        return '<Atividade {}>'.format(self.titulo)

class atividades_alunos(db.Model):

    __tablename__ = 'atividades_alunos'

    id: db.Column(db.Integer, primary_key=True)

    atividade_id: db.Column(db.Integer, db.ForeignKey('atividades.id'), nullable=False)

    aluno_id: db.Column(db.Integer, db.ForeignKey('alunos.id'), nullable=False)

    data_entrega: db.Column(db.DateTime, nullable=True)

    nota: db.Column(db.Float, nullable=True)

    atividade: so.relationship('atividades', backref=so.backref('atividades_alunos', lazy='dynamic'))

    aluno: so.relationship('Aluno', backref=so.backref('atividades_alunos', lazy='dynamic'))

    def __repr__(self):
        return '<AtividadeAluno Atividade {} Aluno {}>'.format(self.atividade.titulo, self.aluno.usuario.username)

class aluno_turma(db.Model):

    __tablename__ = 'aluno_turma'

    id: db.Column(db.Integer, primary_key=True)

    aluno_id: db.Column(db.Integer, db.ForeignKey('alunos.id'), nullable=False)

    turma_id: db.Column(db.Integer, db.ForeignKey('turmas.id'), nullable=False)

    aluno: so.relationship('Aluno', backref=so.backref('aluno_turma', lazy='dynamic'))

    turma: so.relationship('turmas', backref=so.backref('aluno_turma', lazy='dynamic'))

    def __repr__(self):
        return '<AlunoTurma Aluno {} Turma {}>'.format(self.aluno.usuario.username, self.turma.nome)

class conteudo(db.Model):

    __tablename__ = 'conteudos'

    id: db.Column(db.Integer, primary_key=True)

    titulo: db.Column(db.String(200), nullable=False)

    descricao: db.Column(db.String(1000), nullable=True)

    data_criacao: db.Column(db.DateTime, nullable=False, default=sa.func.now())

    professor_id: db.Column(db.Integer, db.ForeignKey('professores.id'), nullable=False)

    professor: so.relationship('Professor', backref=so.backref('conteudos', lazy='dynamic'))

    def __repr__(self):
        return '<Conteudo {}>'.format(self.titulo)

class turmas(db.Model):

    __tablename__ = 'turmas'

    id: db.Column(db.Integer, primary_key=True)

    nome: db.Column(db.String(100), nullable=False)

    descricao: db.Column(db.String(500), nullable=True)

    professor_id: db.Column(db.Integer, db.ForeignKey('professores.id'), nullable=False)

    professor: so.relationship('Professor', backref=so.backref('turmas', lazy='dynamic'))

    def __repr__(self):
        return '<Turma {}>'.format(self.nome)
