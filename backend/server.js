require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

// ========================================
// CONFIGURAÇÕES
// ========================================

const PORT = 3000;

// ========================================
// EXPRESS
// ========================================

const app = express();

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
// ARQUIVOS DO SITE
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
// PESQUISA NO YOUTUBE
// ========================================

app.get("/api/search", async (req, res) => {
    try {
        const query = req.query.q;

        // --------------------------------
        // VERIFICA PESQUISA
        // --------------------------------

        if (!query) {
            return res.status(400).json({
                sucesso: false,
                erro: "Digite o nome de uma música ou artista."
            });
        }

        // --------------------------------
        // VERIFICA API KEY
        // --------------------------------

        if (!process.env.YOUTUBE_API_KEY) {
            return res.status(500).json({
                sucesso: false,
                erro: "A chave da YouTube API não foi configurada."
            });
        }

        // --------------------------------
        // MONTA URL
        // --------------------------------

        const url = new URL(
            "https://www.googleapis.com/youtube/v3/search"
        );

        url.searchParams.set("part", "snippet");
        url.searchParams.set("q", query);
        url.searchParams.set("type", "video");
        url.searchParams.set("maxResults", "10");
        url.searchParams.set("videoEmbeddable", "true");
        url.searchParams.set("regionCode", "BR");
        url.searchParams.set("relevanceLanguage", "pt");
        url.searchParams.set(
            "key",
            process.env.YOUTUBE_API_KEY
        );

        // --------------------------------
        // CONSULTA YOUTUBE
        // --------------------------------

        const response = await fetch(url);
        const data = await response.json();

        // --------------------------------
        // TRATA ERRO
        // --------------------------------

        if (!response.ok) {
            console.error(
                "Erro da YouTube API:",
                data
            );

            return res.status(response.status).json({
                sucesso: false,
                erro:
                    data.error?.message ||
                    "Erro ao pesquisar no YouTube."
            });
        }

        // --------------------------------
        // ORGANIZA RESULTADOS
        // --------------------------------

        const resultados = data.items.map(
            (item) => ({
                videoId: item.id.videoId,
                titulo: item.snippet.title,
                canal: item.snippet.channelTitle,
                descricao: item.snippet.description,
                imagem:
                    item.snippet.thumbnails
                        ?.medium?.url
            })
        );

        // --------------------------------
        // RETORNA
        // --------------------------------

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
            erro: "Erro interno do servidor."
        });
    }
});

// ========================================
// SALAS
// ========================================
//
// Cada sala possui:
//
// {
//     fila: [],
//     indiceAtual: -1,
//     tocando: false,
//     posicao: 0,
//     atualizadoEm: timestamp
// }
//
// ========================================

const salas = new Map();

// ========================================
// GERAR CÓDIGO
// ========================================

