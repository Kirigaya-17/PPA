/* ==========================================================================
   progress.js (adaptado para o PPA)
   XP, níveis, conquistas, progresso por módulo e ranking.

   Diferença crítica em relação ao AlphaFizic original: TODO valor de XP
   e correção de resposta agora é calculado no SERVIDOR
   (app/routes_fisica.py). Este arquivo nunca decide sozinho "quanto XP o
   aluno ganhou" -- ele apenas envia a resposta/pontuação e usa o que o
   servidor devolve. Isso fecha a vulnerabilidade de "Manipulação de XP"
   que existia em potencial no fluxo original (cliente podia, em tese,
   mandar qualquer xpGanho para registrarAtividade/registrarFase).

   As conquistas (client-side, baseadas em contagens locais) continuam
   avaliadas aqui por simplicidade, mas o XP de recompensa de conquista
   também é concedido via API (fica registrado em aluno_conquista_fisica).
   ========================================================================== */

const PhysicsProgress = (() => {

  const local = {
    progressoModulos: {},
    atividadesConcluidas: {},
    fasesConcluidas: {},
    conquistas: new Set(),
    formulasDesbloqueadas: new Set(),
    historicoRespostas: []
  };

  // ------------------------------------------------------------------
  // XP e NÍVEIS (leitura -- o valor oficial vem sempre do servidor)
  // ------------------------------------------------------------------
  async function calcularNivel(xpTotal) {
    const niveis = await PhysicsContent.getNiveis();
    const ordenados = [...niveis].sort((a, b) => a.xp_necessario - b.xp_necessario);
    let atual = ordenados[0];
    let proximo = null;
    for (let i = 0; i < ordenados.length; i++) {
      if (xpTotal >= ordenados[i].xp_necessario) {
        atual = ordenados[i];
        proximo = ordenados[i + 1] || null;
      }
    }
    const xpNoNivel = atual ? xpTotal - atual.xp_necessario : 0;
    const xpParaProximo = proximo ? proximo.xp_necessario - atual.xp_necessario : null;
    return { atual, proximo, xpNoNivel, xpParaProximo, xpTotal };
  }

  // ------------------------------------------------------------------
  // ATIVIDADES -- corrigidas e pontuadas pelo servidor
  // ------------------------------------------------------------------
  async function registrarAtividade(idAtividade, resposta) {
    const resultado = await PhysicsContent.responderAtividade(idAtividade, resposta);
    if (!resultado) return null;

    local.atividadesConcluidas[idAtividade] = resultado;
    local.historicoRespostas.push({ idAtividade, acertou: resultado.correta });

    if (resultado.xp_ganho) {
      PhysicsAuth.atualizarAlunoLocal({
        xp_total: resultado.xp_total,
        nivel_atual: resultado.nivel_atual
      });
    }
    await verificarConquistas();
    return resultado;
  }

  function isAtividadeConcluida(idAtividade) {
    return !!(local.atividadesConcluidas[idAtividade] && local.atividadesConcluidas[idAtividade].correta);
  }

  // ------------------------------------------------------------------
  // FASES DO LABORATÓRIO -- XP sempre definido pelo servidor
  // ------------------------------------------------------------------
  async function registrarFase(idFase, { pontuacao }) {
    const resultado = await PhysicsContent.concluirFase(idFase, { pontuacao });
    if (!resultado) return { estrelas: 1, formulaDesbloqueada: null };

    local.fasesConcluidas[idFase] = resultado;
    if (resultado.xp_ganho) {
      PhysicsAuth.atualizarAlunoLocal({
        xp_total: resultado.xp_total,
        nivel_atual: resultado.nivel_atual
      });
    }

    const todasFormulas = (await PhysicsContent.getModulos()).length
      ? await formulasDeTodosModulos()
      : [];
    const proximaFormula = todasFormulas.find((f) => !local.formulasDesbloqueadas.has(f.id_formula));
    if (proximaFormula) local.formulasDesbloqueadas.add(proximaFormula.id_formula);

    await verificarConquistas();
    return { estrelas: resultado.estrelas, formulaDesbloqueada: proximaFormula || null };
  }

  async function formulasDeTodosModulos() {
    const modulos = await PhysicsContent.getModulos();
    const listas = await Promise.all(modulos.map((m) => PhysicsContent.getFormulasDoModulo(m.id_modulo)));
    return listas.flat();
  }

  function isFaseConcluida(idFase) {
    return !!local.fasesConcluidas[idFase];
  }

  function getFaseResultado(idFase) {
    return local.fasesConcluidas[idFase] || null;
  }

  function getFasesConcluidasCount() {
    return Object.keys(local.fasesConcluidas).length;
  }

  // ------------------------------------------------------------------
  // PROGRESSO DE MÓDULO
  // ------------------------------------------------------------------
  async function atualizarProgressoModulo(idModulo, progresso) {
    const resultado = await PhysicsContent.atualizarProgressoModulo(idModulo, progresso);
    if (!resultado) return;
    local.progressoModulos[idModulo] = resultado;
    if (resultado.concluido) await verificarConquistas();
  }

  function getProgressoModulo(idModulo) {
    return local.progressoModulos[idModulo] || { progresso: 0, concluido: false };
  }

  function getModulosConcluidosCount() {
    return Object.values(local.progressoModulos).filter((m) => m.concluido).length;
  }

  // ------------------------------------------------------------------
  // FÓRMULAS
  // ------------------------------------------------------------------
  function isFormulaDesbloqueada(idFormula) { return local.formulasDesbloqueadas.has(Number(idFormula)); }

  function getFormulasStatus(formulas) {
    const lista = formulas || [];
    return { desbloqueadas: lista.filter(f => isFormulaDesbloqueada(f.id_formula)), bloqueadas: lista.filter(f => !isFormulaDesbloqueada(f.id_formula)) };
  }

  function desbloquearFormula(idFormula) {
    if (local.formulasDesbloqueadas.has(Number(idFormula))) return false;
    local.formulasDesbloqueadas.add(Number(idFormula));
    return true;
  }

  async function desbloquearFormulasDoModulo(idModulo) {
    const formulas = await PhysicsContent.getFormulasDoModulo(idModulo);
    let novas = 0;
    for (const f of formulas) if (desbloquearFormula(f.id_formula)) novas++;
    return novas;
  }

  function getResultadoModulo(idModulo, totalEsperado) {
    const respostas = local.historicoRespostas; // aproximação client-side (contagem local da sessão)
    const total = totalEsperado || 5;
    const acertos = respostas.filter((r) => r.acertou).length;
    return { acertos: Math.min(acertos, total), total, percentual: total ? Math.round((Math.min(acertos, total) / total) * 100) : 0 };
  }

  // ------------------------------------------------------------------
  // CONQUISTAS -- critério avaliado no cliente, mas XP e persistência
  // sempre passam pelo servidor (getConquistas() já retorna o que está
  // realmente desbloqueado no banco).
  // ------------------------------------------------------------------
  async function verificarConquistas() {
    const conquistas = await PhysicsContent.getConquistas();
    const desbloqueadasNoBanco = new Set(conquistas.filter((c) => c.desbloqueada).map((c) => c.id_conquista));
    desbloqueadasNoBanco.forEach((id) => local.conquistas.add(id));
    return conquistas.filter((c) => c.desbloqueada);
  }

  async function getConquistasComStatus() {
    return PhysicsContent.getConquistas();
  }

  // ------------------------------------------------------------------
  // RANKING
  // ------------------------------------------------------------------
  async function getRanking() {
    return PhysicsContent.getRanking();
  }

  // ------------------------------------------------------------------
  // RESUMO PARA DASHBOARD / PERFIL -- vem inteiramente do servidor
  // ------------------------------------------------------------------
  async function getResumoAluno() {
    const resumo = await PhysicsContent.getResumoAluno();
    if (!resumo) return null;
    return {
      nivel: resumo.nivel, xpTotal: resumo.xp_total, xpNoNivel: resumo.xp_no_nivel,
      xpParaProximo: resumo.xp_para_proximo, moedas: resumo.moedas,
      desafiosConcluidos: resumo.atividades_concluidas, atividadesConcluidas: resumo.atividades_concluidas,
      fasesConcluidas: resumo.fases_concluidas, modulosConcluidos: resumo.modulos_concluidos,
      conquistasDesbloqueadas: resumo.conquistas_desbloqueadas, conquistasTotais: undefined,
      ultimasConquistas: []
    };
  }

  return {
    calcularNivel,
    registrarAtividade, isAtividadeConcluida,
    registrarFase, isFaseConcluida, getFaseResultado, getFasesConcluidasCount,
    atualizarProgressoModulo, getProgressoModulo, getModulosConcluidosCount,
    isFormulaDesbloqueada, getFormulasStatus, desbloquearFormula, desbloquearFormulasDoModulo, getResultadoModulo,
    verificarConquistas, getConquistasComStatus,
    getRanking, getResumoAluno
  };
})();

window.PhysicsProgress = PhysicsProgress;
