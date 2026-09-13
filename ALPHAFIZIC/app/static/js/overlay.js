export function criarOverlayBase() {
    const existente = document.getElementById("customOverlay");
    if (existente) existente.remove();

    const overlay = document.createElement("div");
    overlay.id = "customOverlay";
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.55); display: flex; align-items: center;
        justify-content: center; z-index: 99999; padding: 20px;
    `;
    document.body.appendChild(overlay);
    return overlay;
}

export function fecharOverlay() {
    const overlay = document.getElementById("customOverlay");
    if (overlay) overlay.remove();
}

export function mostrarAlerta(mensagem, callback) {
    const overlay = criarOverlayBase();
    const box = document.createElement("div");
    box.className = "text-card";
    box.style.maxWidth = "400px";
    box.innerHTML = `
        <p style="margin:0 0 18px 0;line-height:1.4;">${mensagem}</p>
        <div style="display:flex;justify-content:flex-end;">
            <button class="action-button" id="btnAlertaOk">OK</button>
        </div>
    `;
    overlay.appendChild(box);
    document.getElementById("btnAlertaOk").onclick = () => { fecharOverlay(); if (callback) callback(); };
}

export function mostrarConfirmacao(mensagem, onConfirmar) {
    const overlay = criarOverlayBase();
    const box = document.createElement("div");
    box.className = "text-card";
    box.style.maxWidth = "400px";
    box.innerHTML = `
        <p style="margin:0 0 18px 0;line-height:1.4;">${mensagem}</p>
        <div style="display:flex;justify-content:flex-end;gap:10px;">
            <button class="action-button btn-muted" id="btnCancelar">Cancelar</button>
            <button class="action-button btn-danger" id="btnConfirmar">Confirmar</button>
        </div>
    `;
    overlay.appendChild(box);
    document.getElementById("btnConfirmar").onclick = () => { fecharOverlay(); onConfirmar(); };
    document.getElementById("btnCancelar").onclick = fecharOverlay;
}

export function mostrarPrompt(campos, titulo, onEnviar) {
    const overlay = criarOverlayBase();
    const box = document.createElement("div");
    box.className = "text-card";
    box.style.maxWidth = "440px";

    const camposHtml = campos.map(c => {
        if (c.tipo === "textarea") {
            return `
                <div style="margin-bottom:14px;">
                    <label style="font-weight:bold;display:block;margin-bottom:6px;">${c.label}</label>
                    <textarea id="${c.id}" rows="3" style="width:100%;padding:8px;border-radius:8px;border:1px solid var(--primary);">${c.valor || ''}</textarea>
                </div>`;
        }

        if (c.tipo === "turmas") {
            const opcoes = c.opcoes || [];
            const chipsHtml = opcoes.length
                ? opcoes.map(op => `
                    <button type="button" class="turma-chip" data-turma-id="${op.id}"
                        style="padding:6px 14px;border-radius:20px;border:2px solid var(--primary);
                               background:transparent;color:var(--primary);cursor:pointer;font-size:14px;
                               white-space:nowrap;">
                        ${op.nome}
                    </button>`).join("")
                : `<p style="margin:0;color:var(--text-secondary,#888);font-size:14px;">
                       Você ainda não tem nenhuma turma cadastrada. Crie uma turma primeiro.
                   </p>`;

            return `
                <div style="margin-bottom:14px;">
                    <label style="font-weight:bold;display:block;margin-bottom:6px;">${c.label}</label>
                    <div id="${c.id}" class="turma-chip-selector"
                         style="display:flex;flex-wrap:wrap;gap:8px;max-width:100%;">
                        ${chipsHtml}
                    </div>
                </div>`;
        }

        return `
            <div style="margin-bottom:14px;">
                <label style="font-weight:bold;display:block;margin-bottom:6px;">${c.label}</label>
                <input type="${c.tipo || 'text'}" id="${c.id}" placeholder="${c.placeholder || ''}" value="${c.valor || ''}" style="width:100%;padding:8px;border-radius:8px;border:1px solid var(--primary);">
            </div>`;
    }).join("");

    box.innerHTML = `
        <h3 style="margin:0 0 16px 0;color:var(--primary);">${titulo}</h3>
        ${camposHtml}
        <div style="display:flex;justify-content:flex-end;gap:10px;">
            <button class="action-button btn-muted" id="btnPromptCancelar">Cancelar</button>
            <button class="action-button" id="btnPromptOk">Confirmar</button>
        </div>
    `;
    overlay.appendChild(box);

    // Seleção única (estilo "radio") dos chips de turma
    campos.filter(c => c.tipo === "turmas").forEach(c => {
        const wrapper = box.querySelector(`#${c.id}`);
        if (!wrapper) return;
        wrapper.querySelectorAll(".turma-chip").forEach(chip => {
            if (c.valorSelecionado != null && String(c.valorSelecionado) === chip.dataset.turmaId) {
                marcarChipSelecionado(chip);
            }
            chip.addEventListener("click", () => {
                wrapper.querySelectorAll(".turma-chip").forEach(desmarcarChipSelecionado);
                marcarChipSelecionado(chip);
            });
        });
    });

    document.getElementById("btnPromptOk").onclick = () => {
        const valores = {};
        campos.forEach(c => {
            if (c.tipo === "turmas") {
                const wrapper = box.querySelector(`#${c.id}`);
                const selecionado = wrapper ? wrapper.querySelector(".turma-chip.selecionada") : null;
                valores[c.id] = selecionado ? selecionado.dataset.turmaId : null;
            } else {
                valores[c.id] = document.getElementById(c.id).value.trim();
            }
        });
        fecharOverlay();
        if (onEnviar) onEnviar(valores);
    };
    document.getElementById("btnPromptCancelar").onclick = fecharOverlay;
}

function marcarChipSelecionado(chip) {
    chip.classList.add("selecionada");
    chip.style.background = "var(--primary)";
    chip.style.color = "#fff";
}

function desmarcarChipSelecionado(chip) {
    chip.classList.remove("selecionada");
    chip.style.background = "transparent";
    chip.style.color = "var(--primary)";
}