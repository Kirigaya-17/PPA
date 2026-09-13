/* ==========================================================================
   auth-shim.js
   Substitui completamente js/auth.js do AlphaFizic original.

   O AlphaFizic original usava Supabase Auth (login client-side, JWT, RLS).
   Essa rota é INCOMPATÍVEL com o requisito de integração: "o AlphaFizic
   deve utilizar o sistema de autenticação do PPA sempre que possível" e
   "não crie um segundo mecanismo independente de login".

   Este shim expõe a MESMA interface pública que app.js/game.js/progress.js
   já esperam de `PhysicsAuth` (para não precisar reescrever esses
   arquivos), mas a identidade vem inteiramente do servidor: a rota
   Flask /aluno já exige login + papel 'aluno' (roles_required) antes de
   sequer servir esta página, e injeta os dados iniciais do aluno via
   `window.__ESTADO_INICIAL__` (ver alunoMenu.html, usando |tojson).

   Como a autenticação real já aconteceu no servidor antes desta página
   carregar, `isLoggedIn()` é sempre true aqui -- não existe mais tela de
   login dentro da SPA de física; login/cadastro/logout redirecionam para
   as rotas reais do PPA.
   ========================================================================== */

const PhysicsAuth = (() => {
  const inicial = window.__ESTADO_INICIAL__ || { usuario: null, aluno: null };

  let state = {
    session: { fake: true },
    usuario: inicial.usuario,
    aluno: inicial.aluno,
    demoMode: false,
    ready: true
  };

  const listeners = [];

  function onChange(fn) {
    listeners.push(fn);
  }

  function notify() {
    listeners.forEach((fn) => {
      try { fn(state); } catch (e) { console.error('[Auth] listener falhou:', e); }
    });
  }

  function getState() {
    return state;
  }

  function isLoggedIn() {
    return !!(state.usuario && state.aluno);
  }

  function isDemo() {
    return false; // não existe mais modo de demonstração dentro do PPA autenticado
  }

  async function init() {
    // Nada a inicializar: a identidade já veio pronta do servidor.
    notify();
  }

  // Login/cadastro/logout sempre redirecionam para as rotas REAIS do PPA
  // (que já têm CSRF, hashing de senha, rate limiting etc.) -- nunca
  // reimplementados aqui.
  async function login() {
    window.location.href = '/login';
    return { ok: false, message: 'Redirecionando para o login do PPA...' };
  }

  async function registrar() {
    window.location.href = '/cadastro';
    return { ok: false, message: 'Redirecionando para o cadastro do PPA...' };
  }

  async function logout() {
    window.location.href = '/logout';
  }

  /** Usado por progress.js após ganhar XP/moedas -- aqui só atualiza a UI;
   * quem grava de verdade é sempre o servidor (ver /api/fisica/*). */
  function atualizarAlunoLocal(patch) {
    state.aluno = { ...state.aluno, ...patch };
    notify();
  }

  return {
    init, onChange, getState, isLoggedIn, isDemo,
    login, registrar, logout, atualizarAlunoLocal
  };
})();

window.PhysicsAuth = PhysicsAuth;
