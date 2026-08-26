const menuItems = document.querySelectorAll(".menu-item");
const contentArea = document.getElementById("contentArea");
const pageTitle = document.getElementById("pageTitle");

// =================================
// DADOS EM MEMÓRIA (GLOBAIS)
// =================================

let conteudos = [
    {
        id: 1,
        titulo: "Processos de Eletrização",
        descricao: "Aula sobre átomos, carga elétrica, princípios da eletrostática e processos de eletrização.",
        questoes: [
            {
                id: 1,
                tipo: "multipla_escolha",
                enunciado: "Durante uma experiência de eletrização, um professor explicou que toda carga elétrica é formada por múltiplos de uma quantidade mínima chamada carga elementar. Qual é o valor da carga elementar?",
                alternativas: [
                    { letra: "A", texto: "1,6 . 10⁻¹⁹ C" },
                    { letra: "B", texto: "9,0 . 10⁹ C" },
                    { letra: "C", texto: "3,2 . 10⁻¹⁹ C" },
                    { letra: "D", texto: "6,0 . 10²³" }
                ],
                resposta_correta: "A"
            },
            {
                id: 2,
                tipo: "multipla_escolha",
                enunciado: "Sabendo que a carga elementar possui valor de 1,6 . 10⁻¹⁹ C, um corpo eletrizado apresenta um número n de cargas elementares em excesso. Qual fórmula permite calcular a carga elétrica total desse corpo?",
                alternativas: [
                    { letra: "A", texto: "F = m . a" },
                    { letra: "B", texto: "U = R . I" },
                    { letra: "C", texto: "Q = n . e" },
                    { letra: "D", texto: "P = E/t" }
                ],
                resposta_correta: "C"
            },
            {
                id: 3,
                tipo: "multipla_escolha",
                enunciado: "Ao esfregar um bastão de vidro em um pano de seda, observa-se que:",
                alternativas: [
                    { letra: "A", texto: "Ambos permanecem neutros" },
                    { letra: "B", texto: "O bastão e o pano ficam carregados com cargas de mesmo sinal" },
                    { letra: "C", texto: "O bastão perde elétrons e o pano ganha elétrons" },
                    { letra: "D", texto: "Prótons são transferidos do vidro para a seda" },
                    { letra: "E", texto: "Apenas o pano fica eletrizado" }
                ],
                resposta_correta: "C"
            },
            {
                id: 4,
                tipo: "multipla_escolha",
                enunciado: "Um corpo eletrizado negativamente encosta em um corpo neutro. Após o contato, é correto afirmar que:",
                alternativas: [
                    { letra: "A", texto: "O corpo neutro continua neutro" },
                    { letra: "B", texto: "Ambos ficam com cargas positivas" },
                    { letra: "C", texto: "Ambos ficam com cargas negativas" },
                    { letra: "D", texto: "Apenas o corpo inicialmente eletrizado mantém carga" },
                    { letra: "E", texto: "Há troca de prótons entre os corpos" }
                ],
                resposta_correta: "C"
            },
            {
                id: 5,
                tipo: "multipla_escolha",
                enunciado: "Na eletrização por indução, sem contato físico entre os corpos:",
                alternativas: [
                    { letra: "A", texto: "Há transferência de prótons entre os corpos" },
                    { letra: "B", texto: "O corpo induzido não sofre alteração" },
                    { letra: "C", texto: "Ocorre separação de cargas no corpo induzido" },
                    { letra: "D", texto: "Apenas corpos negativos podem induzir cargas" },
                    { letra: "E", texto: "O processo só ocorre no vácuo" }
                ],
                resposta_correta: "C"
            },
            {
                id: 6,
                tipo: "multipla_escolha",
                enunciado: "Sobre a eletrização, assinale a alternativa correta:",
                alternativas: [
                    { letra: "A", texto: "Em isolantes, os elétrons se movem livremente" },
                    { letra: "B", texto: "Em condutores, as cargas não se movimentam" },
                    { letra: "C", texto: "A eletrização só ocorre em metais" },
                    { letra: "D", texto: "Condutores permitem a movimentação de cargas elétricas" },
                    { letra: "E", texto: "Isolantes não podem ser eletrizados" }
                ],
                resposta_correta: "D"
            },
            {
                id: 7,
                tipo: "multipla_escolha",
                enunciado: "Dois corpos eletrizados com cargas de sinais opostos:",
                alternativas: [
                    { letra: "A", texto: "Se repelem" },
                    { letra: "B", texto: "Se atraem" },
                    { letra: "C", texto: "Permanecem em equilíbrio" },
                    { letra: "D", texto: "Perdem suas cargas" },
                    { letra: "E", texto: "Só interagem se estiverem em contato" }
                ],
                resposta_correta: "B"
            },
            {
                id: 8,
                tipo: "multipla_escolha",
                enunciado: "Ao retirar um suéter de lã, pequenos choques podem ser sentidos. Isso ocorre devido:",
                alternativas: [
                    { letra: "A", texto: "À eletrização por contato" },
                    { letra: "B", texto: "À eletrização por atrito" },
                    { letra: "C", texto: "À indução eletrostática" },
                    { letra: "D", texto: "À força gravitacional" },
                    { letra: "E", texto: "À transferência de prótons" }
                ],
                resposta_correta: "B"
            },
            {
                id: 9,
                tipo: "multipla_escolha",
                enunciado: "Na eletrização por indução com aterramento, o aterramento serve para:",
                alternativas: [
                    { letra: "A", texto: "Transferir prótons para a Terra" },
                    { letra: "B", texto: "Permitir a saída ou entrada de elétrons" },
                    { letra: "C", texto: "Impedir a movimentação de cargas" },
                    { letra: "D", texto: "Neutralizar o indutor" },
                    { letra: "E", texto: "Aumentar a massa do corpo" }
                ],
                resposta_correta: "B"
            },
            {
                id: 10,
                tipo: "multipla_escolha",
                enunciado: "Pelo fato de o núcleo ser extremamente estável e manter suas partículas fortemente ligadas, qual partícula é transferida com facilidade durante os processos de eletrização?",
                alternativas: [
                    { letra: "A", texto: "Nêutrons" },
                    { letra: "B", texto: "Elétrons" },
                    { letra: "C", texto: "Prótons" }
                ],
                resposta_correta: "B"
            },
            {
                id: 11,
                tipo: "ligue",
                enunciado: "Ligue cada situação ao processo de eletrização correspondente.",
                coluna_esquerda: [
                    "(1) Um corpo eletrizado é aproximado de um corpo neutro sem contato e, ao final, se atraem.",
                    "(2) Dois corpos inicialmente neutros são atritados entre si e, ao final, se atraem.",
                    "(3) Um corpo eletrizado toca um corpo neutro e, ao final, os corpos se repelem."
                ],
                coluna_direita: ["Atrito", "Contato", "Indução"],
                resposta_correta: { "1": "Indução", "2": "Atrito", "3": "Contato" }
            }
        ]
    },
    {
        id: 2,
        titulo: "Força Elétrica — Lei de Coulomb",
        descricao: "Aula sobre força elétrica, Lei de Coulomb, unidades e força resultante.",
        questoes: [
            {
                id: 12,
                tipo: "multipla_escolha",
                enunciado: "O que é força elétrica?",
                alternativas: [
                    { letra: "A", texto: "A força que mantém os planetas em órbita." },
                    { letra: "B", texto: "A força de atração ou repulsão entre cargas elétricas." },
                    { letra: "C", texto: "A força que movimenta apenas ímãs." },
                    { letra: "D", texto: "A força produzida apenas por correntes elétricas." }
                ],
                resposta_correta: "B"
            },
            {
                id: 13,
                tipo: "multipla_escolha",
                enunciado: "O que significa dizer que uma carga é puntiforme?",
                alternativas: [
                    { letra: "A", texto: "Que possui formato esférico." },
                    { letra: "B", texto: "Que está em movimento." },
                    { letra: "C", texto: "Que suas dimensões podem ser desprezadas em relação à distância entre as cargas." },
                    { letra: "D", texto: "Que possui carga elétrica igual a zero." }
                ],
                resposta_correta: "C"
            },
            {
                id: 14,
                tipo: "multipla_escolha",
                enunciado: "Quais fatores influenciam a intensidade da força elétrica?",
                alternativas: [
                    { letra: "A", texto: "A massa das cargas e a temperatura." },
                    { letra: "B", texto: "O tamanho das cargas e a velocidade." },
                    { letra: "C", texto: "O valor das cargas elétricas e a distância entre elas." },
                    { letra: "D", texto: "Apenas a distância entre as cargas." }
                ],
                resposta_correta: "C"
            },
            {
                id: 15,
                tipo: "multipla_escolha",
                enunciado: "O que representa a constante k na Lei de Coulomb?",
                alternativas: [
                    { letra: "A", texto: "A constante eletrostática do meio." },
                    { letra: "B", texto: "A massa das cargas." },
                    { letra: "C", texto: "A velocidade da luz." },
                    { letra: "D", texto: "A distância entre as cargas." }
                ],
                resposta_correta: "A"
            },
            {
                id: 16,
                tipo: "multipla_escolha",
                enunciado: "Em que unidade é medida a força elétrica?",
                alternativas: [
                    { letra: "A", texto: "Newton (N)" },
                    { letra: "B", texto: "Coulomb (C)" },
                    { letra: "C", texto: "Joule (J)" },
                    { letra: "D", texto: "Volt (V)" }
                ],
                resposta_correta: "A"
            },
            {
                id: 17,
                tipo: "ligue",
                enunciado: "Ligue a variação da distância ao efeito na força elétrica (Lei de Coulomb).",
                coluna_esquerda: ["Dobrar a distância", "Triplicar a distância", "Quadruplicar a distância"],
                coluna_direita: ["Força 4 vezes menor", "Força 9 vezes menor", "Força 16 vezes menor"],
                resposta_correta: { "Dobrar a distância": "Força 4 vezes menor", "Triplicar a distância": "Força 9 vezes menor", "Quadruplicar a distância": "Força 16 vezes menor" }
            },
            {
                id: 18,
                tipo: "multipla_escolha",
                enunciado: "Se duas forças elétricas atuam em sentidos opostos sobre uma carga, para calcular a força resultante devemos:",
                alternativas: [
                    { letra: "A", texto: "Somar os valores das forças" },
                    { letra: "B", texto: "Subtrair os valores das forças" },
                    { letra: "C", texto: "Multiplicar os valores das forças" },
                    { letra: "D", texto: "Dividir os valores das forças" }
                ],
                resposta_correta: "B"
            }
        ]
    }
];

