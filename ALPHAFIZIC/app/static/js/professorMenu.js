const menuItems = document.querySelectorAll(".menu-item");
const contentArea = document.getElementById("contentArea");
const pageTitle = document.getElementById("pageTitle");

// =================================
// DADOS EM MEMÓRIA (GLOBAIS)
// =================================

// Lista de conteúdos
let conteudos = [
    { titulo: "Aula 01", descricao: "Introdução à Física" },
    { titulo: "Aula 02", descricao: "Movimento" },
    { titulo: "Aula 03", descricao: "Velocidade" },
    { titulo: "Aula 04", descricao: "Aceleração" },
    { titulo: "Aula 05", descricao: "Forças" },
    { titulo: "Aula 06", descricao: "Energia" },
    { titulo: "Aula 07", descricao: "Trabalho" },
    { titulo: "Aula 08", descricao: "Potência" },
    { titulo: "Aula 09", descricao: "Gravidade" },
    { titulo: "Aula 10", descricao: "Leis de Newton" },
    { titulo: "Aula 11", descricao: "Eletricidade" },
    { titulo: "Aula 12", descricao: "Circuitos" }
];

// Lista de turmas
let turmas = [
    { nome: "3º Ano A", alunos: 32 },
    { nome: "3º Ano B", alunos: 28 },
    { nome: "2º Ano A", alunos: 30 }
];

// Lista de atividades
let atividades = [];

// Lista de materiais
let materiais = [];

// =================================
// FUNÇÕES DE NAVEGAÇÃO
// =================================

function abrirTurma(nomeTurma) {
    window.location.href = '/turmas?turma=' + encodeURIComponent(nomeTurma);
}

function fazerLogout() {
    if (confirm('Tem certeza que deseja sair?')) {
        window.location.href = '/logout';
    }
}

function voltarParaProfessorMenu() {
    window.location.href = '/professorMenu';
}

// =================================
// CONTEÚDO
// =================================

function mostrarConteudos() {
    pageTitle.textContent = "CONTEÚDOS";
    contentArea.innerHTML = "";

    conteudos.forEach((conteudo) => {
        const card = document.createElement("div");
        card.className = "text-card";
        card.innerHTML = `
            <div>
                <h2>${conteudo.titulo}</h2>
                <p>${conteudo.descricao}</p>
            </div>
            <button class="action-button" onclick="editarConteudo('${conteudo.titulo}')">
                EDITAR
            </button>
        `;
        contentArea.appendChild(card);
    });
}

// =================================
// CRIAR
// =================================

function mostrarCriar() {
    pageTitle.textContent = "CRIAR";
    contentArea.innerHTML = `
        <div class="text-card">
            <h2>Novo conteúdo</h2>
            <p>Criar uma nova aula ou material.</p>
            <button class="action-button" onclick="criarConteudo()">
                CRIAR
            </button>
        </div>
        <div class="text-card">
            <h2>Atividade</h2>
            <p>Criar uma atividade para os alunos.</p>
            <button class="action-button" onclick="criarAtividade()">
                CRIAR
            </button>
        </div>
        <div class="text-card">
            <h2>Material</h2>
            <p>Adicionar material complementar.</p>
            <button class="action-button" onclick="criarMaterial()">
                CRIAR
            </button>
        </div>
        <div class="text-card">
            <h2>Turmas</h2>
            <p>Criar e Adicionar uma nova Turma.</p>
            <button class="action-button" onclick="criarTurma()">
                CRIAR
            </button>
        </div>
    `;
}

// =================================
// TURMAS (ATUALIZADO)
// =================================

function mostrarTurmas() {
    pageTitle.textContent = "TURMAS";
    contentArea.innerHTML = "";

    if (turmas.length === 0) {
        contentArea.innerHTML = `
            <div class="text-card" style="grid-column: 1 / -1; text-align: center;">
                <h2>Nenhuma turma cadastrada</h2>
                <p>Clique em "Criar" para adicionar uma nova turma.</p>
            </div>
        `;
        return;
    }

    turmas.forEach((turma) => {
        const card = document.createElement("div");
        card.className = "class-card";
        card.innerHTML = `
            <h2>${turma.nome}</h2>
            <p>${turma.alunos} alunos</p>
            <button class="action-button" onclick="event.stopPropagation(); abrirTurma('${turma.nome}')">
                ACESSAR TURMA
            </button>
        `;
        card.onclick = () => abrirTurma(turma.nome);
        contentArea.appendChild(card);
    });
}

// =================================
// PERFIL
// =================================

