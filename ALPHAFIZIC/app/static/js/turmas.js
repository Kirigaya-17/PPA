import { mostrarConfirmacao, mostrarAlerta, mostrarPrompt } from './overlay.js';
import { state, salvarDadosNoBanco, contentArea, pageTitle, ativarMenu } from './main.js';

export function mostrarTurmas() {
    ativarMenu("turmas");
    pageTitle.textContent = "TURMAS";
    contentArea.innerHTML = "";

    if (state.turmas.length === 0) {
        contentArea.innerHTML = `<div class="text-card" style="grid-column:1/-1;text-align:center;"><h2>Nenhuma turma cadastrada</h2><p>Clique em "Criar" para adicionar.</p></div>`;
        return;
    }

    state.turmas.forEach((turma) => {
        const card = document.createElement("div");
        card.className = "class-card";
        card.style.cursor = "pointer";
        card.innerHTML = `
            <h2>${turma.nome}</h2>
            <p>${turma.alunos.length} aluno(s)</p>
            <button class="action-button" onclick="event.stopPropagation();abrirTurma(${turma.id})">ACESSAR TURMA</button>
        `;
        card.onclick = () => abrirTurma(turma.id);
        contentArea.appendChild(card);
    });
}

export function criarTurma() {
    mostrarPrompt(
        [{ id: "campoNomeTurma", label: "Nome da turma", placeholder: "Ex: 3º Ano A" }],
        "🏫 Nova Turma",
        (valores) => {
            if (!valores.campoNomeTurma) { mostrarAlerta("Por favor, informe o nome da turma."); return; }
            const maxId = state.turmas.reduce((m, t) => Math.max(m, t.id || 0), 0);
            state.turmas.push({
                id: maxId + 1,
                nome: valores.campoNomeTurma,
                alunos: [],
                conteudosLiberados: [],
                notas: {},
                desempenhoQuestoes: {}
            });
            salvarDadosNoBanco();
            mostrarAlerta(`Turma "${valores.campoNomeTurma}" criada!`, () => mostrarTurmas());
        }
    );
}

export function abrirTurma(turmaId) {
    const turma = state.turmas.find(t => t.id === turmaId);
    if (!turma) return;

    ativarMenu("turmas");
    pageTitle.textContent = turma.nome;

    contentArea.innerHTML = `
        <div style="grid-column:1/-1;">
            <button class="action-button btn-muted" style="margin-bottom:16px;" onclick="mostrarTurmas()">← Voltar</button>
            <div class="text-card" style="display:flex;flex-direction:column;gap:14px;">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
                    <div><h2 style="margin:0;">🏫 ${turma.nome}</h2><p style="margin:4px 0 0 0;color:var(--primary);">${turma.alunos.length} aluno(s)</p></div>
                    <div style="display:flex;gap:8px;">
                        <button class="action-button" onclick="editarTurma(${turma.id})">✏️ Editar</button>
                        <button class="action-button btn-danger" onclick="excluirTurma(${turma.id})">🗑️ Excluir</button>
                    </div>
                </div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin:18px 0 14px 0;">
                <button class="turma-tab action-button" data-aba="perfil" onclick="ativarAbaTurma(${turma.id},'perfil')">👤 Perfil</button>
                <button class="turma-tab action-button" data-aba="alunos" onclick="ativarAbaTurma(${turma.id},'alunos')">🧑‍🎓 Alunos</button>
                <button class="turma-tab action-button" data-aba="notas" onclick="ativarAbaTurma(${turma.id},'notas')">📊 Notas</button>
                <button class="turma-tab action-button" data-aba="conteudo" onclick="ativarAbaTurma(${turma.id},'conteudo')">🔓 Conteúdo</button>
            </div>
            <div id="turmaSubContent"></div>
        </div>
    `;
    ativarAbaTurma(turmaId, "perfil");
}

export function ativarAbaTurma(turmaId, aba) {
    const turma = state.turmas.find(t => t.id === turmaId);
    if (!turma) return;

    document.querySelectorAll(".turma-tab").forEach(tab => {
        const ativa = tab.dataset.aba === aba;
        tab.style.background = ativa ? "var(--primary)" : "var(--gray)";
    });

    const sub = document.getElementById("turmaSubContent");
    if (!sub) return;

    if (aba === "perfil") sub.innerHTML = renderTurmaPerfil(turma);
    else if (aba === "alunos") sub.innerHTML = renderTurmaAlunos(turma);
    else if (aba === "notas") sub.innerHTML = renderTurmaNotas(turma);
    else if (aba === "conteudo") sub.innerHTML = renderTurmaConteudo(turma);
}

