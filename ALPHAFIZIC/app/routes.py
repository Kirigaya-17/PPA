from app import app
from flask import render_template, request, redirect, url_for, flash, session
from dotenv import load_dotenv
import os
import re
import resend

load_dotenv()  # Carrega variáveis de ambiente do arquivo .env

resend.api_key = os.getenv("Resend")  # Obtém a chave da variável de ambiente

# Simulação de banco de dados em memória
usuarios = {}

def enviarEmail():
    r = resend.Emails.send({
  "from": "wesleyvitor.1928@gmail.com",
  "to": "wesleyvitor.1928@gmail.com",
  "subject": "Recuperação de senha",
  "html": "<p>Congrats on sending your <strong>first email</strong>!</p>"
})


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
    if 'usuario_logado' in session:
        return redirect(url_for('professorMenu'))
        
    if request.method == 'POST':
        email = request.form.get('email')
        senha = request.form.get('senha')
        
        if email in usuarios and usuarios[email]['senha'] == senha:
            session['usuario_logado'] = email
            session['nome_usuario'] = usuarios[email]['nome']
            session['contato_usuario'] = usuarios[email].get('contato', '')
            
            # ---> 1. ADICIONADO AQUI: Salva a bio na sessão no login <---
            session['bio_usuario'] = usuarios[email].get('bio', 'Bem-vindo(a) ao meu perfil!')
            
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
                'senha': senha,
                'bio': 'Bem-vindo(a) ao meu perfil!' # ---> 2. ADICIONADO AQUI: Bio padrão ao cadastrar <---
            }
            
            session['nome_usuario'] = nome
            
            flash('Cadastro realizado com sucesso!', 'sucesso')
            return redirect(url_for('login'))
    
    return render_template('cadastro2.html')

@app.route('/esqueci-senha', methods=['GET', 'POST'])
def esqueci_senha():
    if request.method == 'POST':
        email = request.form.get('email')
        
        if not validar_email(email):
            flash('E-mail inválido.', 'erro')
            return render_template('esqueciSenha.html')
        
        if email in usuarios:
            flash('Um link de recuperação foi enviado para o seu e-mail.', 'sucesso')
            enviarEmail()  # Chama a função para enviar o e-mail

        else:
            flash('E-mail não encontrado.', 'erro')
    
    return render_template('esqueciSenha.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('Você saiu da sua conta.', 'sucesso')
    return redirect(url_for('login'))

@app.route('/professorMenu')
def professorMenu():
    if 'usuario_logado' not in session:
        flash('Por favor, faça login para acessar esta página.', 'erro')
        return redirect(url_for('login'))
        
    usuario_email = session['usuario_logado']
    usuario_data = usuarios.get(usuario_email, {})
    
    return render_template('professorMenu.html', usuario=usuario_data)

@app.route('/atualizar-perfil-inline', methods=['POST'])
def atualizar_perfil_inline():
    if 'usuario_logado' not in session:
        return redirect(url_for('login'))
        
    email_atual = session['usuario_logado']
    
    if email_atual not in usuarios:
        session.clear()
        flash('Sessão expirada ou servidor reiniciado. Por favor, faça login novamente.', 'erro')
        return redirect(url_for('login'))
    
    novo_nome = request.form.get('nome')
    novo_contato = request.form.get('contato')
    nova_senha = request.form.get('senha')
    
    # ---> 3. ADICIONADO AQUI: Pega a nova bio enviada pelo formulário <---
    nova_bio = request.form.get('bio')
    
    if novo_nome:
        usuarios[email_atual]['nome'] = novo_nome
        session['nome_usuario'] = novo_nome
        
    if novo_contato:
        usuarios[email_atual]['contato'] = novo_contato
        session['contato_usuario'] = novo_contato
        
    # ---> 4. ADICIONADO AQUI: Atualiza a bio no dicionário e na sessão <---
    if nova_bio is not None:
        usuarios[email_atual]['bio'] = nova_bio
        session['bio_usuario'] = nova_bio
        
    if nova_senha:
        usuarios[email_atual]['senha'] = nova_senha
        flash('Senha alterada com sucesso!', 'sucesso')
    else:
        flash('Perfil atualizado com sucesso!', 'sucesso')
        
    return redirect(url_for('professorMenu'))

@app.route('/turmas')
def turmas():
    # CORRIGIDO AQUI: Trocado 'usuario' por 'usuario_logado' para bater com o resto do sistema
    if 'usuario_logado' not in session:
        flash('Faça login para acessar esta página.', 'erro')
        return redirect(url_for('login'))
    
    return render_template('turma.html')