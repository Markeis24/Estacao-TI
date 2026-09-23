require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");


// ========================================
// EXPRESS
// ========================================

const app = express();

const PORT = 3000;


// ========================================
// SERVIDOR HTTP
// ========================================

const server = http.createServer(app);


// ========================================
// SOCKET.IO
// ========================================

const io = new Server(server, {

    cors: {
        origin: "*"
    }

});


// ========================================
// MIDDLEWARES
// ========================================

app.use(cors());

app.use(express.json());


// ========================================
// SITE
// ========================================

app.use(
    express.static(
        path.join(__dirname, "../public")
    )
);


// ========================================
// PÁGINA INICIAL
// ========================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "../public/index.html"
        )
    );

});


// ========================================
// TESTE DA API
// ========================================

app.get("/api/teste", (req, res) => {

    res.json({

        sucesso: true,

        mensagem: "A API está funcionando!"

    });

});


// ========================================
// BUSCAR MÚSICAS NO YOUTUBE
// ========================================

app.get("/api/search", async (req, res) => {

    try {

        const query = req.query.q;


        // -----------------------------
        // VALIDA PESQUISA
        // -----------------------------

        if (!query) {

            return res.status(400).json({

                sucesso: false,

                erro:
                    "Digite o nome de uma música ou artista."

            });

        }


        // -----------------------------
        // VALIDA CHAVE
        // -----------------------------

        if (!process.env.YOUTUBE_API_KEY) {

            return res.status(500).json({

                sucesso: false,

                erro:
                    "A chave da YouTube API não foi configurada."

            });

        }


        // -----------------------------
        // MONTA URL
        // -----------------------------

        const url = new URL(
            "https://www.googleapis.com/youtube/v3/search"
        );


        url.searchParams.set(
            "part",
            "snippet"
        );


        url.searchParams.set(
            "q",
            query
        );


        url.searchParams.set(
            "type",
            "video"
        );


        url.searchParams.set(
            "maxResults",
            "10"
        );


        url.searchParams.set(
            "videoEmbeddable",
            "true"
        );


        url.searchParams.set(
            "regionCode",
            "BR"
        );


        url.searchParams.set(
            "relevanceLanguage",
            "pt"
        );


        url.searchParams.set(
            "key",
            process.env.YOUTUBE_API_KEY
        );


        // -----------------------------
        // CONSULTA YOUTUBE
        // -----------------------------

        const response = await fetch(url);

        const data = await response.json();


        // -----------------------------
        // ERRO YOUTUBE
        // -----------------------------

        if (!response.ok) {

            console.error(
                "Erro da YouTube API:",
                data
            );


            return res.status(
                response.status
            ).json({

                sucesso: false,

                erro:
                    data.error?.message ||
                    "Erro ao pesquisar no YouTube."

            });

        }


        // -----------------------------
        // ORGANIZA RESULTADOS
        // -----------------------------

        const resultados = data.items.map(
            item => {

                return {

                    videoId:
                        item.id.videoId,

                    titulo:
                        item.snippet.title,

                    canal:
                        item.snippet.channelTitle,

                    descricao:
                        item.snippet.description,

                    imagem:
                        item.snippet.thumbnails
                            ?.medium?.url

                };

            }
        );


        // -----------------------------
        // RESPOSTA
        // -----------------------------

        res.json({

            sucesso: true,

            resultados

        });


    } catch (error) {

        console.error(
            "Erro no servidor:",
            error
        );


        res.status(500).json({

            sucesso: false,

            erro:
                "Erro interno do servidor."

        });

    }

});


// ========================================
// SALAS
// ========================================
//
// Estrutura:
//
// salas = {
//
//     ABC123: {
//
//         usuarios: 2,
//
//         fila: [],
//
//         indiceAtual: -1,
//
//         tocando: false,
//
//         posicao: 0
//
//     }
//
// }
// ========================================

const salas = new Map();


// ========================================
// GERAR CÓDIGO DA SALA
// ========================================

function gerarCodigoSala() {

    const caracteres =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";


    let codigo;


    do {

        codigo = "";

        for (let i = 0; i < 6; i++) {

            const indice =
                Math.floor(
                    Math.random() *
                    caracteres.length
                );

            codigo += caracteres[indice];

        }

    } while (salas.has(codigo));


    return codigo;

}


