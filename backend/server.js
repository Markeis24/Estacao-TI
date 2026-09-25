require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

app.use(cors());
app.use(express.json());

app.use(
    express.static(
        path.join(__dirname, "../public")
    )
);

app.get("/", (req, res) => {
    res.sendFile(
        path.join(
            __dirname,
            "../public/index.html"
        )
    );
});


/* 
   API TESTE
 */

app.get("/api/teste", (req, res) => {

    res.json({
        sucesso: true,
        mensagem: "A API está funcionando!"
    });

});


/* 
   YOUTUBE SEARCH
 */

app.get("/api/search", async (req, res) => {

    try {

        const query = String(
            req.query.q || ""
        ).trim();


        if (!query) {

            return res.status(400).json({
                sucesso: false,
                erro:
                    "Digite o nome de uma música ou artista."
            });

        }


        const apiKey = String(
            req.get("X-YouTube-API-Key") || ""
        ).trim();

            return res.status(401).json({
                sucesso: false,
                codigo:
                    "CHAVE_API_NAO_INFORMADA",
                erro:
                    "Configure sua chave da YouTube Data API para pesquisar músicas."
            });

        }


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

        /*
           A chave só é usada internamente
           para fazer a chamada ao Google.
        */

        url.searchParams.set(
            "key",
            apiKey
        );


        const response =
            await fetch(url);


        const data =
            await response.json();


        if (!response.ok) {

            const motivo =
                data?.error?.errors?.[0]?.reason ||
                "";

            const statusApi =
                data?.error?.status ||
                "";


            /*
               QUOTA DA CHAVE ESGOTADA

               O frontend poderá identificar esse código
               e pedir para o usuário trocar a chave.
            */

            const quotaExcedida =
                motivo === "quotaExceeded" ||
                motivo === "dailyLimitExceeded" ||
                statusApi === "RESOURCE_EXHAUSTED";


            if (quotaExcedida) {

                return res.status(429).json({
                    sucesso: false,
                    codigo:
                        "QUOTA_EXCEDIDA",
                    erro:
                        "A cota desta chave da YouTube API foi excedida. Troque a chave para continuar."
                });

            }


            /*
               CHAVE INVÁLIDA / ACESSO NEGADO
            */

            const chaveRecusada =
                motivo === "keyInvalid" ||
                motivo === "ipRefererBlocked" ||
                response.status === 401;


            if (chaveRecusada) {

                return res.status(401).json({
                    sucesso: false,
                    codigo:
                        "CHAVE_API_INVALIDA",
                    erro:
                        "A chave da YouTube API foi recusada. Confira sua chave e as configurações da YouTube Data API."
                });

            }


            /*
               Não enviamos para o navegador
               a mensagem completa retornada pelo Google.

               Isso evita expor informações
               desnecessárias da API.
            */

            console.error(
                "Erro da YouTube API:",
                data.error?.code || response.status,
                data.error?.message || ""
            );

            const motivo =
                data.error?.errors?.[0]?.reason || "";

            if (
                motivo === "quotaExceeded" ||
                motivo === "dailyLimitExceeded"
            ) {

                return res.status(429).json({
                    sucesso: false,
                    codigo: "QUOTA_EXCEDIDA",
                    erro:
                        "A cota desta chave da YouTube API foi atingida. Troque sua chave e tente novamente."
                });

            }

            return res.status(
                response.status
            ).json({
                sucesso: false,
                codigo:
                    "YOUTUBE_API_ERRO",
                erro:
                    "Não foi possível pesquisar no YouTube. Verifique sua chave e as configurações da API."
            });

        }


        const resultados =
            (data.items || [])

                .filter(
                    item =>
                        item.id?.videoId
                )

                .map(
                    item => ({
                        videoId:
                            item.id.videoId,

                        titulo:
                            item.snippet.title,

                        canal:
                            item.snippet.channelTitle,

                        descricao:
                            item.snippet.description,

                        imagem:
                            item.snippet
                                .thumbnails
                                ?.medium
                                ?.url
                    })
                );


        res.json({
            sucesso: true,
            resultados
        });


    } catch (error) {

        console.error(
            "Erro no servidor:",
            error?.message ||
            error
        );


        res.status(500).json({
            sucesso: false,
            codigo:
                "ERRO_INTERNO",
            erro:
                "Erro interno do servidor."
        });

    }

});


/* 
   SALAS
 */

const salas = new Map();


/* 
   AVATARES PERMITIDOS
 */