let turmas = [];
let atividades = [];
let materiais = [];

// Controla qual conteúdo está sendo visualizado
let conteudoAtual = null;

// =================================
// SISTEMA DE OVERLAY (substitui alert / confirm / prompt)
// =================================

function criarOverlayBase() {
    // Remove overlay existente, se houver, para evitar duplicidade
    const existente = document.getElementById("customOverlay");
    if (existente) existente.remove();

    const overlay = document.createElement("div");
    overlay.id = "customOverlay";
    overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.55);
        display: flex; align-items: center; justify-content: center;
        z-index: 99999;
        padding: 20px;
        box-sizing: border-box;
        animation: overlayFadeIn 0.15s ease-out;
    `;

    // Injeta a animação uma única vez
    if (!document.getElementById("overlayStyleTag")) {
        const style = document.createElement("style");
        style.id = "overlayStyleTag";
        style.textContent = `
            @keyframes overlayFadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes overlayBoxIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(overlay);
    return overlay;
}

function fecharOverlay() {
    const overlay = document.getElementById("customOverlay");
    if (overlay) overlay.remove();
}

function criarCaixaOverlay(larguraMax) {
    const box = document.createElement("div");
    box.style.cssText = `
        background: #fff;
        border-radius: 14px;
        padding: 24px;
        max-width: ${larguraMax || 400}px;
        width: 100%;
        box-shadow: 0 10px 30px rgba(0,0,0,0.25);
        animation: overlayBoxIn 0.15s ease-out;
    `;
    return box;
}

/**
 * Substitui window.alert(mensagem)
 * mostrarAlerta("Texto", callbackOpcionalAoFechar)
 */
function mostrarAlerta(mensagem, callback) {
    const overlay = criarOverlayBase();
    const box = criarCaixaOverlay(400);
    box.innerHTML = `
        <p style="margin:0 0 18px 0;font-size:15px;color:#333;white-space:pre-wrap;line-height:1.4;">${mensagem}</p>
        <div style="display:flex;justify-content:flex-end;">
            <button class="action-button" id="btnAlertaOk">OK</button>
        </div>
    `;
    overlay.appendChild(box);

    const fechar = () => { fecharOverlay(); if (callback) callback(); };
    document.getElementById("btnAlertaOk").onclick = fechar;
    overlay.onclick = (e) => { if (e.target === overlay) fechar(); };
}

/**
 * Substitui window.confirm(mensagem)
 * mostrarConfirmacao("Texto", onConfirmar, onCancelarOpcional)
 */
function mostrarConfirmacao(mensagem, onConfirmar, onCancelar) {
    const overlay = criarOverlayBase();
    const box = criarCaixaOverlay(400);
    box.innerHTML = `
        <p style="margin:0 0 18px 0;font-size:15px;color:#333;white-space:pre-wrap;line-height:1.4;">${mensagem}</p>
        <div style="display:flex;justify-content:flex-end;gap:10px;">
            <button class="action-button" style="background:#999;" id="btnConfirmCancelar">Cancelar</button>
            <button class="action-button" style="background:#e74c3c;" id="btnConfirmOk">Confirmar</button>
        </div>
    `;
    overlay.appendChild(box);

    document.getElementById("btnConfirmOk").onclick = () => { fecharOverlay(); if (onConfirmar) onConfirmar(); };
    document.getElementById("btnConfirmCancelar").onclick = () => { fecharOverlay(); if (onCancelar) onCancelar(); };
    overlay.onclick = (e) => { if (e.target === overlay) { fecharOverlay(); if (onCancelar) onCancelar(); } };
}

/**
 * Substitui window.prompt(...) — suporta um ou mais campos.
 * mostrarPrompt(
 *   [{ id, label, tipo: 'text'|'number'|'password'|'textarea', valor, placeholder }, ...],
 *   "Título do modal",
 *   (valores) => { ... },   // onEnviar: recebe { id: valorDigitado, ... }
 *   () => { ... }           // onCancelar (opcional)
 * )
 */
function mostrarPrompt(campos, titulo, onEnviar, onCancelar) {
    const overlay = criarOverlayBase();
    const box = criarCaixaOverlay(440);

    const camposHtml = campos.map((c, i) => `
        <div style="margin-bottom:14px;">
            <label style="font-weight:bold;display:block;margin-bottom:6px;font-size:14px;color:#333;">${c.label}</label>
            ${c.tipo === "textarea"
                ? `<textarea id="${c.id}" rows="3" placeholder="${c.placeholder || ''}" style="width:100%;padding:8px;border-radius:8px;border:1px solid #0739ce;font-size:14px;resize:vertical;box-sizing:border-box;font-family:Arial,sans-serif;">${c.valor || ''}</textarea>`
                : `<input type="${c.tipo || 'text'}" id="${c.id}" value="${c.valor || ''}" placeholder="${c.placeholder || ''}" style="width:100%;padding:8px;border-radius:8px;border:1px solid #0739ce;font-size:14px;box-sizing:border-box;">`
            }
        </div>
    `).join("");

    box.innerHTML = `
        <h3 style="margin:0 0 16px 0;color:#0739ce;">${titulo}</h3>
        ${camposHtml}
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:6px;">
            <button class="action-button" style="background:#999;" id="btnPromptCancelar">Cancelar</button>
            <button class="action-button" id="btnPromptOk">Confirmar</button>
        </div>
    `;
    overlay.appendChild(box);

    const enviar = () => {
        const valores = {};
        campos.forEach(c => { valores[c.id] = document.getElementById(c.id).value.trim(); });
        fecharOverlay();
        if (onEnviar) onEnviar(valores);
    };
    const cancelar = () => { fecharOverlay(); if (onCancelar) onCancelar(); };

    document.getElementById("btnPromptOk").onclick = enviar;
    document.getElementById("btnPromptCancelar").onclick = cancelar;
    overlay.onclick = (e) => { if (e.target === overlay) cancelar(); };

    // Permite confirmar com Enter em campos simples (não textarea)
    campos.forEach(c => {
        if (c.tipo !== "textarea") {
            const el = document.getElementById(c.id);
            el.addEventListener("keydown", (e) => { if (e.key === "Enter") enviar(); });
        }
    });

    // Foca automaticamente o primeiro campo
    if (campos[0]) {
        const primeiro = document.getElementById(campos[0].id);
        if (primeiro) primeiro.focus();
    }
}

