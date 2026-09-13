/* ==========================================================================
   ui.js
   Componentes visuais reutilizáveis: toasts, mascote, modal, barras de
   progresso, estrelas, estados de carregamento/erro/vazio.
   ========================================================================== */

const UI = (() => {

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function formatNumber(n, casas = 0) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    return Number(n).toLocaleString('pt-BR', { maximumFractionDigits: casas, minimumFractionDigits: 0 });
  }

  // -------------------------------------------------------------
  // MASCOTE — SVG embutido (substitua por arte própria em assets/mascot/)
  // -------------------------------------------------------------
  function mascotSVG(size = 64) {
    return `<img src="static/img/lobopidao.png" width="${size}" height="${size}" class="mascot-image" alt="Mascote: guia da plataforma" role="img">`;
  }
  function mascotBubble(mensagem, { small = false } = {}) {
    return `
    <div class="mascot-bubble ${small ? 'mascot-bubble--small' : ''}">
      <div class="mascot-bubble__avatar">${mascotSVG(small ? 40 : 56)}</div>
      <div class="mascot-bubble__text">${escapeHtml(mensagem)}</div>
    </div>`;
  }

  let floatTimer = null;
  function mascotFloatShow(mensagem, duration = 4200) {
    let holder = document.getElementById('mascot-float');
    if (!holder) {
      holder = document.createElement('div');
      holder.id = 'mascot-float';
      holder.className = 'mascot-float';
      document.body.appendChild(holder);
    }
    holder.innerHTML = mascotBubble(mensagem);
    holder.classList.add('is-visible');
    clearTimeout(floatTimer);
    floatTimer = setTimeout(() => holder.classList.remove('is-visible'), duration);
  }

  // -------------------------------------------------------------
  // TOASTS
  // -------------------------------------------------------------
  function toast(mensagem, tipo = 'info', duration = 3200) {
    let holder = document.getElementById('toast-stack');
    if (!holder) {
      holder = document.createElement('div');
      holder.id = 'toast-stack';
      holder.className = 'toast-stack';
      holder.setAttribute('role', 'status');
      holder.setAttribute('aria-live', 'polite');
      document.body.appendChild(holder);
    }
    const node = document.createElement('div');
    node.className = `toast toast--${tipo}`;
    node.textContent = mensagem;
    holder.appendChild(node);
    requestAnimationFrame(() => node.classList.add('is-visible'));
    setTimeout(() => {
      node.classList.remove('is-visible');
      setTimeout(() => node.remove(), 300);
    }, duration);
  }

  // -------------------------------------------------------------
  // MODAL
  // -------------------------------------------------------------
  function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.remove();
    document.body.classList.remove('modal-open');
  }

  function openModal({ title, bodyHTML, actions = [], variant = '' }) {
    closeModal();
    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal ${variant}" role="dialog" aria-modal="true" aria-label="${escapeHtml(title || '')}">
        <button class="modal__close" aria-label="Fechar">Fechar</button>
        ${title ? `<h3 class="modal__title">${escapeHtml(title)}</h3>` : ''}
        <div class="modal__body">${bodyHTML}</div>
        <div class="modal__actions">
          ${actions.map((a, i) => `<button class="btn ${a.variant || 'btn--ghost'}" data-action-idx="${i}">${escapeHtml(a.label)}</button>`).join('')}
        </div>
      </div>`;
    document.body.appendChild(overlay);
    document.body.classList.add('modal-open');

    overlay.querySelector('.modal__close').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    actions.forEach((a, i) => {
      const btn = overlay.querySelector(`[data-action-idx="${i}"]`);
      btn.addEventListener('click', () => { if (a.onClick) a.onClick(); if (a.closeOnClick !== false) closeModal(); });
    });
    return overlay;
  }

  // -------------------------------------------------------------
  // ESTADOS
  // -------------------------------------------------------------
  function loadingBlock(mensagem = 'Carregando…') {
    return `<div class="state-block state-block--loading"><div class="spinner" aria-hidden="true"></div><p>${escapeHtml(mensagem)}</p></div>`;
  }
  function errorBlock(mensagem = 'Não foi possível carregar seus dados. Verifique sua conexão.') {
    return `<div class="state-block state-block--error"><p>${escapeHtml(mensagem)}</p></div>`;
  }
  function emptyBlock(mensagem = 'Nada por aqui ainda.') {
    return `<div class="state-block state-block--empty"><p>${escapeHtml(mensagem)}</p></div>`;
  }

  // -------------------------------------------------------------
  // BARRAS E SELOS
  // -------------------------------------------------------------
  function xpBar(xpNoNivel, xpParaProximo, nivel) {
    const max = xpParaProximo || Math.max(xpNoNivel, 1);
    const pct = xpParaProximo ? Math.min(100, (xpNoNivel / xpParaProximo) * 100) : 100;
    return `
    <div class="xp-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${xpNoNivel}" aria-label="Progresso de XP no nível ${nivel}">
      <div class="xp-bar__track"><div class="xp-bar__fill" style="width:${pct}%"></div></div>
      <span class="xp-bar__label">${xpParaProximo ? `${formatNumber(xpNoNivel)} / ${formatNumber(xpParaProximo)} XP` : 'Nível máximo'}</span>
    </div>`;
  }

  function progressBar(pct, label) {
    const clamped = Math.max(0, Math.min(100, pct));
    return `
    <div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(clamped)}" ${label ? `aria-label="${escapeHtml(label)}"` : ''}>
      <div class="progress-bar__track"><div class="progress-bar__fill" style="width:${clamped}%"></div></div>
      <span class="progress-bar__label">${Math.round(clamped)}%</span>
    </div>`;
  }

  function starRow(n, max = 3) {
    let out = `<span class="star-row" aria-label="${n} de ${max} estrelas">`;
    for (let i = 1; i <= max; i++) {
      out += `<span class="star ${i <= n ? 'star--filled' : ''}" aria-hidden="true">OK</span>`;
    }
    return out + '</span>';
  }

  function difficultyBadge(dificuldade) {
    const map = { basico: ['Básico', 'badge--basico'], intermediario: ['Intermediário', 'badge--intermediario'], avancado: ['Avançado', 'badge--avancado'] };
    const [label, cls] = map[dificuldade] || ['—', ''];
    return `<span class="badge ${cls}">${label}</span>`;
  }

  function celebrateBurst(container) {
    if (!container) return;
    const layer = document.createElement('div');
    layer.className = 'celebrate-layer';
    const particles = ['+1', 'XP', 'OK', '+'];
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('span');
      p.className = 'celebrate-particle';
      p.textContent = particles[i % particles.length];
      p.style.left = `${Math.random() * 100}%`;
      p.style.animationDelay = `${Math.random() * 0.4}s`;
      p.style.setProperty('--drift', `${(Math.random() * 2 - 1) * 60}px`);
      layer.appendChild(p);
    }
    container.appendChild(layer);
    setTimeout(() => layer.remove(), 1800);
  }

  function feedbackCorrect(mensagemExtra) {
    return `<div class="feedback feedback--correct" role="status"><strong>Correto!</strong>${mensagemExtra ? `<p>${escapeHtml(mensagemExtra)}</p>` : ''}</div>`;
  }
  function feedbackWrong(explicacao) {
    return `<div class="feedback feedback--wrong" role="status"><strong>Quase!</strong>${explicacao ? `<p>${escapeHtml(explicacao)}</p>` : ''}</div>`;
  }

  return {
    escapeHtml, formatNumber, mascotSVG, mascotBubble, mascotFloatShow,
    toast, openModal, closeModal,
    loadingBlock, errorBlock, emptyBlock,
    xpBar, progressBar, starRow, difficultyBadge, celebrateBurst,
    feedbackCorrect, feedbackWrong
  };
})();

window.UI = UI;
