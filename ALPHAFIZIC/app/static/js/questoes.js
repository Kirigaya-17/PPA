    import { state, salvarDadosNoBanco, contentArea, pageTitle, ativarMenu } from './main.js';
import { mostrarAlerta, mostrarConfirmacao, mostrarPrompt } from './overlay.js';

// Variável global para controlar o overlay aberto
let overlayAberto = null;

export function mostrarConteudos() {
    ativarMenu("conteudo");
    contentArea.innerHTML = "";

    if (state.conteudos.length === 0) {
        // Cria a div como um card clicável
        const card = document.createElement("div");
        card.className = "text-card";
        card.style.cssText = "grid-column:1/-1;text-align:center;cursor:pointer;transition:transform 0.2s, box-shadow 0.2s;";
        card.innerHTML = `
            <h2>Nenhum conteúdo cadastrado</h2>
            <p>Clique aqui para criar seu primeiro conteúdo.</p>
            <div style="font-size:48px;margin-top:10px;"></div>
        `;
        
        // Efeito hover
        card.onmouseenter = function() {
            this.style.transform = "scale(1.02)";
            this.style.boxShadow = "0 8px 25px rgba(7,57,206,0.2)";
        };
        card.onmouseleave = function() {
            this.style.transform = "scale(1)";
            this.style.boxShadow = "none";
        };
        
        // Ao clicar, abre o modal de criar conteúdo
        card.onclick = function() {
            criarConteudo();
        };
        
        contentArea.appendChild(card);
        return;
    }

    // Adiciona botão de criar novo conteúdo no topo
    const headerContainer = document.createElement("div");
    headerContainer.style.cssText = "grid-column:1/-1;display:flex;justify-content:flex-end;margin-bottom:20px;";
    headerContainer.innerHTML = `
        <button class="action-button" onclick="criarConteudo()" style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:18px;">+</span> Novo Conteúdo
        </button>
    `;
    contentArea.appendChild(headerContainer);

    // Container para os cards em colunas
    const cardsContainer = document.createElement("div");
    cardsContainer.style.cssText = `
        grid-column: 1/-1;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
        width: 100%;
    `;
    contentArea.appendChild(cardsContainer);

    state.conteudos.forEach((conteudo) => {
        const card = document.createElement("div");
        card.className = "text-card";
        card.style.cursor = "pointer";
        card.style.cssText = `
            display: flex;
            flex-direction: column;
            height: 100%;
            min-height: 120px;
            transition: transform 0.2s, box-shadow 0.2s;
        `;
        
        // Efeito hover nos cards
        card.onmouseenter = function() {
            this.style.transform = "scale(1.02)";
            this.style.boxShadow = "0 8px 25px rgba(7,57,206,0.15)";
        };
        card.onmouseleave = function() {
            this.style.transform = "scale(1)";
            this.style.boxShadow = "none";
        };
        
        // Trunca o título se tiver mais de 10 caracteres
        let tituloDisplay = conteudo.titulo;
        if (tituloDisplay.length > 10) {
            tituloDisplay = tituloDisplay.substring(0, 15) + '...';
        }
        
        // Trunca a descrição se tiver mais de 10 caracteres
        let descricaoDisplay = conteudo.descricao || "Sem descrição";
        if (descricaoDisplay.length > 10) {
            descricaoDisplay = descricaoDisplay.substring(0, 15) + '...';
        }
        
        card.innerHTML = `
            <div style="display: flex; flex-direction: column; justify-content: space-between; padding: 15px; height: 100%;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap;">
                        <h2 style="margin: 0; word-break: break-all; max-width: 100%; font-size: 1.1em;">${tituloDisplay}</h2>
                        <span style="background: var(--primary); color: white; padding: 2px 10px; border-radius: 12px; font-size: 0.8em; white-space: nowrap;">
                            ${(conteudo.questoes || []).length}
                        </span>
                    </div>
                    <p style="margin: 0 0 8px 0; color: var(--text-secondary); word-break: break-all; max-width: 100%; font-size: 0.9em;">${descricaoDisplay}</p>
                </div>
                <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px;padding-top:10px;border-top:1px solid rgba(0,0,0,0.05);">
                    <button class="action-button btn-danger" onclick="excluirConteudo(${conteudo.id}); event.stopPropagation();" style="font-size: 0.9em;">Excluir</button>
                </div>
            </div>
        `;
        
        card.addEventListener('click', function(e) {
            if (!e.target.closest('.action-button')) {
                verQuestoes(conteudo.id);
            }
        });
        
        cardsContainer.appendChild(card);
    });
}