// ---------------- Aba: Perfil ----------------
export function renderTurmaPerfil(turma) {
    let soma = 0, count = 0;
    Object.values(turma.notas || {}).forEach(notasAluno => {
        Object.values(notasAluno).forEach(nota => {
            if (typeof nota === "number" && !isNaN(nota)) { soma += nota; count++; }
        });
    });
    const mediaGeral = count > 0 ? (soma / count).toFixed(1) : '—';

    return `
        <div class="text-card">
            <h3 style="margin-top:0;">👤 Perfil da Turma</h3>
            <div class="stats-grid">
                <div class="stat-item"><span class="stat-number">${turma.alunos.length}</span><span class="stat-label">Alunos</span></div>
                <div class="stat-item"><span class="stat-number">${turma.conteudosLiberados.length}</span><span class="stat-label">Conteúdos</span></div>
                <div class="stat-item"><span class="stat-number">${mediaGeral}</span><span class="stat-label">Média Geral</span></div>
            </div>
        </div>
    `;
}

// ---------------- Aba: Alunos ----------------
function formatarMediaAluno(turma, alunoId) {
    const notas = turma.notas[alunoId];
    if (!notas) return "—";
    const valores = Object.values(notas).filter(n => typeof n === "number");
    if (valores.length === 0) return "—";
    return (valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(1);
}

export function renderTurmaAlunos(turma) {
    const linhas = turma.alunos.map(aluno => `
        <div class="text-card" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <div><strong>${aluno.nome}</strong><br><small style="color:var(--primary);">Média: ${formatarMediaAluno(turma, aluno.id)}</small></div>
            <div style="display:flex;gap:8px;">
                <button class="action-button" onclick="verNotasAluno(${turma.id},${aluno.id})">📊 Notas</button>
                <button class="action-button btn-danger" onclick="excluirAluno(${turma.id},${aluno.id})">🗑️</button>
            </div>
        </div>
    `).join("");

    return `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <h3 style="margin:0;">🧑‍🎓 Alunos da Turma</h3>
            <button class="action-button" onclick="adicionarAluno(${turma.id})">➕ Adicionar Aluno</button>
        </div>
        ${turma.alunos.length === 0 ? `<div class="text-card"><p>Nenhum aluno cadastrado.</p></div>` : linhas}
    `;
}

export function adicionarAluno(turmaId) {
    mostrarPrompt([{ id: "campoNomeAluno", label: "Nome do aluno" }], "➕ Adicionar Aluno", (valores) => {
        if (!valores.campoNomeAluno) return;
        const turma = state.turmas.find(t => t.id === turmaId);
        const maxId = turma.alunos.reduce((m, a) => Math.max(m, a.id || 0), 0);
        turma.alunos.push({ id: maxId + 1, nome: valores.campoNomeAluno });
        salvarDadosNoBanco();
        ativarAbaTurma(turmaId, "alunos");
    });
}

export function excluirAluno(turmaId, alunoId) {
    mostrarConfirmacao("Tem certeza que deseja remover este aluno?", () => {
        const turma = state.turmas.find(t => t.id === turmaId);
        turma.alunos = turma.alunos.filter(a => a.id !== alunoId);
        if (turma.notas && turma.notas[alunoId]) delete turma.notas[alunoId];
        salvarDadosNoBanco();
        ativarAbaTurma(turmaId, "alunos");
    });
}

export function verNotasAluno(turmaId, alunoId) {
    const turma = state.turmas.find(t => t.id === turmaId);
    const aluno = turma.alunos.find(a => a.id === alunoId);
    const conteudosLiberados = state.conteudos.filter(c => turma.conteudosLiberados.includes(c.id));
    
    document.getElementById("turmaSubContent").innerHTML = `
        <button class="action-button btn-muted" style="margin-bottom:14px;" onclick="ativarAbaTurma(${turmaId},'alunos')">← Voltar</button>
        <div class="text-card">
            <h3>📊 Notas de ${aluno.nome}</h3>
            ${conteudosLiberados.map(c => `
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;">
                    <span>${c.titulo}</span>
                    <input type="number" min="0" max="10" step="0.1" id="nota-${c.id}" value="${turma.notas[aluno.id]?.[c.id] || ''}" style="width:80px;text-align:center;">
                </div>
            `).join("")}
            <button class="action-button" style="margin-top:14px;" onclick="salvarNotasAluno(${turmaId},${alunoId})">💾 Salvar Notas</button>
        </div>
    `;
}

export function salvarNotasAluno(turmaId, alunoId) {
    const turma = state.turmas.find(t => t.id === turmaId);
    if (!turma.notas[alunoId]) turma.notas[alunoId] = {};

    state.conteudos.filter(c => turma.conteudosLiberados.includes(c.id)).forEach(c => {
        const valor = document.getElementById(`nota-${c.id}`).value.trim();
        if (valor === "") { delete turma.notas[alunoId][c.id]; return; }
        turma.notas[alunoId][c.id] = Math.max(0, Math.min(10, parseFloat(valor.replace(",", "."))));
    });
    salvarDadosNoBanco();
    mostrarAlerta("Notas salvas com sucesso!", () => ativarAbaTurma(turmaId, "alunos"));
}

// ---------------- Aba: Notas (Tabela) ----------------
export function renderTurmaNotas(turma) {
    const conteudosLiberados = state.conteudos.filter(c => turma.conteudosLiberados.includes(c.id));
    if (turma.alunos.length === 0 || conteudosLiberados.length === 0) return `<div class="text-card"><p>Adicione alunos e libere conteúdos primeiro.</p></div>`;

    const header = `<th style="text-align:left;padding:8px;">Aluno</th>` + conteudosLiberados.map(c => `<th style="padding:8px;">${c.titulo}</th>`).join("") + `<th style="padding:8px;">Média</th>`;
    
    const linhas = turma.alunos.map(aluno => `<tr>
        <td style="padding:8px;font-weight:bold;">${aluno.nome}</td>
        ${conteudosLiberados.map(c => `<td style="padding:6px;text-align:center;"><input type="number" min="0" max="10" step="0.1" id="notatab-${aluno.id}-${c.id}" value="${turma.notas[aluno.id]?.[c.id] || ''}" style="width:64px;"></td>`).join("")}
        <td style="padding:8px;text-align:center;color:var(--primary);">${formatarMediaAluno(turma, aluno.id)}</td>
    </tr>`).join("");

    return `
        <div class="text-card" style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;">
                <thead><tr style="border-bottom:2px solid var(--primary);">${header}</tr></thead>
                <tbody>${linhas}</tbody>
            </table>
            <button class="action-button" style="margin-top:14px;" onclick="salvarNotasTabela(${turma.id})">💾 Salvar Tudo</button>
        </div>
    `;
}

export function salvarNotasTabela(turmaId) {
    const turma = state.turmas.find(t => t.id === turmaId);
    const conteudosLiberados = state.conteudos.filter(c => turma.conteudosLiberados.includes(c.id));

    turma.alunos.forEach(aluno => {
        if (!turma.notas[aluno.id]) turma.notas[aluno.id] = {};
        conteudosLiberados.forEach(c => {
            const input = document.getElementById(`notatab-${aluno.id}-${c.id}`);
            if (!input) return;
            const valor = input.value.trim();
            if (valor === "") { delete turma.notas[aluno.id][c.id]; return; }
            turma.notas[aluno.id][c.id] = Math.max(0, Math.min(10, parseFloat(valor.replace(",", "."))));
        });
    });
    salvarDadosNoBanco();
    mostrarAlerta("Notas salvas!", () => ativarAbaTurma(turmaId, "notas"));
}

// ---------------- Aba: Conteúdo ----------------
export function renderTurmaConteudo(turma) {
    if (state.conteudos.length === 0) return `<div class="text-card"><p>Nenhum conteúdo cadastrado.</p></div>`;

    return state.conteudos.map(c => {
        const liberado = turma.conteudosLiberados.includes(c.id);
        return `
            <div class="text-card" style="margin-bottom:16px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <h3 style="margin:0;">${c.titulo}</h3>
                    <button class="action-button ${liberado ? 'btn-danger' : 'btn-success'}" onclick="alternarLiberacaoConteudo(${turma.id},${c.id})">
                        ${liberado ? '🔒 Bloquear' : '🔓 Liberar'}
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

export function alternarLiberacaoConteudo(turmaId, conteudoId) {
    const turma = state.turmas.find(t => t.id === turmaId);
    const idx = turma.conteudosLiberados.indexOf(conteudoId);
    if (idx >= 0) turma.conteudosLiberados.splice(idx, 1);
    else turma.conteudosLiberados.push(conteudoId);
    salvarDadosNoBanco();
    ativarAbaTurma(turmaId, "conteudo");
}

// ---------------- Edição e Exclusão ----------------
export function editarTurma(turmaId) {
    const turma = state.turmas.find(t => t.id === turmaId);
    mostrarPrompt([{ id: "campoNomeTurma", label: "Nome", valor: turma.nome }], "✏️ Editar Turma", (valores) => {
        if (!valores.campoNomeTurma) return;
        turma.nome = valores.campoNomeTurma;
        salvarDadosNoBanco();
        abrirTurma(turmaId);
    });
}

export function excluirTurma(turmaId) {
    mostrarConfirmacao("Deseja excluir esta turma?", () => {
        state.turmas = state.turmas.filter(t => t.id !== turmaId);
        salvarDadosNoBanco();
        mostrarTurmas();
    });
}