// ========================================
// SOCKET.IO
// ========================================

let socket = null;


// ========================================
// YOUTUBE
// ========================================

let player = null;

let playerPronto = false;

let aplicandoEstadoServidor = false;


// ========================================
// ESTADO DA SALA
// ========================================

let estadoSala = {

    fila: [],

    indiceAtual: -1,

    tocando: false,

    posicao: 0

};


// ========================================
// ELEMENTOS DA PÁGINA
// ========================================

const searchInput =
    document.getElementById("search-input");

const searchButton =
    document.getElementById("search-button");

const searchResults =
    document.getElementById("search-results");

const queueList =
    document.getElementById("queue-list");

const musicTitle =
    document.getElementById("music-title");

const musicArtist =
    document.getElementById("music-artist");

const roomInput =
    document.getElementById("room-input");

const roomCode =
    document.getElementById("room-code");

const roomUsers =
    document.getElementById("room-users");

const connectionStatus =
    document.getElementById("connection-status");

const createRoomButton =
    document.getElementById("create-room-button");

const joinRoomButton =
    document.getElementById("join-room-button");

const enableAudioButton =
    document.getElementById("enable-audio-button");

const previousButton =
    document.getElementById("previous-button");

const playPauseButton =
    document.getElementById("play-pause-button");

const nextButton =
    document.getElementById("next-button");


// ========================================
// YOUTUBE API
// ========================================

window.onYouTubeIframeAPIReady = function () {

    console.log(
        "YouTube Player API carregada."
    );


    player = new YT.Player(
        "youtube-player",
        {

            height: "100%",

            width: "100%",

            videoId: "",

            playerVars: {

                autoplay: 0,

                controls: 1,

                rel: 0,

                modestbranding: 1

            },

            events: {

                onReady: function () {

                    console.log(
                        "Player do YouTube pronto."
                    );


                    playerPronto = true;


                    tentarAplicarEstado();

                },


                onStateChange: function (event) {

                    tratarEstadoPlayer(event);

                },


                onError: function (event) {

                    console.error(
                        "Erro no player do YouTube:",
                        event.data
                    );

                }

            }

        }
    );

};


// ========================================
// ESTADO DO PLAYER DO YOUTUBE
// ========================================

function tratarEstadoPlayer(event) {

    // ------------------------------------
    // Ignora eventos causados pelo servidor
    // ------------------------------------

    if (aplicandoEstadoServidor) {

        return;

    }


    // ------------------------------------
    // PLAY
    // ------------------------------------

    if (
        event.data ===
        YT.PlayerState.PLAYING
    ) {

        enviarControle({

            tipo: "play"

        });

    }


    // ------------------------------------
    // PAUSE
    // ------------------------------------

    if (
        event.data ===
        YT.PlayerState.PAUSED
    ) {

        enviarControle({

            tipo: "pause"

        });

    }


    // ------------------------------------
    // FIM DA MÚSICA
    // ------------------------------------

    if (
        event.data ===
        YT.PlayerState.ENDED
    ) {

        const musicaAtual =
            obterMusicaAtual();


        if (!musicaAtual) {

            return;

        }


        enviarControle({

            tipo: "ended",

            videoId:
                musicaAtual.videoId

        });

    }

}


// ========================================
// CRIAR SALA
// ========================================

createRoomButton.addEventListener(
    "click",
    function () {

        conectarSocket();

    }
);


// ========================================
// ENTRAR EM SALA
// ========================================

joinRoomButton.addEventListener(
    "click",
    function () {

        const codigo =
            roomInput.value
                .trim()
                .toUpperCase();


        if (!codigo) {

            alert(
                "Digite o código da sala."
            );

            return;

        }


        conectarSocket(codigo);

    }
);


// ========================================
// CONECTAR SOCKET.IO
// ========================================