export function criarConteudo() {
    mostrarPrompt(
        [
            { id: "campoTitulo", label: "Título do conteúdo", placeholder: "Ex: Força Elétrica" },
            { id: "campoDescricao", label: "Descrição", tipo: "textarea", placeholder: "O que os alunos vão aprender?" },
            {
                id: "campoTurma",
                label: "A qual turma este conteúdo está relacionado",
                tipo: "turmas",
                opcoes: state.turmas.map(t => ({ id: t.id, nome: t.nome }))
            }
        ],
        "Criar Novo Conteúdo",
        async (valores) => {
            if (!valores.campoTitulo) { mostrarAlerta("Informe o título do conteúdo."); return; }
            if (state.turmas.length === 0) {
                mostrarAlerta("Você precisa criar uma turma antes de cadastrar um conteúdo.");
                return;
            }
            if (!valores.campoTurma) {
                mostrarAlerta("Selecione a turma relacionada a este conteúdo.");
                return;
            }
            state.conteudos.push({
                id: null, //sera atribuido pelo banco de dados
                titulo: valores.campoTitulo,
                descricao: valores.campoDescricao || "",
                id_turma: parseInt(valores.campoTurma, 10),
                questoes: []
            });

            const salvouComSucesso = await salvarDadosNoBanco();
            if (salvouComSucesso) {
                mostrarAlerta("Conteúdo criado com sucesso!", () => mostrarConteudos());
            } else {
                state.conteudos.pop();
                mostrarAlerta("Não foi possível salvar o conteúdo. Tente novamente.");
            }
        }
    );
}

export function excluirConteudo(conteudoId) {
    mostrarConfirmacao("Deseja excluir este conteúdo e todas as suas questões?", () => {
        state.conteudos = state.conteudos.filter(c => c.id !== conteudoId);
        salvarDadosNoBanco();
        mostrarConteudos();
    });
}

export function verQuestoes(conteudoId) {
    const conteudoAtual = state.conteudos.find(c => c.id === conteudoId);
    if (!conteudoAtual) return;

    pageTitle.textContent = conteudoAtual.titulo.toUpperCase();

    contentArea.innerHTML = `
        <div style="grid-column:1/-1; display: flex; flex-direction: column; align-items: flex-start; width: 100%; max-width: 1000px; margin: 0 auto; padding: 20px;">
            
            <!-- Botão Voltar -->
            <div style="margin-bottom: 20px;">
                <button class="action-button btn-muted" onclick="mostrarConteudos()" style="font-size: 15px; padding: 10px 24px; border-radius: 20px;">Voltar</button>
            </div>

            <!-- Sistema de Abas Inferiores / Superiores [QUESTÕES] | [MATERIAL] -->
            <div style="display: flex; gap: 12px; margin-bottom: 25px; width: 100%;">
                <button id="tabQuestoes" onclick="alternarAbaEditor('questoes', ${conteudoId})" style="padding: 12px 28px; border-radius: 20px; font-weight: 800; cursor: pointer; border: none; font-size: 15px; transition: all 0.2s;">Questões</button>
                <button id="tabMaterial" onclick="alternarAbaEditor('material', ${conteudoId})" style="padding: 12px 28px; border-radius: 20px; font-weight: 800; cursor: pointer; border: none; font-size: 15px; transition: all 0.2s;">Material</button>
            </div>

            <!-- Área Central (Workspace Dinâmico) -->
            <div id="editorWorkspace" style="width: 100%;"></div>
        </div>
    `;
    
    // Inicializa abrindo a aba de Questões por padrão
    window.alternarAbaEditor('questoes', conteudoId);
}