// ========================================
// CRIAR SALA
// ========================================

function criarSala() {

    const codigo = gerarCodigoSala();


    salas.set(codigo, {

        fila: [],

        indiceAtual: -1,

        tocando: false,

        posicao: 0

    });


    return codigo;

}


// ========================================
// SOCKET.IO
// ========================================

io.on("connection", (socket) => {

    console.log(
        "Usuário conectado:",
        socket.id
    );


    // ====================================
    // CRIAR SALA
    // ====================================

    socket.on(
        "criar-sala",
        () => {

            const codigo =
                criarSala();


            socket.join(codigo);


            socket.sala = codigo;


            console.log(
                `Sala criada: ${codigo}`
            );


            socket.emit(
                "sala-criada",
                {

                    codigo,

                    estado:
                        salas.get(codigo)

                }
            );

        }
    );


    // ====================================
    // ENTRAR EM SALA
    // ====================================

    socket.on(
        "entrar-sala",
        (codigoRecebido) => {

            const codigo =
                String(codigoRecebido || "")
                    .trim()
                    .toUpperCase();


            // ----------------------------
            // VALIDA CÓDIGO
            // ----------------------------

            if (!codigo) {

                socket.emit(
                    "erro-sala",
                    "Informe o código da sala."
                );

                return;

            }


            // ----------------------------
            // VERIFICA SE EXISTE
            // ----------------------------

            if (!salas.has(codigo)) {

                socket.emit(
                    "erro-sala",
                    "Essa sala não existe."
                );

                return;

            }


            // ----------------------------
            // SAI DA SALA ANTERIOR
            // ----------------------------

            if (socket.sala) {

                socket.leave(
                    socket.sala
                );

            }


            // ----------------------------
            // ENTRA NA NOVA SALA
            // ----------------------------

            socket.join(codigo);


            socket.sala = codigo;


            const sala =
                salas.get(codigo);


            // ----------------------------
            // ENVIA ESTADO PARA USUÁRIO
            // ----------------------------

            socket.emit(
                "entrou-sala",
                {

                    codigo,

                    estado: sala

                }
            );


            // ----------------------------
            // AVISA A SALA
            // ----------------------------

            io.to(codigo).emit(
                "usuarios-atualizados",
                {

                    quantidade:
                        io.sockets.adapter
                            .rooms.get(codigo)
                            ?.size || 0

                }
            );


            console.log(
                `Usuário ${socket.id} entrou na sala ${codigo}`
            );

        }
    );


    // ====================================
    // ADICIONAR MÚSICA
    // ====================================

    socket.on(
        "adicionar-musica",
        (musica) => {

            const codigo =
                socket.sala;


            if (!codigo) {

                return;

            }


            const sala =
                salas.get(codigo);


            if (!sala) {

                return;

            }


            // ----------------------------
            // EVITA DUPLICADOS
            // ----------------------------

            const existe =
                sala.fila.some(
                    item =>
                        item.videoId ===
                        musica.videoId
                );


            if (existe) {

                return;

            }


            // ----------------------------
            // ADICIONA
            // ----------------------------

            sala.fila.push(musica);


            // ----------------------------
            // SE FOR A PRIMEIRA
            // ----------------------------

            if (
                sala.indiceAtual === -1
            ) {

                sala.indiceAtual = 0;

            }


            // ----------------------------
            // AVISA TODOS
            // ----------------------------

            io.to(codigo).emit(
                "fila-atualizada",
                {

                    fila:
                        sala.fila,

                    indiceAtual:
                        sala.indiceAtual

                }
            );


            console.log(
                `Música adicionada à sala ${codigo}:`,
                musica.titulo
            );

        }
    );


    // ====================================
    // REMOVER MÚSICA
    // ====================================

    socket.on(
        "remover-musica",
        (index) => {

            const codigo =
                socket.sala;


            const sala =
                salas.get(codigo);


            if (!sala) {

                return;

            }


            if (
                index < 0 ||
                index >= sala.fila.length
            ) {

                return;

            }


            sala.fila.splice(
                index,
                1
            );


            if (
                sala.fila.length === 0
            ) {

                sala.indiceAtual = -1;

                sala.tocando = false;

                sala.posicao = 0;

            } else if (
                index < sala.indiceAtual
            ) {

                sala.indiceAtual--;

            } else if (
                sala.indiceAtual >=
                sala.fila.length
            ) {

                sala.indiceAtual =
                    sala.fila.length - 1;

            }


            io.to(codigo).emit(
                "fila-atualizada",
                {

                    fila:
                        sala.fila,

                    indiceAtual:
                        sala.indiceAtual

                }
            );

        }
    );

// ========================================
// CONTROLES DA SALA
// ========================================

socket.on(
    "controle-sala",
    (dados) => {

        const codigo =
            socket.sala;


        if (!codigo) {

            return;

        }


        const sala =
            salas.get(codigo);


        if (!sala) {

            return;

        }


        const tipo =
            dados?.tipo;


        // ====================================
        // ADICIONAR
        // ====================================

        if (
            tipo === "adicionar"
        ) {

            const musica =
                dados.musica;


            if (
                !musica ||
                !musica.videoId
            ) {

                return;

            }


            const existe =
                sala.fila.some(
                    item =>
                        item.videoId ===
                        musica.videoId
                );


            if (existe) {

                return;

            }


            sala.fila.push(
                musica
            );


            if (
                sala.indiceAtual === -1
            ) {

                sala.indiceAtual = 0;

            }


            io.to(codigo).emit(
                "fila-atualizada",
                {

                    fila:
                        sala.fila,

                    indiceAtual:
                        sala.indiceAtual

                }
            );


            return;

        }


        // ====================================
        // TOCAR AGORA
        // ====================================

        if (
            tipo === "play-now"
        ) {

            const musica =
                dados.musica;


            if (
                !musica ||
                !musica.videoId
            ) {

                return;

            }


            const existente =
                sala.fila.findIndex(
                    item =>
                        item.videoId ===
                        musica.videoId
                );


            if (
                existente === -1
            ) {

                sala.fila.push(
                    musica
                );


                sala.indiceAtual =
                    sala.fila.length - 1;

            } else {

                sala.indiceAtual =
                    existente;

            }


            sala.posicao = 0;

            sala.tocando = true;


            io.to(codigo).emit(
                "fila-atualizada",
                {

                    fila:
                        sala.fila,

                    indiceAtual:
                        sala.indiceAtual

                }
            );


            io.to(codigo).emit(
                "estado-player",
                {

                    tocando:
                        sala.tocando,

                    posicao:
                        sala.posicao,

                    indiceAtual:
                        sala.indiceAtual

                }
            );


            return;

        }


        // ====================================
        // PLAY
        // ====================================

        if (
            tipo === "play"
        ) {

            if (
                sala.indiceAtual === -1
            ) {

                return;

            }


            sala.tocando = true;


            io.to(codigo).emit(
                "estado-player",
                {

                    tocando:
                        true,

                    posicao:
                        sala.posicao,

                    indiceAtual:
                        sala.indiceAtual

                }
            );


            return;

        }


        // ====================================
        // PAUSE
        // ====================================

        if (
            tipo === "pause"
        ) {

            sala.tocando = false;


            io.to(codigo).emit(
                "estado-player",
                {

                    tocando:
                        false,

                    posicao:
                        sala.posicao,

                    indiceAtual:
                        sala.indiceAtual

                }
            );


            return;

        }


        // ====================================
        // PRÓXIMA
        // ====================================

        if (
            tipo === "next"
        ) {

            if (
                sala.indiceAtual <
                sala.fila.length - 1
            ) {

                sala.indiceAtual++;

                sala.posicao = 0;

                sala.tocando = true;


                io.to(codigo).emit(
                    "fila-atualizada",
                    {

                        fila:
                            sala.fila,

                        indiceAtual:
                            sala.indiceAtual

                    }
                );


                io.to(codigo).emit(
                    "estado-player",
                    {

                        tocando:
                            true,

                        posicao:
                            0,

                        indiceAtual:
                            sala.indiceAtual

                    }
                );

            }


            return;

        }


        // ====================================
        // ANTERIOR
        // ====================================

        if (
            tipo === "previous"
        ) {

            if (
                sala.indiceAtual > 0
            ) {

                sala.indiceAtual--;

                sala.posicao = 0;

                sala.tocando = true;


                io.to(codigo).emit(
                    "fila-atualizada",
                    {

                        fila:
                            sala.fila,

                        indiceAtual:
                            sala.indiceAtual

                    }
                );


                io.to(codigo).emit(
                    "estado-player",
                    {

                        tocando:
                            true,

                        posicao:
                            0,

                        indiceAtual:
                            sala.indiceAtual

                    }
                );

            }


            return;

        }


        // ====================================
        // PLAY POR ÍNDICE
        // ====================================

        if (
            tipo === "play-index"
        ) {

            const index =
                Number(
                    dados.index
                );


            if (
                index < 0 ||
                index >= sala.fila.length
            ) {

                return;

            }


            sala.indiceAtual =
                index;


            sala.posicao = 0;

            sala.tocando = true;


            io.to(codigo).emit(
                "fila-atualizada",
                {

                    fila:
                        sala.fila,

                    indiceAtual:
                        sala.indiceAtual

                }
            );


            io.to(codigo).emit(
                "estado-player",
                {

                    tocando:
                        true,

                    posicao:
                        0,

                    indiceAtual:
                        sala.indiceAtual

                }
            );


            return;

        }


        // ====================================
        // REMOVER
        // ====================================

        if (
            tipo === "remove"
        ) {

            const index =
                Number(
                    dados.index
                );


            if (
                index < 0 ||
                index >= sala.fila.length
            ) {

                return;

            }


            sala.fila.splice(
                index,
                1
            );


            if (
                sala.fila.length === 0
            ) {

                sala.indiceAtual = -1;

                sala.tocando = false;

                sala.posicao = 0;

            } else if (
                index <
                sala.indiceAtual
            ) {

                sala.indiceAtual--;

            } else if (
                sala.indiceAtual >=
                sala.fila.length
            ) {

                sala.indiceAtual =
                    sala.fila.length - 1;

            }


            io.to(codigo).emit(
                "fila-atualizada",
                {

                    fila:
                        sala.fila,

                    indiceAtual:
                        sala.indiceAtual

                }
            );


            return;

        }


        // ====================================
        // MÚSICA TERMINOU
        // ====================================

        if (
            tipo === "ended"
        ) {

            const musicaAtual =
                sala.fila[
                    sala.indiceAtual
                ];


            if (
                !musicaAtual
            ) {

                return;

            }


            // --------------------------------
            // EVITA AVANÇAR ERRADO
            // --------------------------------

            if (
                dados.videoId !==
                musicaAtual.videoId
            ) {

                return;

            }


            if (
                sala.indiceAtual <
                sala.fila.length - 1
            ) {

                sala.indiceAtual++;

                sala.posicao = 0;

                sala.tocando = true;


                io.to(codigo).emit(
                    "fila-atualizada",
                    {

                        fila:
                            sala.fila,

                        indiceAtual:
                            sala.indiceAtual

                    }
                );


                io.to(codigo).emit(
                    "estado-player",
                    {

                        tocando:
                            true,

                        posicao:
                            0,

                        indiceAtual:
                            sala.indiceAtual

                    }
                );

            } else {

                sala.tocando = false;

                sala.posicao = 0;


                io.to(codigo).emit(
                    "estado-player",
                    {

                        tocando:
                            false,

                        posicao:
                            0,

                        indiceAtual:
                            sala.indiceAtual

                    }
                );

            }


            return;

        }

    }
);
    // ====================================
    // DESCONECTAR
    // ====================================

    socket.on(
        "disconnect",
        () => {

            console.log(
                "Usuário desconectado:",
                socket.id
            );


            if (!socket.sala) {

                return;

            }


            const codigo =
                socket.sala;


            const sala =
                salas.get(codigo);


            if (!sala) {

                return;

            }


            const quantidade =
                io.sockets.adapter
                    .rooms.get(codigo)
                    ?.size || 0;


            // ----------------------------
            // AVISA QUANTIDADE
            // ----------------------------

            io.to(codigo).emit(
                "usuarios-atualizados",
                {

                    quantidade

                }
            );


            // ----------------------------
            // APAGA SALA VAZIA
            // ----------------------------

            if (quantidade === 0) {

                salas.delete(codigo);


                console.log(
                    `Sala ${codigo} removida.`
                );

            }

        }
    );

});


// ========================================
// INICIAR SERVIDOR
// ========================================

server.listen(
    PORT,
    () => {

        console.log(
            `Servidor rodando em http://localhost:${PORT}`
        );

        console.log(
            "WebSocket ativo."
        );

    }
);