// =================================
// FUNÇÕES DE NAVEGAÇÃO
// =================================

/**
 * Sincroniza o destaque da sidebar com a seção realmente exibida no momento.
 * Deve ser chamada no início de toda função que renderiza uma view "raiz"
 * (conteúdo, criar, turmas, perfil), inclusive quando chamada indiretamente
 * (ex: após salvar/excluir algo), e não só no clique direto do menu.
 */
function ativarMenu(section) {
    menuItems.forEach((menu) => {
        menu.classList.toggle("active", menu.dataset.section === section);
    });
}

function abrirTurma(turmaId) {
    const turma = turmas.find(t => t.id === turmaId);
    if (!turma) return;

    ativarMenu("turmas");
    pageTitle.textContent = turma.nome;

    contentArea.innerHTML = `
        <div style="grid-column:1/-1;">
            <button class="action-button" style="background:#555;margin-bottom:16px;" onclick="mostrarTurmas()">← Voltar</button>

            <div class="text-card" style="display:flex;flex-direction:column;gap:14px;">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
                    <div>
                        <h2 style="margin:0;">🏫 ${turma.nome}</h2>
                        <p style="margin:4px 0 0 0;color:#0739ce;">${turma.alunos.length} aluno(s)</p>
                    </div>
                    <div style="display:flex;gap:8px;">
                        <button class="action-button" onclick="editarTurma(${turma.id})">✏️ Editar</button>
                        <button class="action-button" style="background:#e74c3c;" onclick="excluirTurma(${turma.id})">🗑️ Excluir</button>
                    </div>
                </div>
            </div>

            <div style="display:flex;gap:8px;flex-wrap:wrap;margin:18px 0 14px 0;">
                <button class="turma-tab action-button" data-aba="perfil" onclick="ativarAbaTurma(${turma.id},'perfil')">👤 Perfil</button>
                <button class="turma-tab action-button" data-aba="alunos" onclick="ativarAbaTurma(${turma.id},'alunos')">🧑‍🎓 Alunos</button>
                <button class="turma-tab action-button" data-aba="notas" onclick="ativarAbaTurma(${turma.id},'notas')">📊 Notas por Conteúdo</button>
                <button class="turma-tab action-button" data-aba="desempenho" onclick="ativarAbaTurma(${turma.id},'desempenho')">📈 Desempenho da Turma</button>
                <button class="turma-tab action-button" data-aba="conteudo" onclick="ativarAbaTurma(${turma.id},'conteudo')">🔓 Conteúdo</button>
            </div>

            <div id="turmaSubContent"></div>
        </div>
    `;

    ativarAbaTurma(turmaId, "perfil");
}

/**
 * Troca a aba ativa dentro da página da turma, sem recarregar o cabeçalho.
 */
function ativarAbaTurma(turmaId, aba) {
    const turma = turmas.find(t => t.id === turmaId);
    if (!turma) return;

    document.querySelectorAll(".turma-tab").forEach(tab => {
        const ativa = tab.dataset.aba === aba;
        tab.style.background = ativa ? "#0739ce" : "#999";
    });

    const sub = document.getElementById("turmaSubContent");
    if (!sub) return;

    if (aba === "perfil") sub.innerHTML = renderTurmaPerfil(turma);
    else if (aba === "alunos") sub.innerHTML = renderTurmaAlunos(turma);
    else if (aba === "notas") sub.innerHTML = renderTurmaNotas(turma);
    else if (aba === "desempenho") sub.innerHTML = renderTurmaDesempenho(turma);
    else if (aba === "conteudo") sub.innerHTML = renderTurmaConteudo(turma);
}

// ---------- Aba: Perfil da Turma ----------

function calcularMediaGeralTurma(turma) {
    let soma = 0, count = 0;
    Object.values(turma.notas || {}).forEach(notasAluno => {
        Object.values(notasAluno).forEach(nota => {
            if (typeof nota === "number" && !isNaN(nota)) { soma += nota; count++; }
        });
    });
    return count > 0 ? soma / count : null;
}

function renderTurmaPerfil(turma) {
    const mediaGeral = calcularMediaGeralTurma(turma);
    return `
        <div class="text-card">
            <h3 style="margin-top:0;">👤 Perfil da Turma</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-number">${turma.alunos.length}</span>
                    <span class="stat-label">Alunos</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${turma.conteudosLiberados.length}</span>
                    <span class="stat-label">Conteúdos liberados</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${mediaGeral !== null ? mediaGeral.toFixed(1) : '—'}</span>
                    <span class="stat-label">Média geral</span>
                </div>
            </div>
        </div>
    `;
}

// ---------- Aba: Alunos ----------

function formatarMediaAluno(turma, alunoId) {
    const notas = turma.notas[alunoId];
    if (!notas) return "—";
    const valores = Object.values(notas).filter(n => typeof n === "number");
    if (valores.length === 0) return "—";
    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    return media.toFixed(1);
}

function renderTurmaAlunos(turma) {
    const linhas = turma.alunos.map(aluno => `
        <div class="text-card" style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px;">
            <div>
                <strong>${aluno.nome}</strong>
                <br><small style="color:#0739ce;">Média: ${formatarMediaAluno(turma, aluno.id)}</small>
            </div>
            <div style="display:flex;gap:8px;">
                <button class="action-button" style="font-size:12px;padding:6px 10px;" onclick="verNotasAluno(${turma.id},${aluno.id})">📊 Ver/Editar Notas</button>
                <button class="action-button" style="background:#e74c3c;font-size:12px;padding:6px 10px;" onclick="excluirAluno(${turma.id},${aluno.id})">🗑️</button>
            </div>
        </div>
    `).join("");

    return `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
            <h3 style="margin:0;">🧑‍🎓 Alunos da Turma</h3>
            <button class="action-button" onclick="adicionarAluno(${turma.id})">➕ Adicionar Aluno</button>
        </div>
        ${turma.alunos.length === 0 ? `<div class="text-card"><p style="text-align:center;">Nenhum aluno cadastrado ainda.</p></div>` : linhas}
    `;
}

function adicionarAluno(turmaId) {
    mostrarPrompt(
        [{ id: "campoNomeAluno", label: "Nome do aluno", placeholder: "Ex: João da Silva" }],
        "➕ Adicionar Aluno",
        (valores) => {
            if (!valores.campoNomeAluno) { mostrarAlerta("Por favor, informe o nome do aluno."); return; }
            const turma = turmas.find(t => t.id === turmaId);
            if (!turma) return;
            const maxId = turma.alunos.reduce((m, a) => Math.max(m, a.id || 0), 0);
            turma.alunos.push({ id: maxId + 1, nome: valores.campoNomeAluno });
            mostrarAlerta(`Aluno "${valores.campoNomeAluno}" adicionado com sucesso!`, () => ativarAbaTurma(turmaId, "alunos"));
        }
    );
}

function excluirAluno(turmaId, alunoId) {
    mostrarConfirmacao("Tem certeza que deseja remover este aluno da turma?", () => {
        const turma = turmas.find(t => t.id === turmaId);
        if (!turma) return;
        turma.alunos = turma.alunos.filter(a => a.id !== alunoId);
        if (turma.notas && turma.notas[alunoId]) delete turma.notas[alunoId];
        ativarAbaTurma(turmaId, "alunos");
    });
}