// Função global para alternar o estado visual e o conteúdo das abas
window.alternarAbaEditor = function(aba, conteudoId) {
    const conteudo = state.conteudos.find(c => c.id === conteudoId);
    const workspace = document.getElementById("editorWorkspace");
    const btnQ = document.getElementById("tabQuestoes");
    const btnM = document.getElementById("tabMaterial");

    if (aba === 'questoes') {
        workspace.innerHTML = `
            <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
                <button class="action-button" onclick="abrirFormQuestao(${conteudoId})" style="font-size: 15px; padding: 12px 24px; border-radius: 20px;">+ Nova Questão</button>
            </div>
            <div id="listaQuestoes" style="width: 100%;"></div>
        `;
        renderizarQuestoes(conteudo);
        
        // Estilo Aba Ativa (Questões)
        btnQ.style.background = "var(--primary-color)";
        btnQ.style.color = "#ffffff";
        btnQ.style.borderBottom = "4px solid var(--primary-hover)";
        
        // Estilo Aba Inativa (Material)
        btnM.style.background = "var(--container-bg)";
        btnM.style.color = "var(--text-color)";
        btnM.style.border = "2px solid var(--border-color)";
        btnM.style.borderBottom = "4px solid var(--border-color)";
    } else {
        const textoMaterial = conteudo.materialTexto || "";
        
        // Layout do Painel "Material" (Inspiração Canva)
        workspace.innerHTML = `
            <div class="text-card" style="background: var(--primary-color); border: none; border-radius: 24px; padding: 30px; display: flex; flex-direction: column; gap: 20px; box-shadow: 0 8px 0px rgba(0,0,0,0.15);">
                <h3 style="color: #ffffff; font-size: 20px; font-weight: 800;">Editor de Material da Aula</h3>
                
                <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                    <!-- Área de Texto / Editor Esquerdo -->
                    <textarea id="inputMaterialTexto" placeholder="Escreva seu conteúdo...." style="flex: 2; min-height: 300px; padding: 20px; border-radius: 16px; border: none; background: var(--container-bg); color: var(--text-color); font-size: 16px; font-family: inherit; resize: vertical; outline: none; font-weight: 600; line-height: 1.5;">${textoMaterial}</textarea>
                    
                    <!-- Bloco de Mídia / Exemplo Direito (Estilo Canva) -->
                    <div style="flex: 1; min-height: 300px; background: #689f38; border-radius: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #ffffff; font-weight: 800; gap: 10px; border: 3px dashed rgba(255,255,255,0.7); cursor: pointer; text-align: center; padding: 20px;" onclick="alterarImagemMaterial(${conteudoId})">
                        <span style="font-size: 36px;">🖼️</span>
                        <span style="font-size: 18px; letter-spacing: 1px;">IMAGEM...</span>
                        <span style="font-size: 13px; opacity: 0.9; letter-spacing: 0.5px;">DE EXEMPLO</span>
                    </div>
                </div>

                <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
                    <button class="action-button" onclick="salvarMaterial(${conteudoId})" style="background: var(--container-bg); color: var(--primary-color); font-size: 16px; padding: 12px 28px; border-radius: 20px; border-bottom: 4px solid #cccccc;">Salvar Material</button>
                </div>
            </div>
        `;
        
        // Estilo Aba Ativa (Material)
        btnM.style.background = "var(--primary-color)";
        btnM.style.color = "#ffffff";
        btnM.style.borderBottom = "4px solid var(--primary-hover)";
        
        // Estilo Aba Inativa (Questões)
        btnQ.style.background = "var(--container-bg)";
        btnQ.style.color = "var(--text-color)";
        btnQ.style.border = "2px solid var(--border-color)";
        btnQ.style.borderBottom = "4px solid var(--border-color)";
    }
}

// Salva o texto livre digitado pelo professor no estado e banco
window.salvarMaterial = function(conteudoId) {
    const conteudo = state.conteudos.find(c => c.id === conteudoId);
    if (conteudo) {
        conteudo.materialTexto = document.getElementById("inputMaterialTexto").value;
        salvarDadosNoBanco();
        mostrarAlerta("Material da aula salvo com sucesso!");
    }
}

window.alterarImagemMaterial = function(conteudoId) {
    mostrarAlerta("Módulo de upload de imagens ilustrativas pronto para expansão.");
}

// Alterna entre o painel de Questões e o Editor de Material
window.alternarAbaEditor = function(aba, conteudoId) {
    const conteudo = state.conteudos.find(c => c.id === conteudoId);
    const workspace = document.getElementById("editorWorkspace");
    const btnQ = document.getElementById("tabQuestoes");
    const btnM = document.getElementById("tabMaterial");

    if (aba === 'questoes') {
        workspace.innerHTML = `
            <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
                <button class="action-button" onclick="abrirFormQuestao(${conteudoId})" style="font-size: 16px; padding: 12px 24px;">+ Nova Questão</button>
            </div>
            <div id="listaQuestoes" style="width: 100%;"></div>
        `;
        renderizarQuestoes(conteudo);
        
        btnQ.style.background = "var(--primary-color)";
        btnQ.style.color = "#ffffff";
        btnQ.style.border = "none";
        
        btnM.style.background = "var(--container-bg)";
        btnM.style.color = "var(--text-color)";
        btnM.style.border = "2px solid var(--border-color)";
    } else {
        const textoMaterial = conteudo.materialTexto || "";
        const Arquivo = conteudo.arquivoTexto || "";
        workspace.innerHTML = `
            <div class="text-card" style="background: var(--primary-color); border: none; border-radius: 24px; padding: 30px; display: flex; flex-direction: column; gap: 20px; box-shadow: 0 8px 0px rgba(0,0,0,0.15);">
                <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                    <textarea id="inputMaterialTexto" placeholder="Digite o seu conteúdo aqui" 
                    style=
                    "flex: 2;
                     min-height: 500px;
                     min-width: 900px;
                     padding: 20px;
                     border-radius: 16px;
                     border: none;
                     background: var(--container-bg);
                     color: var(--text-color);
                     font-size: 16px;
                     font-family: inherit;
                     resize: vertical;
                     outline: none;
                     font-weight: 600;">${textoMaterial}</textarea>
                </div>
                <h4>O campo acima aceita texto e imagens do tipo JPG, PNG e GIF de até 5MB</h4>
                <h3>Material Adicional (PDF, DOCX, Imagens)</h3>
                <div style="display: flex; flex-direction: column; gap: 10px; width: 100%;">
                    ${Arquivo ? `<p style="color: var(--primary); font-weight: bold;">Arquivo atual: <a href="${Arquivo}" target="_blank" style="color: #3498db; text-decoration: underline;">Visualizar / Baixar Arquivo Anexado</a></p>` : `<p style="color: var(--text-secondary);">Nenhum arquivo anexado ainda.</p>`}
                    
                    <input type="file" id="inputArquivo" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.png" 
                    style="
                     padding: 15px;
                     border-radius: 12px;
                     background: var(--bg-color);
                     color: var(--text-color);
                     font-size: 16px;
                     font-family: inherit;
                     cursor: pointer;
                     font-weight: 600;">
                </div>

                <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
                    <button class="action-button" onclick="salvarMaterial(${conteudoId})" style="background: var(--container-bg); color: var(--primary-color); font-size: 16px; padding: 12px 28px;">Salvar Alterações</button>
                </div>
            </div>
        `;
        
        btnM.style.background = "var(--primary-color)";
        btnM.style.color = "#ffffff";
        btnM.style.border = "none";
        
        btnQ.style.background = "var(--container-bg)";
        btnQ.style.color = "var(--text-color)";
        btnQ.style.border = "2px solid var(--border-color)";
    }
}