function conectarSocket(
    codigoSala = null
) {

    // ------------------------------------
    // Desconecta anterior
    // ------------------------------------

    if (socket) {

        socket.disconnect();

        socket = null;

    }


    // ------------------------------------
    // Cria conexão
    // ------------------------------------

    socket = io();


    connectionStatus.textContent =
        "🟡 Conectando...";


    // ====================================
    // CONECTOU
    // ====================================

    socket.on(
        "connect",
        function () {

            console.log(
                "Socket conectado:",
                socket.id
            );


            connectionStatus.textContent =
                "🟢 Conectado";


            if (codigoSala) {

                socket.emit(
                    "entrar-sala",
                    codigoSala
                );

            } else {

                socket.emit(
                    "criar-sala"
                );

            }

        }
    );


    // ====================================
    // SALA CRIADA
    // ====================================

    socket.on(
        "sala-criada",
        function (dados) {

            entrarVisualmenteNaSala(
                dados
            );

        }
    );


    // ====================================
    // ENTROU NA SALA
    // ====================================

    socket.on(
        "entrou-sala",
        function (dados) {

            entrarVisualmenteNaSala(
                dados
            );

        }
    );


    // ====================================
    // ERRO DA SALA
    // ====================================

    socket.on(
        "erro-sala",
        function (mensagem) {

            alert(mensagem);


            connectionStatus.textContent =
                "🔴 Erro ao entrar";

        }
    );


    // ====================================
    // FILA ATUALIZADA
    // ====================================

    socket.on(
        "fila-atualizada",
        function (dados) {

            estadoSala.fila =
                dados.fila || [];


            estadoSala.indiceAtual =
                dados.indiceAtual ?? -1;


            atualizarFila();

            atualizarMusicaAtual();

            tentarAplicarEstado();

        }
    );


    // ====================================
    // ESTADO DO PLAYER
    // ====================================

    socket.on(
        "estado-player",
        function (dados) {

            estadoSala.tocando =
                dados.tocando;


            estadoSala.posicao =
                dados.posicao || 0;


            estadoSala.indiceAtual =
                dados.indiceAtual ?? -1;


            atualizarFila();

            atualizarMusicaAtual();

            tentarAplicarEstado();

        }
    );


    // ====================================
    // USUÁRIOS ATUALIZADOS
    // ====================================

    socket.on(
        "usuarios-atualizados",
        function (dados) {

            roomUsers.textContent =
                dados.quantidade || 0;

        }
    );


    // ====================================
    // DESCONECTADO
    // ====================================

    socket.on(
        "disconnect",
        function () {

            connectionStatus.textContent =
                "🔴 Desconectado";

        }
    );

}


// ========================================
// ENTRAR VISUALMENTE NA SALA
// ========================================

function entrarVisualmenteNaSala(
    dados
) {

    console.log(
        "Entrando na sala:",
        dados.codigo
    );


    // ------------------------------------
    // Código
    // ------------------------------------

    roomCode.textContent =
        dados.codigo;


    roomInput.value =
        dados.codigo;


    // ------------------------------------
    // Estado inicial
    // ------------------------------------

    estadoSala =
        dados.estado || {

            fila: [],

            indiceAtual: -1,

            tocando: false,

            posicao: 0

        };


    // ------------------------------------
    // Atualiza tela
    // ------------------------------------

    atualizarFila();

    atualizarMusicaAtual();


    // ------------------------------------
    // Coloca sala na URL
    // ------------------------------------

    const novaUrl =
        `${window.location.pathname}?room=${dados.codigo}`;


    window.history.replaceState(
        {},
        "",
        novaUrl
    );


    // ------------------------------------
    // Tenta sincronizar
    // ------------------------------------

    tentarAplicarEstado();

}


// ========================================
// VERIFICA SOCKET
// ========================================

function socketConectado() {

    return (
        socket &&
        socket.connected
    );

}


// ========================================
// ENVIAR CONTROLE
// ========================================

function enviarControle(
    dados
) {

    if (!socketConectado()) {

        return;

    }


    socket.emit(
        "controle-sala",
        dados
    );

}


// ========================================
// PESQUISAR MÚSICAS
// ========================================

async function pesquisarMusicas() {

    const consulta =
        searchInput.value.trim();


    if (!consulta) {

        alert(
            "Digite o nome de uma música ou artista."
        );

        return;

    }


    searchResults.innerHTML = `

        <p class="empty-message">

            🔎 Pesquisando...

        </p>

    `;


    try {

        const resposta =
            await fetch(
                `/api/search?q=${encodeURIComponent(
                    consulta
                )}`
            );


        const dados =
            await resposta.json();


        if (
            !resposta.ok ||
            !dados.sucesso
        ) {

            throw new Error(
                dados.erro ||
                "Erro ao pesquisar."
            );

        }


        mostrarResultados(
            dados.resultados
        );


    } catch (erro) {

        console.error(
            "Erro na pesquisa:",
            erro
        );


        searchResults.innerHTML = `

            <p class="empty-message">

                ❌
                ${escaparHTML(
                    erro.message
                )}

            </p>

        `;

    }

}


// ========================================
// MOSTRAR RESULTADOS
// ========================================