const AVATARES_PERMITIDOS = new Set([
    "avatar01.png",
    "avatar02.png",
    "avatar03.png",
    "avatar04.png",
    "avatar05.png",
    "avatar06.png",
    "avatar07.png",
    "avatar08.png",
    "avatar09.png",
    "avatar10.png"
]);


/* 
   NORMALIZAR USUÁRIO
 */

function normalizarUsuario(usuario) {

    const nomeRecebido =
        String(
            usuario?.nome || ""
        )
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 20);


    const avatarRecebido =
        String(
            usuario?.avatar || ""
        ).trim();


    const nome =
        nomeRecebido ||
        "Visitante";


    const avatar =
        AVATARES_PERMITIDOS.has(
            avatarRecebido
        )
            ? avatarRecebido
            : "avatar01.png";


    return {
        nome,
        avatar
    };

}


/* 
   CRIAR CÓDIGO DA SALA
 */

function gerarCodigoSala() {

    const caracteres =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let codigo;


    do {

        codigo = "";


        for (
            let i = 0;
            i < 6;
            i++
        ) {

            const indice =
                Math.floor(
                    Math.random() *
                    caracteres.length
                );

            codigo +=
                caracteres[indice];

        }

    } while (
        salas.has(codigo)
    );


    return codigo;

}


/* 
   CRIAR SALA
 */

function criarSala() {

    const codigo =
        gerarCodigoSala();


    salas.set(
        codigo,
        {
            fila: [],

            indiceAtual: -1,

            tocando: false,

            posicao: 0,

            atualizadoEm:
                Date.now()
        }
    );


    return codigo;

}


/* 
   POSIÇÃO DO PLAYER
 */

function obterPosicaoAtual(sala) {

    if (!sala.tocando) {

        return sala.posicao;

    }


    const agora =
        Date.now();


    const segundos =
        (
            agora -
            sala.atualizadoEm
        ) / 1000;


    return (
        sala.posicao +
        segundos
    );

}


function salvarPosicaoAtual(sala) {

    sala.posicao =
        obterPosicaoAtual(sala);

    sala.atualizadoEm =
        Date.now();

}


/* 
   ESTADO DO PLAYER
 */

function enviarEstadoPlayer(codigo) {

    const sala =
        salas.get(codigo);


    if (!sala) {

        return;

    }


    const posicao =
        obterPosicaoAtual(sala);


    io.to(codigo).emit(
        "estado-player",
        {
            tocando:
                sala.tocando,

            posicao:
                Math.max(
                    0,
                    posicao
                ),

            indiceAtual:
                sala.indiceAtual
        }
    );

}


/* 
   FILA
 */