window.salvarMaterial = async function(conteudoId) {
    const conteudo = state.conteudos.find(c => c.id === conteudoId);
    if (!conteudo) return;

    // 1. Salva o texto digitado no estado
    conteudo.materialTexto = document.getElementById("inputMaterialTexto").value;
    
    // 2. Verifica se o professor selecionou um arquivo para upload
    const inputArquivo = document.getElementById("inputArquivo");
    const arquivo = inputArquivo.files[0];

    if (arquivo) {
        // Prepara o "pacote" FormData para enviar o arquivo pesado
        let dados = new FormData();
        dados.append('arquivo', arquivo);
        dados.append('id_conteudo', conteudoId);

        try {
            mostrarAlerta("Fazendo upload do arquivo, aguarde...");
            
            // Envia para a rota do Flask
            const resposta = await fetch('/salvar_material', {
                method: 'POST',
                body: dados
            });
            
            const resultado = await resposta.json();
            
            if (resposta.ok) {
                // Salva o caminho gerado pelo Python no estado do JavaScript
                conteudo.arquivo = resultado.caminho;
                
                // Salva o restante (como o materialTexto) na rota principal
                await salvarDadosNoBanco();
                fecharOverlay(); // Fecha o alerta de "aguarde"
                mostrarAlerta("Material e arquivo salvos com sucesso!");
                alternarAbaEditor('material', conteudoId); // Recarrega a aba para exibir o link do arquivo
            } else {
                fecharOverlay();
                mostrarAlerta("Erro ao salvar arquivo: " + (resultado.erro || "Desconhecido"));
            }
        } catch (erro) {
            console.error(erro);
            fecharOverlay();
            mostrarAlerta("Erro de conexão ao enviar o arquivo.");
        }
    } else {
        // Se não tem arquivo selecionado, apenas salva os textos normalmente
        await salvarDadosNoBanco();
        mostrarAlerta("Material salvo com sucesso!");
    }
}