function mostrarResultados(
    resultados
) {

    searchResults.innerHTML = "";


    if (
        !resultados ||
        resultados.length === 0
    ) {

        searchResults.innerHTML = `

            <p class="empty-message">

                Nenhum resultado encontrado.

            </p>

        `;

        return;

    }


    resultados.forEach(
        function (musica) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "result-card";


            card.innerHTML = `

                <img
                    src="${escaparAtributo(
                        musica.imagem
                    )}"
                    alt="Thumbnail"
                >

                <div class="result-info">

                    <h3>

                        ${escaparHTML(
                            musica.titulo
                        )}

                    </h3>

                    <p>

                        ${escaparHTML(
                            musica.canal
                        )}

                    </p>

                </div>

                <div class="result-actions">

                    <button
                        class="play-button"
                    >
                        ▶ Tocar
                    </button>

                    <button
                        class="queue-button"
                    >
                        ＋ Fila
                    </button>

                </div>

            `;


            // --------------------------------
            // BOTÃO TOCAR
            // --------------------------------

            const botaoTocar =
                card.querySelector(
                    ".play-button"
                );


            botaoTocar.addEventListener(
                "click",
                function () {

                    tocarMusica(
                        musica
                    );

                }
            );


            // --------------------------------
            // BOTÃO FILA
            // --------------------------------

            const botaoFila =
                card.querySelector(
                    ".queue-button"
                );


            botaoFila.addEventListener(
                "click",
                function () {

                    adicionarNaFila(
                        musica
                    );

                }
            );


            searchResults.appendChild(
                card
            );

        }
    );

}


// ========================================
// TOCAR MÚSICA AGORA
// ========================================

function tocarMusica(
    musica
) {

    if (!socketConectado()) {

        alert(
            "Entre em uma sala primeiro."
        );

        return;

    }


    enviarControle({

        tipo: "play-now",

        musica: musica

    });

}


// ========================================
// ADICIONAR À FILA
// ========================================

function adicionarNaFila(
    musica
) {

    if (!socketConectado()) {

        alert(
            "Entre em uma sala primeiro."
        );

        return;

    }


    enviarControle({

        tipo: "adicionar",

        musica: musica

    });

}


// ========================================
// TOCAR
// ========================================

function tocarAtual() {

    enviarControle({

        tipo: "play"

    });

}


// ========================================
// PAUSAR
// ========================================

function pausarAtual() {

    enviarControle({

        tipo: "pause"

    });

}


// ========================================
// PRÓXIMA
// ========================================

function proxima() {

    enviarControle({

        tipo: "next"

    });

}


// ========================================
// ANTERIOR
// ========================================

function anterior() {

    enviarControle({

        tipo: "previous"

    });

}


// ========================================
// REMOVER
// ========================================

function remover(
    index
) {

    enviarControle({

        tipo: "remove",

        index: index

    });

}


// ========================================
// OBTER MÚSICA ATUAL
// ========================================

function obterMusicaAtual() {

    if (
        estadoSala.indiceAtual < 0
    ) {

        return null;

    }


    return (
        estadoSala.fila[
            estadoSala.indiceAtual
        ] || null
    );

}


// ========================================
// ATUALIZAR MÚSICA ATUAL
// ========================================

function atualizarMusicaAtual() {

    const musica =
        obterMusicaAtual();


    if (!musica) {

        musicTitle.textContent =
            "Nenhuma música tocando";


        musicArtist.textContent =
            "Adicione uma música à fila";


        playPauseButton.textContent =
            "▶ Tocar";


        return;

    }


    musicTitle.textContent =
        musica.titulo;


    musicArtist.textContent =
        musica.canal;


    if (
        estadoSala.tocando
    ) {

        playPauseButton.textContent =
            "⏸ Pausar";

    } else {

        playPauseButton.textContent =
            "▶ Tocar";

    }

}


// ========================================
// ATUALIZAR FILA
// ========================================

function atualizarFila() {

    queueList.innerHTML = "";


    if (
        estadoSala.fila.length === 0
    ) {

        queueList.innerHTML = `

            <p class="empty-message">

                A fila está vazia.

            </p>

        `;

        return;

    }


    estadoSala.fila.forEach(
        function (musica, index) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "queue-item";


            if (
                index ===
                estadoSala.indiceAtual
            ) {

                item.classList.add(
                    "current"
                );

            }


            item.innerHTML = `

                <img
                    src="${escaparAtributo(
                        musica.imagem
                    )}"
                    alt="Thumbnail"
                >

                <div class="queue-info">

                    <strong>

                        ${escaparHTML(
                            musica.titulo
                        )}

                    </strong>

                    <span>

                        ${escaparHTML(
                            musica.canal
                        )}

                    </span>

                </div>

                <button
                    class="queue-play-button"
                >
                    ▶
                </button>

                <button
                    class="queue-remove-button"
                >
                    🗑️
                </button>

            `;


            // --------------------------------
            // TOCAR DA FILA
            // --------------------------------

            const botaoTocar =
                item.querySelector(
                    ".queue-play-button"
                );


            botaoTocar.addEventListener(
                "click",
                function () {

                    enviarControle({

                        tipo: "play-index",

                        index: index

                    });

                }
            );


            // --------------------------------
            // REMOVER
            // --------------------------------

            const botaoRemover =
                item.querySelector(
                    ".queue-remove-button"
                );


            botaoRemover.addEventListener(
                "click",
                function () {

                    remover(index);

                }
            );


            queueList.appendChild(
                item
            );

        }
    );

}