function enviarFila(codigo) {

    const sala =
        salas.get(codigo);


    if (!sala) {

        return;

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


/* 
   LISTA DE USUÁRIOS

   MANTIDO:
   - nome
   - avatar
   - id do socket
   - quantidade de usuários
 */

function obterUsuariosDaSala(codigo) {

    const room =
        io.sockets.adapter.rooms.get(
            codigo
        );


    if (!room) {

        return [];

    }


    const usuarios = [];


    for (
        const socketId of room
    ) {

        const socket =
            io.sockets.sockets.get(
                socketId
            );


        if (
            socket &&
            socket.usuario
        ) {

            usuarios.push({
                id:
                    socket.id,

                nome:
                    socket.usuario.nome,

                avatar:
                    socket.usuario.avatar
            });

        }

    }


    return usuarios;

}


/* 
   ATUALIZAR USUÁRIOS

   Esse evento continua sendo enviado
   para todos que estão na sala.
 */

function atualizarUsuarios(codigo) {

    const usuarios =
        obterUsuariosDaSala(
            codigo
        );


    io.to(codigo).emit(
        "usuarios-atualizados",
        {
            quantidade:
                usuarios.length,

            usuarios
        }
    );

}


/* 
   SALA VAZIA
 */

function removerSalaSeVazia(codigo) {

    if (!codigo) {

        return;

    }


    const quantidade =
        io.sockets.adapter.rooms.get(
            codigo
        )?.size || 0;


    if (
        quantidade === 0 &&
        salas.has(codigo)
    ) {

        salas.delete(codigo);

        console.log(
            `Sala ${codigo} removida.`
        );

    }

}


/* 
   LIMPAR MÚSICA
 */

function limparMusica(
    musica,
    usuario
) {

    if (!musica) {

        return null;

    }


    if (!musica.videoId) {

        return null;

    }


    const autor =
        usuario
            ? {
                nome:
                    usuario.nome,

                avatar:
                    usuario.avatar
            }
            : {
                nome:
                    "Visitante",

                avatar:
                    "avatar01.png"
            };


    return {

        videoId:
            String(
                musica.videoId
            ),

        titulo:
            String(
                musica.titulo || ""
            ),

        canal:
            String(
                musica.canal || ""
            ),

        descricao:
            String(
                musica.descricao || ""
            ),

        imagem:
            String(
                musica.imagem || ""
            ),

        adicionadoPor:
            autor

    };

}


/* 
   SOCKET.IO
 */

io.on(
    "connection",
    socket => {

        console.log(
            "Usuário conectado:",
            socket.id
        );


        /* ==================================================
           DEFINIR IDENTIDADE
        ================================================== */

        socket.on(
            "definir-identidade",
            usuarioRecebido => {

                socket.usuario =
                    normalizarUsuario(
                        usuarioRecebido
                    );


                console.log(
                    `Identidade definida: ${socket.usuario.nome}`
                );


                if (socket.sala) {

                    atualizarUsuarios(
                        socket.sala
                    );

                }

            }
        );


        /* ==================================================
           CRIAR SALA
        ================================================== */

        socket.on(
            "criar-sala",
            usuarioRecebido => {

                if (
                    usuarioRecebido
                ) {

                    socket.usuario =
                        normalizarUsuario(
                            usuarioRecebido
                        );

                }


                if (!socket.usuario) {

                    socket.usuario =
                        normalizarUsuario(
                            null
                        );

                }


                if (socket.sala) {

                    const salaAnterior =
                        socket.sala;


                    /*
                       ATIVIDADE DE SAÍDA
                       MANTIDA
                    */

                    socket.to(
                        salaAnterior
                    ).emit(
                        "usuario-saiu",
                        socket.usuario
                    );


                    socket.leave(
                        salaAnterior
                    );

                    socket.sala =
                        null;


                    atualizarUsuarios(
                        salaAnterior
                    );


                    removerSalaSeVazia(
                        salaAnterior
                    );

                }


                const codigo =
                    criarSala();


                const sala =
                    salas.get(codigo);


                socket.join(codigo);

                socket.sala =
                    codigo;


                socket.emit(
                    "sala-criada",
                    {
                        codigo,
                        estado: sala
                    }
                );


                atualizarUsuarios(
                    codigo
                );


                console.log(
                    `Sala criada: ${codigo} por ${socket.usuario.nome}`
                );

            }
        );


        /* ==================================================
           ENTRAR NA SALA
        ================================================== */

        socket.on(
            "entrar-sala",
            dados => {

                let codigo;

                let usuarioRecebido;


                if (
                    typeof dados ===
                    "string"
                ) {

                    codigo =
                        String(
                            dados
                        )
                        .trim()
                        .toUpperCase();

                } else {

                    codigo =
                        String(
                            dados?.codigo ||
                            ""
                        )
                        .trim()
                        .toUpperCase();


                    usuarioRecebido =
                        dados?.usuario;

                }


                if (
                    usuarioRecebido
                ) {

                    socket.usuario =
                        normalizarUsuario(
                            usuarioRecebido
                        );

                }


                if (!socket.usuario) {

                    socket.usuario =
                        normalizarUsuario(
                            null
                        );

                }


                if (!codigo) {

                    socket.emit(
                        "erro-sala",
                        "Informe o código da sala."
                    );

                    return;

                }


                if (
                    !salas.has(codigo)
                ) {

                    socket.emit(
                        "erro-sala",
                        "Essa sala não existe."
                    );

                    return;

                }


                if (
                    socket.sala &&
                    socket.sala !== codigo
                ) {

                    const salaAnterior =
                        socket.sala;


                    /*
                       ATIVIDADE DE SAÍDA
                       MANTIDA
                    */

                    socket.to(
                        salaAnterior
                    ).emit(
                        "usuario-saiu",
                        socket.usuario
                    );


                    socket.leave(
                        salaAnterior
                    );

                    socket.sala =
                        null;


                    atualizarUsuarios(
                        salaAnterior
                    );


                    removerSalaSeVazia(
                        salaAnterior
                    );

                }


                socket.join(codigo);

                socket.sala =
                    codigo;


                const sala =
                    salas.get(codigo);


                socket.emit(
                    "entrou-sala",
                    {
                        codigo,

                        estado: {
                            fila:
                                sala.fila,

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


                /*
                   ATIVIDADE DE ENTRADA
                   MANTIDA

                   Todos os outros usuários
                   recebem quem acabou de entrar.
                */

                socket.to(
                    codigo
                ).emit(
                    "usuario-entrou",
                    socket.usuario
                );


                /*
                   ATUALIZA A LISTA E A QUANTIDADE
                   DE USUÁRIOS PARA TODOS.
                */

                atualizarUsuarios(
                    codigo
                );


                console.log(
                    `Usuário ${socket.usuario.nome} entrou na sala ${codigo}`
                );

            }
        );


        /* ==================================================
           CONTROLE DA SALA
        ================================================== */

        socket.on(
            "controle-sala",
            dados => {

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


                /* ==========================================
                   ADICIONAR
                ========================================== */

                if (
                    tipo === "adicionar"
                ) {

                    const musica =
                        limparMusica(
                            dados.musica,
                            socket.usuario
                        );


                    if (!musica) {

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


                    if (
                        sala.tocando
                    ) {

                        salvarPosicaoAtual(
                            sala
                        );

                    }


                    sala.fila.push(
                        musica
                    );


                    if (
                        sala.indiceAtual ===
                        -1
                    ) {

                        sala.indiceAtual =
                            0;

                        sala.posicao =
                            0;

                        sala.tocando =
                            false;

                        sala.atualizadoEm =
                            Date.now();

                    }


                    enviarFila(
                        codigo
                    );


                    console.log(
                        `Música adicionada por ${socket.usuario?.nome}: ${musica.titulo}`
                    );


                    return;

                }


                /* ==========================================
                   TOCAR AGORA
                ========================================== */

                if (
                    tipo === "play-now"
                ) {

                    const musicaRecebida =
                        dados.musica;


                    if (
                        !musicaRecebida
                    ) {

                        return;

                    }


                    const indiceExistente =
                        sala.fila.findIndex(
                            item =>
                                item.videoId ===
                                musicaRecebida.videoId
                        );


                    if (
                        indiceExistente ===
                        -1
                    ) {

                        const musica =
                            limparMusica(
                                musicaRecebida,
                                socket.usuario
                            );


                        if (!musica) {

                            return;

                        }


                        sala.fila.push(
                            musica
                        );


                        sala.indiceAtual =
                            sala.fila.length -
                            1;

                    } else {

                        sala.indiceAtual =
                            indiceExistente;

                    }


                    sala.posicao =
                        0;

                    sala.tocando =
                        true;

                    sala.atualizadoEm =
                        Date.now();


                    enviarFila(
                        codigo
                    );

                    enviarEstadoPlayer(
                        codigo
                    );


                    console.log(
                        `Tocando agora na sala ${codigo}: ${sala.fila[sala.indiceAtual].titulo}`
                    );


                    return;

                }


                /* ==========================================
                   PLAY
                ========================================== */

                if (
                    tipo === "play"
                ) {

                    if (
                        sala.indiceAtual ===
                        -1
                    ) {

                        return;

                    }


                    sala.posicao =
                        obterPosicaoAtual(
                            sala
                        );

                    sala.tocando =
                        true;

                    sala.atualizadoEm =
                        Date.now();


                    enviarEstadoPlayer(
                        codigo
                    );


                    return;

                }


                /* ==========================================
                   NEXT
                ========================================== */

                if (
                    tipo === "next"
                ) {

                    if (
                        sala.indiceAtual 
                        sala.fila.length - 1
                    ) {

                        sala.indiceAtual++;

                        sala.posicao =
                            0;

                        sala.tocando =
                            true;

                        sala.atualizadoEm =
                            Date.now();


                        enviarFila(
                            codigo
                        );

                        enviarEstadoPlayer(
                            codigo
                        );

                    }


                    return;

                }


                /* ==========================================
                   PREVIOUS
                ========================================== */

                if (
                    tipo === "previous"
                ) {

                    if (
                        sala.indiceAtual >
                        0
                    ) {

                        sala.indiceAtual--;

                        sala.posicao =
                            0;

                        sala.tocando =
                            true;

                        sala.atualizadoEm =
                            Date.now();


                        enviarFila(
                            codigo
                        );

                        enviarEstadoPlayer(
                            codigo
                        );

                    }


                    return;

                }


                /* ==========================================
                   PLAY INDEX
                ========================================== */

                if (
                    tipo === "play-index"
                ) {

                    const index =
                        Number(
                            dados.index
                        );


                    if (
                        !Number.isInteger(
                            index
                        )
                    ) {

                        return;

                    }


                    if (
                        index < 0 ||
                        index >=
                        sala.fila.length
                    ) {

                        return;

                    }


                    sala.indiceAtual =
                        index;

                    sala.posicao =
                        0;

                    sala.tocando =
                        true;

                    sala.atualizadoEm =
                        Date.now();


                    enviarFila(
                        codigo
                    );

                    enviarEstadoPlayer(
                        codigo
                    );


                    return;

                }


                /* ==========================================
                   REMOVE
                ========================================== */

                if (
                    tipo === "remove"
                ) {

                    const index =
                        Number(
                            dados.index
                        );


                    if (
                        !Number.isInteger(
                            index
                        )
                    ) {

                        return;

                    }


                    if (
                        index < 0 ||
                        index >=
                        sala.fila.length
                    ) {

                        return;

                    }


                    const removendoAtual =
                        index ===
                        sala.indiceAtual;


                    if (
                        removendoAtual &&
                        sala.tocando
                    ) {

                        salvarPosicaoAtual(
                            sala
                        );

                    }


                    sala.fila.splice(
                        index,
                        1
                    );


                    if (
                        sala.fila.length ===
                        0
                    ) {

                        sala.indiceAtual =
                            -1;

                        sala.tocando =
                            false;

                        sala.posicao =
                            0;

                        sala.atualizadoEm =
                            Date.now();

                    } else if (
                        index 
                        sala.indiceAtual
                    ) {

                        sala.indiceAtual--;

                    } else if (
                        removendoAtual
                    ) {

                        if (
                            sala.indiceAtual >=
                            sala.fila.length
                        ) {

                            sala.indiceAtual =
                                sala.fila.length -
                                1;

                        }


                        sala.posicao =
                            0;

                        sala.tocando =
                            true;

                        sala.atualizadoEm =
                            Date.now();

                    }


                    if (
                        sala.indiceAtual >=
                        sala.fila.length
                    ) {

                        sala.indiceAtual =
                            sala.fila.length -
                            1;

                    }


                    enviarFila(
                        codigo
                    );

                    enviarEstadoPlayer(
                        codigo
                    );


                    return;

                }


                /* ==========================================
                   ENDED
                ========================================== */

                if (
                    tipo === "ended"
                ) {

                    const musicaAtual =
                        sala.fila[
                            sala.indiceAtual
                        ];


                    if (!musicaAtual) {

                        return;

                    }


                    if (
                        dados.videoId !==
                        musicaAtual.videoId
                    ) {

                        return;

                    }


                    if (
                        sala.indiceAtual 
                        sala.fila.length - 1
                    ) {

                        sala.indiceAtual++;

                        sala.posicao =
                            0;

                        sala.tocando =
                            true;

                        sala.atualizadoEm =
                            Date.now();


                        enviarFila(
                            codigo
                        );

                        enviarEstadoPlayer(
                            codigo
                        );


                        console.log(
                            `Avançando música na sala ${codigo}`
                        );

                    } else {

                        sala.posicao =
                            0;

                        sala.tocando =
                            false;

                        sala.atualizadoEm =
                            Date.now();


                        enviarEstadoPlayer(
                            codigo
                        );


                        console.log(
                            `Fim da fila na sala ${codigo}`
                        );

                    }


                    return;

                }

            }
        );


        /* ==================================================
           DESCONECTOU
        ================================================== */

        socket.on(
            "disconnect",
            () => {

                console.log(
                    "Usuário desconectado:",
                    socket.id
                );


                const codigo =
                    socket.sala;


                if (!codigo) {

                    return;

                }


                /*
                   ATIVIDADE DE SAÍDA
                   MANTIDA

                   Quando alguém fecha a página,
                   sai da sala ou perde a conexão,
                   os outros usuários recebem
                   o evento "usuario-saiu".
                */

                if (
                    socket.usuario
                ) {

                    socket.to(
                        codigo
                    ).emit(
                        "usuario-saiu",
                        socket.usuario
                    );

                }


                /*
                   Atualiza a lista e a quantidade
                   de pessoas restantes.
                */

                atualizarUsuarios(
                    codigo
                );


                removerSalaSeVazia(
                    codigo
                );

            }
        );

    }
);


/* 
   SINCRONIZAÇÃO PERIÓDICA
 */

setInterval(
    () => {

        for (
            const [
                codigo,
                sala
            ] of salas
        ) {

            const quantidade =
                io.sockets.adapter.rooms.get(
                    codigo
                )?.size || 0;


            if (
                quantidade === 0
            ) {

                continue;

            }


            if (
                sala.tocando
            ) {

                enviarEstadoPlayer(
                    codigo
                );

            }

        }

    },
    5000
);


/* 
   SERVIDOR
 */

server.listen(
    PORT,
    () => {

        console.log(
            `Servidor rodando em http://localhost:${PORT}`
        );

        console.log(
            "Socket.IO ativo."
        );

    }
);