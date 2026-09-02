import { mostrarAlerta } from './overlay.js';
import { state, contentArea, pageTitle, ativarMenu, fazerLogout } from './main.js';

// -----------------------------------------------------------------------
// Escapa HTML antes de qualquer interpolação em innerHTML.
// Corrige uma vulnerabilidade de Stored XSS: nome/bio/contato do usuário
// são dados fornecidos por ele mesmo (via /atualizar-perfil-inline) e
// podiam conter tags/handlers HTML que eram executados quando inseridos
// via innerHTML sem sanitização.
// -----------------------------------------------------------------------
function escapeHtml(valor) {
    const texto = (valor === undefined || valor === null) ? '' : String(valor);
    return texto
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function mostrarPerfil() {
    ativarMenu("perfil");
    pageTitle.textContent = "PERFIL";
    
    // Pega as variáveis globais que estão no <script> do HTML
    const nomeExibicao = escapeHtml((typeof window.nomeDoUsuario !== 'undefined' && window.nomeDoUsuario !== 'None' && window.nomeDoUsuario.trim() !== '') ? window.nomeDoUsuario : 'Professor(a)');
    const emailExibicao = escapeHtml((typeof window.emailDoUsuario !== 'undefined' && window.emailDoUsuario !== 'None' && window.emailDoUsuario.trim() !== '') ? window.emailDoUsuario : 'Sem e-mail');
    const contatoExibicao = escapeHtml((typeof window.contatoDoUsuario !== 'undefined' && window.contatoDoUsuario !== 'None' && window.contatoDoUsuario.trim() !== '') ? window.contatoDoUsuario : 'Sem contato');
    const bioExibicao = escapeHtml((typeof window.bioDoUsuario !== 'undefined' && window.bioDoUsuario !== 'None' && window.bioDoUsuario.trim() !== '') ? window.bioDoUsuario : 'Bem-vindo(a) ao meu perfil!');

    // Calcula total de questões nos conteúdos para a estatística
    const totalQuestoes = state.conteudos.reduce((s, c) => s + (c.questoes || []).length, 0);

    contentArea.innerHTML = `
        <div class="profile-container">
            <div class="profile-card">
                <div class="profile-header">
                    <!-- Foto clicável com ícone padrão -->
                    <div class="profile-avatar" onclick="trocarFoto()" title="Clique para trocar a foto" style="cursor: pointer;">
                        <div id="profileImageContainer" class="avatar-placeholder">
                            👤
                        </div>
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
                                <span class="stat-number">${state.turmas.length}</span>
                                <span class="stat-label">Turmas</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">${state.conteudos.length}</span>
                                <span class="stat-label">Conteúdos</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">${totalQuestoes}</span>
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
                        <button class="action-button logout-btn" style="background:#e74c3c; width: 100%;" onclick="fazerLogout()">🚪 Sair da Conta</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function trocarFoto() {
    const input = document.createElement('input');
    input.type = 'file'; 
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const container = document.getElementById('profileImageContainer');
                // Substitui o emoji 👤 pela imagem que o usuário escolheu
                container.innerHTML = `<img src="${ev.target.result}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                mostrarAlerta('Foto atualizada!');
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

export function editarBioInline() {
    const s = document.getElementById("settingBioSection");
    const bio = escapeHtml(typeof window.bioDoUsuario !== 'undefined' ? window.bioDoUsuario : '');
    s.innerHTML = `
        <form action="/atualizar-perfil-inline" method="POST" style="display:flex;flex-direction:column;gap:10px;margin-top:5px;">
            <input type="hidden" name="csrf_token" value="${obterCsrfToken()}">
            <textarea name="bio" rows="3" style="padding:10px;border-radius:8px;border:1px solid #0739ce;width:100%;resize:none;font-family:Arial,sans-serif;font-size:14px;" required>${bio}</textarea>
            <button type="submit" class="action-button" style="padding:8px 15px;font-size:13px;align-self:flex-start;">Salvar Bio</button>
        </form>`;
}

export function editarEmail() { 
    mostrarAlerta("Para alterar seu e-mail, entre em contato com o suporte."); 
}

export function editarNomeInline() {
    const s = document.getElementById("settingNameSection");
    const nomeAtual = escapeHtml((typeof window.nomeDoUsuario !== 'undefined' && window.nomeDoUsuario !== 'None' && window.nomeDoUsuario !== 'Professor(a)') ? window.nomeDoUsuario : '');
    
    s.innerHTML = `
        <form action="/atualizar-perfil-inline" method="POST" style="display:flex;gap:10px;align-items:center;">
            <input type="hidden" name="csrf_token" value="${obterCsrfToken()}">
            <input type="text" name="nome" value="${nomeAtual}" placeholder="Digite o novo nome..." style="padding:8px;border-radius:8px;border:1px solid #0739ce;flex:1;" required>
            <button type="submit" class="action-button" style="padding:8px 15px;font-size:13px;">Salvar</button>
        </form>`;
}

export function editarContatoInline() {
    const s = document.getElementById("settingContactSection");
    const contatoAtual = escapeHtml((typeof window.contatoDoUsuario !== 'undefined' && window.contatoDoUsuario !== 'None') ? window.contatoDoUsuario : '');
    
    s.innerHTML = `
        <form action="/atualizar-perfil-inline" method="POST" style="display:flex;gap:10px;align-items:center;">
            <input type="hidden" name="csrf_token" value="${obterCsrfToken()}">
            <input type="tel" name="contato" value="${contatoAtual}" placeholder="DDD + Número" style="padding:8px;border-radius:8px;border:1px solid #0739ce;flex:1;" required>
            <button type="submit" class="action-button" style="padding:8px 15px;font-size:13px;">Salvar</button>
        </form>`;
}

export function editarSenhaInline() {
    const s = document.getElementById("settingPasswordSection");
    s.innerHTML = `
        <form action="/atualizar-perfil-inline" method="POST" style="display:flex;gap:10px;align-items:center;">
            <input type="hidden" name="csrf_token" value="${obterCsrfToken()}">
            <input type="password" name="senha" placeholder="Nova senha" style="padding:8px;border-radius:8px;border:1px solid #0739ce;flex:1;" required>
            <button type="submit" class="action-button" style="padding:8px 15px;font-size:13px;">Salvar</button>
        </form>`;
}

function obterCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? escapeHtml(meta.getAttribute('content')) : '';
}