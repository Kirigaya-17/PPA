from app import app
from flask import render_template, request, redirect, url_for, flash, session

# Simulação de banco de dados em memória
usuarios = {}

@app.route('/')
@app.route('/index')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        senha = request.form.get('senha')
        if email in usuarios and usuarios[email]['senha'] == senha:
            session['usuario'] = email
            flash('Login realizado com sucesso!', 'sucesso')
            return redirect(url_for('professorMenu'))
        else:
            flash('E-mail ou senha incorretos.', 'erro')
    return render_template('login.html')

@app.route('/cadastro')
def cadastro():
    return render_template('cadastro.html')

@app.route('/cadastro2', methods=['GET', 'POST'])
def cadastro2():
    if request.method == 'POST':
        nome = request.form.get('nome')
        email = request.form.get('email')
        cpf = request.form.get('cpf')
        contato = request.form.get('contato')
        senha = request.form.get('senha')
        if email in usuarios:
            flash('E-mail já cadastrado.', 'erro')
        else:
            usuarios[email] = {'nome': nome, 'cpf': cpf, 'contato': contato, 'senha': senha}
            flash('Cadastro realizado com sucesso!', 'sucesso')
            return redirect(url_for('login'))
    return render_template('cadastro2.html')

@app.route('/esqueci-senha', methods=['GET', 'POST'])
def esqueci_senha():
    if request.method == 'POST':
        email = request.form.get('email')
        if email in usuarios:
            flash('Um link de recuperação foi enviado para o seu e-mail.', 'sucesso')
        else:
            flash('E-mail não encontrado.', 'erro')
    return render_template('esqueciSenha.html')

@app.route('/codigo', methods=['GET', 'POST'])
def codigo():
    if request.method == 'POST':
        flash('Código verificado com sucesso!', 'sucesso')
        return redirect(url_for('login'))
    return render_template('codigo.html')

@app.route('/logout')
def logout():
    session.pop('usuario', None)
    return redirect(url_for('index'))

@app.route('/professorMenu')
def professorMenu():
    return render_template('professorMenu.html')

@app.route('/turmas')
def turmas():
    return render_template('turma.html')