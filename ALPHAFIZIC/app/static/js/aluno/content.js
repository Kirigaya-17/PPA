/* ==========================================================================
   content.js (adaptado para o PPA)
   1) PhysicsCore  — constantes, conversão de unidades e fórmulas reais
      (inalterado em relação ao AlphaFizic original).
   2) PhysicsContent — busca conteúdos/módulos/fórmulas/exemplos/atividades
      via as rotas Flask do PPA (/api/fisica/...), que por sua vez leem do
      MySQL (tabelas *_fisica, populadas com o currículo real do AlphaFizic
      via `flask seed-fisica`).

   Diferença em relação ao original: a busca não passa mais pelo Supabase
   nem por um "modo de demonstração" -- o PPA já garante que só chega até
   aqui quem está autenticado como aluno, então os dados são sempre reais.
   ========================================================================== */

const PhysicsCore = (() => {
  const K = 8.99e9; // constante eletrostática no vácuo, N·m²/C²

  const prefixosCarga = { C: 1, mC: 1e-3, uC: 1e-6, 'μC': 1e-6, nC: 1e-9, pC: 1e-12 };
  const prefixosComprimento = { m: 1, cm: 1e-2, mm: 1e-3, km: 1e3 };

  function paraCoulomb(valor, unidade) {
    const f = prefixosCarga[unidade] !== undefined ? prefixosCarga[unidade] : 1;
    return valor * f;
  }
  function paraMetro(valor, unidade) {
    const f = prefixosComprimento[unidade] !== undefined ? prefixosComprimento[unidade] : 1;
    return valor * f;
  }

  function formatoCientifico(numero, casas = 3) {
    if (numero === 0) return '0';
    const abs = Math.abs(numero);
    if (abs >= 1e-3 && abs < 1e5) {
      return Number(numero.toPrecision(casas + 1)).toString().replace('.', ',');
    }
    const exp = Math.floor(Math.log10(abs));
    const mant = numero / Math.pow(10, exp);
    return `${mant.toFixed(casas).replace('.', ',')} × 10${sobrescrito(exp)}`;
  }

  function sobrescrito(n) {
    const map = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
    return String(n).split('').map((c) => map[c] || c).join('');
  }

  const formulasCalc = {
    coulomb: ({ Q1, Q2, d }) => (K * Math.abs(Q1 * Q2)) / (d * d),
    campoDefinicao: ({ F, q }) => F / q,
    campoPontual: ({ Q, d }) => (K * Math.abs(Q)) / (d * d),
    potencial: ({ Q, d }) => (K * Q) / d,
    ddp: ({ VA, VB }) => VB - VA,
    energiaPotencialV: ({ q, V }) => q * V,
    energiaPotencialQq: ({ Q, q, d }) => (K * Q * q) / d,
    trabalho: ({ q, VA, VB }) => q * (VA - VB),
    trabalhoEnergia: ({ deltaEp }) => -deltaEp,
    campoUniforme: ({ dV, d }) => dV / d
  };

  function calcular(nomeFuncao, valoresSI) {
    const fn = formulasCalc[nomeFuncao];
    if (!fn) throw new Error(`Fórmula "${nomeFuncao}" não implementada.`);
    return fn(valoresSI);
  }

  function campoVetorial(cargaQ, cargaX, cargaY, px, py) {
    const dx = px - cargaX;
    const dy = py - cargaY;
    const distSq = dx * dx + dy * dy;
    const dist = Math.sqrt(distSq) || 1e-6;
    const modulo = (K * Math.abs(cargaQ)) / distSq;
    const sinal = cargaQ >= 0 ? 1 : -1;
    return { ex: sinal * modulo * (dx / dist), ey: sinal * modulo * (dy / dist), modulo };
  }

  function potencialTotal(cargas, px, py) {
    return cargas.reduce((total, c) => {
      const d = Math.hypot(px - c.x, py - c.y) || 1e-6;
      return total + (K * c.q) / d;
    }, 0);
  }

  return { K, paraCoulomb, paraMetro, formatoCientifico, calcular, campoVetorial, potencialTotal };
})();


const PhysicsContent = (() => {

  function csrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
  }

  async function apiGet(url) {
    const resp = await fetch(url, { credentials: 'same-origin' });
    if (!resp.ok) {
      console.error(`[PhysicsContent] GET ${url} -> ${resp.status}`);
      return null;
    }
    return resp.json();
  }

  async function apiPost(url, body) {
    const resp = await fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken() },
      body: JSON.stringify(body || {})
    });
    if (!resp.ok) {
      console.error(`[PhysicsContent] POST ${url} -> ${resp.status}`);
      return null;
    }
    return resp.json();
  }

  let conteudoCache = null;
  async function getConteudo() {
    if (conteudoCache) return conteudoCache;
    const modulos = await getModulos();
    conteudoCache = { id_conteudo: modulos[0] ? modulos[0].id_conteudo : 1, titulo: 'Física', modulos };
    return conteudoCache;
  }

  async function getModulos() {
    return (await apiGet('/api/fisica/modulos')) || [];
  }

  async function getModulo(idModulo) {
    return apiGet(`/api/fisica/modulo/${idModulo}`);
  }

  async function getFormulasDoModulo(idModulo) {
    return (await apiGet(`/api/fisica/modulo/${idModulo}/formulas`)) || [];
  }

  async function getExemplosDoModulo(idModulo) {
    return (await apiGet(`/api/fisica/modulo/${idModulo}/exemplos`)) || [];
  }

  async function getAtividadesDoModulo(idModulo) {
    return (await apiGet(`/api/fisica/modulo/${idModulo}/atividades`)) || [];
  }

  async function getTodasAtividades() {
    const modulos = await getModulos();
    const listas = await Promise.all(modulos.map((m) => getAtividadesDoModulo(m.id_modulo)));
    return listas.flat();
  }

  async function getFasesJogo() {
    return (await apiGet('/api/fisica/fases')) || [];
  }

  async function getFase(idFase) {
    const fases = await getFasesJogo();
    return fases.find((f) => f.id_fase === Number(idFase));
  }

  async function getNiveis() {
    return (await apiGet('/api/fisica/niveis')) || [];
  }

  async function getConquistas() {
    return (await apiGet('/api/fisica/conquistas')) || [];
  }

  /**
   * Envia a resposta do aluno para correção NO SERVIDOR.
   * `resposta` é { id_alternativa } ou { valor }, nunca inclui XP/nota --
   * quem calcula isso é sempre o backend (ver app/routes_fisica.py).
   */
  async function responderAtividade(idAtividade, resposta) {
    return apiPost(`/api/fisica/atividade/${idAtividade}/responder`, resposta);
  }

  async function concluirFase(idFase, { pontuacao }) {
    return apiPost(`/api/fisica/fase/${idFase}/concluir`, { pontuacao });
  }

  async function atualizarProgressoModulo(idModulo, progresso) {
    return apiPost(`/api/fisica/modulo/${idModulo}/progresso`, { progresso });
  }

  async function getResumoAluno() {
    return apiGet('/api/fisica/resumo');
  }

  async function getRanking() {
    return (await apiGet('/api/fisica/ranking')) || [];
  }

  return {
    getConteudo, getModulos, getModulo, getFormulasDoModulo,
    getExemplosDoModulo, getAtividadesDoModulo, getTodasAtividades,
    getFasesJogo, getFase, getNiveis, getConquistas,
    responderAtividade, concluirFase, atualizarProgressoModulo,
    getResumoAluno, getRanking
  };
})();

window.PhysicsCore = PhysicsCore;
window.PhysicsContent = PhysicsContent;