// ========================================
// APLICAR ESTADO NO YOUTUBE
// ========================================

function tentarAplicarEstado() {

    if (!playerPronto) {

        return;

    }


    const musica =
        obterMusicaAtual();


    if (!musica) {

        return;

    }


    try {

        aplicandoEstadoServidor =
            true;


        // --------------------------------
        // VÍDEO ATUAL
        // --------------------------------

        let videoAtual = "";


        try {

            videoAtual =
                player
                    .getVideoData()
                    ?.video_id || "";

        } catch (erro) {

            videoAtual = "";

        }


        // --------------------------------
        // VÍDEO DIFERENTE
        // --------------------------------

        if (
            videoAtual !==
            musica.videoId
        ) {

            if (
                estadoSala.tocando
            ) {

                player.loadVideoById({

                    videoId:
                        musica.videoId,

                    startSeconds:
                        estadoSala.posicao || 0

                });

            } else {

                player.cueVideoById({

                    videoId:
                        musica.videoId,

                    startSeconds:
                        estadoSala.posicao || 0

                });

            }

        }


        // --------------------------------
        // MESMO VÍDEO
        // --------------------------------

        else {

            let tempoLocal = 0;


            try {

                tempoLocal =
                    player.getCurrentTime();

            } catch (erro) {

                tempoLocal = 0;

            }


            const tempoServidor =
                estadoSala.posicao || 0;


            const diferenca =
                Math.abs(
                    tempoLocal -
                    tempoServidor
                );


            // ----------------------------
            // CORRIGE DIFERENÇA
            // ----------------------------

            if (
                diferenca > 2
            ) {

                player.seekTo(
                    tempoServidor,
                    true
                );

            }


            // ----------------------------
            // PLAY
            // ----------------------------

            if (
                estadoSala.tocando
            ) {

                player.playVideo();

            }


            // ----------------------------
            // PAUSE
            // ----------------------------

            else {

                player.pauseVideo();

            }

        }


    } catch (erro) {

        console.error(
            "Erro ao sincronizar YouTube:",
            erro
        );

    }


    // ------------------------------------
    // Libera eventos depois de um tempo
    // ------------------------------------

    setTimeout(
        function () {

            aplicandoEstadoServidor =
                false;

        },
        1200
    );

}


// ========================================
// ATIVAR ÁUDIO
// ========================================

enableAudioButton.addEventListener(
    "click",
    function () {

        if (!playerPronto) {

            return;

        }


        aplicandoEstadoServidor =
            true;


        player.unMute();

        player.playVideo();


        setTimeout(
            function () {

                aplicandoEstadoServidor =
                    false;

            },
            1200
        );


        enableAudioButton.hidden =
            true;

    }
);


// ========================================
// BOTÃO PLAY / PAUSE
// ========================================

playPauseButton.addEventListener(
    "click",
    function () {

        if (
            estadoSala.tocando
        ) {

            pausarAtual();

        } else {

            tocarAtual();

        }

    }
);


// ========================================
// PRÓXIMA
// ========================================

nextButton.addEventListener(
    "click",
    function () {

        proxima();

    }
);


// ========================================
// ANTERIOR
// ========================================

previousButton.addEventListener(
    "click",
    function () {

        anterior();

    }
);


// ========================================
// PESQUISA
// ========================================

searchButton.addEventListener(
    "click",
    function () {

        pesquisarMusicas();

    }
);


searchInput.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Enter"
        ) {

            pesquisarMusicas();

        }

    }
);


// ========================================
// TECLADO
// ========================================

document.addEventListener(
    "keydown",
    function (event) {

        if (
            document.activeElement ===
            searchInput
        ) {

            return;

        }


        if (
            event.key === "ArrowRight"
        ) {

            proxima();

        }


        if (
            event.key === "ArrowLeft"
        ) {

            anterior();

        }

    }
);


// ========================================
// ESCAPAR HTML
// ========================================

function escaparHTML(
    texto
) {

    if (
        texto === null ||
        texto === undefined
    ) {

        return "";

    }


    return String(texto)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


function escaparAtributo(
    texto
) {

    return escaparHTML(
        texto
    );

}


// ========================================
// VERIFICA SALA NA URL
// ========================================

const parametros =
    new URLSearchParams(
        window.location.search
    );


const salaInicial =
    parametros.get("room");


if (salaInicial) {

    roomInput.value =
        salaInicial.toUpperCase();

}


// ========================================
// INICIALIZA
// ========================================

atualizarFila();

atualizarMusicaAtual();


console.log(
    "Meu Player carregado."
);