function gerarCodigoSala() {
    const caracteres =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let codigo;

    do {
        codigo = "";

        for (let i = 0; i < 6; i++) {
            const indice = Math.floor(
                Math.random() * caracteres.length
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
        posicao: 0,
        atualizadoEm: Date.now()
    });

    return codigo;
}

// ========================================
// CALCULAR POSIÇÃO ATUAL
// ========================================

function obterPosicaoAtual(sala) {
    if (!sala.tocando) {
        return sala.posicao;
    }

    const agora = Date.now();

    const segundos =
        (agora - sala.atualizadoEm) / 1000;

    return sala.posicao + segundos;
}

// ========================================
// ATUALIZAR POSIÇÃO DA SALA
// ========================================

function salvarPosicaoAtual(sala) {
    sala.posicao = obterPosicaoAtual(sala);
    sala.atualizadoEm = Date.now();
}

// ========================================
// ENVIAR ESTADO DO PLAYER
// ========================================

function enviarEstadoPlayer(codigo) {
    const sala = salas.get(codigo);

    if (!sala) {
        return;
    }

    const posicao = obterPosicaoAtual(sala);

    io.to(codigo).emit(
        "estado-player",
        {
            tocando: sala.tocando,
            posicao: Math.max(0, posicao),
            indiceAtual: sala.indiceAtual
        }
    );
}

// ========================================
// ENVIAR FILA
// ========================================

function enviarFila(codigo) {
    const sala = salas.get(codigo);

    if (!sala) {
        return;
    }

    io.to(codigo).emit(
        "fila-atualizada",
        {
            fila: sala.fila,
            indiceAtual: sala.indiceAtual
        }
    );
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

    socket.on("criar-sala", () => {

        // ----------------------------
        // Se já estava em uma sala
        // ----------------------------

        if (socket.sala) {
            socket.leave(socket.sala);
        }

        // ----------------------------
        // Cria nova sala
        // ----------------------------

        const codigo = criarSala();

        const sala = salas.get(codigo);

        // ----------------------------
        // Entra
        // ----------------------------

        socket.join(codigo);
        socket.sala = codigo;

        // ----------------------------
        // Envia estado
        // ----------------------------

        socket.emit(
            "sala-criada",
            {
                codigo,
                estado: sala
            }
        );

        // ----------------------------
        // Atualiza usuários
        // ----------------------------

        atualizarQuantidadeUsuarios(codigo);

        console.log(
            `Sala criada: ${codigo}`
        );
    });

    // ====================================
    // ENTRAR EM SALA
    // ====================================

    socket.on(
        "entrar-sala",
        (codigoRecebido) => {

            const codigo = String(
                codigoRecebido || ""
            )
                .trim()
                .toUpperCase();

            // ----------------------------
            // Verifica código
            // ----------------------------

            if (!codigo) {
                socket.emit(
                    "erro-sala",
                    "Informe o código da sala."
                );

                return;
            }

            // ----------------------------
            // Verifica existência
            // ----------------------------

            if (!salas.has(codigo)) {
                socket.emit(
                    "erro-sala",
                    "Essa sala não existe."
                );

                return;
            }

            // ----------------------------
            // Sai da sala anterior
            // ----------------------------

            if (socket.sala) {
                const salaAnterior =
                    socket.sala;

                socket.leave(salaAnterior);

                atualizarQuantidadeUsuarios(
                    salaAnterior
                );
            }

            // ----------------------------
            // Entra
            // ----------------------------

            socket.join(codigo);
            socket.sala = codigo;

            const sala = salas.get(codigo);

            // ----------------------------
            // Envia estado
            // ----------------------------

            socket.emit(
                "entrou-sala",
                {
                    codigo,
                    estado: {
                        fila: sala.fila,
                        indiceAtual:
                            sala.indiceAtual,
                        tocando:
                            sala.tocando,
                        posicao:
                            obterPosicaoAtual(
                                sala
                            )
                    }
                }
            );

            // ----------------------------
            // Atualiza usuários
            // ----------------------------

            atualizarQuantidadeUsuarios(codigo);

            console.log(
                `Usuário ${socket.id} entrou na sala ${codigo}`
            );
        }
    );

    // ====================================
    // CONTROLES DA SALA
    // ====================================

    socket.on(
        "controle-sala",
        (dados) => {

            const codigo = socket.sala;

            if (!codigo) {
                return;
            }

            const sala = salas.get(codigo);

            if (!sala) {
                return;
            }

            const tipo = dados?.tipo;

            // =================================
            // ADICIONAR
            // =================================

            if (tipo === "adicionar") {

                const musica =
                    limparMusica(
                        dados.musica
                    );

                if (!musica) {
                    return;
                }

                const existe =
                    sala.fila.some(
                        (item) =>
                            item.videoId ===
                            musica.videoId
                    );

                if (existe) {
                    return;
                }

                sala.fila.push(musica);

                // Primeira música
                if (sala.indiceAtual === -1) {
                    sala.indiceAtual = 0;
                    sala.posicao = 0;
                    sala.tocando = false;
                }

                sala.atualizadoEm = Date.now();

                enviarFila(codigo);
                enviarEstadoPlayer(codigo);

                console.log(
                    `Música adicionada na sala ${codigo}: ${musica.titulo}`
                );

                return;
            }

            // =================================
            // TOCAR AGORA
            // =================================

            if (tipo === "play-now") {

                const musica =
                    limparMusica(
                        dados.musica
                    );

                if (!musica) {
                    return;
                }

                const indiceExistente =
                    sala.fila.findIndex(
                        (item) =>
                            item.videoId ===
                            musica.videoId
                    );

                if (indiceExistente === -1) {
                    sala.fila.push(musica);

                    sala.indiceAtual =
                        sala.fila.length - 1;
                } else {
                    sala.indiceAtual =
                        indiceExistente;
                }

                sala.posicao = 0;
                sala.tocando = true;
                sala.atualizadoEm = Date.now();

                enviarFila(codigo);
                enviarEstadoPlayer(codigo);

                console.log(
                    `Tocando agora na sala ${codigo}: ${musica.titulo}`
                );

                return;
            }

            // =================================
            // PLAY
            // =================================

            if (tipo === "play") {

                if (sala.indiceAtual === -1) {
                    return;
                }

                sala.posicao =
                    obterPosicaoAtual(sala);

                sala.tocando = true;
                sala.atualizadoEm = Date.now();

                enviarEstadoPlayer(codigo);

                return;
            }

            // =================================
            // PAUSE
            // =================================

            if (tipo === "pause") {

                salvarPosicaoAtual(sala);

                sala.tocando = false;

                enviarEstadoPlayer(codigo);

                return;
            }

            // =================================
            // NEXT
            // =================================

            if (tipo === "next") {

                if (
                    sala.indiceAtual <
                    sala.fila.length - 1
                ) {
                    sala.indiceAtual++;
                    sala.posicao = 0;
                    sala.tocando = true;
                    sala.atualizadoEm = Date.now();

                    enviarFila(codigo);
                    enviarEstadoPlayer(codigo);
                }

                return;
            }

            // =================================
            // PREVIOUS
            // =================================

            if (tipo === "previous") {

                if (sala.indiceAtual > 0) {
                    sala.indiceAtual--;
                    sala.posicao = 0;
                    sala.tocando = true;
                    sala.atualizadoEm = Date.now();

                    enviarFila(codigo);
                    enviarEstadoPlayer(codigo);
                }

                return;
            }

            // =================================
            // PLAY POR ÍNDICE
            // =================================

            if (tipo === "play-index") {

                const index =
                    Number(dados.index);

                if (!Number.isInteger(index)) {
                    return;
                }

                if (
                    index < 0 ||
                    index >= sala.fila.length
                ) {
                    return;
                }

                sala.indiceAtual = index;
                sala.posicao = 0;
                sala.tocando = true;
                sala.atualizadoEm = Date.now();

                enviarFila(codigo);
                enviarEstadoPlayer(codigo);

                return;
            }

            // =================================
            // REMOVER
            // =================================

            if (tipo === "remove") {

                const index =
                    Number(dados.index);

                if (!Number.isInteger(index)) {
                    return;
                }

                if (
                    index < 0 ||
                    index >= sala.fila.length
                ) {
                    return;
                }

                const removendoAtual =
                    index === sala.indiceAtual;

                sala.fila.splice(index, 1);

                // -----------------------------
                // FILA VAZIA
                // -----------------------------

                if (sala.fila.length === 0) {
                    sala.indiceAtual = -1;
                    sala.tocando = false;
                    sala.posicao = 0;
                }

                // -----------------------------
                // Removeu antes da atual
                // -----------------------------

                else if (
                    index < sala.indiceAtual
                ) {
                    sala.indiceAtual--;
                }

                // -----------------------------
                // Removeu a atual
                // -----------------------------

                else if (removendoAtual) {

                    if (
                        sala.indiceAtual >=
                        sala.fila.length
                    ) {
                        sala.indiceAtual =
                            sala.fila.length - 1;
                    }

                    sala.posicao = 0;
                    sala.tocando = true;
                }

                // -----------------------------
                // Corrige índice
                // -----------------------------

                if (
                    sala.indiceAtual >=
                    sala.fila.length
                ) {
                    sala.indiceAtual =
                        sala.fila.length - 1;
                }

                sala.atualizadoEm = Date.now();

                enviarFila(codigo);
                enviarEstadoPlayer(codigo);

                return;
            }

            // =================================
            // MÚSICA TERMINOU
            // =================================

            if (tipo === "ended") {

                const musicaAtual =
                    sala.fila[
                        sala.indiceAtual
                    ];

                if (!musicaAtual) {
                    return;
                }

                // --------------------------------
                // Evita evento de vídeo antigo
                // --------------------------------

                if (
                    dados.videoId !==
                    musicaAtual.videoId
                ) {
                    return;
                }

                // --------------------------------
                // Próxima música
                // --------------------------------

                if (
                    sala.indiceAtual <
                    sala.fila.length - 1
                ) {
                    sala.indiceAtual++;
                    sala.posicao = 0;
                    sala.tocando = true;
                    sala.atualizadoEm = Date.now();

                    enviarFila(codigo);
                    enviarEstadoPlayer(codigo);

                    console.log(
                        `Avançando música na sala ${codigo}`
                    );
                }

                // --------------------------------
                // Fim da fila
                // --------------------------------

                else {
                    sala.posicao = 0;
                    sala.tocando = false;
                    sala.atualizadoEm = Date.now();

                    enviarEstadoPlayer(codigo);

                    console.log(
                        `Fim da fila na sala ${codigo}`
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

            const codigo = socket.sala;

            if (!codigo) {
                return;
            }

            // ----------------------------
            // Atualiza usuários
            // ----------------------------

            atualizarQuantidadeUsuarios(codigo);

            // ----------------------------
            // Verifica sala
            // ----------------------------

            const sala = salas.get(codigo);

            if (!sala) {
                return;
            }

            const quantidade =
                io.sockets.adapter
                    .rooms
                    .get(codigo)
                    ?.size || 0;

            // ----------------------------
            // Remove sala vazia
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
// QUANTIDADE DE USUÁRIOS
// ========================================

function atualizarQuantidadeUsuarios(codigo) {
    const quantidade =
        io.sockets.adapter
            .rooms
            .get(codigo)
            ?.size || 0;

    io.to(codigo).emit(
        "usuarios-atualizados",
        {
            quantidade
        }
    );
}

// ========================================
// LIMPAR DADOS DA MÚSICA
// ========================================

function limparMusica(musica) {

    if (!musica) {
        return null;
    }

    if (!musica.videoId) {
        return null;
    }

    return {
        videoId: String(musica.videoId),
        titulo: String(musica.titulo || ""),
        canal: String(musica.canal || ""),
        descricao: String(musica.descricao || ""),
        imagem: String(musica.imagem || "")
    };
}

// ========================================
// SINCRONIZAÇÃO PERIÓDICA
// ========================================
//
// A cada 5 segundos o servidor manda
// a posição atual para os usuários.
//
// Isso ajuda a corrigir pequenos atrasos.
//
// ========================================

setInterval(() => {

    for (const [codigo, sala] of salas) {

        const quantidade =
            io.sockets.adapter
                .rooms
                .get(codigo)
                ?.size || 0;

        if (quantidade === 0) {
            continue;
        }

        if (sala.tocando) {
            enviarEstadoPlayer(codigo);
        }
    }

}, 5000);

// ========================================
// INICIAR SERVIDOR
// ========================================

server.listen(PORT, () => {

    console.log(
        `Servidor rodando em http://localhost:${PORT}`
    );

    console.log(
        "Socket.IO ativo."
    );
});