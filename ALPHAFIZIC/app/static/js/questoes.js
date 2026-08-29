import { state, salvarDadosNoBanco, contentArea, pageTitle, ativarMenu } from './main.js';
import { mostrarAlerta, mostrarConfirmacao, mostrarPrompt } from './overlay.js';

export function mostrarConteudos() {
    ativarMenu("conteudo");
    pageTitle.textContent = "CONTEÚDOS";
    contentArea.innerHTML = "";

    if (state.conteudos.length === 0) {
        contentArea.innerHTML = `<div class="text-card" style="text-align:center;"><h2>Nenhum conteúdo cadastrado</h2></div>`;
        return;
    }

    state.conteudos.forEach((conteudo) => {
        const card = document.createElement("div");
        card.className = "text-card";
        card.innerHTML = `
            <div>
                <h2>${conteudo.titulo}</h2>
                <p>${conteudo.descricao || ""}</p>
                <small style="color:var(--primary);">${(conteudo.questoes || []).length} questão(ões)</small>
            </div>
            <div style="display:flex;gap:8px;margin-top:10px;">
                <button class="action-button" onclick="verQuestoes(${conteudo.id})">📋 QUESTÕES</button>
                <button class="action-button btn-danger" onclick="excluirConteudo(${conteudo.id})">🗑️</button>
            </div>
        `;
        contentArea.appendChild(card);
    });
}

export function mostrarCriar() {
    ativarMenu("criar");
    pageTitle.textContent = "CRIAR";
    contentArea.innerHTML = `
        <div class="text-card">
            <h2>📖 Novo Conteúdo</h2>
            <button class="action-button" onclick="criarConteudo()">CRIAR CONTEÚDO</button>
        </div>
        <div class="text-card">
            <h2>🏫 Nova Turma</h2>
            <button class="action-button" onclick="criarTurma()">CRIAR TURMA</button>
        </div>
    `;
}

export function criarConteudo() {
    mostrarPrompt(
        [
            { id: "campoTitulo", label: "Título do conteúdo", placeholder: "Ex: Força Elétrica" },
            { id: "campoDescricao", label: "Descrição curta", tipo: "textarea" }
        ],
        "📖 Novo Conteúdo",
        (valores) => {
            if (!valores.campoTitulo) { mostrarAlerta("Informe o título."); return; }
            const maxId = state.conteudos.reduce((m, c) => Math.max(m, c.id || 0), 0);
            state.conteudos.push({ 
                id: maxId + 1, 
                titulo: valores.campoTitulo, 
                descricao: valores.campoDescricao || "", 
                questoes: [] 
            });
            salvarDadosNoBanco(); // <--- SALVA NO PYTHON
            mostrarAlerta("Conteúdo criado!", () => mostrarConteudos());
        }
    );
}

export function excluirConteudo(conteudoId) {
    mostrarConfirmacao("Deseja excluir este conteúdo e suas questões?", () => {
        state.conteudos = state.conteudos.filter(c => c.id !== conteudoId);
        salvarDadosNoBanco(); // <--- SALVA NO PYTHON
        mostrarConteudos();
    });
}

export function verQuestoes(conteudoId) {
    const conteudoAtual = state.conteudos.find(c => c.id === conteudoId);
    if (!conteudoAtual) return;

    pageTitle.textContent = conteudoAtual.titulo;
    contentArea.innerHTML = `
        <div style="grid-column:1/-1;">
            <div style="display:flex;justify-content:space-between;margin-bottom:18px;">
                <button class="action-button btn-muted" onclick="mostrarConteudos()">← Voltar</button>
                <button class="action-button" onclick="abrirFormQuestao(${conteudoId})">➕ Nova Questão</button>
            </div>
            <div id="listaQuestoes"></div>
        </div>
    `;
    renderizarQuestoes(conteudoAtual);
}

export function renderizarQuestoes(conteudoAtual) {
    const lista = document.getElementById("listaQuestoes");
    if (!lista) return;
    const questoes = conteudoAtual.questoes || [];

    if (questoes.length === 0) {
        lista.innerHTML = `<div class="text-card"><p style="text-align:center;">Nenhuma questão cadastrada.</p></div>`;
        return;
    }

    lista.innerHTML = questoes.map((q, idx) => `
        <div class="text-card">
            <div style="display:flex;justify-content:space-between;">
                <div>
                    <p style="font-weight:bold;color:var(--primary);">Questão ${idx + 1}</p>
                    <p>${q.enunciado}</p>
                </div>
                <div style="display:flex;flex-direction:column;gap:6px;">
                    <button class="action-button" onclick="editarQuestao(${conteudoAtual.id},${q.id})">✏️</button>
                    <button class="action-button btn-danger" onclick="excluirQuestao(${conteudoAtual.id},${q.id})">🗑️</button>
                </div>
            </div>
        </div>
    `).join("");
}

export function abrirFormQuestao(conteudoId, questaoId = null) {
    const conteudo = state.conteudos.find(c => c.id === conteudoId);
    const questao = questaoId ? conteudo.questoes.find(q => q.id === questaoId) : null;
    
    mostrarPrompt(
        [
            { id: "campoEnunciado", label: "Enunciado", tipo: "textarea", valor: questao ? questao.enunciado : "" }
        ],
        questaoId ? "✏️ Editar Questão" : "➕ Nova Questão",
        (valores) => {
            if (!valores.campoEnunciado) { mostrarAlerta("Preencha o enunciado."); return; }
            salvarQuestao(conteudoId, questaoId, valores.campoEnunciado);
        }
    );
}

export function salvarQuestao(conteudoId, questaoId, enunciado) {
    const conteudo = state.conteudos.find(c => c.id === conteudoId);
    
    if (questaoId) {
        const q = conteudo.questoes.find(q => q.id === questaoId);
        if (q) q.enunciado = enunciado;
    } else {
        const maxId = conteudo.questoes.reduce((m, q) => Math.max(m, q.id || 0), 0);
        conteudo.questoes.push({ id: maxId + 1, enunciado: enunciado, tipo: "dissertativa" });
    }

    salvarDadosNoBanco(); // <--- SALVA NO PYTHON
    verQuestoes(conteudoId);
}

export function editarQuestao(conteudoId, questaoId) {
    abrirFormQuestao(conteudoId, questaoId);
}

export function excluirQuestao(conteudoId, questaoId) {
    mostrarConfirmacao("Deseja excluir esta questão?", () => {
        const conteudo = state.conteudos.find(c => c.id === conteudoId);
        conteudo.questoes = conteudo.questoes.filter(q => q.id !== questaoId);
        salvarDadosNoBanco(); // <--- SALVA NO PYTHON
        verQuestoes(conteudoId);
    });
}

// Stubs para funções não implementadas neste escopo reduzido mas chamadas no main.js
export function atualizarCamposTipo() {}
export function adicionarAlternativa() {}
export function removerAlternativa() {}
export function adicionarItemColuna() {}
export function removerItemColuna() {}