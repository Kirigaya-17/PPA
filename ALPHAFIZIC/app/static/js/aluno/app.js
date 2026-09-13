/* ==========================================================================
   app.js
   Inicialização, roteamento (hash) e renderização de todas as páginas.
   ========================================================================== */

(() => {
  const main = document.getElementById('app-main');
  const navLinks = () => document.querySelectorAll('.nav__link');

  const ROTAS_PROTEGIDAS = ['aprender', 'modulo', 'conteudo', 'fase', 'ranking', 'perfil'];

  // ------------------------------------------------------------------
  // ROTEADOR
  // ------------------------------------------------------------------
  function parseRota() {
    const hash = (location.hash || '#aprender').replace('#', '');
    const [rota, param] = hash.split('/');
    return { rota: rota || param };
  }

  async function rotear() {
    const { rota, param } = parseRota();
    atualizarNavAtiva(rota);
    fecharMenuMobile();

    if (ROTAS_PROTEGIDAS.includes(rota) && !PhysicsAuth.isLoggedIn()) {
      location.hash = '#login';
      return;
    }

    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });

    try {
      switch (rota) {
        case 'login': return renderLogin();
        case 'aprender': return renderAprender();
        case 'modulo': return renderModuloLanding(param);
        case 'conteudo': return renderModulo(Number(param));
        case 'fase': return renderFasePage(Number(param));
        case 'ranking': return renderRanking();
        case 'perfil': return renderPerfil();
      }
    } catch (err) {
      console.error('[App] Erro ao renderizar rota', rota, err);
      main.innerHTML = UI.errorBlock();
    }
  }

  function atualizarNavAtiva(rota) {
    navLinks().forEach((a) => {
      const ativa = a.dataset.rota === rota || ((rota === 'modulo' || rota === 'conteudo') && a.dataset.rota === 'aprender');
      a.classList.toggle('is-active', ativa);
    });
  }

  function fecharMenuMobile() {
    document.body.classList.remove('menu-aberto');
  }

  // ------------------------------------------------------------------
  // CABEÇALHO DE PÁGINA (com botão voltar opcional)
  // ------------------------------------------------------------------
  function cabecalho(titulo, subtitulo, voltarHash) {
    return `
    <div class="page-header">
      ${voltarHash ? `<a class="voltar-link" href="${voltarHash}" aria-label="Voltar">← Voltar</a>` : ''}
      <h1>${UI.escapeHtml(titulo)}</h1>
      ${subtitulo ? `<p class="page-header__sub">${UI.escapeHtml(subtitulo)}</p>` : ''}
    </div>`;
  }

  function bannerDemo() {
    if (!PhysicsAuth.isDemo()) return '';
    return `<div class="demo-banner">Modo de demonstração — seu progresso não é salvo em um banco real. <a href="#login">Entrar com uma conta</a></div>`;
  }

  async function renderDashboard() {
    const { usuario } = PhysicsAuth.getState();
    main.innerHTML = bannerDemo() + UI.loadingBlock('Carregando seu progresso…');

    const [resumo, modulos] = await Promise.all([
      PhysicsProgress.getResumoAluno(),
      PhysicsContent.getModulos(1)
    ]);

    const ultimoId = Number(sessionStorage.getItem('fisica_ultimo_modulo')) || modulos[0].id_modulo;
    const ultimoModulo = modulos.find((m) => m.id_modulo === ultimoId) || modulos[0];
    const progressoUltimo = PhysicsProgress.getProgressoModulo(ultimoModulo.id_modulo);

    main.innerHTML = bannerDemo() + `
      <section class="dashboard">
        <div class="dashboard__saudacao">
          ${UI.mascotSVG(56)}
          <div>
            <h1>Olá, ${UI.escapeHtml(usuario.nome)}!</h1>
            <p>Nível ${resumo.nivel} • ${UI.formatNumber(resumo.xpTotal)} XP total</p>
          </div>
        </div>
        ${UI.xpBar(resumo.xpNoNivel, resumo.xpParaProximo, resumo.nivel)}

        <section class="dashboard-opcoes" aria-label="Acesso rápido">
          <a class="dashboard-opcao" href="#aprender"><strong>Aprender</strong></a>
          <a class="dashboard-opcao" href="#ranking"><strong>Ranking</strong></a>
          <a class="dashboard-opcao" href="#perfil"><strong>Perfil</strong></a>
        </section>

        <div class="dashboard__stats">
          <div class="stat-card"><span>${resumo.modulosConcluidos}/${modulos.length}</span><small>Módulos concluídos</small></div>
          <div class="stat-card"><span>${resumo.desafiosConcluidos}</span><small>Desafios concluídos</small></div>
          <div class="stat-card"><span>${resumo.conquistasDesbloqueadas}/${resumo.conquistasTotais}</span><small>Conquistas</small></div>
        </div>

        <div class="continuar-card">
          <p class="continuar-card__label">Continue aprendendo</p>
          <h3>${UI.escapeHtml(ultimoModulo.titulo)}</h3>
          ${UI.progressBar(progressoUltimo.progresso, 'Progresso do módulo')}
          <a class="btn btn--primary" href="#conteudo/${ultimoModulo.id_modulo}">Continuar módulo</a>
        </div>

        <section class="conquistas-resumo">
          <div class="section-heading"><div><span class="trilha-kicker">PROGRESSO</span><h2>Últimas conquistas</h2></div><span>${resumo.conquistasDesbloqueadas}/${resumo.conquistasTotais}</span></div>
          <div class="conquista-mini-grid">${resumo.ultimasConquistas.map(c => `<div class="conquista-mini ${c.desbloqueada ? '' : 'is-locked'}"><span>${c.desbloqueada ? UI.escapeHtml(c.icone || 'Conquista') : 'Bloqueada'}</span><strong>${UI.escapeHtml(c.nome)}</strong></div>`).join('')}</div>
        </section>
      </section>`;
  }

  // ------------------------------------------------------------------
  // LOGIN / CADASTRO / DEMO
  // ------------------------------------------------------------------
  // LOGIN -- normalmente inalcançável: a rota Flask /aluno já exige
  // sessão autenticada com papel 'aluno' antes de servir esta página.
  // Mantido apenas como fallback caso a sessão expire durante o uso.
  // ------------------------------------------------------------------
  function renderLogin() {
    main.innerHTML = `
      <section class="auth-page">
        ${UI.mascotSVG(72)}
        <h1>Sua sessão expirou</h1>
        <p>Faça login novamente para continuar de onde parou.</p>
        <a class="btn btn--primary" href="/login">Ir para o login</a>
      </section>`;
  }


  // ------------------------------------------------------------------
  // APRENDER
  // ------------------------------------------------------------------
  async function renderAprender() {
    main.innerHTML = bannerDemo() + cabecalho('Aprender', 'Escolha um módulo para iniciar sua jornada de Física.') + UI.loadingBlock('Carregando módulos…');
    const conteudo = await PhysicsContent.getConteudo();
    const modulos = await PhysicsContent.getModulos(conteudo.id_conteudo);
    const areas = [
      { nome: 'Eletrodinâmica', numero: '01', descricao: 'Eletricidade, corrente, tensão, resistência, circuitos e energia.', classe: 'module-card--eletro', icone: 'eletricidade' },
      { nome: 'Magnetismo', numero: '02', descricao: 'Ímãs, campos magnéticos, força magnética e indução eletromagnética.', classe: 'module-card--mag', icone: '◈' }
    ];

    const cards = areas.map((area) => {
      const lista = modulos.filter(m => (m.area || '') === area.nome).sort((a,b) => a.ordem-b.ordem);
      if (!lista.length) return '';
      const concluidos = lista.filter(m => PhysicsProgress.getProgressoModulo(m.id_modulo).concluido).length;
      const percentual = lista.length ? Math.round((concluidos / lista.length) * 100) : 0;
      return `
        <a class="module-choice ${area.classe}" href="#modulo/${area.nome.toLowerCase().replace('ê','e').replace('í','i').replace('ô','o')}" aria-label="Abrir módulo ${UI.escapeHtml(area.nome)}">
          <div class="module-choice__shine"></div>
          <div class="module-choice__title">${UI.escapeHtml(area.nome)}</div>
          <div class="module-choice__contents">
            <span class="module-choice__contents-title">CONTEÚDOS</span>
            <div class="module-choice__contents-list">${lista.map((m) => `<span>${UI.escapeHtml(m.titulo)}</span>`).join('')}</div>
          </div>
        </a>`;
    }).join('');

    main.innerHTML = bannerDemo() + cabecalho('Aprender', conteudo.titulo || 'Escolha uma jornada para começar.') + `
      <section class="module-choices-intro">
        <span class="trilha-kicker">JORNADAS DE FÍSICA</span>
        <h2>Escolha seu próximo módulo</h2>
        <p>Entre em uma jornada e avance por uma trilha de etapas. As próximas etapas são desbloqueadas conforme você aprende e pratica.</p>
      </section>
      <div class="module-choice-grid">${cards}</div>`;
  }

  // ------------------------------------------------------------------
  // PÁGINA DO MÓDULO — trilha visual de etapas + fórmulas desbloqueadas
  // ------------------------------------------------------------------
  async function renderModuloLanding(idModulo) {
    const chave = String(idModulo || '').toLowerCase();
    const area = chave.includes('mag') ? 'Magnetismo' : chave.includes('elet') ? 'Eletrodinâmica' : null;
    if (!area) {
      const antigo = Number(idModulo);
      if (Number.isFinite(antigo)) return renderModulo(antigo);
      main.innerHTML = UI.errorBlock('Módulo não encontrado.');
      return;
    }
// Renderiza a página do módulo com a trilha de etapas e fórmulas desbloqueadas  
    main.innerHTML = bannerDemo() + UI.loadingBlock('Montando sua jornada…');
    const todos = await PhysicsContent.getModulos(1);
    const lista = todos.filter(m => (m.area || '') === area).sort((a,b) => a.ordem-b.ordem);
    if (!lista.length) { main.innerHTML = UI.errorBlock('Módulo não encontrado.'); return; }

// Carrega todas as fórmulas de todos os módulos da trilha, para exibir as desbloqueadas
    const formulasPorModulo = await Promise.all(lista.map(async m => ({ modulo: m, formulas: await PhysicsContent.getFormulasDoModulo(m.id_modulo) })));
    const todasFormulas = formulasPorModulo.flatMap(x => x.formulas);
    const { desbloqueadas } = PhysicsProgress.getFormulasStatus(todasFormulas);
    const concluidos = lista.filter(m => PhysicsProgress.getProgressoModulo(m.id_modulo).concluido).length;
    const percentual = Math.round((concluidos / lista.length) * 100);

// Renderiza a trilha de etapas com base no progresso do aluno
    const trilha = lista.map((m, i) => {
      const progresso = PhysicsProgress.getProgressoModulo(m.id_modulo);
      const anterior = lista[i - 1];
      const desbloqueado = i === 0 || (anterior && PhysicsProgress.getProgressoModulo(anterior.id_modulo).concluido);
      const estado = progresso.concluido ? 'concluida' : desbloqueado ? 'atual' : 'bloqueada';
      return `
        <div class="game-stage game-stage--${estado}">
          <div class="game-stage__connector"></div>
          <div class="game-stage__orb">${String(i + 1).padStart(2,'0')}</div>
          <div class="game-stage__card">
            <div class="game-stage__top"><span>ETAPA ${String(i+1).padStart(2,'0')}</span>${UI.difficultyBadge(m.dificuldade)}${!desbloqueado ? '<span class="game-stage__lock">Bloqueada</span>' : ''}</div>
            <h3>${UI.escapeHtml(m.titulo)}</h3>
            <p>${UI.escapeHtml(m.descricao)}</p>
            ${UI.progressBar(progresso.progresso, 'Progresso da etapa')}
            <div class="game-stage__bottom">
              <span>${progresso.concluido ? 'Etapa concluída' : desbloqueado ? 'Etapa disponível' : 'Conclua a etapa anterior'}</span>
              ${desbloqueado ? `<a class="btn btn--primary btn--sm" href="#conteudo/${m.id_modulo}">${progresso.progresso > 0 ? 'Continuar' : 'Começar'} →</a>` : ''}
            </div>
          </div>
        </div>`;
    }).join('');

// Renderiza a seção de fórmulas desbloqueadas, mostrando as que o aluno conquistou até agora
    const formulasHtml = desbloqueadas.length ? desbloqueadas.map(f => `
      <div class="module-formula-card">
        <span>DESBLOQUEADA</span>
        <strong>${UI.escapeHtml(f.expressao)}</strong>
        <small>${UI.escapeHtml(f.nome)}</small>
      </div>`).join('') : `<div class="module-formula-empty"><strong>Nenhuma fórmula desbloqueada ainda.</strong><span>Conclua as etapas e seus desafios para começar sua coleção.</span></div>`;
      
// Renderiza a página do módulo com o cabeçalho, progresso, trilha de etapas e fórmulas desbloqueadas
    main.innerHTML = bannerDemo() + cabecalho(area, `Jornada ${area === 'Eletrodinâmica' ? '01' : '02'} · avance etapa por etapa`, '#aprender') + `
      <section class="module-journey-head">
        <div><span class="trilha-kicker">TRILHA DE APRENDIZADO</span><h2>${UI.escapeHtml(area)}</h2><p>${concluidos}/${lista.length} etapas concluídas</p></div>
        <div class="module-journey-head__score"><strong>${percentual}%</strong><span>progresso</span></div>
      </section>
      <div class="module-journey-progress">${UI.progressBar(percentual, `Progresso do módulo ${area}`)}</div>
      <section class="module-content-intro">
        <span class="trilha-kicker">CONTEÚDOS DO MÓDULO</span>
        <h2>${UI.escapeHtml(lista[0].titulo)}</h2>
        <p>Este é o primeiro conteúdo da jornada. Os demais serão liberados progressivamente conforme você conclui cada etapa.</p>
      </section>
      <section class="physics-journey">
        <div class="physics-journey__title"><span class="trilha-kicker">SUA JORNADA</span><h2>Avance pelas etapas</h2><p>Conclua uma etapa para liberar a próxima, como uma trilha de fases.</p></div>
        <div class="game-stage-list">${trilha}</div>
      </section>
      <section class="module-formulas">
        <div class="section-heading"><div><span class="trilha-kicker">COLEÇÃO</span><h2>Fórmulas desbloqueadas</h2><p>As fórmulas que você conquistou nesta jornada.</p></div><span class="formula-counter">${desbloqueadas.length}/${todasFormulas.length}</span></div>
        <div class="module-formula-grid">${formulasHtml}</div>
      </section>`;
  }

  // ------------------------------------------------------------------
  // CONTEÚDO / AULA INDIVIDUAL
  // ------------------------------------------------------------------

  // ------------------------------------------------------------------
  async function renderModulo(idModulo) {
    main.innerHTML = UI.loadingBlock('Carregando a etapa…');
    const [modulo, formulas, exemplos, atividades] = await Promise.all([
      PhysicsContent.getModulo(idModulo),
      PhysicsContent.getFormulasDoModulo(idModulo),
      PhysicsContent.getExemplosDoModulo(idModulo),
      PhysicsContent.getAtividadesDoModulo(idModulo)
    ]);
    if (!modulo) { main.innerHTML = UI.errorBlock('Conteúdo não encontrado.'); return; }

    const { desbloqueadas } = PhysicsProgress.getFormulasStatus(formulas);
    const resultado = PhysicsProgress.getResultadoModulo(modulo.id_modulo, atividades.length);
    sessionStorage.setItem('fisica_ultimo_modulo', modulo.id_modulo);
    const corpo = modulo.corpo || {};

    const areaSlug = (modulo.area || '').toLowerCase().includes('mag') ? 'magnetismo' : 'eletrodinamica';
    main.innerHTML = cabecalho(modulo.titulo, modulo.descricao, `#modulo/${areaSlug}`) + `
      <article class="modulo-artigo">
        <div class="content-stage-header"><span class="trilha-kicker">${UI.escapeHtml(modulo.area || 'Física')}</span><span class="stage-result">${resultado.acertos}/${resultado.total} acertos</span></div>
        ${UI.mascotBubble(corpo.introducao || 'Vamos estudar juntos!', { small: true })}
        <section class="modulo-secao"><h2>Conceito</h2><p class="conceito-destaque">${UI.escapeHtml(corpo.conceito || '')}</p></section>
        <section class="modulo-secao"><h2>Explicação</h2>${(corpo.explicacao || []).map((p) => `<p>${UI.escapeHtml(p)}</p>`).join('')}</section>
        ${formulas.length ? `<section class="modulo-secao"><div class="section-heading"><div><span class="trilha-kicker">CONHECIMENTO</span><h2>Fórmulas deste conteúdo</h2></div></div><div class="formula-grid" id="formula-grid"></div></section>` : ''}
        ${exemplos.length ? `<section class="modulo-secao"><h2>Exemplo resolvido</h2><div id="exemplos-area"></div></section>` : ''}
        <section class="modulo-secao"><h2>Resumo</h2><ul class="resumo-lista">${(corpo.resumo || []).map((r) => `<li>${UI.escapeHtml(r)}</li>`).join('')}</ul></section>
        <section class="modulo-secao formulas-unlocked-section"><div class="section-heading"><div><span class="trilha-kicker">RECOMPENSA</span><h2>Fórmulas desbloqueadas</h2></div><span class="formula-counter" id="formula-counter">${desbloqueadas.length}/${formulas.length}</span></div><div class="formula-unlocked-grid" id="formula-unlocked-grid"></div></section>
        <div class="modulo-artigo__acoes" id="modulo-acoes"></div>
      </article>`;

    renderFormulas(formulas, main.querySelector('#formula-grid'));
    if (exemplos.length) renderExemplos(exemplos, main.querySelector('#exemplos-area'));
    renderQuestoes(atividades, main.querySelector('#questoes-area'), modulo);
    renderFormulasDesbloqueadas(formulas, main.querySelector('#formula-unlocked-grid'));

    const atualizarAcoes = async () => {
      const r = PhysicsProgress.getResultadoModulo(modulo.id_modulo, atividades.length);
      const podeConcluir = r.acertos >= Math.ceil(atividades.length * 0.6);
      main.querySelector('#modulo-acoes').innerHTML = podeConcluir ? `<button class="btn btn--primary btn--lg" id="btn-concluir-modulo">Concluir etapa e desbloquear próxima</button><p class="modulo-score">Resultado: <strong>${r.acertos}/${r.total}</strong> acertos</p>` : `<p class="modulo-score">Acerte pelo menos 3/5 para concluir esta etapa.</p>`;
      const btn=main.querySelector('#btn-concluir-modulo');
      if(btn) btn.addEventListener('click', async () => {
        await PhysicsProgress.atualizarProgressoModulo(modulo.id_modulo, 100);
        await PhysicsProgress.desbloquearFormulasDoModulo(modulo.id_modulo);
        const novas = await PhysicsProgress.verificarConquistas();
        renderFormulasDesbloqueadas(formulas, main.querySelector('#formula-unlocked-grid'));
        main.querySelector('#formula-counter').textContent = `${PhysicsProgress.getFormulasStatus(formulas).desbloqueadas.length}/${formulas.length}`;
        UI.celebrateBurst(main.querySelector('.modulo-artigo'));
        UI.toast(novas.length ? 'Etapa concluída! Nova conquista desbloqueada.' : 'Etapa concluída! Próxima etapa desbloqueada.', 'success');
        const modulos = await PhysicsContent.getModulos(1);
        const lista = modulos.filter(m => (m.area||'') === (modulo.area||''));
        const proximo = lista.find(m => m.ordem === modulo.ordem + 1);
      });
    };
    window.setTimeout(atualizarAcoes, 0);
  }

  function renderFormulasDesbloqueadas(formulas, container) {
    if (!container) return;
    const { desbloqueadas } = PhysicsProgress.getFormulasStatus(formulas);
    container.innerHTML = desbloqueadas.length ? desbloqueadas.map(f => `<div class="formula-unlocked-card"><span>Desbloqueada</span><strong>${UI.escapeHtml(f.expressao)}</strong><small>${UI.escapeHtml(f.nome)}</small></div>`).join('') : `<div class="formula-locked-empty">Conclua desafios deste conteúdo para desbloquear suas primeiras fórmulas.</div>`;
  }

  function renderFormulas(formulas, container) {
    if (!container) return;
    container.innerHTML = formulas.map((f) => `
      <div class="formula-card">
        <p class="formula-card__nome">${UI.escapeHtml(f.nome)}</p>
        <p class="formula-card__expressao">${UI.escapeHtml(f.expressao)}</p>
        <p class="formula-card__desc">${UI.escapeHtml(f.descricao)} · unidade: ${UI.escapeHtml(f.unidade)}</p>
        ${f.calc ? `<button class="btn btn--outline" data-testar="${f.id_formula}">Testar fórmula</button><div class="formula-card__calculadora is-hidden" id="calc-${f.id_formula}"></div>` : `<span class="formula-card__status">Use no laboratório para praticar</span>`}
      </div>`).join('');

    formulas.forEach((f) => {
      const btn = container.querySelector(`[data-testar="${f.id_formula}"]`);
      if (!btn) return;
      btn.addEventListener('click', () => {
        const painel = container.querySelector(`#calc-${f.id_formula}`);
        const aberta = !painel.classList.contains('is-hidden');
        if (aberta) { painel.classList.add('is-hidden'); return; }
        painel.classList.remove('is-hidden');
        if (!painel.dataset.montado) { montarCalculadora(f, painel); painel.dataset.montado = '1'; }
      });
    });
  }

  function montarCalculadora(formula, painel) {
    const variaveis = (formula.variaveis_formula || []).filter((v) => v.simbolo !== 'k');
    painel.innerHTML = `
      <div class="calculadora">
        ${variaveis.map((v) => `
          <label>${UI.escapeHtml(v.nome)} (${v.simbolo}) — ${UI.escapeHtml(v.unidade)}
            <input type="number" step="any" data-simbolo="${v.simbolo}" data-unidade="${v.unidade}" value="${v.valor_padrao != null ? v.valor_padrao : ''}">
          </label>`).join('')}
        <button class="btn btn--primary" id="calc-executar-${formula.id_formula}">Calcular</button>
        <div class="calculadora__resultado" id="calc-resultado-${formula.id_formula}"></div>
      </div>`;

    painel.querySelector(`#calc-executar-${formula.id_formula}`).addEventListener('click', () => {
      const valoresSI = {};
      const dadosTexto = [];
      let valido = true;
      painel.querySelectorAll('[data-simbolo]').forEach((input) => {
        const bruto = parseFloat(input.value);
        if (isNaN(bruto)) valido = false;
        const unidade = input.dataset.unidade;
        const simbolo = input.dataset.simbolo;
        const emSI = (unidade === 'μC' || unidade === 'uC') ? PhysicsCore.paraCoulomb(bruto, 'uC') : bruto;
        valoresSI[simbolo] = emSI;
        dadosTexto.push(`${simbolo} = ${bruto} ${unidade}`);
      });

      const resultadoEl = painel.querySelector(`#calc-resultado-${formula.id_formula}`);
      if (!valido) { resultadoEl.innerHTML = UI.feedbackWrong('Preencha todos os valores.'); return; }

      const resultado = PhysicsCore.calcular(formula.calc, valoresSI);
      resultadoEl.innerHTML = `
        <div class="calc-passos">
          <p><strong>Dados:</strong> ${dadosTexto.join(' · ')}</p>
          <p><strong>Fórmula:</strong> ${UI.escapeHtml(formula.expressao)}</p>
          <p><strong>Resultado:</strong> ${PhysicsCore.formatoCientifico(resultado, 3)} ${formula.unidade.split(' ou ')[0]}</p>
        </div>`;
    });
  }

  function renderExemplos(exemplos, container) {
    if (!container) return;
    container.innerHTML = exemplos.map((ex) => `
      <div class="exemplo-card">
        <h3>${UI.escapeHtml(ex.titulo)}</h3>
        <p>${UI.escapeHtml(ex.enunciado)}</p>
        <p class="exemplo-card__dados"><strong>Dados:</strong> ${UI.escapeHtml(ex.dados)}</p>
        <p class="exemplo-card__formula"><strong>Fórmula usada:</strong> ${UI.escapeHtml(ex.formula_utilizada)}</p>
        <ol class="exemplo-card__resolucao">${(ex.resolucao || []).map((p) => `<li>${UI.escapeHtml(p)}</li>`).join('')}</ol>
        <p class="exemplo-card__resultado"><strong>Resultado:</strong> ${UI.escapeHtml(ex.resultado)}</p>
      </div>`).join('');
  }

  function renderQuestoes(atividades, container, modulo) {
    if (!container) return;
    container.innerHTML = `<div class="questoes-score" id="questoes-score"><strong>0/${atividades.length}</strong><span>acertos neste conteúdo</span></div>` + atividades.map((a) => `
      <div class="questao-card" id="questao-${a.id_atividade}">
        <div class="questao-card__topo">${UI.difficultyBadge(a.dificuldade)}<span>+${a.xp_recompensa} XP</span></div>
        <p class="questao-card__enunciado">${UI.escapeHtml(a.enunciado)}</p>
        ${a.tipo === 'multipla_escolha'
          ? `<div class="fase-opcoes">${(a.alternativas || []).map((alt) => `<button class="btn btn--outline" data-alt="${alt.id_alternativa}">${UI.escapeHtml(alt.texto)}</button>`).join('')}</div>`
          : `<div class="resposta-numerica"><input type="number" step="any" id="resp-${a.id_atividade}" placeholder="Sua resposta em ${a.unidade || ''}"><button class="btn btn--primary" data-confirmar="${a.id_atividade}">Confirmar</button></div>`}
        ${(a.dicas && a.dicas.length) ? `<button class="btn btn--ghost btn--sm" data-dica="${a.id_atividade}">Ver dica</button><div class="dica-texto is-hidden" id="dica-${a.id_atividade}"></div>` : ''}
        <div id="feedback-${a.id_atividade}"></div>
      </div>`).join('');

    let dicasUsadas = {};
    const scoreInicial = PhysicsProgress.getResultadoModulo(modulo ? modulo.id_modulo : (atividades[0] || {}).id_modulo, atividades.length);
    const scoreInicialEl = container.querySelector('#questoes-score');
    if (scoreInicialEl) scoreInicialEl.innerHTML = `<strong>${scoreInicial.acertos}/${scoreInicial.total}</strong><span>acertos neste conteúdo</span>`;

    atividades.forEach((a) => {
      const card = container.querySelector(`#questao-${a.id_atividade}`);
      if (PhysicsProgress.isAtividadeConcluida(a.id_atividade)) {
        card.querySelector(`#feedback-${a.id_atividade}`).innerHTML = UI.feedbackCorrect('Você já concluiu esta questão.');
      }

      const dicaBtn = card.querySelector(`[data-dica="${a.id_atividade}"]`);
      if (dicaBtn) {
        dicaBtn.addEventListener('click', () => {
          const alvo = card.querySelector(`#dica-${a.id_atividade}`);
          alvo.classList.remove('is-hidden');
          alvo.textContent = a.dicas[0].texto;
          dicasUsadas[a.id_atividade] = (dicasUsadas[a.id_atividade] || 0) + 1;
          dicaBtn.disabled = true;
        });
      }

      async function concluir(acertou, explicacaoExtra) {
        const fb = card.querySelector(`#feedback-${a.id_atividade}`);
        fb.innerHTML = acertou ? UI.feedbackCorrect() : UI.feedbackWrong(explicacaoExtra);
        if (acertou) {
          await PhysicsProgress.registrarAtividade(a.id_atividade, {
            nota: 10, xpGanho: a.xp_recompensa, status: 'concluida', dicasUtilizadas: dicasUsadas[a.id_atividade] || 0
          });
          if (modulo) await PhysicsProgress.verificarConquistas();
          const score = PhysicsProgress.getResultadoModulo(modulo ? modulo.id_modulo : a.id_modulo, atividades.length);
          const scoreEl = container.querySelector('#questoes-score');
          if (scoreEl) scoreEl.innerHTML = `<strong>${score.acertos}/${score.total}</strong><span>acertos neste conteúdo</span>`;
          UI.toast(`+${a.xp_recompensa} XP`, 'success');
        }
      }

      if (a.tipo === 'multipla_escolha') {
        card.querySelectorAll('[data-alt]').forEach((btn) => {
          btn.addEventListener('click', () => {
            card.querySelectorAll('[data-alt]').forEach((b) => (b.disabled = true));
            const alt = a.alternativas.find((x) => x.id_alternativa === Number(btn.dataset.alt));
            concluir(!!alt.correta, `A resposta correta é: ${a.alternativas.find((x) => x.correta).texto}`);
          });
        });
      } else {
        card.querySelector(`[data-confirmar="${a.id_atividade}"]`).addEventListener('click', () => {
          const valor = parseFloat(card.querySelector(`#resp-${a.id_atividade}`).value);
          const acertou = !isNaN(valor) && Math.abs(valor - a.resposta_correta) <= (a.tolerancia || Math.abs(a.resposta_correta) * 0.05);
          concluir(acertou, `O valor esperado era aproximadamente ${PhysicsCore.formatoCientifico(a.resposta_correta, 2)} ${a.unidade || ''}.`);
        });
      }
    });
  }

  // ------------------------------------------------------------------
  // ANIMAÇÕES DO MÓDULO (mini Canvas demonstrativo, ligado ao tema)
  // ------------------------------------------------------------------
  function renderAnimacaoModulo(tipo, container) {
    if (!container) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'fase-canvas';
    container.appendChild(canvas);
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = container.clientWidth, cssHeight = 220;
    canvas.style.width = cssWidth + 'px'; canvas.style.height = cssHeight + 'px';
    canvas.width = cssWidth * dpr; canvas.height = cssHeight * dpr;
    const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let t = 0;
    function frame() {
      t += 0.02;
      ctx.clearRect(0, 0, cssWidth, cssHeight);
      desenharAnimacao(tipo, ctx, cssWidth, cssHeight, t);
      requestAnimationFrame(frame);
    }
    frame();
  }

  function desenharCargaSimples(ctx, x, y, positiva, r = 20) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = positiva ? '#ff7a59' : '#4fd1ff';
    ctx.fill();
    ctx.fillStyle = '#0b1220';
    ctx.font = `bold ${r}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(positiva ? '+' : '−', x, y + 1);
  }

  function desenharAnimacao(tipo, ctx, w, h, t) {
    const cy = h / 2;
    switch (tipo) {
      case 'cargas-sinais': {
        const osc = Math.sin(t) * 10;
        desenharCargaSimples(ctx, w * 0.3 - osc, cy, true);
        desenharCargaSimples(ctx, w * 0.7 + osc, cy, true);
        break;
      }
      case 'lei-coulomb': {
        const d = w * 0.4 + Math.sin(t * 0.7) * w * 0.1;
        const x1 = w / 2 - d / 2, x2 = w / 2 + d / 2;
        desenharCargaSimples(ctx, x1, cy, true);
        desenharCargaSimples(ctx, x2, cy, false);
        break;
      }
      case 'linhas-campo':
      case 'equipotenciais':
      case 'campo-uniforme': {
        desenharCargaSimples(ctx, w / 2, cy, tipo !== 'linhas-campo' ? true : true);
        for (let i = 0; i < 10; i++) {
          const ang = (i / 10) * Math.PI * 2 + t * 0.15;
          const len = 60 + Math.sin(t + i) * 6;
          ctx.strokeStyle = 'rgba(140,232,176,0.55)';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(w / 2 + Math.cos(ang) * 24, cy + Math.sin(ang) * 24);
          ctx.lineTo(w / 2 + Math.cos(ang) * len, cy + Math.sin(ang) * len);
          ctx.stroke();
        }
        break;
      }
      case 'superposicao': {
        desenharCargaSimples(ctx, w * 0.32, cy, true);
        desenharCargaSimples(ctx, w * 0.68, cy, false);
        ctx.strokeStyle = '#8ce8b0'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(w / 2, cy - 4 + Math.sin(t) * 3); ctx.lineTo(w / 2 + 30, cy - 4 + Math.sin(t) * 3); ctx.stroke();
        break;
      }
      case 'ddp':
      case 'trabalho': {
        const x = w * 0.25 + ((t * 40) % (w * 0.5));
        desenharCargaSimples(ctx, w * 0.15, cy, true, 16);
        ctx.beginPath(); ctx.arc(x, cy, 8, 0, Math.PI * 2); ctx.fillStyle = '#e7ecf5'; ctx.fill();
        ctx.strokeStyle = 'rgba(231,236,245,0.3)'; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(w * 0.25, cy); ctx.lineTo(w * 0.75, cy); ctx.stroke(); ctx.setLineDash([]);
        break;
      }
      case 'energia-potencial': {
        const y = cy + Math.sin(t) * 20;
        desenharCargaSimples(ctx, w * 0.3, cy, true);
        desenharCargaSimples(ctx, w * 0.7, y, false, 16);
        break;
      }
      default:
        desenharCargaSimples(ctx, w / 2, cy, true);
    }
  }

  // // ------------------------------------------------------------------
  // // LABORATÓRIO ELÉTRICO
  // // ------------------------------------------------------------------
  // async function renderLaboratorio() {
  //   main.innerHTML = bannerDemo() + cabecalho('Laboratório Elétrico', 'Entre em uma missão, interaja com as simulações e desbloqueie recompensas.') + UI.loadingBlock('Carregando fases…');
  //   const fases = await PhysicsContent.getFasesJogo();

  //   const cardsHTML = fases.map((f, i) => {
  //     const anteriorConcluida = i === 0 || PhysicsProgress.isFaseConcluida(fases[i - 1].id_fase);
  //     const concluida = PhysicsProgress.isFaseConcluida(f.id_fase);
  //     const resultado = PhysicsProgress.getFaseResultado(f.id_fase);
  //     const bloqueada = !anteriorConcluida;
  //     return `
  //     <div class="fase-card ${bloqueada ? 'fase-card--bloqueada' : ''}">
  //       <div class="fase-card__topo">
  //         <span class="fase-card__numero">Fase ${f.ordem}</span>
  //         ${UI.difficultyBadge(f.dificuldade)}
  //       </div>
  //       <h3>${UI.escapeHtml(f.titulo)}</h3>
  //       <p>${UI.escapeHtml(f.descricao)}</p>
  //       <div class="fase-card__meta">
  //         <span>${f.xp} XP</span>
  //         <span>${f.pontuacao_maxima} pts</span>
  //       </div>
  //       ${concluida ? `<div class="fase-card__estrelas">${UI.starRow(resultado ? resultado.estrelas : 1)}</div>` : ''}
  //       ${bloqueada
  //         ? `<span class="fase-card__cadeado">Complete a fase anterior</span>`
  //         : `<a class="btn btn--primary" href="#fase/${f.id_fase}">${concluida ? 'Jogar novamente' : 'Iniciar fase'}</a>`}
  //     </div>`;
  //   }).join('');

  //   main.innerHTML = bannerDemo() + cabecalho('Laboratório Elétrico', 'Entre em uma missão, interaja com as simulações e desbloqueie recompensas.') + `<div class="laboratorio-intro"><div><span class="trilha-kicker">MISSÕES INTERATIVAS</span><h2>Laboratório</h2><p>Complete fases, acerte desafios, ganhe XP e revele novas fórmulas.</p></div><div class="lab-stat">${PhysicsProgress.getFasesConcluidasCount()}/${fases.length}<small>fases concluídas</small></div></div><div class="fase-grid">${cardsHTML}</div>`;
  // }

  // async function renderFasePage(idFase) {
  //   main.innerHTML = UI.loadingBlock('Preparando a fase…');
  //   const fase = await PhysicsContent.getFase(idFase);
  //   if (!fase) { main.innerHTML = UI.errorBlock('Fase não encontrada.'); return; }

  //   main.innerHTML = cabecalho(`Fase ${fase.ordem} — ${fase.titulo}`, '', '#laboratorio') + `<div id="fase-container"></div>`;
  //   UI.mascotFloatShow('Pronto para o desafio?');
  //   PhysicsGame.iniciarFase(idFase, main.querySelector('#fase-container'));
  // }

  // ------------------------------------------------------------------
  // ATIVIDADES
  // ------------------------------------------------------------------
  async function renderAtividades() {
    main.innerHTML = bannerDemo() + cabecalho('Atividades', 'Exercícios de todos os módulos.') + UI.loadingBlock('Carregando atividades…');
    const [atividades, modulos] = await Promise.all([PhysicsContent.getTodasAtividades(), PhysicsContent.getModulos()]);

    if (!atividades.length) { main.innerHTML = bannerDemo() + cabecalho('Atividades', '') + UI.emptyBlock('Nenhuma atividade cadastrada ainda.'); return; }

    const listaHTML = atividades.map((a) => {
      const modulo = modulos.find((m) => m.id_modulo === a.id_modulo);
      const concluida = PhysicsProgress.isAtividadeConcluida(a.id_atividade);
      return `
      <div class="atividade-item">
        <div>
          <p class="atividade-item__titulo">${UI.escapeHtml(a.titulo)}</p>
          <p class="atividade-item__modulo">${modulo ? UI.escapeHtml(modulo.titulo) : ''}</p>
        </div>
        ${UI.difficultyBadge(a.dificuldade)}
        <span>+${a.xp_recompensa} XP</span>
        <span class="atividade-item__status ${concluida ? 'is-ok' : ''}">${concluida ? 'Concluída' : 'Pendente'}</span>
        ${modulo ? `<a class="btn btn--outline btn--sm" href="#conteudo/${modulo.id_modulo}">Responder</a>` : ''}
      </div>`;
    }).join('');

    main.innerHTML = bannerDemo() + cabecalho('Atividades', 'Exercícios de todos os módulos.') + `<div class="atividade-lista">${listaHTML}</div>`;
  }

  // ------------------------------------------------------------------
  // CONQUISTAS
  // ------------------------------------------------------------------
  async function renderConquistas() {
    main.innerHTML = bannerDemo() + cabecalho('Conquistas', 'Desbloqueie selos ao dominar o conteúdo.') + UI.loadingBlock('Carregando conquistas…');
    const conquistas = await PhysicsProgress.getConquistasComStatus();
    main.innerHTML = bannerDemo() + cabecalho('Conquistas', 'Desbloqueie selos ao dominar o conteúdo.') + `
      <div class="conquista-grid">
        ${conquistas.map((c) => `
        <div class="conquista-card ${c.desbloqueada ? '' : 'conquista-card--bloqueada'}">
          <span class="conquista-card__icone">${c.desbloqueada ? UI.escapeHtml(c.icone || 'Conquista') : 'Bloqueada'}</span>
          <h3>${UI.escapeHtml(c.nome)}</h3>
          <p>${UI.escapeHtml(c.descricao)}</p>
          <span class="conquista-card__xp">+${c.xp_recompensa} XP</span>
        </div>`).join('')}
      </div>`;
  }

  // ------------------------------------------------------------------
  // RANKING
  // ------------------------------------------------------------------
  async function renderRanking() {
    main.innerHTML = bannerDemo() + cabecalho('Ranking', '') + UI.loadingBlock('Carregando ranking…');
    const ranking = await PhysicsProgress.getRanking();
    main.innerHTML = bannerDemo() + cabecalho('Ranking', '') + `
      <div class="ranking-tabela">
        <div class="ranking-linha ranking-linha--cabecalho"><span>#</span><span>Aluno</span><span>Pontuação</span></div>
        ${ranking.map((r) => `
        <div class="ranking-linha ${r.isCurrentUser ? 'ranking-linha--voce' : ''}">
          <span>${r.posicao}º</span><span>${UI.escapeHtml(r.nome)}</span><span>${UI.formatNumber(r.pontuacao)}</span>
        </div>`).join('')}
      </div>`;
  }

  // ------------------------------------------------------------------
  // PERFIL
  // ------------------------------------------------------------------
  async function renderPerfil() {
    main.innerHTML = bannerDemo() + cabecalho('Meu Perfil', 'Seu progresso, fórmulas e conquistas.') + UI.loadingBlock('Carregando perfil…');
    const { usuario, aluno, demoMode } = PhysicsAuth.getState();
    const resumo = await PhysicsProgress.getResumoAluno();
    const conquistas = await PhysicsProgress.getConquistasComStatus();
    const todasFormulas = (await PhysicsContent.getModulos(1)).flatMap(async m => PhysicsContent.getFormulasDoModulo(m.id_modulo));
    const formulasArrays = await Promise.all(todasFormulas);
    const formulas = formulasArrays.flat();
    const desbloqueadas = formulas.filter(f => PhysicsProgress.isFormulaDesbloqueada(f.id_formula));

    main.innerHTML = bannerDemo() + cabecalho('Meu Perfil', '') + `
      <section class="perfil">
        <div class="perfil__topo">${UI.mascotSVG(50)}<div><h2>${UI.escapeHtml(usuario.nome)}</h2><p>Nível ${resumo.nivel} ${demoMode ? '· conta de demonstração' : ''}</p></div></div>
        ${UI.xpBar(resumo.xpNoNivel, resumo.xpParaProximo, resumo.nivel)}
        <div class="dashboard__stats">
          <div class="stat-card"><span>${UI.formatNumber(resumo.xpTotal)}</span><small>XP total</small></div>
          <div class="stat-card"><span>${resumo.desafiosConcluidos}</span><small>Desafios concluídos</small></div>
          <div class="stat-card"><span>${desbloqueadas.length}</span><small>Fórmulas desbloqueadas</small></div>
          <div class="stat-card"><span>${resumo.conquistasDesbloqueadas}/${resumo.conquistasTotais}</span><small>Conquistas</small></div>
        </div>
        <section class="perfil-section"><div class="section-heading"><div><span class="trilha-kicker">CONQUISTAS</span><h2>Minha coleção</h2></div></div><div class="conquista-grid">${conquistas.map(c => `<div class="conquista-card ${c.desbloqueada ? '' : 'conquista-card--bloqueada'}"><span class="conquista-card__icone">${c.desbloqueada ? UI.escapeHtml(c.icone || 'Conquista') : 'Bloqueada'}</span><h3>${UI.escapeHtml(c.nome)}</h3><p>${UI.escapeHtml(c.descricao)}</p><span class="conquista-card__xp">+${c.xp_recompensa} XP</span></div>`).join('')}</div></section>
        <section class="perfil-section"><div class="section-heading"><div><span class="trilha-kicker">FÓRMULAS</span><h2>Fórmulas desbloqueadas</h2></div><span>${desbloqueadas.length}</span></div><div class="formula-unlocked-grid">${desbloqueadas.length ? desbloqueadas.map(f => `<div class="formula-unlocked-card"><span>Desbloqueada</span><strong>${UI.escapeHtml(f.expressao)}</strong><small>${UI.escapeHtml(f.nome)}</small></div>`).join('') : '<div class="formula-locked-empty">Nenhuma fórmula desbloqueada ainda.</div>'}</div></section>
        <button class="btn btn--ghost" id="btn-sair">Sair</button>
      </section>`;
    main.querySelector('#btn-sair').addEventListener('click', async () => { await PhysicsAuth.logout(); location.hash = '#aprender'; });
  }

  // ------------------------------------------------------------------
  // NAVEGAÇÃO / MENU MOBILE / INICIALIZAÇÃO
  // ------------------------------------------------------------------
  function ligarMenuMobile() {
    const botao = document.getElementById('menu-toggle');
    if (!botao) return;
    botao.addEventListener('click', () => {
      const aberto = document.body.classList.toggle('menu-aberto');
      botao.setAttribute('aria-expanded', String(aberto));
      botao.setAttribute('aria-label', aberto ? 'Fechar menu lateral' : 'Abrir menu lateral');
    });
    document.querySelectorAll('.nav__link').forEach((a) => a.addEventListener('click', () => {
      fecharMenuMobile();
      botao.setAttribute('aria-expanded', 'false');
      botao.setAttribute('aria-label', 'Abrir menu lateral');
    }));

    // Fecha o menu ao clicar em qualquer área fora do painel ou do botão de abertura.
    // O listener fica no document para funcionar também sobre a camada escurecida.
    document.addEventListener('click', (event) => {
      if (!document.body.classList.contains('menu-aberto')) return;
      const nav = document.querySelector('.nav');
      const clicouNoMenu = nav && nav.contains(event.target);
      const clicouNoBotao = botao.contains(event.target);
      if (!clicouNoMenu && !clicouNoBotao) {
        fecharMenuMobile();
        botao.setAttribute('aria-expanded', 'false');
        botao.setAttribute('aria-label', 'Abrir menu lateral');
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        fecharMenuMobile();
        botao.setAttribute('aria-expanded', 'false');
        botao.setAttribute('aria-label', 'Abrir menu lateral');
      }
    });
  }

  function atualizarVisibilidadeNav() {
    // As opções principais ficam sempre visíveis no menu.
    // Se o visitante não estiver logado, o roteador direciona as áreas protegidas para a tela de login.
    document.querySelectorAll('[data-precisa-login]').forEach((el) => {
      el.classList.remove('is-hidden');
    });
    const entrar = document.getElementById('nav-entrar');
    if (entrar) entrar.classList.toggle('is-hidden', PhysicsAuth.isLoggedIn());
  }

  async function iniciar() {
    ligarMenuMobile();
    await PhysicsAuth.init();
    atualizarVisibilidadeNav();
    PhysicsAuth.onChange(atualizarVisibilidadeNav);
    window.addEventListener('hashchange', rotear);
    rotear();
  }

  document.addEventListener('DOMContentLoaded', iniciar);
})();
