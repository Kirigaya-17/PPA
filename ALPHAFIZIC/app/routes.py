from app import app
from flask import render_template, request, redirect, url_for, flash, session
import re

# Simulação de banco de dados em memória
usuarios = {}

# Validação de email
def validar_email(email):
    regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(regex, email)

# Validação de CPF (apenas dígitos e tamanho)
def validar_cpf(cpf):
    cpf = cpf.replace('.', '').replace('-', '')
    return len(cpf) == 11 and cpf.isdigit()

@app.route('/')
@app.route('/index')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        senha = request.form.get('senha')
        
        # Verificação de sessão existente
        if 'usuario' in session:
            flash('Você já está logado!', 'sucesso')
            return redirect(url_for('professorMenu'))
        
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
        
        # Validações
        if not nome or not email or not cpf or not senha:
            flash('Todos os campos obrigatórios devem ser preenchidos.', 'erro')
            return render_template('cadastro2.html')
        
        if not validar_email(email):
            flash('E-mail inválido.', 'erro')
            return render_template('cadastro2.html')
        
        if not validar_cpf(cpf):
            flash('CPF inválido. Verifique o formato.', 'erro')
            return render_template('cadastro2.html')
        
        if email in usuarios:
            flash('E-mail já cadastrado.', 'erro')
        else:
            usuarios[email] = {
                'nome': nome, 
                'cpf': cpf, 
                'contato': contato, 
                'senha': senha
            }
            
            session['nome_usuario'] = nome 
            
            flash('Cadastro realizado com sucesso!', 'sucesso')
            return redirect(url_for('login'))
    
    return render_template('cadastro2.html')

@app.route('/esqueci-senha', methods=['GET', 'POST'])
def esqueci_senha():
    if request.method == 'POST':
        email = request.form.get('email')
        
        # Verificação de email válido
        if not validar_email(email):
            flash('E-mail inválido.', 'erro')
            return render_template('esqueciSenha.html')
        
        if email in usuarios:
            flash('Um link de recuperação foi enviado para o seu e-mail.', 'sucesso')
            # Aqui você implementaria o envio real de email
        else:
            flash('E-mail não encontrado.', 'erro')
    
    return render_template('esqueciSenha.html')

@app.route('/codigo', methods=['GET', 'POST'])
def codigo():
    if request.method == 'POST':
        codigo = request.form.get('codigo')
        
        # Validação do código (exemplo: 6 dígitos)
        if codigo and len(codigo) == 6 and codigo.isdigit():
            flash('Código verificado com sucesso!', 'sucesso')
            return redirect(url_for('login'))
        else:
            flash('Código inválido. Verifique e tente novamente.', 'erro')
    
    return render_template('codigo.html')

@app.route('/logout')
def logout():
    session.pop('usuario', None)
    flash('Logout realizado com sucesso!', 'sucesso')
    return redirect(url_for('login'))

@app.route('/professorMenu')
def professorMenu():
    # Verificação de autenticação
    if 'usuario' not in session:
        flash('Faça login para acessar esta página.', 'erro')
        return redirect(url_for('login'))
    
    # Pega os dados do usuário logado
    usuario_email = session['usuario']
    usuario_data = usuarios.get(usuario_email, {})
    
    return render_template('professorMenu.html', usuario=usuario_data)

@app.route('/turmas')
def turmas():
    # Verificação de autenticação
    if 'usuario' not in session:
        flash('Faça login para acessar esta página.', 'erro')
        return redirect(url_for('login'))
    
    return render_template('turma.html')