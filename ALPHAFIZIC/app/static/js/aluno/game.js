/* ==========================================================================
   game.js
   Laboratório Elétrico: as 7 fases interativas, com simulações reais em
   Canvas (linhas de campo, vetores, cargas) calculadas com PhysicsCore.
   ========================================================================== */

const PhysicsGame = (() => {
  const COR_POSITIVA = '#ff7a59';
  const COR_NEGATIVA = '#4fd1ff';
  const COR_VETOR = '#8ce8b0';

  let inicioTempo = 0;

  // ------------------------------------------------------------------
  // UTILITÁRIOS DE DESENHO
  // ------------------------------------------------------------------
  function setupCanvas(canvas, cssHeight) {
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.parentElement.clientWidth;
    canvas.style.width = cssWidth + 'px';
    canvas.style.height = cssHeight + 'px';
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, width: cssWidth, height: cssHeight };
  }

  function drawCharge(ctx, x, y, q, r = 24) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    if (q >= 0) { grad.addColorStop(0, '#ffb199'); grad.addColorStop(1, COR_POSITIVA); }
    else { grad.addColorStop(0, '#a6ecff'); grad.addColorStop(1, COR_NEGATIVA); }
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(11,18,32,0.55)';
    ctx.stroke();
    ctx.fillStyle = '#0b1220';
    ctx.font = `bold ${Math.round(r * 1.1)}px 'Space Grotesk', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(q >= 0 ? '+' : '−', x, y + 1);
  }

  function drawArrow(ctx, x1, y1, x2, y2, color, width = 2.4) {
    const headlen = Math.max(6, width * 3.2);
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }

  function formatCarga(q) {
    return `${q >= 0 ? '+' : ''}${q} μC`;
  }

  // Campo resultante (vetor) em (px,py) gerado por um conjunto de cargas.
  // Escala: 100 px = 1 metro. Cargas em microcoulombs.
  function campoResultante(cargas, px, py, escalaPxPorMetro = 100) {
    let ex = 0, ey = 0;
    cargas.forEach((c) => {
      const dx = px - c.x, dy = py - c.y;
      const distPx = Math.hypot(dx, dy) || 1;
      const distM = distPx / escalaPxPorMetro;
      const Qc = PhysicsCore.paraCoulomb(c.q, 'uC');
      const modulo = (PhysicsCore.K * Math.abs(Qc)) / (distM * distM);
      const sinal = c.q >= 0 ? 1 : -1;
      ex += sinal * modulo * (dx / distPx);
      ey += sinal * modulo * (dy / distPx);
    });
    return { ex, ey, modulo: Math.hypot(ex, ey) };
  }

  function potencialResultante(cargas, px, py, escalaPxPorMetro = 100) {
    return cargas.reduce((total, c) => {
      const distPx = Math.hypot(px - c.x, py - c.y) || 1;
      const distM = distPx / escalaPxPorMetro;
      const Qc = PhysicsCore.paraCoulomb(c.q, 'uC');
      return total + (PhysicsCore.K * Qc) / distM;
    }, 0);
  }

  // ------------------------------------------------------------------
  // TELA DE VITÓRIA
  // ------------------------------------------------------------------
  function telaVitoria({ fase, pontuacao, estrelas, tempoGasto, xp }, onContinuar, onRepetir) {
    const mm = String(Math.floor(tempoGasto / 60)).padStart(2, '0');
    const ss = String(tempoGasto % 60).padStart(2, '0');
    return `
    <div class="vitoria">
      <div class="vitoria__mascote">${UI.mascotSVG(80)}</div>
      <h2>Fase concluída!</h2>
      <p class="vitoria__sub">${UI.escapeHtml(fase.titulo)}</p>
      <div class="vitoria__estrelas">${UI.starRow(estrelas)}</div>
      <div class="vitoria__stats">
        <div><span>${UI.formatNumber(pontuacao)}</span><small>Pontuação</small></div>
        <div><span>+${UI.formatNumber(xp)}</span><small>XP ganho</small></div>
        <div><span>${mm}:${ss}</span><small>Tempo</small></div>
      </div>
      <div class="vitoria__acoes">
        <button class="btn btn--ghost" id="btn-repetir-fase">Jogar novamente</button>
        <button class="btn btn--primary" id="btn-continuar-fase">Voltar ao laboratório</button>
      </div>
    </div>`;
  }

  async function finalizarFase(container, fase, pontuacao) {
    const tempoGasto = Math.max(1, Math.round((Date.now() - inicioTempo) / 1000));
    const { estrelas } = await PhysicsProgress.registrarFase(fase.id_fase, {
      pontuacao, pontuacaoMaxima: fase.pontuacao_maxima, xp: fase.xp, tempoGasto
    });
    container.innerHTML = telaVitoria({ fase, pontuacao, estrelas, tempoGasto, xp: fase.xp });
    UI.celebrateBurst(container.querySelector('.vitoria'));
    UI.toast(`+${fase.xp} XP • ${estrelas} estrela(s)`, 'success');
    container.querySelector('#btn-repetir-fase').addEventListener('click', () => iniciarFase(fase.id_fase, container));
  }

  // ------------------------------------------------------------------
  // FASE 1 — Atração ou Repulsão
  // ------------------------------------------------------------------
  function initFaseAtracaoRepulsao(fase, container) {
    const rodadas = [
      { q1: 5, q2: 3 }, { q1: -4, q2: -2 }, { q1: 6, q2: -3 }, { q1: -5, q2: 4 }, { q1: 2, q2: 2 }
    ];
    let indice = 0, acertos = 0;

    function render() {
      const r = rodadas[indice];
      container.innerHTML = `
        <div class="fase-jogo">
          <p class="fase-jogo__objetivo">Rodada ${indice + 1} de ${rodadas.length} — ${fase.objetivo}</p>
          <canvas class="fase-canvas" id="canvas-fase1"></canvas>
          <p class="fase-pergunta">${formatCarga(r.q1)} e ${formatCarga(r.q2)}: essas cargas vão se atrair ou se repelir?</p>
          <div class="fase-opcoes">
            <button class="btn btn--outline" data-resp="atracao">Atração</button>
            <button class="btn btn--outline" data-resp="repulsao">Repulsão</button>
          </div>
          <div id="fase1-feedback"></div>
        </div>`;

      const canvas = container.querySelector('#canvas-fase1');
      const { ctx, width, height } = setupCanvas(canvas, 200);
      const y = height / 2;
      let x1 = width * 0.32, x2 = width * 0.68;

      function desenhar() {
        ctx.clearRect(0, 0, width, height);
        drawCharge(ctx, x1, y, r.q1);
        drawCharge(ctx, x2, y, r.q2);
        ctx.fillStyle = 'rgba(231,236,245,0.7)';
        ctx.font = "13px 'Inter', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText(formatCarga(r.q1), x1, y + 46);
        ctx.fillText(formatCarga(r.q2), x2, y + 46);
      }
      desenhar();

      container.querySelectorAll('[data-resp]').forEach((btn) => {
        btn.addEventListener('click', () => responder(btn.dataset.resp, r, x1, x2, y, ctx, width, height, desenhar));
      });
    }

    function responder(resposta, r, x1, x2, y, ctx, width, height, desenhar) {
      const mesmoSinal = (r.q1 >= 0) === (r.q2 >= 0);
      const correta = mesmoSinal ? 'repulsao' : 'atracao';
      const acertou = resposta === correta;
      if (acertou) acertos++;

      container.querySelectorAll('[data-resp]').forEach((b) => (b.disabled = true));
      const fb = container.querySelector('#fase1-feedback');
      fb.innerHTML = acertou
        ? UI.feedbackCorrect(mesmoSinal ? 'Cargas de mesmo sinal se repelem.' : 'Cargas de sinais opostos se atraem.')
        : UI.feedbackWrong(`A resposta certa é "${correta === 'atracao' ? 'Atração' : 'Repulsão'}". ${mesmoSinal ? 'Cargas de mesmo sinal se repelem.' : 'Cargas de sinais opostos se atraem.'}`);

      // animação simples: aproximar (atração) ou afastar (repulsão)
      let t = 0;
      const alvo = correta === 'atracao' ? (x2 - x1) * 0.28 : -(x2 - x1) * 0.18;
      function anim() {
        t += 0.05;
        const offset = Math.sin(Math.min(t, 1) * Math.PI / 2) * alvo;
        ctx.clearRect(0, 0, width, height);
        drawCharge(ctx, x1 + offset, y, r.q1);
        drawCharge(ctx, x2 - offset, y, r.q2);
        if (t < 1) requestAnimationFrame(anim);
      }
      anim();

      const proximoBtn = document.createElement('button');
      proximoBtn.className = 'btn btn--primary fase-proximo';
      proximoBtn.textContent = indice < rodadas.length - 1 ? 'Próxima rodada' : 'Ver resultado';
      fb.appendChild(proximoBtn);
      proximoBtn.addEventListener('click', () => {
        indice++;
        if (indice < rodadas.length) render();
        else finalizarFase(container, fase, Math.round((acertos / rodadas.length) * fase.pontuacao_maxima));
      });
    }

    render();
  }

  // ------------------------------------------------------------------
  // FASE 2 — Controle da Força
  // ------------------------------------------------------------------
  function initFaseControleForca(fase, container) {
    const alvo = fase.configuracao.forcaAlvo;
    const tolerancia = fase.configuracao.tolerancia;
    let tentativas = 0;

    container.innerHTML = `
      <div class="fase-jogo">
        <p class="fase-jogo__objetivo">${fase.objetivo}</p>
        <canvas class="fase-canvas" id="canvas-fase2"></canvas>
        <div class="controle-grid">
          <label>Q₁ (μC): <span id="val-q1">5</span>
            <input type="range" id="slider-q1" min="1" max="10" step="0.5" value="5"></label>
          <label>Q₂ (μC): <span id="val-q2">5</span>
            <input type="range" id="slider-q2" min="1" max="10" step="0.5" value="5"></label>
          <label>Distância (m): <span id="val-d">0.5</span>
            <input type="range" id="slider-d" min="0.1" max="2" step="0.05" value="0.5"></label>
        </div>
        <div class="controle-status">
          <div>Força atual: <strong id="forca-atual">—</strong> N</div>
          <div>Objetivo: <strong>${alvo} N</strong> (±${Math.round(tolerancia * 100)}%)</div>
        </div>
        <button class="btn btn--primary" id="btn-confirmar-forca">Confirmar</button>
        <div id="fase2-feedback"></div>
      </div>`;

    const canvas = container.querySelector('#canvas-fase2');
    const { ctx, width, height } = setupCanvas(canvas, 190);
    const y = height / 2;
    const sQ1 = container.querySelector('#slider-q1');
    const sQ2 = container.querySelector('#slider-q2');
    const sD = container.querySelector('#slider-d');

    function calcularForca() {
      const q1 = parseFloat(sQ1.value), q2 = parseFloat(sQ2.value), d = parseFloat(sD.value);
      const F = PhysicsCore.calcular('coulomb', { Q1: PhysicsCore.paraCoulomb(q1, 'uC'), Q2: PhysicsCore.paraCoulomb(q2, 'uC'), d });
      return { F, q1, q2, d };
    }

    function redesenhar() {
      const { F, q1, q2, d } = calcularForca();
      container.querySelector('#val-q1').textContent = q1;
      container.querySelector('#val-q2').textContent = q2;
      container.querySelector('#val-d').textContent = d.toFixed(2);
      container.querySelector('#forca-atual').textContent = PhysicsCore.formatoCientifico(F, 2);

      const margem = 50;
      const dispPx = Math.min(width - margem * 2, (d / 2) * (width - margem * 2) / 1 + 40);
      const x1 = width / 2 - dispPx / 2, x2 = width / 2 + dispPx / 2;
      ctx.clearRect(0, 0, width, height);
      drawCharge(ctx, x1, y, q1);
      drawCharge(ctx, x2, y, q2);
      const setaLen = Math.min(40, 10 + F * 2);
      drawArrow(ctx, x1 - 30, y, x1 - 30 - setaLen, y, COR_VETOR);
      drawArrow(ctx, x2 + 30, y, x2 + 30 + setaLen, y, COR_VETOR);
    }
    [sQ1, sQ2, sD].forEach((s) => s.addEventListener('input', redesenhar));
    redesenhar();

    container.querySelector('#btn-confirmar-forca').addEventListener('click', () => {
      tentativas++;
      const { F } = calcularForca();
      const dentroTolerancia = Math.abs(F - alvo) / alvo <= tolerancia;
      const fb = container.querySelector('#fase2-feedback');
      if (dentroTolerancia) {
        const pontuacao = Math.max(60, fase.pontuacao_maxima - (tentativas - 1) * 25);
        fb.innerHTML = UI.feedbackCorrect(`Força alcançada: ${PhysicsCore.formatoCientifico(F, 2)} N.`);
        container.querySelector('#btn-confirmar-forca').disabled = true;
        setTimeout(() => finalizarFase(container, fase, pontuacao), 1400);
      } else {
        fb.innerHTML = UI.feedbackWrong(F > alvo ? 'A força está acima do objetivo — aumente a distância ou diminua as cargas.' : 'A força está abaixo do objetivo — diminua a distância ou aumente as cargas.');
      }
    });
  }

  // ------------------------------------------------------------------
  // FASE 3 — Mapa do Campo
  // ------------------------------------------------------------------
  function initFaseMapaCampo(fase, container) {
    let cargas = [{ x: 0, y: 0, q: 5 }];
    let modo = 1;
    const maxCargas = fase.configuracao.maxCargas || 4;

    container.innerHTML = `
      <div class="fase-jogo">
        <p class="fase-jogo__objetivo">${fase.objetivo}</p>
        <div class="mapa-controles">
          <button class="btn btn--outline is-active" id="btn-modo-pos">+ Carga positiva</button>
          <button class="btn btn--outline" id="btn-modo-neg">− Carga negativa</button>
          <button class="btn btn--ghost" id="btn-limpar-mapa">Limpar</button>
        </div>
        <canvas class="fase-canvas fase-canvas--tall" id="canvas-fase3"></canvas>
        <p class="mapa-dica">Toque no mapa para adicionar uma carga. Toque em uma carga existente para removê-la. Arraste para mover.</p>
        <div class="controle-status"><div>Campo no ponto de prova (○): <strong id="campo-probe">—</strong> N/C</div></div>
        <button class="btn btn--primary" id="btn-concluir-mapa" disabled>Concluir exploração</button>
      </div>`;

    const canvas = container.querySelector('#canvas-fase3');
    const { ctx, width, height } = setupCanvas(canvas, 320);
    const probe = { x: width / 2, y: height / 2 };
    cargas[0].x = width * 0.35; cargas[0].y = height * 0.5;

    function desenhar() {
      ctx.clearRect(0, 0, width, height);
      const passo = 34;
      for (let gx = passo / 2; gx < width; gx += passo) {
        for (let gy = passo / 2; gy < height; gy += passo) {
          if (cargas.some((c) => Math.hypot(c.x - gx, c.y - gy) < 24)) continue;
          const { ex, ey, modulo } = campoResultante(cargas, gx, gy);
          if (modulo < 1) continue;
          const comprimento = Math.min(16, 6 + Math.log10(modulo + 1) * 2);
          const nx = ex / modulo, ny = ey / modulo;
          const alpha = Math.min(0.9, 0.25 + Math.log10(modulo + 1) / 12);
          drawArrow(ctx, gx - nx * comprimento / 2, gy - ny * comprimento / 2, gx + nx * comprimento / 2, gy + ny * comprimento / 2, `rgba(140,232,176,${alpha})`, 1.6);
        }
      }
      cargas.forEach((c) => drawCharge(ctx, c.x, c.y, c.q, 20));
      ctx.beginPath();
      ctx.arc(probe.x, probe.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      const campoProbe = campoResultante(cargas, probe.x, probe.y);
      if (campoProbe.modulo > 0.1) {
        const nx = campoProbe.ex / campoProbe.modulo, ny = campoProbe.ey / campoProbe.modulo;
        drawArrow(ctx, probe.x, probe.y, probe.x + nx * 34, probe.y + ny * 34, '#ffffff', 2.6);
      }
      container.querySelector('#campo-probe').textContent = PhysicsCore.formatoCientifico(campoProbe.modulo, 2);
      container.querySelector('#btn-concluir-mapa').disabled = cargas.length < 2;
    }
    desenhar();

    container.querySelector('#btn-modo-pos').addEventListener('click', (e) => { modo = 1; toggleModo(e.target); });
    container.querySelector('#btn-modo-neg').addEventListener('click', (e) => { modo = -1; toggleModo(e.target); });
    function toggleModo(btn) {
      container.querySelectorAll('.mapa-controles .btn--outline').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
    }
    container.querySelector('#btn-limpar-mapa').addEventListener('click', () => { cargas = []; desenhar(); });

    let arrastando = null;
    function pos(evento) {
      const rect = canvas.getBoundingClientRect();
      const p = evento.touches ? evento.touches[0] : evento;
      return { x: p.clientX - rect.left, y: p.clientY - rect.top };
    }
    canvas.addEventListener('pointerdown', (e) => {
      const p = pos(e);
      const alvo = cargas.find((c) => Math.hypot(c.x - p.x, c.y - p.y) < 24);
      if (alvo) {
        arrastando = alvo;
      } else if (cargas.length < maxCargas) {
        cargas.push({ x: p.x, y: p.y, q: modo * 5 });
        desenhar();
      } else {
        UI.toast(`Máximo de ${maxCargas} cargas nesta fase.`, 'info');
      }
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!arrastando) return;
      const p = pos(e);
      arrastando.x = p.x; arrastando.y = p.y;
      desenhar();
    });
    window.addEventListener('pointerup', () => { arrastando = null; });
    canvas.addEventListener('dblclick', (e) => {
      const p = pos(e);
      const idx = cargas.findIndex((c) => Math.hypot(c.x - p.x, c.y - p.y) < 24);
      if (idx >= 0) { cargas.splice(idx, 1); desenhar(); }
    });

    container.querySelector('#btn-concluir-mapa').addEventListener('click', () => {
      const pontuacao = Math.min(fase.pontuacao_maxima, 60 + cargas.length * 35);
      finalizarFase(container, fase, pontuacao);
    });
  }

  // ------------------------------------------------------------------
  // FASE 4 — Caça ao Potencial
  // ------------------------------------------------------------------
  function initFaseCacaPotencial(fase, container) {
    const totalRodadas = fase.configuracao.rodadas || 4;
    let indice = 0, acertos = 0;

    function gerarRodada() {
      const Q = [4, -3, 6, -5, 8][indice % 5];
      const distancias = [0.2, 0.35, 0.5, 0.7].sort(() => Math.random() - 0.5);
      const pontos = ['A', 'B', 'C', 'D'].map((label, i) => ({
        label, d: distancias[i], v: PhysicsCore.calcular('potencial', { Q: PhysicsCore.paraCoulomb(Q, 'uC'), d: distancias[i] })
      }));
      return { Q, pontos };
    }

    function render() {
      const { Q, pontos } = gerarRodada();
      const maior = pontos.reduce((a, b) => (b.v > a.v ? b : a));
      container.innerHTML = `
        <div class="fase-jogo">
          <p class="fase-jogo__objetivo">Rodada ${indice + 1} de ${totalRodadas} — carga central: ${formatCarga(Q)}</p>
          <canvas class="fase-canvas" id="canvas-fase4"></canvas>
          <p class="fase-pergunta">Qual ponto possui o maior potencial elétrico?</p>
          <div class="fase-opcoes" id="opcoes-potencial">
            ${pontos.map((p) => `<button class="btn btn--outline" data-ponto="${p.label}">${p.label}</button>`).join('')}
          </div>
          <div id="fase4-feedback"></div>
        </div>`;

      const canvas = container.querySelector('#canvas-fase4');
      const { ctx, width, height } = setupCanvas(canvas, 220);
      const cx = width / 2, cy = height / 2;
      const escala = Math.min(width, height) / 2.2;
      ctx.clearRect(0, 0, width, height);
      drawCharge(ctx, cx, cy, Q, 22);
      const angulos = [-100, -20, 100, 200].map((g) => (g * Math.PI) / 180);
      pontos.forEach((p, i) => {
        const r = 40 + p.d * escala;
        const px = cx + Math.cos(angulos[i]) * r, py = cy + Math.sin(angulos[i]) * r;
        p.px = px; p.py = py;
        ctx.beginPath();
        ctx.arc(px, py, 14, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(140,232,176,0.18)';
        ctx.fill();
        ctx.strokeStyle = '#8ce8b0';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#e7ecf5';
        ctx.font = "bold 13px 'Space Grotesk', sans-serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.label, px, py);
      });

      container.querySelectorAll('[data-ponto]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const acertou = btn.dataset.ponto === maior.label;
          if (acertou) acertos++;
          container.querySelectorAll('[data-ponto]').forEach((b) => (b.disabled = true));
          const detalhes = pontos.map((p) => `${p.label}: ${PhysicsCore.formatoCientifico(p.v, 2)} V`).join(' · ');
          const fb = container.querySelector('#fase4-feedback');
          fb.innerHTML = acertou
            ? UI.feedbackCorrect(detalhes)
            : UI.feedbackWrong(`O ponto de maior potencial era ${maior.label}. ${detalhes}`);
          const prox = document.createElement('button');
          prox.className = 'btn btn--primary fase-proximo';
          prox.textContent = indice < totalRodadas - 1 ? 'Próxima rodada' : 'Ver resultado';
          fb.appendChild(prox);
          prox.addEventListener('click', () => {
            indice++;
            if (indice < totalRodadas) render();
            else finalizarFase(container, fase, Math.round((acertos / totalRodadas) * fase.pontuacao_maxima));
          });
        });
      });
    }
    render();
  }

  // ------------------------------------------------------------------
  // FASE 5 — Subida ou Descida
  // ------------------------------------------------------------------
  function initFaseSubidaDescida(fase, container) {
    const totalRodadas = fase.configuracao.rodadas || 5;
    let indice = 0, acertos = 0;

    function gerarRodada() {
      const Q = [6, -4, 5, -6, 7][indice % 5];
      const dA = 0.2 + Math.random() * 0.3;
      const dB = dA + (Math.random() > 0.5 ? 1 : -1) * (0.1 + Math.random() * 0.2);
      const dBpos = Math.max(0.1, dB);
      const vA = PhysicsCore.calcular('potencial', { Q: PhysicsCore.paraCoulomb(Q, 'uC'), d: dA });
      const vB = PhysicsCore.calcular('potencial', { Q: PhysicsCore.paraCoulomb(Q, 'uC'), d: dBpos });
      return { Q, dA, dB: dBpos, vA, vB };
    }

    function render() {
      const { Q, dA, dB, vA, vB } = gerarRodada();
      container.innerHTML = `
        <div class="fase-jogo">
          <p class="fase-jogo__objetivo">Rodada ${indice + 1} de ${totalRodadas}</p>
          <canvas class="fase-canvas" id="canvas-fase5"></canvas>
          <p class="fase-pergunta">Uma carga vai do ponto A para o ponto B. O potencial elétrico aumenta ou diminui?</p>
          <div class="fase-opcoes">
            <button class="btn btn--outline" data-resp="aumenta">Aumenta</button>
            <button class="btn btn--outline" data-resp="diminui">Diminui</button>
          </div>
          <div id="fase5-feedback"></div>
        </div>`;

      const canvas = container.querySelector('#canvas-fase5');
      const { ctx, width, height } = setupCanvas(canvas, 200);
      const cx = width * 0.24, cy = height / 2;
      const escala = (width * 0.65) / 1;
      ctx.clearRect(0, 0, width, height);
      drawCharge(ctx, cx, cy, Q, 20);
      const xA = cx + dA * escala, xB = cx + dB * escala;
      ['A', 'B'].forEach((label, i) => {
        const x = i === 0 ? xA : xB;
        ctx.beginPath(); ctx.arc(x, cy, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill();
        ctx.fillStyle = '#0b1220'; ctx.font = "bold 11px 'Space Grotesk'"; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(label, x, cy);
      });
      drawArrow(ctx, xA, cy + 26, xB, cy + 26, COR_VETOR, 2);

      container.querySelectorAll('[data-resp]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const correta = vB > vA ? 'aumenta' : 'diminui';
          const acertou = btn.dataset.resp === correta;
          if (acertou) acertos++;
          container.querySelectorAll('[data-resp]').forEach((b) => (b.disabled = true));
          const fb = container.querySelector('#fase5-feedback');
          const detalhe = `V_A ≈ ${PhysicsCore.formatoCientifico(vA, 2)} V · V_B ≈ ${PhysicsCore.formatoCientifico(vB, 2)} V`;
          fb.innerHTML = acertou ? UI.feedbackCorrect(detalhe) : UI.feedbackWrong(`O potencial ${correta === 'aumenta' ? 'aumentou' : 'diminuiu'}. ${detalhe}`);
          const prox = document.createElement('button');
          prox.className = 'btn btn--primary fase-proximo';
          prox.textContent = indice < totalRodadas - 1 ? 'Próxima rodada' : 'Ver resultado';
          fb.appendChild(prox);
          prox.addEventListener('click', () => {
            indice++;
            if (indice < totalRodadas) render();
            else finalizarFase(container, fase, Math.round((acertos / totalRodadas) * fase.pontuacao_maxima));
          });
        });
      });
    }
    render();
  }

  // ------------------------------------------------------------------
  // FASE 6 — Resgate da Carga
  // ------------------------------------------------------------------
  function initFaseResgateCarga(fase, container) {
    const etapas = [
      { q: 3, VA: 120, VB: 40 },
      { q: -2, VA: 80, VB: 200 },
      { q: 5, VA: 60, VB: 60 }
    ];
    let indice = 0, corretas = 0;

    function render() {
      const e = etapas[indice];
      const W = PhysicsCore.calcular('trabalho', { q: PhysicsCore.paraCoulomb(e.q, 'uC'), VA: e.VA, VB: e.VB });
      container.innerHTML = `
        <div class="fase-jogo">
          <p class="fase-jogo__objetivo">Etapa ${indice + 1} de ${etapas.length} — ${fase.objetivo}</p>
          <div class="resgate-card">
            <p>Uma carga de prova <strong>q = ${formatCarga(e.q)}</strong> é deslocada de um ponto A (V_A = ${e.VA} V) até um ponto B (V_B = ${e.VB} V).</p>
            <p>Calcule o trabalho realizado pela força elétrica, em joules, usando W = q · (V_A − V_B).</p>
          </div>
          <div class="resposta-numerica">
            <input type="number" step="any" id="input-trabalho" placeholder="Resposta em joules (ex: 0.00032)">
            <button class="btn btn--primary" id="btn-confirmar-trabalho">Confirmar</button>
          </div>
          <div id="fase6-feedback"></div>
        </div>`;

      container.querySelector('#btn-confirmar-trabalho').addEventListener('click', () => {
        const valor = parseFloat(container.querySelector('#input-trabalho').value);
        const tolerancia = Math.max(Math.abs(W) * 0.1, 1e-6);
        const acertou = !isNaN(valor) && Math.abs(valor - W) <= tolerancia;
        if (acertou) corretas++;
        container.querySelector('#btn-confirmar-trabalho').disabled = true;
        const fb = container.querySelector('#fase6-feedback');
        fb.innerHTML = acertou
          ? UI.feedbackCorrect(`W = q·(V_A − V_B) = ${PhysicsCore.formatoCientifico(W, 2)} J.`)
          : UI.feedbackWrong(`O valor correto era ${PhysicsCore.formatoCientifico(W, 2)} J.`);
        const prox = document.createElement('button');
        prox.className = 'btn btn--primary fase-proximo';
        prox.textContent = indice < etapas.length - 1 ? 'Próxima etapa' : 'Ver resultado';
        fb.appendChild(prox);
        prox.addEventListener('click', () => {
          indice++;
          if (indice < etapas.length) render();
          else finalizarFase(container, fase, Math.round((corretas / etapas.length) * fase.pontuacao_maxima));
        });
      });
    }
    render();
  }

  // ------------------------------------------------------------------
  // FASE 7 — Desafio Final
  // ------------------------------------------------------------------
  function initFaseDesafioFinal(fase, container) {
    const perguntas = [
      {
        tipo: 'numerica', unidade: 'N',
        enunciado: 'Duas cargas de 2 μC e 3 μC estão a 0,3 m de distância. Qual a força elétrica entre elas (em N)?',
        resposta: PhysicsCore.calcular('coulomb', { Q1: PhysicsCore.paraCoulomb(2, 'uC'), Q2: PhysicsCore.paraCoulomb(3, 'uC'), d: 0.3 }),
        tolerancia: 0.05
      },
      {
        tipo: 'mc',
        enunciado: 'Ao redor de uma carga puntiforme negativa, as linhas de campo elétrico:',
        opcoes: [{ t: 'Saem da carga', c: false }, { t: 'Entram na carga', c: true }, { t: 'Formam círculos', c: false }]
      },
      {
        tipo: 'numerica', unidade: 'V',
        enunciado: 'Qual o potencial elétrico a 0,2 m de uma carga de −5 μC?',
        resposta: PhysicsCore.calcular('potencial', { Q: PhysicsCore.paraCoulomb(-5, 'uC'), d: 0.2 }),
        tolerancia: 8000
      },
      {
        tipo: 'mc',
        enunciado: 'Duas cargas de mesmo sinal têm energia potencial elétrica:',
        opcoes: [{ t: 'Positiva', c: true }, { t: 'Negativa', c: false }, { t: 'Sempre nula', c: false }]
      },
      {
        tipo: 'numerica', unidade: 'J',
        enunciado: 'Uma carga de 4 μC vai de um ponto com V_A = 300 V a outro com V_B = 100 V. Qual o trabalho da força elétrica (em J)?',
        resposta: PhysicsCore.calcular('trabalho', { q: PhysicsCore.paraCoulomb(4, 'uC'), VA: 300, VB: 100 }),
        tolerancia: 0.00008
      }
    ];
    let indice = 0, acertos = 0;

    function render() {
      const p = perguntas[indice];
      const corpo = p.tipo === 'mc'
        ? `<div class="fase-opcoes">${p.opcoes.map((o, i) => `<button class="btn btn--outline" data-idx="${i}">${o.t}</button>`).join('')}</div>`
        : `<div class="resposta-numerica"><input type="number" step="any" id="input-final" placeholder="Resposta em ${p.unidade}"><button class="btn btn--primary" id="btn-confirmar-final">Confirmar</button></div>`;

      container.innerHTML = `
        <div class="fase-jogo">
          <p class="fase-jogo__objetivo">Pergunta ${indice + 1} de ${perguntas.length} — Desafio Final</p>
          <p class="fase-pergunta">${p.enunciado}</p>
          ${corpo}
          <div id="final-feedback"></div>
        </div>`;

      function avancar(acertou, explicacao) {
        if (acertou) acertos++;
        const fb = container.querySelector('#final-feedback');
        fb.innerHTML = acertou ? UI.feedbackCorrect(explicacao) : UI.feedbackWrong(explicacao);
        const prox = document.createElement('button');
        prox.className = 'btn btn--primary fase-proximo';
        prox.textContent = indice < perguntas.length - 1 ? 'Próxima pergunta' : 'Concluir desafio';
        fb.appendChild(prox);
        prox.addEventListener('click', () => {
          indice++;
          if (indice < perguntas.length) render();
          else finalizarFase(container, fase, Math.round((acertos / perguntas.length) * fase.pontuacao_maxima));
        });
      }

      if (p.tipo === 'mc') {
        container.querySelectorAll('[data-idx]').forEach((btn) => {
          btn.addEventListener('click', () => {
            container.querySelectorAll('[data-idx]').forEach((b) => (b.disabled = true));
            const opc = p.opcoes[Number(btn.dataset.idx)];
            avancar(opc.c, `Resposta correta: ${p.opcoes.find((o) => o.c).t}.`);
          });
        });
      } else {
        container.querySelector('#btn-confirmar-final').addEventListener('click', () => {
          const valor = parseFloat(container.querySelector('#input-final').value);
          container.querySelector('#btn-confirmar-final').disabled = true;
          const acertou = !isNaN(valor) && Math.abs(valor - p.resposta) <= p.tolerancia;
          avancar(acertou, `Valor correto: ${PhysicsCore.formatoCientifico(p.resposta, 2)} ${p.unidade}.`);
        });
      }
    }
    render();
  }

  // ------------------------------------------------------------------
  const INIT_POR_TIPO = {
    'atracao-repulsao': initFaseAtracaoRepulsao,
    'controle-forca': initFaseControleForca,
    'mapa-campo': initFaseMapaCampo,
    'caca-potencial': initFaseCacaPotencial,
    'subida-descida': initFaseSubidaDescida,
    'resgate-carga': initFaseResgateCarga,
    'desafio-final': initFaseDesafioFinal
  };

  async function iniciarFase(idFase, container) {
    const fase = await PhysicsContent.getFase(idFase);
    if (!fase) { container.innerHTML = UI.errorBlock('Fase não encontrada.'); return; }
    const initFn = INIT_POR_TIPO[fase.tipo];
    if (!initFn) { container.innerHTML = UI.errorBlock('Este tipo de fase ainda não está disponível.'); return; }
    inicioTempo = Date.now();
    initFn(fase, container);
  }

  return { iniciarFase };
})();

window.PhysicsGame = PhysicsGame;
