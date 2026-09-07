import { mostrarAlerta, mostrarConfirmacao, mostrarPrompt } from './overlay.js';
import * as Turmas from './turmas.js';
import * as Questoes from './questoes.js';
import * as Perfil from './perfil.js';


// =================================
// ESTADO GLOBAL E SINCRONIZAÇÃO API
// =================================
export let state = {
    turmas: [],
    conteudos: []
};

// Puxa os dados do Python assim que a página carrega
export async function carregarDadosDoBanco() {
    try {
        const resposta = await fetch('/api/dados');
        if (resposta.ok) {
            const dados = await resposta.json();
            state.turmas = dados.turmas || [];
            state.conteudos = dados.conteudos || [];
            
            // Depois de carregar, renderiza a tela inicial
            carregarSecao('conteudo'); 
        }
    } catch (erro) {
        console.error("Erro ao carregar dados:", erro);
    }
}

// Envia o estado atualizado para o Python
export async function salvarDadosNoBanco() {
    try {
        await fetch('/api/dados', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': obterCsrfTokenGlobal()
            },
            body: JSON.stringify(state)
        });
    } catch (erro) {
        console.error("Erro ao salvar dados:", erro);
    }
}

function obterCsrfTokenGlobal() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
}

// =================================
// SELETORES DO DOM
// =================================
export const menuItems = document.querySelectorAll(".menu-item");
export const contentArea = document.getElementById("contentArea");
export const pageTitle = document.getElementById("pageTitle");

// =================================
// NAVEGAÇÃO DO MENU PRINCIPAL
// =================================
export function ativarMenu(section) {
    menuItems.forEach((menu) => {
        menu.classList.toggle("active", menu.dataset.section === section);
    });
}

export function carregarSecao(section) {
    ativarMenu(section);
    if (section === "conteudo") {
        Questoes.mostrarConteudos();
    } else if (section === "turmas") {
        Turmas.mostrarTurmas();
    } else if (section === "perfil") {
        Perfil.mostrarPerfil();
    }
}

// Configura os cliques dos botões da sidebar
menuItems.forEach((item) => {
    item.addEventListener("click", () => carregarSecao(item.dataset.section));
});

// Funções de logout e rota global
export function fazerLogout() {
    mostrarConfirmacao('Tem certeza que deseja sair?', () => {
        window.location.href = '/logout';
    });
}

export function voltarParaProfessorMenu() {
    window.location.href = '/professorMenu';
}

// =================================
// REGISTRO GLOBAL NO WINDOW
// Necessário para chamadas de onclick="" do HTML dinâmico
// =================================
window.carregarSecao = carregarSecao;
window.fazerLogout = fazerLogout;
window.voltarParaProfessorMenu = voltarParaProfessorMenu;

// Funções de Turmas
window.abrirTurma = Turmas.abrirTurma;
window.mostrarTurmas = Turmas.mostrarTurmas;
window.ativarAbaTurma = Turmas.ativarAbaTurma;
window.adicionarAluno = Turmas.adicionarAluno;
window.excluirAluno = Turmas.excluirAluno;
window.verNotasAluno = Turmas.verNotasAluno;
window.salvarNotasAluno = Turmas.salvarNotasAluno;
window.salvarNotasTabela = Turmas.salvarNotasTabela;
window.salvarDesempenhoQuestoes = Turmas.salvarDesempenhoQuestoes;
window.alternarLiberacaoConteudo = Turmas.alternarLiberacaoConteudo;
window.editarTurma = Turmas.editarTurma;
window.excluirTurma = Turmas.excluirTurma;

// Funções de Conteúdos/Questões
window.mostrarConteudos = Questoes.mostrarConteudos;
window.verQuestoes = Questoes.verQuestoes;
window.abrirFormQuestao = Questoes.abrirFormQuestao;
window.atualizarCamposTipo = Questoes.atualizarCamposTipo;
window.adicionarAlternativa = Questoes.adicionarAlternativa;
window.removerAlternativa = Questoes.removerAlternativa;
window.adicionarItemColuna = Questoes.adicionarItemColuna;
window.removerItemColuna = Questoes.removerItemColuna;
window.salvarQuestao = Questoes.salvarQuestao;
window.editarQuestao = Questoes.editarQuestao;
window.excluirQuestao = Questoes.excluirQuestao;
window.excluirConteudo = Questoes.excluirConteudo;
window.criarConteudo = Questoes.criarConteudo;
window.criarTurma = Turmas.criarTurma;

// Funções de Perfil
window.mostrarPerfil = Perfil.mostrarPerfil;
window.trocarFoto = Perfil.trocarFoto;
window.editarBioInline = Perfil.editarBioInline;
window.editarEmail = Perfil.editarEmail;
window.editarNomeInline = Perfil.editarNomeInline;
window.editarContatoInline = Perfil.editarContatoInline;
window.editarSenhaInline = Perfil.editarSenhaInline;

// INICIALIZAÇÃO AUTOMÁTICA
carregarDadosDoBanco();

// =================================
// SERVICE WORKER PARA PWA
// =================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/static/js/sw.js')
            .then(reg => console.log("Service Worker registrado!"))
            .catch(err => console.error("Erro no Service Worker:", err));
    });
}

// ==========================================
// MENU MOBILE (HAMBÚRGUER) - CORRIGIDO
// ==========================================
{
    const btnMenuMobile = document.getElementById('menuToggle');
    const barraLateralMobile = document.querySelector('.sidebar');
    const botoesMenuLateral = document.querySelectorAll('.menu-item');

    if (btnMenuMobile && barraLateralMobile) {
        // Abre e fecha o menu ao clicar nas 3 barras
        btnMenuMobile.addEventListener('click', () => {
            barraLateralMobile.classList.toggle('open');
        });

        // Fecha o painel automaticamente após tocar em um botão no celular
        botoesMenuLateral.forEach(botao => {
            botao.addEventListener('click', () => {
                if (window.innerWidth <= 600) {
                    barraLateralMobile.classList.remove('open');
                }
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const darkModeBtn = document.getElementById('btn-dark-mode');
    
    // Verifica se o usuário já havia escolhido o modo escuro antes
    const currentTheme = localStorage.getItem('theme');
    
    // Se o tema salvo for 'dark', adiciona a classe ao body
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
        darkModeBtn.textContent = '☀️ Mudar Tema'; // Muda o ícone do botão
    }

    // Adiciona o evento de clique no botão
    if (darkModeBtn) {
        darkModeBtn.addEventListener('click', () => {
            // Alterna (liga/desliga) a classe 'dark-mode' no body
            document.body.classList.toggle('dark-mode');
            
            // Verifica qual é o tema atual para salvar
            let theme = 'light';
            if (document.body.classList.contains('dark-mode')) {
                theme = 'dark';
                darkModeBtn.textContent = '☀️ Mudar Tema';
            } else {
                darkModeBtn.textContent = '🌙 Mudar Tema';
            }
            
            // Salva a preferência no localStorage
            localStorage.setItem('theme', theme);
        });
    }
});