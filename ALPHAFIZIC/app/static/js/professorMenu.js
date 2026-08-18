const menuItems = document.querySelectorAll(".menu-item");

const contentArea = document.getElementById("contentArea");

const pageTitle = document.getElementById("pageTitle");


/* =================================
   CONTEÚDOS EXISTENTES
================================= */

const conteudos = [

    {
        titulo: "Aula 01",
        descricao: "Introdução à Física"
    },

    {
        titulo: "Aula 02",
        descricao: "Movimento"
    },

    {
        titulo: "Aula 03",
        descricao: "Velocidade"
    },

    {
        titulo: "Aula 04",
        descricao: "Aceleração"
    },

    {
        titulo: "Aula 05",
        descricao: "Forças"
    },

    {
        titulo: "Aula 06",
        descricao: "Energia"
    },

    {
        titulo: "Aula 07",
        descricao: "Trabalho"
    },

    {
        titulo: "Aula 08",
        descricao: "Potência"
    },

    {
        titulo: "Aula 09",
        descricao: "Gravidade"
    },

    {
        titulo: "Aula 10",
        descricao: "Leis de Newton"
    },

    {
        titulo: "Aula 11",
        descricao: "Eletricidade"
    },

    {
        titulo: "Aula 12",
        descricao: "Circuitos"
    }

];


/* =================================
   CONTEÚDO
================================= */

function mostrarConteudos() {

    pageTitle.textContent = "CONTEÚDOS";

    contentArea.innerHTML = "";

    /*
        Aqui ficam somente os conteúdos
        que já foram criados.
    */

    conteudos.forEach((conteudo) => {

        const card = document.createElement("div");

        card.className = "text-card";

        card.innerHTML = `

            <div>

                <h2>${conteudo.titulo}</h2>

                <p>${conteudo.descricao}</p>

            </div>

            <button class="action-button">
                EDITAR
            </button>

        `;

        contentArea.appendChild(card);

    });

}


/* =================================
   CRIAR
================================= */

function mostrarCriar() {

    pageTitle.textContent = "CRIAR";

    contentArea.innerHTML = `

        <div class="text-card">

            <h2>Novo conteúdo</h2>

            <p>
                Criar uma nova aula ou material.
            </p>

            <button
                class="action-button"
                onclick="criarConteudo()"
            >
                CRIAR
            </button>

        </div>


        <div class="text-card">

            <h2>Atividade</h2>

            <p>
                Criar uma atividade para os alunos.
            </p>

            <button
                class="action-button"
                onclick="criarAtividade()"
            >
                CRIAR
            </button>

        </div>


        <div class="text-card">

            <h2>Material</h2>

            <p>
                Adicionar material complementar.
            </p>

            <button
                class="action-button"
                onclick="criarMaterial()"
            >
                CRIAR
            </button>

        </div>

        <div class="text-card">

            <h2>Turmas</h2>

            <p>
                Criar e Adicionar uma nova Turma.
            </p>

            <button
                class="action-button"
                onclick="criarTurma()"
            >
                CRIAR
            </button>

        </div>

    `;

}


/* =================================
   TURMAS
================================= */

function mostrarTurmas() {

    pageTitle.textContent = "TURMAS";

    contentArea.innerHTML = `

        <div class="class-card">

            <h2>3º Ano A</h2>

            <p>
                32 alunos
            </p>

        </div>


        <div class="class-card">

            <h2>3º Ano B</h2>

            <p>
                28 alunos
            </p>

        </div>


        <div class="class-card">

            <h2>2º Ano A</h2>

            <p>
                30 alunos
            </p>

        </div>

    `;

}


/* =================================
   PERFIL
================================= */

function mostrarPerfil() {

    pageTitle.textContent = "PERFIL";

    contentArea.innerHTML = `

        <div class="profile">

            <h2>Professor</h2>

            <p>
                Nome do Professor
            </p>

            <br>

            <p>
                professor@email.com
            </p>

            <br>

            <button class="action-button">
                EDITAR PERFIL
            </button>

        </div>

    `;

}


/* =================================
   NAVEGAÇÃO
================================= */

menuItems.forEach((item) => {

    item.addEventListener("click", () => {

        menuItems.forEach((menu) => {

            menu.classList.remove("active");

        });

        item.classList.add("active");


        const section = item.dataset.section;


        if (section === "conteudo") {

            mostrarConteudos();

        }


        if (section === "criar") {

            mostrarCriar();

        }


        if (section === "turmas") {

            mostrarTurmas();

        }


        if (section === "perfil") {

            mostrarPerfil();

        }

    });

});


/* =================================
   FUNÇÕES DE CRIAÇÃO
================================= */

function criarConteudo() {

    alert("Tela para criar um novo conteúdo.");

}


function criarAtividade() {

    alert("Tela para criar uma atividade.");

}


function criarMaterial() {

    alert("Tela para adicionar um material.");

}

function criarTurma() {

    alert("Tela para adicionar uma Turma.");

}


/* =================================
   INICIALIZAÇÃO
================================= */

mostrarConteudos();
console.log("JavaScript do professor carregado!");