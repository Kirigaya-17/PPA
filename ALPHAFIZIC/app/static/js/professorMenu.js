const menuItems = document.querySelectorAll(".menu-item");
const contentArea = document.getElementById("contentArea");
const pageTitle = document.getElementById("pageTitle");

// =================================
// DADOS EM MEMÓRIA (GLOBAIS)
// =================================

// Lista de conteúdos
let conteudos = [
    {}
];

// Lista de turmas
let turmas = [
    {}
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
                <h2>${conteudo.titulo || "Sem título"}</h2>
                <p>${conteudo.descricao || ""}</p>
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
// TURMAS 
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
    
    const nomeExibicao = (typeof nomeDoUsuario !== 'undefined' && nomeDoUsuario) ? nomeDoUsuario : 'Professor(a)';
    const emailExibicao = (typeof emailDoUsuario !== 'undefined' && emailDoUsuario) ? emailDoUsuario : 'professora@email.com';
    const contatoExibicao = (typeof contatoDoUsuario !== 'undefined' && contatoDoUsuario) ? contatoDoUsuario : '(11) 99999-9999';
    const bioExibicao = (typeof bioDoUsuario !== 'undefined' && bioDoUsuario) ? bioDoUsuario : 'Bem-vindo(a) ao meu perfil!';

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
                    
                    <h2 id="profileName">${nomeExibicao.toUpperCase()}</h2>
                    <p class="profile-role">Professor(a)</p>
                </div>
                
                <div class="profile-body">
                    <!-- BIOGRAFIA INLINE -->
                    <div class="profile-section">
                        <h3>📝 BIOGRAFIA</h3>
                        <div id="settingBioSection">
                            <p id="profileBio" class="editable-text">${bioExibicao}</p>
                            <button class="edit-btn" onclick="editarBioInline()">✏️ Editar Bio</button>
                        </div>
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
                            <!-- Bloco com ID para o Nome -->
                            <div id="settingNameSection">
                                <button class="settings-btn" onclick="editarNomeInline()">
                                    <span>👤</span> Editar Nome (${nomeExibicao})
                                </button>
                            </div>
                            
                            <!-- Email -->
                            <button class="settings-btn" onclick="editarEmail()">
                                <span>📧</span> Editar Email (${emailExibicao})
                            </button>
                            
                            <!-- Bloco com ID para a Senha -->
                            <div id="settingPasswordSection">
                                <button class="settings-btn" onclick="editarSenhaInline()">
                                    <span>🔒</span> Alterar Senha
                                </button>
                            </div>
                            
                            <!-- Bloco com ID para o Contato -->
                            <div id="settingContactSection">
                                <button class="settings-btn" onclick="editarContatoInline()">
                                    <span>📱</span> Editar Contato (${contatoExibicao})
                                </button>
                            </div>
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
// FUNÇÕES DE CRIAÇÃO
// =================================

function criarConteudo() {
    const titulo = prompt("Digite o título do conteúdo:");
    if (titulo) {
        const descricao = prompt("Digite a descrição do conteúdo:");
        conteudos.push({ titulo: titulo, descricao: descricao || "Novo conteúdo" });
        alert(`Conteúdo "${titulo}" criado com sucesso!`);
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
        if (pageTitle.textContent === "TURMAS") {
            mostrarTurmas();
        }
    }
}

// =================================
// FUNÇÕES DE EDIÇÃO E PERFIL INLINE
// =================================

function editarConteudo(titulo) {
    alert(`Editando conteúdo: ${titulo}`);
}

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

function editarBioInline() {
    const sectionBio = document.getElementById("settingBioSection");
    
    // Pega a bio atual da variável global injetada pelo Flask (ou usa um padrão)
    const bioAtual = typeof bioDoUsuario !== 'undefined' ? bioDoUsuario : 'Bem-vindo(a) ao meu perfil!';
    
    sectionBio.innerHTML = `
        <form action="/atualizar-perfil-inline" method="POST" style="display: flex; flex-direction: column; gap: 10px; margin-top: 5px;">
            <textarea name="bio" rows="3" style="padding: 10px; border-radius: 8px; border: 1px solid #0739ce; width: 100%; resize: none; font-family: Arial, sans-serif; font-size: 14px;" required>${bioAtual}</textarea>
            <button type="submit" class="action-button" style="padding: 8px 15px; font-size: 13px; align-self: flex-start;">Salvar Bio</button>
        </form>
    `;
}

function editarEmail() {
    alert("Para alterar seu e-mail de acesso, entre em contato com o suporte.");
}

function salvarPerfil() {
    alert('Perfil salvo com sucesso!');
}

function editarNomeInline() {
    const sectionName = document.getElementById("settingNameSection");
    sectionName.innerHTML = `
        <form action="/atualizar-perfil-inline" method="POST" style="display: flex; gap: 10px; align-items: center;">
            <input type="text" name="nome" value="${nomeDoUsuario}" style="padding: 8px; border-radius: 8px; border: 1px solid #0739ce; flex: 1;" required>
            <button type="submit" class="action-button" style="padding: 8px 15px; font-size: 13px;">Salvar</button>
        </form>
    `;
}

function editarContatoInline() {
    const sectionContact = document.getElementById("settingContactSection");
    sectionContact.innerHTML = `
        <form action="/atualizar-perfil-inline" method="POST" style="display: flex; gap: 10px; align-items: center;">
            <input type="tel" name="contato" value="${contatoDoUsuario}" style="padding: 8px; border-radius: 8px; border: 1px solid #0739ce; flex: 1;" required>
            <button type="submit" class="action-button" style="padding: 8px 15px; font-size: 13px;">Salvar</button>
        </form>
    `;
}

function editarSenhaInline() {
    const sectionPassword = document.getElementById("settingPasswordSection");
    sectionPassword.innerHTML = `
        <form action="/atualizar-perfil-inline" method="POST" style="display: flex; gap: 10px; align-items: center;">
            <input type="password" name="senha" placeholder="Nova senha" style="padding: 8px; border-radius: 8px; border: 1px solid #0739ce; flex: 1;" required>
            <button type="submit" class="action-button" style="padding: 8px 15px; font-size: 13px;">Salvar</button>
        </form>
    `;
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
console.log("JavaScript do professor carregado com sucesso!");  