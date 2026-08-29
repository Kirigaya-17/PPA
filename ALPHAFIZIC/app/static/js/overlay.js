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

    const camposHtml = campos.map(c => `
        <div style="margin-bottom:14px;">
            <label style="font-weight:bold;display:block;margin-bottom:6px;">${c.label}</label>
            ${c.tipo === "textarea" 
                ? `<textarea id="${c.id}" rows="3" style="width:100%;padding:8px;border-radius:8px;border:1px solid var(--primary);"></textarea>`
                : `<input type="${c.tipo || 'text'}" id="${c.id}" placeholder="${c.placeholder || ''}" value="${c.valor || ''}" style="width:100%;padding:8px;border-radius:8px;border:1px solid var(--primary);">`
            }
        </div>
    `).join("");

    box.innerHTML = `
        <h3 style="margin:0 0 16px 0;color:var(--primary);">${titulo}</h3>
        ${camposHtml}
        <div style="display:flex;justify-content:flex-end;gap:10px;">
            <button class="action-button btn-muted" id="btnPromptCancelar">Cancelar</button>
            <button class="action-button" id="btnPromptOk">Confirmar</button>
        </div>
    `;
    overlay.appendChild(box);

    document.getElementById("btnPromptOk").onclick = () => {
        const valores = {};
        campos.forEach(c => { valores[c.id] = document.getElementById(c.id).value.trim(); });
        fecharOverlay();
        if (onEnviar) onEnviar(valores);
    };
    document.getElementById("btnPromptCancelar").onclick = fecharOverlay;
}