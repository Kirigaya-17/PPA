const menuItems =
    document.querySelectorAll(".menu-item");

const contentArea =
    document.getElementById("contentArea");


/* =========================
   CONTEÚDOS DA TURMA
========================= */

/*
    locked = true
        Conteúdo bloqueado.

    locked = false
        Conteúdo desbloqueado.
*/

const conteudos = [

    {
        id: 1,
        nome: "Aula 01",
        locked: false
    },

    {
        id: 2,
        nome: "Aula 02",
        locked: true
    },

    {
        id: 3,
        nome: "Aula 03",
        locked: true
    },

    {
        id: 4,
        nome: "Aula 04",
        locked: true
    },

    {
        id: 5,
        nome: "Aula 05",
        locked: true
    },

    {
        id: 6,
        nome: "Aula 06",
        locked: true
    }

];


/* =========================
   CONTEÚDOS
========================= */

function mostrarConteudos() {

    contentArea.innerHTML = "";


    const grid =
        document.createElement("div");

    grid.className = "content-grid";


    conteudos.forEach((conteudo) => {

        const item =
            document.createElement("div");

        item.className =
            "content-item";


        const label =
            document.createElement("div");

        label.className =
            "content-label";

        label.textContent =
            conteudo.locked
                ? "bloqueado para turma"
                : "desbloqueado para turma";


        const button =
            document.createElement("button");

        button.className =
            "content-button";


        if (conteudo.locked) {

            button.classList.add("locked");

        }
        else {

            button.classList.add("unlocked");

        }


        /*
            Clique no conteúdo
        */

        button.addEventListener(
            "click",
            () => {

                alternarConteudo(conteudo);

            }
        );


        item.appendChild(label);

        item.appendChild(button);

        grid.appendChild(item);

    });


    contentArea.appendChild(grid);

}


/* =========================
   BLOQUEAR / DESBLOQUEAR
========================= */

function alternarConteudo(conteudo) {

    conteudo.locked =
        !conteudo.locked;


    mostrarConteudos();

}


/* =========================
   NOTAS
========================= */

function mostrarNotas() {

    contentArea.innerHTML = `

        <div class="grades-container">

            <div class="grade-card">

                <h2>
                    Desempenho da turma
                </h2>

                <p>
                    Média geral: <strong>7,8</strong>
                </p>

                <p>
                    Maior nota: <strong>10</strong>
                </p>

                <p>
                    Menor nota: <strong>4</strong>
                </p>

            </div>


            <div class="grade-card">

                <h2>
                    Notas por conteúdo
                </h2>

                <table class="grade-table">

                    <thead>

                        <tr>

                            <th>
                                Conteúdo
                            </th>

                            <th>
                                Média
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        <tr>

                            <td>
                                Aula 01
                            </td>

                            <td class="grade">
                                8,5
                            </td>

                        </tr>


                        <tr>

                            <td>
                                Aula 02
                            </td>

                            <td class="grade">
                                7,2
                            </td>

                        </tr>


                        <tr>

                            <td>
                                Aula 03
                            </td>

                            <td class="grade">
                                7,8
                            </td>

                        </tr>

                    </tbody>

                </table>

            </div>


            <div class="grade-card">

                <h2>
                    Desempenho dos alunos
                </h2>

                <p>
                    Aqui posteriormente ficará o
                    gráfico de desempenho individual
                    e da turma.
                </p>

            </div>

        </div>

    `;

}


/* =========================
   ALUNOS
========================= */

function mostrarAlunos() {

    contentArea.innerHTML = `

        <div class="students">

            <div class="student-card">

                <h2>
                    João Silva
                </h2>

                <p>
                    Email:
                    joao@email.com
                </p>

                <p>
                    Média:
                    8,5
                </p>

            </div>


            <div class="student-card">

                <h2>
                    Maria Santos
                </h2>

                <p>
                    Email:
                    maria@email.com
                </p>

                <p>
                    Média:
                    9,2
                </p>

            </div>


            <div class="student-card">

                <h2>
                    Pedro Oliveira
                </h2>

                <p>
                    Email:
                    pedro@email.com
                </p>

                <p>
                    Média:
                    7,4
                </p>

            </div>


            <div class="student-card">

                <h2>
                    Ana Souza
                </h2>

                <p>
                    Email:
                    ana@email.com
                </p>

                <p>
                    Média:
                    8,8
                </p>

            </div>

        </div>

    `;

}


/* =========================
   MENU
========================= */

menuItems.forEach((item) => {

    item.addEventListener(
        "click",
        () => {

            menuItems.forEach((menu) => {

                menu.classList.remove("active");

            });


            item.classList.add("active");


            const section =
                item.dataset.section;


            if (section === "conteudo") {

                mostrarConteudos();

            }


            if (section === "notas") {

                mostrarNotas();

            }


            if (section === "alunos") {

                mostrarAlunos();

            }

        }
    );

});


/* =========================
   INICIAR
========================= */

mostrarConteudos();