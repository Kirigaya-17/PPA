# ALPHAFIZIC 🐺

Projeto Flask com login, cadastro e autenticação. Mesclagem PPA2025 + PPA.

## 📦 Estrutura do Projeto

## 🚀 Como Rodar

```bash
# 1. Instale o Flask
pip install -r requirements.txt

# 2. Execute
python av.py

# 3. Acesse
http://localhost:5000
```

## 📍 Rotas Disponíveis

| Rota | Descrição |
|------|-----------|
| `/` | Página inicial |
| `/login` | Login |
| `/cadastro` | Escolha Aluno/Professor |
| `/cadastro2` | Formulário de cadastro |
| `/esqueci-senha` | Recuperação de senha |
| `/codigo` | Verificação de código |
| `/logout` | Encerra sessão |

## 🔧 Tecnologias

- Flask (Python)
- HTML5 + CSS3
- Autenticação em memória (dict)

## ⚠️ Próximos Passos

- [ ] Integrar banco de dados (SQLalchemy)
- [ ] Adicionar validações de email
- [ ] Implementar confirmação de cadastro
- [ ] Adicionar sistema de tokens
- [ ] Adicionar um botão de entrar nas turmas
- [ ] Conectar turmas com professorMenu

"# PPA" 

## ⚠️ Arrumar alguns Problemas

- [ ] Mensagem de "Login concluido com Sucesso" aparecendo sem efetuar o login
