# ALPHAFIZIC 🐺

Plataforma educacional gamificada de Física desenvolvida como projeto da **PPA 2025**. Conecta professores e alunos por meio de turmas, módulos de conteúdo e um sistema de progressão com XP, níveis e conquistas.

---

## 🛠️ Tecnologias

| Camada | Tecnologias |
|---|---|
| Back-end | Python 3, Flask, Flask-SQLAlchemy, Flask-Migrate, Flask-WTF, Flask-Limiter |
| Front-end | HTML5, CSS3, JavaScript, Jinja2 |
| Banco de dados | MySQL (via PyMySQL) |
| E-mail | Resend API |
| Segurança | Werkzeug (hashing), CSRF, Rate Limiting, HTTP Security Headers |
| Testes | pytest, pip-audit |

---

## 📦 Estrutura do Projeto

```text
ALPHAFIZIC/
│
├── app/
│   ├── __init__.py           # Inicialização do app, db, CSRF e rate limiter
│   ├── config.py             # Configurações lidas de variáveis de ambiente
│   ├── models.py             # Modelos SQLAlchemy (schema MySQL)
│   ├── routes.py             # Rotas gerais (auth, perfil, turmas, materiais)
│   ├── routes_fisica.py      # Rotas da API de física (módulos, progresso, XP)
│   ├── seed_fisica.py        # Script de carga inicial do currículo de física
│   ├── dados/
│   │   └── curriculo_fisica.json   # Dados do currículo (módulos, fórmulas, atividades)
│   ├── templates/            # Views Jinja2
│   └── static/
│       ├── css/              # Estilos (global, aluno, professor, turma…)
│       ├── js/               # Scripts (app.js, game.js, progress.js, ui.js…)
│       └── img/              # Imagens
│
├── migrations/               # Migrações Alembic
├── tests/
│   ├── test_security.py      # Testes de segurança gerais
│   ├── test_regressao.py     # Testes de regressão
│   └── test_integracao_fisica.py  # Testes de integração do módulo de física
├── requirements.txt
└── av.py                     # Entrypoint do servidor
```

---

## ⚙️ Configuração do Ambiente

O projeto usa variáveis de ambiente para **todos** os segredos e credenciais. Crie um arquivo `.env` na raiz do projeto (`ALPHAFIZIC/`) com as seguintes variáveis:

```dotenv
# Obrigatórias
SECRET_KEY=<chave-secreta-longa-e-aleatoria>
DATABASE_URL=mysql+pymysql://<usuario>:<senha>@<host>/<banco>

# Opcionais (valores padrão em parênteses)
FLASK_DEBUG=0                         # 1 apenas em desenvolvimento local
FLASK_TESTING=0
SESSION_COOKIE_SECURE=0               # 1 quando servindo via HTTPS
SESSION_LIFETIME_SECONDS=3600
MAX_CONTENT_LENGTH_BYTES=2097152      # 2 MB
RESEND_API_KEY=                       # Necessária para e-mails de recuperação de senha
```

> **Nunca** comite o `.env` no repositório. O `.gitignore` já o exclui.

---

## 🚀 Como Rodar Localmente

**1. Clone o repositório**

```bash
git clone <url-do-repositorio>
cd PPA-altb/ALPHAFIZIC
```

**2. Crie e ative o ambiente virtual**

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate
```

**3. Instale as dependências**

```bash
pip install -r requirements.txt
```

**4. Configure as variáveis de ambiente**

Crie o arquivo `.env` conforme descrito na seção acima.

**5. Aplique as migrações do banco de dados**

```bash
flask db upgrade
```

**6. (Opcional) Carregue o currículo de física**

```bash
python app/seed_fisica.py
```

**7. Inicie o servidor**

```bash
python av.py
```

O servidor estará disponível em `http://localhost:5000`.

---

## 📍 Rotas

### Gerais