function verNotasAluno(turmaId, alunoId) {
    const turma = turmas.find(t => t.id === turmaId);
    const aluno = turma ? turma.alunos.find(a => a.id === alunoId) : null;
    if (!turma || !aluno) return;

    const conteudosLiberados = conteudos.filter(c => turma.conteudosLiberados.includes(c.id));
    const sub = document.getElementById("turmaSubContent");
    if (!sub) return;

    sub.innerHTML = `
        <button class="action-button" style="background:#555;margin-bottom:14px;" onclick="ativarAbaTurma(${turmaId},'alunos')">← Voltar para Alunos</button>
        <div class="text-card">
            <h3 style="margin-top:0;">📊 Notas de ${aluno.nome}</h3>
            ${conteudosLiberados.length === 0
                ? `<p style="color:#666;">Nenhum conteúdo liberado para esta turma ainda. Libere na aba "Conteúdo".</p>`
                : conteudosLiberados.map(c => `
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid #eee;">
                        <span>${c.titulo}</span>
                        <input type="number" min="0" max="10" step="0.1" id="nota-${c.id}"
                            value="${(turma.notas[aluno.id] && turma.notas[aluno.id][c.id] !== undefined) ? turma.notas[aluno.id][c.id] : ''}"
                            placeholder="0-10"
                            style="width:80px;padding:6px;border-radius:8px;border:1px solid #0739ce;text-align:center;">
                    </div>
                `).join("")
            }
            ${conteudosLiberados.length > 0 ? `<button class="action-button" style="margin-top:14px;" onclick="salvarNotasAluno(${turmaId},${alunoId})">💾 Salvar Notas</button>` : ""}
        </div>
    `;
}

function salvarNotasAluno(turmaId, alunoId) {
    const turma = turmas.find(t => t.id === turmaId);
    const aluno = turma ? turma.alunos.find(a => a.id === alunoId) : null;
    if (!turma || !aluno) return;

    if (!turma.notas[alunoId]) turma.notas[alunoId] = {};

    conteudos.filter(c => turma.conteudosLiberados.includes(c.id)).forEach(c => {
        const input = document.getElementById(`nota-${c.id}`);
        if (!input) return;
        const valor = input.value.trim();
        if (valor === "") { delete turma.notas[alunoId][c.id]; return; }
        let nota = parseFloat(valor.replace(",", "."));
        if (isNaN(nota)) return;
        nota = Math.max(0, Math.min(10, nota));
        turma.notas[alunoId][c.id] = nota;
    });

    mostrarAlerta("Notas salvas com sucesso!", () => ativarAbaTurma(turmaId, "alunos"));
}

// ---------- Aba: Notas por Conteúdo (tabela) ----------

