
# ALPHAFIZIC 🐺

Bem-vindo ao repositório do **ALPHAFIZIC**. Esta aplicação é construída em **Python + Flask** e gerencia fluxos de cadastro, login e painéis específicos para alunos e professores.

**Aviso de Contexto:** Este projeto é o resultado da **mesclagem dos repositórios PPA2025 + PPA**. Atualmente, ele serve como base para a implementação do sistema completo, com autenticação provisória estruturada em memória.

---

## 🛠️ Tecnologias Utilizadas

- **Back-end:** Python 3, Flask
- **Front-end:** HTML5, CSS3, JavaScript (Jinja2 para renderização de templates)
- **Armazenamento de Dados Atual:** Em memória (utilizando Dicionários/Dicts). *A ser substituído por SQL em breve.*
- **Gerenciamento de Sessão:** Sessões nativas do Flask

---

## 📦 Estrutura do Projeto

Para facilitar a navegação da equipe, o projeto segue a arquitetura modular abaixo:

```text
ALPHAFIZIC/
│
├── app/
│   ├── __init__.py          # Configurações iniciais do app e secret_key
│   ├── routes.py            # Controladores e definição de todas as rotas
│   ├── templates/           # Arquivos HTML (views)
│   └── static/              # Assets (CSS, JS, Imagens)
│       ├── css/             # Folhas de estilo modularizadas
│       ├── js/              # Scripts de interatividade
│       └── img/             # Imagens da aplicação
│
├── venv/                    # (Ignorado no Git) Ambiente virtual
├── requirements.txt         # Dependências do projeto
└── av.py                    # Ponto de entrada (Entrypoint) do servidor

```

---

## 🚀 Como Rodar o Projeto Localmente

Siga o passo a passo abaixo para configurar o ambiente de desenvolvimento na sua máquina:

**1. Clone o repositório e acesse a pasta**

```bash
git clone <url-do-repositorio>
cd ALPHAFIZIC

```

**2. Crie e ative o Ambiente Virtual (Recomendado)**

```bash
# Criar o ambiente
python -m venv venv

# Ativar no Windows:
venv\Scripts\activate
# Ativar no Linux/Mac:
source venv/bin/activate

```

**3. Instale as Dependências**

```bash
pip install -r requirements.txt

```

**4. Execute o Servidor**

```bash
python av.py

```

> O servidor estará rodando em: `http://localhost:5000`

---

## 📍 Mapeamento de Rotas

Lista de endpoints disponíveis atualmente no arquivo `routes.py`:

| Rota | Método | Descrição | Autenticação |
| --- | --- | --- | --- |
| `/` | `GET` | Página inicial da aplicação | Pública |
| `/login` | `GET, POST` | Página e processamento de Login | Pública |
| `/cadastro` | `GET` | Tela de escolha de perfil (Aluno/Professor) | Pública |
| `/cadastro2` | `GET, POST` | Formulário final e processamento de cadastro | Pública |
| `/esqueci-senha` | `GET, POST` | Solicitação de recuperação de senha | Pública |
| `/codigo` | `GET, POST` | Verificação do código de recuperação | Pública |
| `/professorMenu` | `GET` | Painel de controle do Professor | **Protegida** |
| `/logout` | `GET` | Encerra a sessão atual e limpa os cookies | **Protegida** |

---

## 🔧 Histórico de Atualizações (Changelog)

**Correções Recentes:**

* ✅ Corrigido bug de login que permitia acesso sem verificação de sessão.
* ✅ Adicionadas validações estruturais de Email e CPF.
* ✅ Conectado o `professorMenu` com o módulo de turmas.
* ✅ Implementada a rota e o botão de logout.
* ✅ Arquivo `requirements.txt` atualizado e corrigido.
* ✅ Adicionada verificação de autenticação nas rotas protegidas (redirecionamento caso não logado).

---

## ⚠️ Issues Conhecidos (Bugs)

Abaixo estão os bugs mapeados que precisam de atenção prioritária da equipe:

* [ ] **Falso Positivo no Login:** A mensagem de "Login concluído com Sucesso" está aparecendo na tela (flash message) mesmo quando o usuário falha na autenticação ou acessa a página sem logar.

---

## 🎯 Próximos Passos (Roadmap)

Tarefas pendentes para os desenvolvedores. Pegue uma task, crie uma *branch* e faça seu PR!

**Banco de Dados & Segurança:**

* [ ] Integrar banco de dados real utilizando **SQLAlchemy** (Substituir os dicionários atuais).
* [ ] Adicionar sistema de hash e proteção de senhas (ex: *Werkzeug security* ou *Bcrypt*).
* [ ] Adicionar sistema de tokens para recuperação de senha real (JWT).

**Funcionalidades:**

* [ ] Melhorar/Aprofundar as validações de email no backend.
* [ ] Implementar fluxo de confirmação de cadastro via email.
* [ ] Adicionar um botão funcional de "Entrar nas turmas" no painel do aluno.
* [ ] Refinar a conexão e exibição das turmas dentro do `professorMenu`.

```

```