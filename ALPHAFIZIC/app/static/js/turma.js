const menuItems = document.querySelectorAll(".menu-item");
const contentArea = document.getElementById("contentArea");

// Conteúdos da turma
const conteudos = [
    { id: 1, nome: "Aula 01", locked: false },
    { id: 2, nome: "Aula 02", locked: true },
    { id: 3, nome: "Aula 03", locked: true },
    { id: 4, nome: "Aula 04", locked: true },
    { id: 5, nome: "Aula 05", locked: true },
    { id: 6, nome: "Aula 06", locked: true }
];

// Função para voltar ao menu do professor
function voltarParaProfessorMenu() {
    window.location.href = '/professorMenu';
}

// Mostrar conteúdos
function mostrarConteudos() {
    contentArea.innerHTML = "";
    const grid = document.createElement("div");
    grid.className = "content-grid";

    conteudos.forEach((conteudo) => {
        const item = document.createElement("div");
        item.className = "content-item";

        const label = document.createElement("div");
        label.className = "content-label";
        label.textContent = conteudo.locked ? "🔒 bloqueado" : "🔓 desbloqueado";

        const button = document.createElement("button");
        button.className = "content-button";
        
        if (conteudo.locked) {
            button.classList.add("locked");
        } else {
            button.classList.add("unlocked");
        }

        button.addEventListener("click", () => {
            alternarConteudo(conteudo);
        });

        item.appendChild(label);
        item.appendChild(button);
        grid.appendChild(item);
    });

    contentArea.appendChild(grid);
}

// Alternar bloqueio
function alternarConteudo(conteudo) {
    conteudo.locked = !conteudo.locked;
    mostrarConteudos();
    alert(`Conteúdo "${conteudo.nome}" ${conteudo.locked ? 'bloqueado' : 'desbloqueado'} com sucesso!`);
}

// Mostrar notas
function mostrarNotas() {
    contentArea.innerHTML = `
        <div class="grades-container">
            <div class="grade-card">
                <h2>📊 Desempenho da turma</h2>
                <p>Média geral: <strong>7,8</strong></p>
                <p>Maior nota: <strong>10</strong></p>
                <p>Menor nota: <strong>4</strong></p>
            </div>
            <div class="grade-card">
                <h2>📝 Notas por conteúdo</h2>
                <table class="grade-table">
                    <thead>
                        <tr>
                            <th>Conteúdo</th>
                            <th>Média</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>Aula 01</td><td class="grade">8,5</td></tr>
                        <tr><td>Aula 02</td><td class="grade">7,2</td></tr>
                        <tr><td>Aula 03</td><td class="grade">7,8</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Mostrar alunos
function mostrarAlunos() {
    const alunos = [
        { nome: "João Silva", email: "joao@email.com", media: 8.5 },
        { nome: "Maria Santos", email: "maria@email.com", media: 9.2 },
        { nome: "Pedro Oliveira", email: "pedro@email.com", media: 7.4 },
        { nome: "Ana Souza", email: "ana@email.com", media: 8.8 }
    ];

    contentArea.innerHTML = '<div class="students">';
    
    alunos.forEach(aluno => {
        contentArea.innerHTML += `
            <div class="student-card" onclick="verAluno('${aluno.nome}')">
                <h2>${aluno.nome}</h2>
                <p>Email: ${aluno.email}</p>
                <p>Média: ${aluno.media}</p>
            </div>
        `;
    });

    contentArea.innerHTML += '</div>';
}

// Ver aluno
function verAluno(nome) {
    alert(`Visualizando dados do aluno: ${nome}`);
}

// Navegação
menuItems.forEach((item) => {
    item.addEventListener("click", () => {
        menuItems.forEach((menu) => {
            menu.classList.remove("active");
        });
        item.classList.add("active");

        const section = item.dataset.section;

        if (section === "conteudo") {
            mostrarConteudos();
        } else if (section === "notas") {
            mostrarNotas();
        } else if (section === "alunos") {
            mostrarAlunos();
        }
    });
});

// Inicialização
mostrarConteudos();