function renderTurmaNotas(turma) {
    const conteudosLiberados = conteudos.filter(c => turma.conteudosLiberados.includes(c.id));

    if (turma.alunos.length === 0) {
        return `<div class="text-card"><p style="text-align:center;">Cadastre alunos na aba "Alunos" para lançar notas.</p></div>`;
    }
    if (conteudosLiberados.length === 0) {
        return `<div class="text-card"><p style="text-align:center;">Libere conteúdos na aba "Conteúdo" para lançar notas.</p></div>`;
    }

    const header = `<th style="text-align:left;padding:8px;">Aluno</th>` +
        conteudosLiberados.map(c => `<th style="padding:8px;">${c.titulo}</th>`).join("") +
        `<th style="padding:8px;">Média</th>`;

    const linhas = turma.alunos.map(aluno => {
        const celulas = conteudosLiberados.map(c => {
            const valor = (turma.notas[aluno.id] && turma.notas[aluno.id][c.id] !== undefined) ? turma.notas[aluno.id][c.id] : '';
            return `<td style="padding:6px;text-align:center;">
                <input type="number" min="0" max="10" step="0.1" id="notatab-${aluno.id}-${c.id}" value="${valor}" placeholder="-"
                    style="width:64px;padding:5px;border-radius:6px;border:1px solid #ccc;text-align:center;">
            </td>`;
        }).join("");
        return `<tr>
            <td style="padding:8px;font-weight:bold;">${aluno.nome}</td>
            ${celulas}
            <td style="padding:8px;text-align:center;color:#0739ce;font-weight:bold;">${formatarMediaAluno(turma, aluno.id)}</td>
        </tr>`;
    }).join("");

    const rodape = conteudosLiberados.map(c => {
        const valores = turma.alunos.map(a => turma.notas[a.id] && turma.notas[a.id][c.id]).filter(n => typeof n === "number");
        const media = valores.length > 0 ? (valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(1) : "—";
        return `<td style="padding:8px;text-align:center;font-weight:bold;color:#27ae60;">${media}</td>`;
    }).join("");

    return `
        <div class="text-card" style="overflow-x:auto;">
            <h3 style="margin-top:0;">📊 Notas por Conteúdo</h3>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <thead><tr style="border-bottom:2px solid #0739ce;">${header}</tr></thead>
                <tbody>${linhas}</tbody>
                <tfoot><tr style="border-top:2px solid #eee;"><td style="padding:8px;font-weight:bold;">Média da turma</td>${rodape}<td></td></tr></tfoot>
            </table>
            <button class="action-button" style="margin-top:14px;" onclick="salvarNotasTabela(${turma.id})">💾 Salvar Todas as Notas</button>
        </div>
    `;
}

function salvarNotasTabela(turmaId) {
    const turma = turmas.find(t => t.id === turmaId);
    if (!turma) return;
    const conteudosLiberados = conteudos.filter(c => turma.conteudosLiberados.includes(c.id));

    turma.alunos.forEach(aluno => {
        if (!turma.notas[aluno.id]) turma.notas[aluno.id] = {};
        conteudosLiberados.forEach(c => {
            const input = document.getElementById(`notatab-${aluno.id}-${c.id}`);
            if (!input) return;
            const valor = input.value.trim();
            if (valor === "") { delete turma.notas[aluno.id][c.id]; return; }
            let nota = parseFloat(valor.replace(",", "."));
            if (isNaN(nota)) return;
            nota = Math.max(0, Math.min(10, nota));
            turma.notas[aluno.id][c.id] = nota;
        });
    });

    mostrarAlerta("Notas salvas com sucesso!", () => ativarAbaTurma(turmaId, "notas"));
}

// ---------- Aba: Desempenho da Turma ----------

function renderTurmaDesempenho(turma) {
    const mediaGeral = calcularMediaGeralTurma(turma);
    const conteudosLiberados = conteudos.filter(c => turma.conteudosLiberados.includes(c.id));

    const barrasConteudo = conteudosLiberados.map(c => {
        const valores = turma.alunos.map(a => turma.notas[a.id] && turma.notas[a.id][c.id]).filter(n => typeof n === "number");
        const media = valores.length > 0 ? (valores.reduce((a, b) => a + b, 0) / valores.length) : 0;
        const pct = Math.min(100, (media / 10) * 100);
        return `
            <div style="margin-bottom:14px;">
                <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
                    <span>${c.titulo}</span><span style="font-weight:bold;color:#0739ce;">${valores.length > 0 ? media.toFixed(1) : '—'}</span>
                </div>
                <div style="background:#eee;border-radius:6px;height:10px;overflow:hidden;">
                    <div style="background:#0739ce;height:100%;width:${pct}%;"></div>
                </div>
            </div>
        `;
    }).join("") || `<p style="color:#666;">Nenhum conteúdo liberado ainda.</p>`;

    return `
        <div class="text-card">
            <h3 style="margin-top:0;">📈 Desempenho da Turma</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-number">${mediaGeral !== null ? mediaGeral.toFixed(1) : '—'}</span>
                    <span class="stat-label">Média geral</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${turma.alunos.length}</span>
                    <span class="stat-label">Alunos</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${conteudosLiberados.length}</span>
                    <span class="stat-label">Conteúdos avaliados</span>
                </div>
            </div>
        </div>
        <div class="text-card" style="margin-top:18px;">
            <h3 style="margin-top:0;">Média por Conteúdo</h3>
            ${barrasConteudo}
        </div>
    `;
}

// ---------- Aba: Conteúdo (liberar questões + desempenho por questão) ----------

function renderTurmaConteudo(turma) {
    const listaConteudos = conteudos.filter(c => c.titulo);

    if (listaConteudos.length === 0) {
        return `<div class="text-card"><p style="text-align:center;">Nenhum conteúdo cadastrado ainda.</p></div>`;
    }

    return listaConteudos.map(c => {
        const liberado = turma.conteudosLiberados.includes(c.id);
        const questoes = c.questoes || [];

        return `
            <div class="text-card" style="margin-bottom:16px;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;">
                    <div>
                        <h3 style="margin:0 0 4px 0;">${c.titulo}</h3>
                        <small style="color:#0739ce;">${questoes.length} questão(ões)</small>
                    </div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        <button class="action-button" onclick="verQuestoes(${c.id})">📋 Ver Questões</button>
                        <button class="action-button" style="background:${liberado ? '#e74c3c' : '#27ae60'};" onclick="alternarLiberacaoConteudo(${turma.id},${c.id})">
                            ${liberado ? '🔒 Bloquear para Turma' : '🔓 Liberar para Turma'}
                        </button>
                    </div>
                </div>
                ${liberado ? `
                    <div style="margin-top:14px;border-top:1px solid #eee;padding-top:12px;">
                        <strong style="display:block;margin-bottom:8px;">📊 Desempenho dos alunos nas questões:</strong>
                        ${renderDesempenhoQuestoes(turma, c)}
                    </div>
                ` : ""}
            </div>
        `;
    }).join("");
}

function renderDesempenhoQuestoes(turma, conteudo) {
    const questoes = conteudo.questoes || [];
    if (questoes.length === 0) {
        return `<p style="color:#666;">Nenhuma questão cadastrada neste conteúdo.</p>`;
    }

    const linhas = questoes.map((q, idx) => {
        const dado = (turma.desempenhoQuestoes && turma.desempenhoQuestoes[q.id]) || { acertos: '', total: '' };
        const acertosNum = Number(dado.acertos);
        const totalNum = Number(dado.total);
        const pct = (dado.acertos !== '' && dado.total !== '' && totalNum > 0)
            ? Math.round((acertosNum / totalNum) * 100)
            : null;
        return `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid #f0f0f0;flex-wrap:wrap;">
                <span style="flex:1;min-width:180px;">Questão ${idx + 1}${pct !== null ? ` <strong style="color:${pct >= 60 ? '#27ae60' : '#e74c3c'};">(${pct}%)</strong>` : ''}</span>
                <div style="display:flex;align-items:center;gap:6px;">
                    <input type="number" min="0" id="acertos-${turma.id}-${q.id}" placeholder="Acertos" value="${dado.acertos}"
                        style="width:70px;padding:5px;border-radius:6px;border:1px solid #ccc;text-align:center;">
                    <span>/</span>
                    <input type="number" min="0" id="total-${turma.id}-${q.id}" placeholder="Total" value="${dado.total}"
                        style="width:70px;padding:5px;border-radius:6px;border:1px solid #ccc;text-align:center;">
                </div>
            </div>
        `;
    }).join("");

    return `
        ${linhas}
        <button class="action-button" style="margin-top:10px;font-size:13px;" onclick="salvarDesempenhoQuestoes(${turma.id},${conteudo.id})">💾 Salvar Desempenho</button>
    `;
}

function alternarLiberacaoConteudo(turmaId, conteudoId) {
    const turma = turmas.find(t => t.id === turmaId);
    if (!turma) return;
    const idx = turma.conteudosLiberados.indexOf(conteudoId);
    if (idx >= 0) turma.conteudosLiberados.splice(idx, 1);
    else turma.conteudosLiberados.push(conteudoId);
    ativarAbaTurma(turmaId, "conteudo");
}

function salvarDesempenhoQuestoes(turmaId, conteudoId) {
    const turma = turmas.find(t => t.id === turmaId);
    const conteudo = conteudos.find(c => c.id === conteudoId);
    if (!turma || !conteudo) return;
    if (!turma.desempenhoQuestoes) turma.desempenhoQuestoes = {};

    (conteudo.questoes || []).forEach(q => {
        const inAcertos = document.getElementById(`acertos-${turma.id}-${q.id}`);
        const inTotal = document.getElementById(`total-${turma.id}-${q.id}`);
        if (!inAcertos || !inTotal) return;
        const acertos = inAcertos.value.trim();
        const total = inTotal.value.trim();
        if (acertos === "" && total === "") { delete turma.desempenhoQuestoes[q.id]; return; }
        turma.desempenhoQuestoes[q.id] = {
            acertos: acertos === "" ? 0 : Math.max(0, parseInt(acertos) || 0),
            total: total === "" ? 0 : Math.max(0, parseInt(total) || 0)
        };
    });

    mostrarAlerta("Desempenho salvo com sucesso!", () => ativarAbaTurma(turmaId, "conteudo"));
}

function editarTurma(turmaId) {
    const turma = turmas.find(t => t.id === turmaId);
    if (!turma) return;

    mostrarPrompt(
        [
            { id: "campoNomeTurma", label: "Nome da turma", valor: turma.nome, placeholder: "Ex: 3º Ano A" }
        ],
        "✏️ Editar Turma",
        (valores) => {
            if (!valores.campoNomeTurma) { mostrarAlerta("Por favor, informe o nome da turma."); return; }
            turma.nome = valores.campoNomeTurma;
            mostrarAlerta("Turma atualizada com sucesso!", () => abrirTurma(turmaId));
        }
    );
}

function excluirTurma(turmaId) {
    mostrarConfirmacao("Tem certeza que deseja excluir esta turma?", () => {
        turmas = turmas.filter(t => t.id !== turmaId);
        mostrarTurmas();
    });
}

function fazerLogout() {
    mostrarConfirmacao('Tem certeza que deseja sair?', () => {
        window.location.href = '/logout';
    });
}

function voltarParaProfessorMenu() {
    window.location.href = '/professorMenu';
}

// =================================
// CONTEÚDO — LISTA
// =================================

function mostrarConteudos() {
    ativarMenu("conteudo");
    pageTitle.textContent = "CONTEÚDOS";
    conteudoAtual = null;
    contentArea.innerHTML = "";

    if (conteudos.length === 0 || (conteudos.length === 1 && !conteudos[0].titulo)) {
        contentArea.innerHTML = `<div class="text-card" style="grid-column:1/-1;text-align:center;"><h2>Nenhum conteúdo cadastrado</h2><p>Clique em "Criar" para adicionar.</p></div>`;
        return;
    }

    conteudos.forEach((conteudo) => {
        if (!conteudo.titulo) return;
        const card = document.createElement("div");
        card.className = "text-card";
        card.style.cursor = "pointer";
        card.innerHTML = `
            <div>
                <h2>${conteudo.titulo}</h2>
                <p>${conteudo.descricao || ""}</p>
                <small style="color:#0739ce;">${(conteudo.questoes || []).length} questão(ões)</small>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
                <button class="action-button" onclick="event.stopPropagation();verQuestoes(${conteudo.id})">📋 QUESTÕES</button>
                <button class="action-button" style="background:#e74c3c;" onclick="event.stopPropagation();excluirConteudo(${conteudo.id})">🗑️</button>
            </div>
        `;
        card.onclick = () => verQuestoes(conteudo.id);
        contentArea.appendChild(card);
    });
}

// =================================
// QUESTÕES — VISUALIZAÇÃO
// =================================

function verQuestoes(conteudoId) {
    ativarMenu("conteudo");
    conteudoAtual = conteudos.find(c => c.id === conteudoId);
    if (!conteudoAtual) return;

    pageTitle.textContent = conteudoAtual.titulo;
    contentArea.innerHTML = `
        <div style="grid-column:1/-1;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:10px;">
                <button class="action-button" style="background:#555;" onclick="mostrarConteudos()">← Voltar</button>
                <button class="action-button" onclick="abrirFormQuestao(${conteudoId})">➕ Nova Questão</button>
            </div>
            <div id="listaQuestoes"></div>
        </div>
    `;
    renderizarQuestoes();
}

function renderizarQuestoes() {
    const lista = document.getElementById("listaQuestoes");
    if (!lista || !conteudoAtual) return;

    const questoes = conteudoAtual.questoes || [];

    if (questoes.length === 0) {
        lista.innerHTML = `<div class="text-card"><p style="text-align:center;">Nenhuma questão cadastrada. Clique em "+ Nova Questão".</p></div>`;
        return;
    }

    lista.innerHTML = questoes.map((q, idx) => `
        <div class="text-card" style="margin-bottom:18px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
                <div style="flex:1;">
                    <p style="font-weight:bold;color:#0739ce;margin-bottom:4px;">
                        Questão ${idx + 1} — ${q.tipo === "ligue" ? "⛓️ Ligue" : "📝 Múltipla Escolha"}
                    </p>
                    <p style="margin-bottom:10px;">${q.enunciado}</p>
                    ${q.tipo === "multipla_escolha" ? renderAlternativas(q) : renderLigue(q)}
                    <p style="margin-top:8px;color:#27ae60;font-weight:bold;">
                        ✅ Resposta correta: ${
                            q.tipo === "multipla_escolha"
                            ? q.resposta_correta
                            : JSON.stringify(q.resposta_correta)
                        }
                    </p>
                </div>
                <div style="display:flex;flex-direction:column;gap:6px;">
                    <button class="action-button" style="font-size:12px;padding:6px 10px;" onclick="editarQuestao(${conteudoAtual.id},${q.id})">✏️ Editar</button>
                    <button class="action-button" style="background:#e74c3c;font-size:12px;padding:6px 10px;" onclick="excluirQuestao(${conteudoAtual.id},${q.id})">🗑️ Excluir</button>
                </div>
            </div>
        </div>
    `).join("");
}

function renderAlternativas(q) {
    return `<ul style="list-style:none;padding:0;margin:0;">
        ${q.alternativas.map(alt => `
            <li style="padding:4px 0;${alt.letra === q.resposta_correta ? 'color:#27ae60;font-weight:bold;' : ''}">
                ${alt.letra === q.resposta_correta ? '✅' : '○'} <strong>${alt.letra})</strong> ${alt.texto}
            </li>
        `).join("")}
    </ul>`;
}

