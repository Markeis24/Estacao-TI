// ==========================================================
// ESTACAO-TI MUSIC NETWORK
// SCRIPT PRINCIPAL
// ==========================================================

// ==========================================================
// SOCKET.IO
// ==========================================================

let socket = null;

// ==========================================================
// YOUTUBE
// ==========================================================

let player = null;
let playerPronto = false;
let aplicandoEstadoServidor = false;

// ==========================================================
// ESTADO DA SALA
// ==========================================================

let estadoSala = {
    fila: [],
    indiceAtual: -1,
    tocando: false,
    posicao: 0
};

// ==========================================================
// ELEMENTOS
// ==========================================================

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

// ==========================================================
// YOUTUBE API
// ==========================================================

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

// ==========================================================
// ESTADO DO YOUTUBE
// ==========================================================

function tratarEstadoPlayer(event) {

    if (aplicandoEstadoServidor) {
        return;
    }

    if (
        event.data ===
        YT.PlayerState.PLAYING
    ) {
        enviarControle({
            tipo: "play"
        });
    }

    if (
        event.data ===
        YT.PlayerState.PAUSED
    ) {
        enviarControle({
            tipo: "pause"
        });
    }

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
            videoId: musicaAtual.videoId
        });
    }
}

// ==========================================================
// CRIAR SALA
// ==========================================================

createRoomButton.addEventListener(
    "click",
    function () {
        conectarSocket();
    }
);

// ==========================================================
// ENTRAR EM SALA
// ==========================================================

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

// ==========================================================
// SOCKET
// ==========================================================