// Renderiza a lista de questões no painel de Questões
export function renderizarQuestoes(conteudoAtual) {
    const lista = document.getElementById("listaQuestoes");
    if (!lista) return;
    const questoes = conteudoAtual.questoes || [];

    if (questoes.length === 0) {
        lista.innerHTML = `
            <div class="text-card" style="text-align:center; padding: 40px; cursor: pointer;" onclick="abrirFormQuestao(${conteudoAtual.id})">
                <div style="font-size: 48px; margin-bottom: 15px;"></div>
                <h3>Nenhuma questão cadastrada</h3>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">Comece adicionando sua primeira questão!</p>
                <button class="action-button" onclick="abrirFormQuestao(${conteudoAtual.id})">Adicionar Questão</button>
            </div>
        `;
        return;
    }
// Renderiza cada questão com base no tipo e nas alternativas
    lista.innerHTML = questoes.map((q, idx) => {
        let tipoDisplay = '';
        let icone = '';
        let corTipo = 'var(--primary)';
        
        switch(q.tipo) {
            case 'multipla_escolha':
                tipoDisplay = 'Múltipla Escolha';
                icone = '';
                corTipo = '#3498db';
                break;
            case 'aberta':
                tipoDisplay = 'Questão Aberta';
                icone = '';
                corTipo = '#2ecc71';
                break;
            default:
                tipoDisplay = 'Dissertativa';
                icone = '';
                corTipo = '#95a5a6';
        }
// Renderiza as alternativas se a questão for de múltipla escolha
        let detalhes = '';
        if (q.tipo === 'multipla_escolha' && q.alternativas) {
            const alternativasHtml = q.alternativas.map((alt, i) => {
                const letra = String.fromCharCode(65 + i);
                return `
                    <div style="display: flex; align-items: center; gap: 10px; padding: 5px 10px; margin: 3px 0; 
                                background: ${alt.correta ? 'rgba(46, 204, 113, 0.15)' : 'transparent'};
                                border-radius: 4px; border-left: ${alt.correta ? '3px solid #2ecc71' : '3px solid transparent'};">
                        <span style="font-weight: bold; color: var(--primary); min-width: 25px;">${letra}.</span>
                        <span>${alt.texto}</span>
                        ${alt.correta ? '<span style="margin-left: auto; color: #2ecc71;">Correta</span>' : ''}
                    </div>
                `;
            }).join('');
            
            detalhes = `
                <div style="margin-top: 12px; background: var(--bg-secondary); padding: 12px; border-radius: 8px;">
                    <div style="font-size: 0.9em; font-weight: bold; margin-bottom: 8px; color: var(--text-secondary);">Alternativas:</div>
                    ${alternativasHtml}
                </div>
            `;
        }

        return `
        <div class="text-card" style="margin-bottom: 15px; border-left: 4px solid ${corTipo};">
            <div style="display:flex; justify-content:space-between; gap: 15px;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 10px;">
                        <span style="font-weight: bold; color: var(--primary); font-size: 1.1em;">
                            Questão ${idx + 1}
                        </span>
                        <span style="background: ${corTipo}; color: white; padding: 2px 12px; border-radius: 12px; font-size: 0.8em;">
                            ${icone} ${tipoDisplay}
                        </span>
                    </div>
                    <div style="font-size: 1.05em; line-height: 1.6; margin-bottom: 5px;">${q.enunciado}</div>
                    ${detalhes}
                </div>
                <div style="display:flex;flex-direction:column;gap:6px; min-width: 40px;">
                    <button class="action-button" onclick="editarQuestao(${conteudoAtual.id},${q.id})" style="font-size: 0.9em;"></button>
                    <button class="action-button btn-danger" onclick="excluirQuestao(${conteudoAtual.id},${q.id})" style="font-size: 0.9em;">🗑️</button>
                </div>
            </div>
        </div>
    `}).join("");
}