function renderLigue(q) {
    return `
        <div style="display:flex;gap:20px;flex-wrap:wrap;margin-top:6px;">
            <div>
                <strong>Coluna A</strong>
                <ol style="margin:4px 0;padding-left:18px;">
                    ${q.coluna_esquerda.map(item => `<li style="margin-bottom:4px;">${item}</li>`).join("")}
                </ol>
            </div>
            <div>
                <strong>Coluna B</strong>
                <ul style="margin:4px 0;padding-left:18px;">
                    ${q.coluna_direita.map(item => `<li style="margin-bottom:4px;">${item}</li>`).join("")}
                </ul>
            </div>
        </div>
    `;
}

// =================================
// FORMULÁRIO — NOVA / EDITAR QUESTÃO
// =================================

function abrirFormQuestao(conteudoId, questaoId = null) {
    ativarMenu("conteudo");
    conteudoAtual = conteudos.find(c => c.id === conteudoId);
    if (!conteudoAtual) return;

    const questao = questaoId ? conteudoAtual.questoes.find(q => q.id === questaoId) : null;
    const isEdit = !!questao;
    const tipo = questao ? questao.tipo : "multipla_escolha";

    pageTitle.textContent = isEdit ? "Editar Questão" : "Nova Questão";
    contentArea.innerHTML = `
        <div style="grid-column:1/-1;max-width:700px;margin:0 auto;width:100%;">
            <button class="action-button" style="background:#555;margin-bottom:16px;" onclick="verQuestoes(${conteudoId})">← Voltar</button>

            <div class="text-card" style="display:flex;flex-direction:column;gap:14px;">
                <h2 style="margin:0;">${isEdit ? "✏️ Editar Questão" : "➕ Nova Questão"}</h2>

                <div>
                    <label style="font-weight:bold;display:block;margin-bottom:6px;">Tipo de questão:</label>
                    <select id="tipoQuestao" onchange="atualizarCamposTipo(${conteudoId},${questaoId || 'null'})"
                        style="padding:8px;border-radius:8px;border:1px solid #0739ce;width:100%;font-size:14px;">
                        <option value="multipla_escolha" ${tipo==="multipla_escolha"?"selected":""}>📝 Múltipla Escolha</option>
                        <option value="ligue" ${tipo==="ligue"?"selected":""}>⛓️ Ligue</option>
                    </select>
                </div>

                <div>
                    <label style="font-weight:bold;display:block;margin-bottom:6px;">Enunciado:</label>
                    <textarea id="enunciado" rows="3" placeholder="Digite o enunciado da questão..."
                        style="width:100%;padding:10px;border-radius:8px;border:1px solid #0739ce;font-size:14px;resize:vertical;box-sizing:border-box;">${questao ? questao.enunciado : ""}</textarea>
                </div>

                <div id="camposDinamicos"></div>

                <button class="action-button" onclick="salvarQuestao(${conteudoId},${questaoId || 'null'})">
                    💾 ${isEdit ? "Salvar Alterações" : "Criar Questão"}
                </button>
            </div>
        </div>
    `;

    atualizarCamposTipo(conteudoId, questaoId);
}

function atualizarCamposTipo(conteudoId, questaoId) {
    const tipo = document.getElementById("tipoQuestao").value;
    const campos = document.getElementById("camposDinamicos");
    const questao = questaoId ? conteudoAtual.questoes.find(q => q.id === questaoId) : null;

    if (tipo === "multipla_escolha") {
        const alts = questao && questao.tipo === "multipla_escolha"
            ? questao.alternativas
            : [{letra:"A",texto:""},{letra:"B",texto:""},{letra:"C",texto:""},{letra:"D",texto:""}];

        campos.innerHTML = `
            <div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <label style="font-weight:bold;">Alternativas:</label>
                    <button type="button" class="action-button" style="font-size:12px;padding:5px 10px;" onclick="adicionarAlternativa()">+ Alternativa</button>
                </div>
                <div id="listaAlternativas">
                    ${alts.map((alt, i) => `
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;" id="alt-row-${i}">
                            <span style="font-weight:bold;min-width:24px;">${alt.letra})</span>
                            <input type="text" placeholder="Texto da alternativa ${alt.letra}" value="${alt.texto}"
                                id="alt-texto-${i}"
                                style="flex:1;padding:8px;border-radius:8px;border:1px solid #ccc;font-size:14px;">
                            ${i >= 2 ? `<button type="button" onclick="removerAlternativa(${i})" style="background:#e74c3c;color:#fff;border:none;border-radius:6px;padding:4px 8px;cursor:pointer;">✕</button>` : ''}
                        </div>
                    `).join("")}
                </div>
                <div style="margin-top:10px;">
                    <label style="font-weight:bold;display:block;margin-bottom:6px;">Resposta correta (letra):</label>
                    <input type="text" id="respostaCorreta" maxlength="1" placeholder="Ex: A"
                        value="${questao && questao.tipo === "multipla_escolha" ? questao.resposta_correta : ""}"
                        style="padding:8px;border-radius:8px;border:1px solid #0739ce;width:80px;text-align:center;font-size:16px;text-transform:uppercase;">
                </div>
            </div>
        `;
    } else {
        const esq = questao && questao.tipo === "ligue" ? questao.coluna_esquerda : ["", ""];
        const dir = questao && questao.tipo === "ligue" ? questao.coluna_direita : ["", ""];

        campos.innerHTML = `
            <div style="display:flex;gap:16px;flex-wrap:wrap;">
                <div style="flex:1;min-width:200px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                        <label style="font-weight:bold;">Coluna A:</label>
                        <button type="button" class="action-button" style="font-size:12px;padding:5px 10px;" onclick="adicionarItemColuna('esq')">+</button>
                    </div>
                    <div id="colunaEsq">
                        ${esq.map((item, i) => `
                            <div style="display:flex;gap:6px;margin-bottom:8px;">
                                <input type="text" value="${item}" id="esq-${i}" placeholder="Item ${i+1}"
                                    style="flex:1;padding:8px;border-radius:8px;border:1px solid #ccc;font-size:13px;">
                                ${i >= 2 ? `<button type="button" onclick="removerItemColuna('esq',${i})" style="background:#e74c3c;color:#fff;border:none;border-radius:6px;padding:4px 8px;cursor:pointer;">✕</button>` : ''}
                            </div>
                        `).join("")}
                    </div>
                </div>
                <div style="flex:1;min-width:200px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                        <label style="font-weight:bold;">Coluna B:</label>
                        <button type="button" class="action-button" style="font-size:12px;padding:5px 10px;" onclick="adicionarItemColuna('dir')">+</button>
                    </div>
                    <div id="colunaDir">
                        ${dir.map((item, i) => `
                            <div style="display:flex;gap:6px;margin-bottom:8px;">
                                <input type="text" value="${item}" id="dir-${i}" placeholder="Item ${i+1}"
                                    style="flex:1;padding:8px;border-radius:8px;border:1px solid #ccc;font-size:13px;">
                                ${i >= 2 ? `<button type="button" onclick="removerItemColuna('dir',${i})" style="background:#e74c3c;color:#fff;border:none;border-radius:6px;padding:4px 8px;cursor:pointer;">✕</button>` : ''}
                            </div>
                        `).join("")}
                    </div>
                </div>
            </div>
            <div style="margin-top:10px;">
                <label style="font-weight:bold;display:block;margin-bottom:6px;">Gabarito (ex: {"1":"Atrito","2":"Contato"}):</label>
                <textarea id="respostaLigue" rows="2" placeholder='{"Item A1":"Item B1","Item A2":"Item B2"}'
                    style="width:100%;padding:10px;border-radius:8px;border:1px solid #0739ce;font-size:13px;resize:vertical;box-sizing:border-box;">${
                        questao && questao.tipo === "ligue" ? JSON.stringify(questao.resposta_correta) : ""
                    }</textarea>
            </div>
        `;
    }
}