function mostrarPerfil() {
    pageTitle.textContent = "PERFIL";
    
    const nomeExibicao = typeof nomeDoUsuario !== 'undefined' ? nomeDoUsuario : 'Professor(a)';

    contentArea.innerHTML = `
        <div class="profile-container">
            <div class="profile-card">
                <div class="profile-header">
                    <div class="profile-avatar">
                        <img src="https://via.placeholder.com/150" alt="Foto de perfil" id="profileImage">
                        <button class="edit-avatar-btn" onclick="trocarFoto()" title="Trocar foto">
                            📷
                        </button>
                    </div>
                    <!-- AQUI ENTRA O NOME DINÂMICO! -->
                    <h2 id="profileName">${nomeExibicao.toUpperCase()}</h2>
                    <p class="profile-role">Professor(a)</p>
                </div>
                
                <div class="profile-body">
                    <div class="profile-section">
                        <h3>📝 BIOGRAFIA</h3>
                        <p id="profileBio" class="editable-text">Bem-vindo(a) ao meu perfil!</p>
                        <button class="edit-btn" onclick="editarBio()">✏️ Editar Bio</button>
                    </div>

                    <div class="profile-section">
                        <h3>📊 ESTATÍSTICAS</h3>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <span class="stat-number">${turmas.length}</span>
                                <span class="stat-label">Turmas</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">${conteudos.length}</span>
                                <span class="stat-label">Conteúdos</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">${atividades.length + materiais.length}</span>
                                <span class="stat-label">Atividades</span>
                            </div>
                        </div>
                    </div>

                    <div class="profile-section">
                        <h3>⚙️ CONFIGURAÇÕES</h3>
                        <div class="settings-list">
                            <button class="settings-btn" onclick="editarNome()">
                                <span>👤</span> Editar Nome
                            </button>
                            <button class="settings-btn" onclick="editarEmail()">
                                <span>📧</span> Editar Email
                            </button>
                            <button class="settings-btn" onclick="editarSenha()">
                                <span>🔒</span> Alterar Senha
                            </button>
                            <button class="settings-btn" onclick="editarContato()">
                                <span>📱</span> Editar Contato
                            </button>
                        </div>
                    </div>

                    <div class="profile-actions">
                        <button class="action-button save-btn" onclick="salvarPerfil()">
                            💾 Salvar Alterações
                        </button>
                        <button class="action-button logout-btn" onclick="fazerLogout()">
                            🚪 Sair
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// =================================
// FUNÇÕES DE CRIAÇÃO (CORRIGIDAS)
// =================================

function criarConteudo() {
    const titulo = prompt("Digite o título do conteúdo:");
    if (titulo) {
        const descricao = prompt("Digite a descrição do conteúdo:");
        conteudos.push({ titulo: titulo, descricao: descricao || "Novo conteúdo" });
        alert(`Conteúdo "${titulo}" criado com sucesso!`);
        // Atualiza automaticamente a aba de conteúdo
        if (pageTitle.textContent === "CONTEÚDOS") {
            mostrarConteudos();
        }
    }
}

function criarAtividade() {
    const titulo = prompt("Digite o título da atividade:");
    if (titulo) {
        atividades.push({ titulo: titulo });
        alert(`Atividade "${titulo}" criada com sucesso!`);
        // Atualiza automaticamente a aba de conteúdo se estiver nela
        if (pageTitle.textContent === "CONTEÚDOS") {
            mostrarConteudos();
        }
    }
}

function criarMaterial() {
    const titulo = prompt("Digite o nome do material:");
    if (titulo) {
        materiais.push({ titulo: titulo });
        alert(`Material "${titulo}" adicionado com sucesso!`);
        // Atualiza automaticamente a aba de conteúdo se estiver nela
        if (pageTitle.textContent === "CONTEÚDOS") {
            mostrarConteudos();
        }
    }
}

function criarTurma() {
    const nome = prompt("Digite o nome da nova turma:");
    if (nome) {
        const numAlunos = prompt("Digite o número de alunos (padrão: 0):");
        turmas.push({ nome: nome, alunos: parseInt(numAlunos) || 0 });
        alert(`Turma "${nome}" criada com sucesso!`);
        // Atualiza automaticamente a aba de turmas se estiver nela
        if (pageTitle.textContent === "TURMAS") {
            mostrarTurmas();
        }
    }
}

// =================================
// FUNÇÕES DE EDIÇÃO
// =================================

function editarConteudo(titulo) {
    alert(`Editando conteúdo: ${titulo}`);
}

// =================================
// FUNÇÕES DO PERFIL
// =================================

function trocarFoto() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                document.getElementById('profileImage').src = event.target.result;
                alert('Foto atualizada com sucesso!');
            };
            reader.readAsDataURL(file);
        }
    };
    
    input.click();
}

function editarBio() {
    const bioElement = document.getElementById('profileBio');
    const novaBio = prompt('Digite sua nova biografia:', bioElement.textContent);
    
    if (novaBio) {
        bioElement.textContent = novaBio;
        alert('Biografia atualizada!');
    }
}

function editarNome() {
    const nomeElement = document.getElementById('profileName');
    const novoNome = prompt('Digite seu nome:', nomeElement.textContent);
    
    if (novoNome) {
        nomeElement.textContent = novoNome.toUpperCase();
        alert('Nome atualizado!');
    }
}

function editarEmail() {
    const email = prompt('Digite seu novo email:', 'professora@email.com');
    
    if (email) {
        alert(`Email alterado para: ${email}`);
    }
}

function editarSenha() {
    const novaSenha = prompt('Digite sua nova senha:');
    const confirmarSenha = prompt('Confirme sua nova senha:');
    
    if (novaSenha && novaSenha === confirmarSenha) {
        alert('Senha alterada com sucesso!');
    } else {
        alert('As senhas não coincidem!');
    }
}

function editarContato() {
    const contato = prompt('Digite seu novo contato:', '(11) 99999-9999');
    
    if (contato) {
        alert(`Contato atualizado para: ${contato}`);
    }
}

function salvarPerfil() {
    alert('Perfil salvo com sucesso!');
}

// =================================
// NAVEGAÇÃO DO MENU
// =================================

menuItems.forEach((item) => {
    item.addEventListener("click", () => {
        menuItems.forEach((menu) => {
            menu.classList.remove("active");
        });
        item.classList.add("active");

        const section = item.dataset.section;

        if (section === "conteudo") {
            mostrarConteudos();
        } else if (section === "criar") {
            mostrarCriar();
        } else if (section === "turmas") {
            mostrarTurmas();
        } else if (section === "perfil") {
            mostrarPerfil();
        }
    });
});

// INICIALIZAÇÃO
mostrarConteudos();
console.log("JavaScript do professor carregado!");