function conectarSocket(codigoSala = null) {

    if (socket) {
        socket.disconnect();
        socket = null;
    }

    socket = io();

    connectionStatus.textContent =
        "🟡 CONECTANDO...";

    socket.on(
        "connect",
        function () {

            console.log(
                "Socket conectado:",
                socket.id
            );

            connectionStatus.textContent =
                "🟢 ONLINE";

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

    socket.on(
        "sala-criada",
        function (dados) {

            entrarVisualmenteNaSala(
                dados
            );
        }
    );

    socket.on(
        "entrou-sala",
        function (dados) {

            entrarVisualmenteNaSala(
                dados
            );
        }
    );

    socket.on(
        "erro-sala",
        function (mensagem) {

            alert(mensagem);

            connectionStatus.textContent =
                "🔴 ERRO";
        }
    );

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

    socket.on(
        "usuarios-atualizados",
        function (dados) {

            roomUsers.textContent =
                dados.quantidade || 0;
        }
    );

    socket.on(
        "disconnect",
        function () {

            connectionStatus.textContent =
                "🔴 OFFLINE";
        }
    );
}

// ==========================================================
// ENTRAR VISUALMENTE NA SALA
// ==========================================================

function entrarVisualmenteNaSala(dados) {

    console.log(
        "Entrando na sala:",
        dados.codigo
    );

    roomCode.textContent =
        dados.codigo;

    roomInput.value =
        dados.codigo;

    estadoSala =
        dados.estado || {
            fila: [],
            indiceAtual: -1,
            tocando: false,
            posicao: 0
        };

    atualizarFila();
    atualizarMusicaAtual();

    const novaUrl =
        `${window.location.pathname}?room=${dados.codigo}`;

    window.history.replaceState(
        {},
        "",
        novaUrl
    );

    tentarAplicarEstado();
}

// ==========================================================
// SOCKET CONECTADO?
// ==========================================================

function socketConectado() {

    return (
        socket &&
        socket.connected
    );
}

// ==========================================================
// CONTROLE
// ==========================================================

function enviarControle(dados) {

    if (!socketConectado()) {
        return;
    }

    socket.emit(
        "controle-sala",
        dados
    );
}

// ==========================================================
// PESQUISA
// ==========================================================

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
        <div class="empty-message">

            <span class="empty-icon">
                🔎
            </span>

            <strong>
                PESQUISANDO...
            </strong>

            <p>
                procurando na rede musical
            </p>

        </div>
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
            <div class="empty-message">

                <span class="empty-icon">
                    ⚠
                </span>

                <strong>
                    ERRO NA PESQUISA
                </strong>

                <p>
                    ${escaparHTML(
                        erro.message
                    )}
                </p>

            </div>
        `;
    }
}

// ==========================================================
// MOSTRAR RESULTADOS
// ==========================================================

function mostrarResultados(resultados) {

    searchResults.innerHTML = "";

    if (
        !resultados ||
        resultados.length === 0
    ) {

        searchResults.innerHTML = `
            <div class="empty-message">

                <span class="empty-icon">
                    ♪
                </span>

                <strong>
                    NENHUM RESULTADO
                </strong>

                <p>
                    tente outra pesquisa
                </p>

            </div>
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
                        ▶ TOCAR
                    </button>

                    <button
                        class="queue-button"
                    >
                        ＋ FILA
                    </button>

                </div>
            `;

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

// ==========================================================
// TOCAR AGORA
// ==========================================================

function tocarMusica(musica) {

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

// ==========================================================
// ADICIONAR À FILA
// ==========================================================

function adicionarNaFila(musica) {

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

// ==========================================================
// TOCAR
// ==========================================================

function tocarAtual() {

    enviarControle({
        tipo: "play"
    });
}

// ==========================================================
// PAUSAR
// ==========================================================

function pausarAtual() {

    enviarControle({
        tipo: "pause"
    });
}

// ==========================================================
// PRÓXIMA
// ==========================================================

function proxima() {

    enviarControle({
        tipo: "next"
    });
}

// ==========================================================
// ANTERIOR
// ==========================================================

function anterior() {

    enviarControle({
        tipo: "previous"
    });
}

// ==========================================================
// REMOVER
// ==========================================================

function remover(index) {

    enviarControle({
        tipo: "remove",
        index: index
    });
}

// ==========================================================
// MÚSICA ATUAL
// ==========================================================

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

// ==========================================================
// ATUALIZAR MÚSICA
// ==========================================================

function atualizarMusicaAtual() {

    const musica =
        obterMusicaAtual();

    if (!musica) {

        musicTitle.textContent =
            "Nenhuma música tocando";

        musicArtist.textContent =
            "Entre em uma sala para começar";

        playPauseButton.innerHTML =
            `▶ <small>TOCAR</small>`;

        return;
    }

    musicTitle.textContent =
        musica.titulo;

    musicArtist.textContent =
        musica.canal;

    if (
        estadoSala.tocando
    ) {

        playPauseButton.innerHTML =
            `⏸ <small>PAUSAR</small>`;

    } else {

        playPauseButton.innerHTML =
            `▶ <small>TOCAR</small>`;
    }
}

// ==========================================================
// ATUALIZAR FILA
// ==========================================================

function atualizarFila() {

    queueList.innerHTML = "";

    if (
        estadoSala.fila.length === 0
    ) {

        queueList.innerHTML = `
            <div class="empty-message">

                <span class="empty-icon">
                    ♬
                </span>

                <strong>
                    A FILA ESTÁ VAZIA
                </strong>

                <p>
                    Adicione músicas para criar sua playlist
                </p>

            </div>
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
                    title="Tocar"
                >
                    ▶
                </button>

                <button
                    class="queue-remove-button"
                    title="Remover"
                >
                    ×
                </button>
            `;

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

// ==========================================================
// APLICAR ESTADO NO YOUTUBE
// ==========================================================

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

        let videoAtual = "";

        try {

            videoAtual =
                player
                    .getVideoData()
                    ?.video_id || "";

        } catch (erro) {

            videoAtual = "";
        }

        // ==================================================
        // VÍDEO DIFERENTE
        // ==================================================

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

        // ==================================================
        // MESMO VÍDEO
        // ==================================================

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

            if (
                diferenca > 2
            ) {

                player.seekTo(
                    tempoServidor,
                    true
                );
            }

            if (
                estadoSala.tocando
            ) {

                player.playVideo();

            } else {

                player.pauseVideo();
            }
        }

    } catch (erro) {

        console.error(
            "Erro ao sincronizar YouTube:",
            erro
        );
    }

    setTimeout(
        function () {

            aplicandoEstadoServidor =
                false;

        },
        1200
    );
}

// ==========================================================
// ATIVAR ÁUDIO
// ==========================================================

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

// ==========================================================
// PLAY / PAUSE
// ==========================================================

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

// ==========================================================
// PRÓXIMA
// ==========================================================

nextButton.addEventListener(
    "click",
    function () {

        proxima();
    }
);

// ==========================================================
// ANTERIOR
// ==========================================================

previousButton.addEventListener(
    "click",
    function () {

        anterior();
    }
);

// ==========================================================
// PESQUISA
// ==========================================================

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

// ==========================================================
// TECLADO
// ==========================================================

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

// ==========================================================
// SEGURANÇA HTML
// ==========================================================

function escaparHTML(texto) {

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

function escaparAtributo(texto) {

    return escaparHTML(texto);
}

// ==========================================================
// SALA PELA URL
// ==========================================================

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

// ==========================================================
// INICIALIZAÇÃO
// ==========================================================

atualizarFila();
atualizarMusicaAtual();

console.log(
    "★ ESTACAO-TI MUSIC NETWORK carregado ★"
);