// Helpers para adicionar/remover campos dinamicamente
function adicionarAlternativa() {
    const lista = document.getElementById("listaAlternativas");
    const rows = lista.querySelectorAll("[id^='alt-row-']");
    const i = rows.length;
    const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const letra = letras[i] || String(i+1);
    const div = document.createElement("div");
    div.id = `alt-row-${i}`;
    div.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:8px;";
    div.innerHTML = `
        <span style="font-weight:bold;min-width:24px;">${letra})</span>
        <input type="text" placeholder="Texto da alternativa ${letra}" id="alt-texto-${i}"
            style="flex:1;padding:8px;border-radius:8px;border:1px solid #ccc;font-size:14px;">
        <button type="button" onclick="removerAlternativa(${i})" style="background:#e74c3c;color:#fff;border:none;border-radius:6px;padding:4px 8px;cursor:pointer;">✕</button>
    `;
    lista.appendChild(div);
}

function removerAlternativa(i) {
    const el = document.getElementById(`alt-row-${i}`);
    if (el) el.remove();
}

function adicionarItemColuna(col) {
    const cont = document.getElementById(col === "esq" ? "colunaEsq" : "colunaDir");
    const rows = cont.querySelectorAll("div");
    const i = rows.length;
    const div = document.createElement("div");
    div.style.cssText = "display:flex;gap:6px;margin-bottom:8px;";
    div.innerHTML = `
        <input type="text" id="${col}-${i}" placeholder="Item ${i+1}"
            style="flex:1;padding:8px;border-radius:8px;border:1px solid #ccc;font-size:13px;">
        <button type="button" onclick="this.parentElement.remove()" style="background:#e74c3c;color:#fff;border:none;border-radius:6px;padding:4px 8px;cursor:pointer;">✕</button>
    `;
    cont.appendChild(div);
}

function removerItemColuna(col, i) {
    const el = document.getElementById(`${col}-${i}`);
    if (el && el.parentElement) el.parentElement.remove();
}

// =================================
// SALVAR / EXCLUIR QUESTÃO
// =================================

function salvarQuestao(conteudoId, questaoId) {
    const tipo = document.getElementById("tipoQuestao").value;
    const enunciado = document.getElementById("enunciado").value.trim();

    if (!enunciado) { mostrarAlerta("Por favor, preencha o enunciado."); return; }

    let novaQuestao = { tipo, enunciado };

    if (tipo === "multipla_escolha") {
        const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const alts = [];
        let i = 0;
        while (document.getElementById(`alt-texto-${i}`)) {
            const texto = document.getElementById(`alt-texto-${i}`).value.trim();
            if (texto) alts.push({ letra: letras[i], texto });
            i++;
        }
        if (alts.length < 2) { mostrarAlerta("Adicione ao menos 2 alternativas."); return; }
        const resp = (document.getElementById("respostaCorreta").value || "").toUpperCase();
        if (!resp) { mostrarAlerta("Informe a resposta correta."); return; }
        novaQuestao.alternativas = alts;
        novaQuestao.resposta_correta = resp;
    } else {
        const esqInputs = document.querySelectorAll("[id^='esq-']");
        const dirInputs = document.querySelectorAll("[id^='dir-']");
        const esq = [...esqInputs].map(el => el.value.trim()).filter(v => v);
        const dir = [...dirInputs].map(el => el.value.trim()).filter(v => v);
        if (esq.length < 2 || dir.length < 2) { mostrarAlerta("Adicione ao menos 2 itens em cada coluna."); return; }

        let respostaLigue;
        try {
            respostaLigue = JSON.parse(document.getElementById("respostaLigue").value || "{}");
        } catch(e) {
            mostrarAlerta("Gabarito inválido. Use formato JSON, ex: {\"A\":\"B\"}"); return;
        }
        novaQuestao.coluna_esquerda = esq;
        novaQuestao.coluna_direita = dir;
        novaQuestao.resposta_correta = respostaLigue;
    }

    const conteudo = conteudos.find(c => c.id === conteudoId);
    if (!conteudo) return;

    if (!conteudo.questoes) conteudo.questoes = [];

    if (questaoId) {
        const idx = conteudo.questoes.findIndex(q => q.id === questaoId);
        if (idx >= 0) {
            novaQuestao.id = questaoId;
            conteudo.questoes[idx] = novaQuestao;
            mostrarAlerta("Questão atualizada com sucesso!", () => verQuestoes(conteudoId));
            return;
        }
    } else {
        const maxId = conteudo.questoes.reduce((m, q) => Math.max(m, q.id || 0), 0);
        novaQuestao.id = maxId + 1;
        conteudo.questoes.push(novaQuestao);
        mostrarAlerta("Questão criada com sucesso!", () => verQuestoes(conteudoId));
        return;
    }

    verQuestoes(conteudoId);
}

function editarQuestao(conteudoId, questaoId) {
    abrirFormQuestao(conteudoId, questaoId);
}

function excluirQuestao(conteudoId, questaoId) {
    mostrarConfirmacao("Tem certeza que deseja excluir esta questão?", () => {
        const conteudo = conteudos.find(c => c.id === conteudoId);
        if (!conteudo) return;
        conteudo.questoes = conteudo.questoes.filter(q => q.id !== questaoId);
        renderizarQuestoes();
    });
}

function excluirConteudo(conteudoId) {
    mostrarConfirmacao("Tem certeza que deseja excluir este conteúdo e todas as suas questões?", () => {
        conteudos = conteudos.filter(c => c.id !== conteudoId);
        mostrarConteudos();
    });
}

// =================================
// CRIAR
// =================================

function mostrarCriar() {
    ativarMenu("criar");
    pageTitle.textContent = "CRIAR";
    contentArea.innerHTML = `
        <div class="text-card">
            <h2>📖 Novo Conteúdo</h2>
            <p>Criar uma nova aula com questões.</p>
            <button class="action-button" onclick="criarConteudo()">CRIAR</button>
        </div>
        <div class="text-card">
            <h2>🏫 Nova Turma</h2>
            <p>Criar e adicionar uma nova turma.</p>
            <button class="action-button" onclick="criarTurma()">CRIAR</button>
        </div>
    `;
}

// =================================
// TURMAS
// =================================