| Rota | Método | Descrição | Autenticação |
|---|---|---|---|
| `/` ou `/index` | GET | Página inicial | Pública |
| `/login` | GET, POST | Login de usuários | Pública |
| `/cadastro` | GET | Escolha de perfil (aluno/professor) | Pública |
| `/cadastro2` | GET, POST | Formulário de cadastro | Pública |
| `/esqueci-senha` | GET, POST | Solicitação de recuperação de senha | Pública |
| `/logout` | GET | Encerra a sessão | Protegida |
| `/professorMenu` | GET | Painel do professor | Professor |
| `/atualizar-perfil-inline` | POST | Atualização de dados do perfil | Protegida |
| `/turmas` | GET | Listagem de turmas do professor | Professor |
| `/salvar_material` | POST | Upload de material para uma turma | Professor |
| `/api/dados` | GET, POST | CRUD de dados da turma (alunos, atividades) | Protegida |

### Módulo de Física (API)

| Rota | Método | Descrição |
|---|---|---|
| `/aluno` | GET | Painel do aluno (menu principal) |
| `/api/fisica/modulos` | GET | Lista todos os módulos de física |
| `/api/fisica/modulo/<id>` | GET | Detalhes de um módulo |
| `/api/fisica/modulo/<id>/formulas` | GET | Fórmulas do módulo |
| `/api/fisica/modulo/<id>/exemplos` | GET | Exemplos do módulo |
| `/api/fisica/modulo/<id>/atividades` | GET | Atividades do módulo |
| `/api/fisica/modulo/<id>/progresso` | POST | Registra progresso no módulo |
| `/api/fisica/fases` | GET | Lista fases do jogo |
| `/api/fisica/fase/<id>/concluir` | POST | Conclui uma fase e concede XP |
| `/api/fisica/atividade/<id>/responder` | POST | Responde uma atividade |
| `/api/fisica/niveis` | GET | Tabela de níveis e XP necessário |
| `/api/fisica/conquistas` | GET | Conquistas disponíveis e desbloqueadas |
| `/api/fisica/resumo` | GET | Resumo do progresso do aluno |
| `/api/fisica/ranking` | GET | Ranking de XP da turma |

> Todas as rotas de física exigem autenticação com papel `aluno`. O XP nunca é aceito como valor enviado pelo cliente — o servidor sempre recalcula a partir das definições oficiais.

---

## 🔐 Segurança

O projeto implementa diversas camadas de proteção:

- **Hashing de senhas** com Werkzeug (scrypt), nunca armazenando texto puro.
- **CSRF Protection** via Flask-WTF em todos os formulários POST.
- **Rate Limiting** via Flask-Limiter (200 req/hora por padrão; limites específicos em `/login` e `/cadastro`).
- **HTTP Security Headers**: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy`.
- **Cookies de sessão** com `HttpOnly`, `SameSite=Lax` e `Secure` (configurável via env).
- **Variáveis de ambiente obrigatórias**: a aplicação falha ao iniciar se `SECRET_KEY` ou `DATABASE_URL` estiverem ausentes — nunca sobe com valores padrão inseguros.
- **Autorização por papel** (`login_required` + `roles_required`) verificada no servidor em toda rota protegida.
- **Prevenção de IDOR**: o `id_aluno` usado em gravações vem sempre da sessão do servidor, nunca do corpo da requisição.

---

## 🧪 Testes

```bash
pytest tests/
```

A suíte cobre:

- Autenticação e controle de acesso (privilege escalation vertical).
- Prevenção de IDOR entre alunos.
- Mass Assignment (tentativa de definir `xp_aluno` ou `tipo_usuario` via request).
- Proteção CSRF nas rotas de física.
- Manipulação de XP (envio de valores arbitrários nas rotas de resposta/fase).
- Regressões gerais de rotas.

Para auditoria de dependências:

```bash
pip-audit
```

---

## 🗄️ Banco de Dados

O schema é gerenciado pelo **Alembic** via Flask-Migrate. As principais entidades são:

- **usuarios** / **professores** / **alunos** — cadastro e perfis.
- **turmas** / **alunos_turma** — gerenciamento de turmas.
- **atividades** / **atividades_aluno** — atividades e registros de entrega.
- **conteudos** — materiais vinculados a turmas.
- **modulos_fisica**, **formulas_fisica**, **exemplos_fisica**, **atividades_fisica** — currículo gamificado.
- **fases_jogo_fisica**, **niveis_fisica**, **conquistas_fisica** — progressão e gamificação.
- **progresso_atividade_fisica**, **progresso_modulo_fisica**, **progresso_fase_fisica**, **aluno_conquista_fisica** — rastreamento de progresso por aluno.

---