// Função para abrir o formulário de criação/edição de questão
export function abrirFormQuestao(conteudoId, questaoId = null) {
    // Fecha qualquer overlay aberto antes de abrir um novo
    fecharFormQuestao();
     
    const conteudo = state.conteudos.find(c => c.id === conteudoId);
    const questao = questaoId ? conteudo.questoes.find(q => q.id === questaoId) : null;
    
    // Criar overlay - Fundo semi-transparente (escurecido)
    const overlay = document.createElement('div');
    overlay.id = 'questaoOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: flex-start;
        z-index: 9999;
        padding: 30px 20px;
        overflow-y: auto;
        animation: fadeIn 0.3s ease;
    `;

    // Container principal - Fundo branco
    const modal = document.createElement('div');
    modal.style.cssText = `
        background-color: #ffffff;
        max-width: 800px;
        width: 100%;
        padding: 30px;
        margin: 20px auto;
        animation: slideUp 0.3s ease;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    `;
// Define o tipo atual da questão (multipla_escolha, aberta, etc.) com base na questão existente ou padrão
    const tipoAtual = questao ? questao.tipo : 'multipla_escolha';
// Define o enunciado atual da questão com base na questão existente ou vazio
    modal.innerHTML = `
        <style>
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            
            .form-group { margin-bottom: 24px; }
            .form-label { 
                display: block; 
                font-weight: 600; 
                margin-bottom: 8px; 
                color: #2d3436;
                font-size: 0.95em;
            }
            .form-input, .form-textarea, .form-select {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid #2c88c5;
                border-radius: 8px;
                font-size: 1em;
                background: #2d3436;
                color: #2d3436;
                transition: all 0.3s ease;
                box-sizing: border-box;
                font-family: inherit;
            }
            .form-input:focus, .form-textarea:focus, .form-select:focus {
                outline: none;
                border-color: #3498db;
                box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
            }
            .form-textarea { min-height: 100px; resize: vertical; }
            
            .tipo-options {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 12px;
                margin-top: 5px;
            }
            .tipo-option {
                padding: 16px;
                border: 2px solid #dfe6e9;
                border-radius: 10px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
                background: #f8f9fa;
                user-select: none;
            }
            .tipo-option:hover { 
                border-color: #3498db;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .tipo-option.selected {
                border-color: #3498db;
                background: rgba(52, 152, 219, 0.08);
                box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.15);
            }
            .tipo-option .icon { font-size: 32px; display: block; margin-bottom: 8px; }
            .tipo-option .label { font-size: 0.95em; font-weight: 600; color: #2d3436; }
            .tipo-option .desc { font-size: 0.8em; color: #636e72; margin-top: 4px; }
            
            .alternativas-container {
                background: #f8f9fa;
                padding: 16px;
                border-radius: 10px;
                margin-top: 8px;
                border: 2px solid #dfe6e9;
            }
            .alternativa-row {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 8px;
                padding: 4px;
                border-radius: 6px;
                transition: background 0.3s ease;
            }
            .alternativa-row:last-child { margin-bottom: 0; }
            .alternativa-row .letra {
                font-weight: 700;
                color: #3498db;
                min-width: 28px;
                font-size: 0.95em;
            }
            .alternativa-row input {
                flex: 1;
                padding: 8px 12px;
                border: 2px solid #dfe6e9;
                border-radius: 6px;
                background: #ffffff;
                color: #2d3436;
                font-size: 0.95em;
                transition: all 0.3s ease;
            }
            .alternativa-row input:focus {
                outline: none;
                border-color: #3498db;
            }
            .alternativa-row input.correta {
                border-color: #2ecc71;
                background: rgba(46, 204, 113, 0.05);
            }
            .btn-correta {
                padding: 6px 12px;
                border: 2px solid #dfe6e9;
                border-radius: 6px;
                background: #ffffff;
                cursor: pointer;
                transition: all 0.3s ease;
                color: #636e72;
                font-weight: 700;
                min-width: 36px;
                font-size: 0.9em;
            }
            .btn-correta:hover { 
                border-color: #3498db;
                background: #f8f9fa;
            }
            .btn-correta.ativa {
                background: #2ecc71;
                border-color: #2ecc71;
                color: white;
                box-shadow: 0 0 0 3px rgba(46, 204, 113, 0.2);
            }
            .btn-correta.ativa:hover { background: #27ae60; }
            
            .btn-remover-alternativa {
                padding: 4px 10px;
                border: 2px solid #e74c3c;
                border-radius: 6px;
                background: transparent;
                color: #e74c3c;
                cursor: pointer;
                font-weight: 700;
                font-size: 0.85em;
                transition: all 0.3s ease;
                min-width: 32px;
                opacity: 0.7;
            }
            .btn-remover-alternativa:hover {
                background: #e74c3c;
                color: white;
                opacity: 1;
                transform: scale(1.05);
            }
            .btn-remover-alternativa:disabled {
                opacity: 0.3;
                cursor: not-allowed;
                transform: none;
            }
            .btn-remover-alternativa:disabled:hover {
                background: transparent;
                color: #e74c3c;
            }
            
            .btn-add-alternativa {
                padding: 10px 16px;
                border: 2px dashed #dfe6e9;
                border-radius: 8px;
                background: transparent;
                color: #636e72;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s ease;
                margin-top: 12px;
                width: 100%;
                font-size: 0.95em;
            }
            .btn-add-alternativa:hover {
                border-color: #3498db;
                color: #3498db;
                background: rgba(52, 152, 219, 0.05);
            }
            
            .help-text {
                font-size: 0.85em;
                color: #636e72;
                margin-top: 8px;
                padding: 8px 12px;
                background: #f8f9fa;
                border-radius: 6px;
                border-left: 3px solid #3498db;
            }
            
            .form-actions {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 2px solid #dfe6e9;
            }
            .btn-cancel {
                padding: 12px 28px;
                border: 2px solid #dfe6e9;
                border-radius: 8px;
                background: transparent;
                color: #636e72;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s ease;
                font-size: 0.95em;
            }
            .btn-cancel:hover { 
                background: #f8f9fa;
                border-color: #636e72;
            }
            .btn-save {
                padding: 12px 32px;
                border: none;
                border-radius: 8px;
                background: #3498db;
                color: white;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s ease;
                font-size: 0.95em;
            }
            .btn-save:hover { 
                background: #2980b9;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 28px;
                padding-bottom: 16px;
                border-bottom: 2px solid #dfe6e9;
            }
            .modal-title {
                font-size: 1.5em;
                font-weight: 700;
                color: #2d3436;
                margin: 0;
            }
            .modal-close {
                background: none;
                border: none;
                font-size: 28px;
                cursor: pointer;
                color: #636e72;
                transition: all 0.3s ease;
                padding: 0 8px;
                line-height: 1;
            }
            .modal-close:hover {
                color: #2d3436;
                transform: rotate(90deg);
            }
        </style>

        <div class="modal-header">
            <h2 class="modal-title">
                ${questaoId ? 'Editar Questão' : 'Nova Questão'}
            </h2>
            <button class="modal-close" id="btnFecharModal">✕</button>
        </div>

        <div class="form-group">
            <label class="form-label">Enunciado da Questão</label>
            <textarea class="form-textarea" id="formEnunciado" placeholder="Digite o enunciado da questão...">${questao ? questao.enunciado : ''}</textarea>
        </div>

        <div class="form-group">
            <label class="form-label">Tipo de Questão</label>
            <div class="tipo-options" id="tipoOptions">
                <div class="tipo-option ${tipoAtual === 'aberta' ? 'selected' : ''}" data-tipo="aberta">
                    <span class="icon"></span>
                    <div class="label">Aberta</div>
                    <div class="desc">Resposta longa</div>
                </div>
                <div class="tipo-option ${tipoAtual === 'multipla_escolha' ? 'selected' : ''}" data-tipo="multipla_escolha">
                    <span class="icon"></span>
                    <div class="label">Múltipla Escolha</div>
                    <div class="desc">Escolha a correta</div>
                </div>
            </div>
        </div>

        <div id="alternativasContainer" style="display: ${tipoAtual === 'multipla_escolha' ? 'block' : 'none'};">
            <div class="form-group">
                <label class="form-label">Alternativas</label>
                <div class="alternativas-container" id="alternativasList">
                    ${questao && questao.alternativas ? questao.alternativas.map((alt, idx) => `
                        <div class="alternativa-row">
                            <span class="letra">${String.fromCharCode(65 + idx)}.</span>
                            <input type="text" class="alternativa-input ${alt.correta ? 'correta' : ''}" 
                                   value="${alt.texto}" placeholder="Digite a alternativa...">
                            <button class="btn-correta ${alt.correta ? 'ativa' : ''}" onclick="marcarCorreta(this)">✓</button>
                            <button class="btn-remover-alternativa" onclick="removerAlternativaUI(this)" ${questao.alternativas.length <= 2 ? 'disabled' : ''}>✕</button>
                        </div>
                    `).join('') : `
                        <div class="alternativa-row">
                            <span class="letra">A.</span>
                            <input type="text" class="alternativa-input" placeholder="Digite a alternativa A...">
                            <button class="btn-correta" onclick="marcarCorreta(this)">✓</button>
                            <button class="btn-remover-alternativa" disabled>✕</button>
                        </div>
                        <div class="alternativa-row">
                            <span class="letra">B.</span>
                            <input type="text" class="alternativa-input" placeholder="Digite a alternativa B...">
                            <button class="btn-correta" onclick="marcarCorreta(this)">✓</button>
                            <button class="btn-remover-alternativa" disabled>✕</button>
                        </div>
                        <div class="alternativa-row">
                            <span class="letra">C.</span>
                            <input type="text" class="alternativa-input" placeholder="Digite a alternativa C...">
                            <button class="btn-correta" onclick="marcarCorreta(this)">✓</button>
                            <button class="btn-remover-alternativa" onclick="removerAlternativaUI(this)">✕</button>
                        </div>
                        <div class="alternativa-row">
                            <span class="letra">D.</span>
                            <input type="text" class="alternativa-input" placeholder="Digite a alternativa D...">
                            <button class="btn-correta" onclick="marcarCorreta(this)">✓</button>
                            <button class="btn-remover-alternativa" onclick="removerAlternativaUI(this)">✕</button>
                        </div>
                    `}
                </div>
                <button class="btn-add-alternativa" onclick="adicionarAlternativaUI()">Adicionar Alternativa</button>
                <div class="help-text">Clique no ✓ para marcar a alternativa correta | Mínimo de 2 alternativas</div>
            </div>
        </div>

        <div class="form-actions">
            <button class="btn-cancel" id="btnCancelar">Cancelar</button>
            <button class="btn-save" onclick="salvarQuestaoUI(${conteudoId}, ${questaoId || 'null'})">💾 Salvar Questão</button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    overlayAberto = overlay;

    // Adicionar eventos de fechamento
    const btnFechar = modal.querySelector('#btnFecharModal');
    const btnCancelar = modal.querySelector('#btnCancelar');
    
    btnFechar.addEventListener('click', fecharFormQuestao);
    btnCancelar.addEventListener('click', fecharFormQuestao);

    // Fechar ao clicar fora do modal (no overlay escurecido)
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            fecharFormQuestao();
        }
    });

    // Adicionar eventos dos tipos de questão
    const tipoOptions = modal.querySelectorAll('.tipo-option');
    tipoOptions.forEach(opt => {
        opt.addEventListener('click', function() {
            tipoOptions.forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            const tipo = this.dataset.tipo;
            const container = document.getElementById('alternativasContainer');
            container.style.display = tipo === 'multipla_escolha' ? 'block' : 'none';
        });
    });

    // Tecla ESC para fechar
    const escHandler = function(e) {
        if (e.key === 'Escape') {
            fecharFormQuestao();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

// Função para fechar o overlay
export function fecharFormQuestao() {
    if (overlayAberto) {
        overlayAberto.remove();
        overlayAberto = null;
    }
    const overlayExistente = document.getElementById('questaoOverlay');
    if (overlayExistente) {
        overlayExistente.remove();
    }
}

// Funções globais para UI
window.marcarCorreta = function(btn) {
    const row = btn.closest('.alternativa-row');
    const container = row.closest('#alternativasList');
    container.querySelectorAll('.btn-correta').forEach(b => b.classList.remove('ativa'));
    container.querySelectorAll('.alternativa-input').forEach(inp => inp.classList.remove('correta'));
    btn.classList.add('ativa');
    row.querySelector('.alternativa-input').classList.add('correta');
};

window.adicionarAlternativaUI = function() {
    const container = document.getElementById('alternativasList');
    const rows = container.querySelectorAll('.alternativa-row');
    const letra = String.fromCharCode(65 + rows.length);
    const row = document.createElement('div');
    row.className = 'alternativa-row';
    row.innerHTML = `
        <span class="letra">${letra}.</span>
        <input type="text" class="alternativa-input" placeholder="Digite a alternativa ${letra}...">
        <button class="btn-correta" onclick="marcarCorreta(this)">✓</button>
        <button class="btn-remover-alternativa" onclick="removerAlternativaUI(this)">✕</button>
    `;
    container.appendChild(row);
    atualizarBotoesRemover();
};

window.removerAlternativaUI = function(btn) {
    const row = btn.closest('.alternativa-row');
    const container = document.getElementById('alternativasList');
    const rows = container.querySelectorAll('.alternativa-row');
    
    if (rows.length <= 2) {
        mostrarAlerta('É necessário ter pelo menos 2 alternativas.');
        return;
    }
    
    row.remove();
    
    const novasRows = container.querySelectorAll('.alternativa-row');
    novasRows.forEach((row, index) => {
        const letraSpan = row.querySelector('.letra');
        letraSpan.textContent = String.fromCharCode(65 + index) + '.';
    });
    
    atualizarBotoesRemover();
};

function atualizarBotoesRemover() {
    const container = document.getElementById('alternativasList');
    if (!container) return;
    
    const rows = container.querySelectorAll('.alternativa-row');
    const botoesRemover = container.querySelectorAll('.btn-remover-alternativa');
    
    botoesRemover.forEach((btn) => {
        btn.disabled = rows.length <= 2;
    });
}

window.fecharFormQuestao = fecharFormQuestao;

window.salvarQuestaoUI = function(conteudoId, questaoId) {
    const enunciado = document.getElementById('formEnunciado').value.trim();
    
    if (!enunciado) {
        mostrarAlerta('Por favor, digite o enunciado da questão.');
        return;
    }

    const tipoOption = document.querySelector('.tipo-option.selected');
    const tipo = tipoOption ? tipoOption.dataset.tipo : 'dissertativa';

    const valores = {
        campoEnunciado: enunciado,
        campoTipo: tipo
    };

    if (tipo === 'multipla_escolha') {
        const inputs = document.querySelectorAll('.alternativa-input');
        const alternativas = Array.from(inputs).map(inp => inp.value.trim()).filter(t => t);
        
        if (alternativas.length < 2) {
            mostrarAlerta('Adicione pelo menos 2 alternativas.');
            return;
        }

        const corretaBtn = document.querySelector('.btn-correta.ativa');
        if (!corretaBtn) {
            mostrarAlerta('Marque qual alternativa é a correta clicando no ✓.');
            return;
        }

        const indexCorreta = Array.from(document.querySelectorAll('.btn-correta')).indexOf(corretaBtn);
        
        valores.campoAlternativas = alternativas.join('; ');
        valores.campoCorreta = indexCorreta.toString();
    }

    salvarQuestao(conteudoId, questaoId, valores);
    fecharFormQuestao();
};

export function salvarQuestao(conteudoId, questaoId, valores) {
    const conteudo = state.conteudos.find(c => c.id === conteudoId);
    
    const novaQuestao = {
        id: questaoId || (conteudo.questoes.reduce((m, q) => Math.max(m, q.id || 0), 0) + 1),
        enunciado: valores.campoEnunciado,
        tipo: valores.campoTipo || "dissertativa"
    };

    if (novaQuestao.tipo === 'multipla_escolha') {
        const alternativasTexto = valores.campoAlternativas.split(';').map(s => s.trim()).filter(s => s);
        const indiceCorreta = parseInt(valores.campoCorreta);
        
        novaQuestao.alternativas = alternativasTexto.map((texto, index) => ({
            texto: texto,
            correta: index === indiceCorreta
        }));
    }

    if (questaoId) {
        const index = conteudo.questoes.findIndex(q => q.id === questaoId);
        if (index !== -1) {
            const idOriginal = conteudo.questoes[index].id;
            conteudo.questoes[index] = { ...novaQuestao, id: idOriginal };
        }
    } else {
        conteudo.questoes.push(novaQuestao);
    }

    salvarDadosNoBanco();
    verQuestoes(conteudoId);
    mostrarAlerta('Questão salva com sucesso!');
}

export function editarQuestao(conteudoId, questaoId) {
    abrirFormQuestao(conteudoId, questaoId);
}


// Funções stub para compatibilidade
export function atualizarCamposTipo() {}
export function adicionarAlternativa() {}
export function removerAlternativa() {}
export function adicionarItemColuna() {}
export function removerItemColuna() {}