function mostrarTurmas() {
    ativarMenu("turmas");
    pageTitle.textContent = "TURMAS";
    contentArea.innerHTML = "";

    if (turmas.length === 0) {
        contentArea.innerHTML = `<div class="text-card" style="grid-column:1/-1;text-align:center;"><h2>Nenhuma turma cadastrada</h2><p>Clique em "Criar" para adicionar.</p></div>`;
        return;
    }

    turmas.forEach((turma) => {
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

// =================================
// PERFIL
// =================================

function mostrarPerfil() {
    ativarMenu("perfil");
    pageTitle.textContent = "PERFIL";
    const nomeExibicao = (typeof nomeDoUsuario !== 'undefined' && nomeDoUsuario) ? nomeDoUsuario : 'Professor(a)';
    const emailExibicao = (typeof emailDoUsuario !== 'undefined' && emailDoUsuario) ? emailDoUsuario : '';
    const contatoExibicao = (typeof contatoDoUsuario !== 'undefined' && contatoDoUsuario) ? contatoDoUsuario : '';
    const bioExibicao = (typeof bioDoUsuario !== 'undefined' && bioDoUsuario) ? bioDoUsuario : 'Bem-vindo(a) ao meu perfil!';

    contentArea.innerHTML = `
        <div class="profile-container">
            <div class="profile-card">
                <div class="profile-header">
                    <div class="profile-avatar">
                        <img src="https://via.placeholder.com/150" alt="Foto de perfil" id="profileImage">
                        <button class="edit-avatar-btn" onclick="trocarFoto()" title="Trocar foto">📷</button>
                    </div>
                    <h2 id="profileName">${nomeExibicao.toUpperCase()}</h2>
                    <p class="profile-role">Professor(a)</p>
                </div>
                <div class="profile-body">
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
                                <span class="stat-number">${conteudos.filter(c=>c.titulo).length}</span>
                                <span class="stat-label">Conteúdos</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">${conteudos.reduce((s,c)=>s+(c.questoes||[]).length,0)}</span>
                                <span class="stat-label">Questões</span>
                            </div>
                        </div>
                    </div>
                    <div class="profile-section">
                        <h3>⚙️ CONFIGURAÇÕES</h3>
                        <div class="settings-list">
                            <div id="settingNameSection">
                                <button class="settings-btn" onclick="editarNomeInline()"><span>👤</span> Editar Nome (${nomeExibicao})</button>
                            </div>
                            <button class="settings-btn" onclick="editarEmail()"><span>📧</span> Editar Email (${emailExibicao})</button>
                            <div id="settingPasswordSection">
                                <button class="settings-btn" onclick="editarSenhaInline()"><span>🔒</span> Alterar Senha</button>
                            </div>
                            <div id="settingContactSection">
                                <button class="settings-btn" onclick="editarContatoInline()"><span>📱</span> Editar Contato (${contatoExibicao})</button>
                            </div>
                        </div>
                    </div>
                    <div class="profile-actions">
                        <button class="action-button save-btn" onclick="salvarPerfil()">💾 Salvar Alterações</button>
                        <button class="action-button logout-btn" onclick="fazerLogout()">🚪 Sair</button>
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
    mostrarPrompt(
        [
            { id: "campoTitulo", label: "Título do conteúdo", placeholder: "Ex: Força Elétrica" },
            { id: "campoDescricao", label: "Descrição curta", tipo: "textarea", placeholder: "Descreva o conteúdo..." }
        ],
        "📖 Novo Conteúdo",
        (valores) => {
            if (!valores.campoTitulo) { mostrarAlerta("Por favor, informe o título do conteúdo."); return; }
            const maxId = conteudos.reduce((m, c) => Math.max(m, c.id || 0), 0);
            conteudos.push({ id: maxId + 1, titulo: valores.campoTitulo, descricao: valores.campoDescricao || "", questoes: [] });
            mostrarAlerta(`Conteúdo "${valores.campoTitulo}" criado! Agora você pode adicionar questões.`, () => {
                mostrarConteudos();
            });
        }
    );
}

function criarTurma() {
    mostrarPrompt(
        [
            { id: "campoNomeTurma", label: "Nome da turma", placeholder: "Ex: 3º Ano A" }
        ],
        "🏫 Nova Turma",
        (valores) => {
            if (!valores.campoNomeTurma) { mostrarAlerta("Por favor, informe o nome da turma."); return; }
            const maxId = turmas.reduce((m, t) => Math.max(m, t.id || 0), 0);
            turmas.push({
                id: maxId + 1,
                nome: valores.campoNomeTurma,
                alunos: [],                 // { id, nome }
                conteudosLiberados: [],      // ids de "conteudos" liberados para esta turma
                notas: {},                   // { alunoId: { conteudoId: nota } }
                desempenhoQuestoes: {}       // { questaoId: { acertos, total } }
            });
            mostrarAlerta(`Turma "${valores.campoNomeTurma}" criada com sucesso! Agora você pode adicionar alunos.`, () => {
                mostrarTurmas();
            });
        }
    );
}

// =================================
// EDIÇÃO DE PERFIL (inline)
// =================================

function trocarFoto() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                document.getElementById('profileImage').src = ev.target.result;
                mostrarAlerta('Foto atualizada!');
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

function editarBioInline() {
    const s = document.getElementById("settingBioSection");
    const bio = typeof bioDoUsuario !== 'undefined' ? bioDoUsuario : '';
    s.innerHTML = `
        <form action="/atualizar-perfil-inline" method="POST" style="display:flex;flex-direction:column;gap:10px;margin-top:5px;">
            <textarea name="bio" rows="3" style="padding:10px;border-radius:8px;border:1px solid #0739ce;width:100%;resize:none;font-family:Arial,sans-serif;font-size:14px;" required>${bio}</textarea>
            <button type="submit" class="action-button" style="padding:8px 15px;font-size:13px;align-self:flex-start;">Salvar Bio</button>
        </form>`;
}

function editarEmail() { mostrarAlerta("Para alterar seu e-mail, entre em contato com o suporte."); }
function salvarPerfil() { mostrarAlerta('Perfil salvo com sucesso!'); }

function editarNomeInline() {
    const s = document.getElementById("settingNameSection");
    s.innerHTML = `
        <form action="/atualizar-perfil-inline" method="POST" style="display:flex;gap:10px;align-items:center;">
            <input type="text" name="nome" value="${nomeDoUsuario}" style="padding:8px;border-radius:8px;border:1px solid #0739ce;flex:1;" required>
            <button type="submit" class="action-button" style="padding:8px 15px;font-size:13px;">Salvar</button>
        </form>`;
}

function editarContatoInline() {
    const s = document.getElementById("settingContactSection");
    s.innerHTML = `
        <form action="/atualizar-perfil-inline" method="POST" style="display:flex;gap:10px;align-items:center;">
            <input type="tel" name="contato" value="${contatoDoUsuario}" style="padding:8px;border-radius:8px;border:1px solid #0739ce;flex:1;" required>
            <button type="submit" class="action-button" style="padding:8px 15px;font-size:13px;">Salvar</button>
        </form>`;
}

function editarSenhaInline() {
    const s = document.getElementById("settingPasswordSection");
    s.innerHTML = `
        <form action="/atualizar-perfil-inline" method="POST" style="display:flex;gap:10px;align-items:center;">
            <input type="password" name="senha" placeholder="Nova senha" style="padding:8px;border-radius:8px;border:1px solid #0739ce;flex:1;" required>
            <button type="submit" class="action-button" style="padding:8px 15px;font-size:13px;">Salvar</button>
        </form>`;
}

// =================================
// NAVEGAÇÃO DO MENU
// =================================

menuItems.forEach((item) => {
    item.addEventListener("click", () => {
        const section = item.dataset.section;
        // Cada função mostrarX() já chama ativarMenu(section) internamente,
        // então a sidebar fica sincronizada tanto no clique direto
        // quanto quando a navegação acontece de forma indireta
        // (ex: após criar/editar/excluir algo).
        if (section === "conteudo") mostrarConteudos();
        else if (section === "criar") mostrarCriar();
        else if (section === "turmas") mostrarTurmas();
        else if (section === "perfil") mostrarPerfil();
    });
});

// INICIALIZAÇÃO
mostrarConteudos();
console.log("ALPHAFIZIC — JavaScript carregado com sucesso!");