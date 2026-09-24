let socket = null;

let player = null;
let playerPronto = false;
let aplicandoEstadoServidor = false;

let identidade = null;
let salaDesejada = null;

let estadoSala = {
    fila: [],
    indiceAtual: -1,
    tocando: false,
    posicao: 0
};

let resultadosPesquisa = [];
let audioMutado = false;

const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const searchResults = document.getElementById("search-results");

const queueList = document.getElementById("queue-list");

const roomInput = document.getElementById("room-input");
const roomCode = document.getElementById("room-code");
const roomUsers = document.getElementById("room-users");

const connectionStatus =
    document.getElementById("connection-status");

const createRoomButton =
    document.getElementById("create-room-button");

const joinRoomButton =
    document.getElementById("join-room-button");

const musicTitle =
    document.getElementById("music-title");

const musicArtist =
    document.getElementById("music-artist");

const enableAudioButton =
    document.getElementById("enable-audio-button");

const muteButton =
    document.getElementById("mute-button");

const muteIcon =
    document.getElementById("mute-icon");

const muteText =
    document.getElementById("mute-text");

const identityModal =
    document.getElementById("identity-modal");

const identityNameInput =
    document.getElementById("identity-name");

const identityError =
    document.getElementById("identity-error");

const saveIdentityButton =
    document.getElementById("save-identity-button");

const closeIdentityButton =
    document.getElementById("close-identity-button");

const changeIdentityButton =
    document.getElementById("change-identity-button");

const currentIdentity =
    document.getElementById("current-identity");

const usersList =
    document.getElementById("users-list");

const activityList =
    document.getElementById("activity-list");


function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escapeAttribute(value) {
    return escapeHtml(value);
}


/* ===
   IDENTIDADE
=== */

function carregarIdentidade() {
    const salva = sessionStorage.getItem(
        "estacao-ti-identidade"
    );

    if (!salva) {
        mostrarModalIdentidade();
        return;
    }

    try {
        const dados = JSON.parse(salva);

        if (
            dados &&
            dados.nome &&
            dados.avatar
        ) {
            identidade = {
                nome: String(dados.nome),
                avatar: String(dados.avatar)
            };

            atualizarIdentidadeVisual();
            selecionarAvatar(identidade.avatar);
            return;
        }
    } catch (error) {
        console.warn(
            "Identidade salva inválida.",
            error
        );
    }

    sessionStorage.removeItem(
        "estacao-ti-identidade"
    );

    mostrarModalIdentidade();
}


function mostrarModalIdentidade() {
    if (!identityModal) {
        return;
    }

    identityModal.hidden = false;

    setTimeout(() => {
        if (identityNameInput) {
            identityNameInput.focus();
        }
    }, 100);
}


function esconderModalIdentidade() {
    if (!identityModal) {
        return;
    }

    identityModal.hidden = true;
}


function selecionarAvatar(avatar) {
    document
        .querySelectorAll(".avatar-option")
        .forEach(option => {
            option.classList.toggle(
                "selected",
                option.dataset.avatar === avatar
            );
        });
}


function obterAvatarSelecionado() {
    const selecionado =
        document.querySelector(
            ".avatar-option.selected"
        );

    return selecionado
        ? selecionado.dataset.avatar
        : null;
}


function salvarIdentidade() {
    const nome =
        identityNameInput
            ? identityNameInput.value
                .trim()
                .replace(/\s+/g, " ")
                .slice(0, 30)
            : "";

    const avatar =
        obterAvatarSelecionado();

    if (!nome) {
        identityError.textContent =
            "Digite seu nome.";
        return false;
    }

    if (!avatar) {
        identityError.textContent =
            "Escolha um avatar.";
        return false;
    }

    identidade = {
        nome,
        avatar
    };

    sessionStorage.setItem(
        "estacao-ti-identidade",
        JSON.stringify(identidade)
    );

    atualizarIdentidadeVisual();

    identityError.textContent = "";

    esconderModalIdentidade();

    if (
        socket &&
        socket.connected
    ) {
        socket.emit(
            "definir-identidade",
            identidade
        );
    }

    return true;
}


function atualizarIdentidadeVisual() {
    if (
        !currentIdentity ||
        !identidade
    ) {
        return;
    }

    currentIdentity.innerHTML = `
        <img
            src="/avatars/${escapeAttribute(identidade.avatar)}"
            width="42"
            height="42"
            alt=""
        >

        <div>
            <strong>
                ${escapeHtml(identidade.nome)}
            </strong>

            <span>
                ONLINE
            </span>
        </div>
    `;

    currentIdentity.classList.add("visible");
}


document
    .querySelectorAll(".avatar-option")
    .forEach(option => {
        option.addEventListener(
            "click",
            () => {
                selecionarAvatar(
                    option.dataset.avatar
                );
            }
        );
    });


if (saveIdentityButton) {
    saveIdentityButton.addEventListener(
        "click",
        salvarIdentidade
    );
}


if (closeIdentityButton) {
    closeIdentityButton.addEventListener(
        "click",
        () => {
            if (identidade) {
                esconderModalIdentidade();
            }
        }
    );
}


if (identityNameInput) {
    identityNameInput.addEventListener(
        "keydown",
        event => {
            if (event.key === "Enter") {
                salvarIdentidade();
            }
        }
    );
}


if (changeIdentityButton) {
    changeIdentityButton.addEventListener(
        "click",
        () => {
            if (!identidade) {
                mostrarModalIdentidade();
                return;
            }

            identityNameInput.value =
                identidade.nome;

            identityError.textContent = "";

            selecionarAvatar(
                identidade.avatar
            );

            mostrarModalIdentidade();
        }
    );
}


/* ===
   YOUTUBE
=== */

window.onYouTubeIframeAPIReady = function () {
    player = new YT.Player(
        "youtube-player",
        {
            height: "100%",
            width: "100%",
            videoId: "",
            playerVars: {
                controls: 0,
                disablekb: 1,
                fs: 0,
                rel: 0,
                modestbranding: 1,
                playsinline: 1
            },
            events: {
                onReady: () => {
                    playerPronto = true;

                    if (enableAudioButton) {
                        enableAudioButton.hidden = false;
                    }

                    tentarAplicarEstado();
                },

                onStateChange:
                    tratarEstadoPlayer
            }
        }
    );
};


function tratarEstadoPlayer(event) {
    if (aplicandoEstadoServidor) {
        return;
    }

    if (!socket || !socket.connected) {
        return;
    }

    const musicaAtual =
        estadoSala.fila[
            estadoSala.indiceAtual
        ];

    if (!musicaAtual) {
        return;
    }

    if (
        event.data ===
        YT.PlayerState.PLAYING
    ) {
        socket.emit(
            "controle-sala",
            {
                tipo: "play"
            }
        );

        return;
    }

    if (
        event.data ===
        YT.PlayerState.ENDED
    ) {
        socket.emit(
            "controle-sala",
            {
                tipo: "ended",
                videoId: musicaAtual.videoId
            }
        );
    }
}


/* ===
   SOCKET
=== */

function conectarSocket(codigoSala = null) {
    if (!identidade) {
        mostrarModalIdentidade();
        return;
    }

    salaDesejada =
        codigoSala
            ? codigoSala.trim().toUpperCase()
            : null;

    if (socket) {
        socket.disconnect();
    }

    socket = io();

    atualizarStatus("conectando");

    socket.on("connect", () => {
        atualizarStatus("online");

        if (salaDesejada) {
            socket.emit(
                "entrar-sala",
                salaDesejada
            );
        } else {
            socket.emit("criar-sala");
        }
    });


    socket.on(
        "sala-criada",
        dados => {
            salaDesejada = dados.codigo;
            entrarVisualmenteNaSala(dados);

            socket.emit("definir-identidade", identidade);
        }
    );


    socket.on(
        "entrou-sala",
        dados => {
            salaDesejada = dados.codigo;
            entrarVisualmenteNaSala(dados);

            renderizarAtividades(
                Array.isArray(dados?.atividades)
                    ? dados.atividades
                    : []
            );

            socket.emit("definir-identidade", identidade);
        }
    );


    socket.on(
        "erro-sala",
        mensagem => {
            alert(mensagem);
            atualizarStatus("erro");
        }
    );


    socket.on(
        "erro-identidade",
        mensagem => {
            identityError.textContent =
                mensagem;
            mostrarModalIdentidade();
        }
    );


    socket.on(
        "fila-atualizada",
        dados => {
            estadoSala.fila =
                Array.isArray(dados.fila)
                    ? dados.fila
                    : [];

            estadoSala.indiceAtual =
                Number.isInteger(
                    dados.indiceAtual
                )
                    ? dados.indiceAtual
                    : -1;

            atualizarFila();
            atualizarMusicaAtual();
            tentarAplicarEstado();
        }
    );


    socket.on(
        "estado-player",
        dados => {
            estadoSala.tocando =
                Boolean(dados.tocando);

            estadoSala.posicao =
                Number(dados.posicao || 0);

            if (
                Number.isInteger(
                    dados.indiceAtual
                )
            ) {
                estadoSala.indiceAtual =
                    dados.indiceAtual;
            }

            atualizarMusicaAtual();
            tentarAplicarEstado();
        }
    );


    socket.on(
        "usuarios-atualizados",
        dados => {
            const usuarios =
                Array.isArray(dados.usuarios)
                    ? dados.usuarios
                    : [];

            roomUsers.textContent =
                usuarios.length ||
                dados.quantidade ||
                0;

            renderizarUsuarios(usuarios);
        }
    );


    socket.on(
        "atividade-atualizada",
        dados => {
            renderizarAtividades(
                Array.isArray(dados?.atividades)
                    ? dados.atividades
                    : []
            );
        }
    );


    socket.on(
        "identidade-atualizada",
        dados => {
            if (
                dados &&
                dados.socketId === socket.id &&
                dados.usuario
            ) {
                identidade =
                    dados.usuario;

                sessionStorage.setItem(
                    "estacao-ti-identidade",
                    JSON.stringify(
                        identidade
                    )
                );

                atualizarIdentidadeVisual();
            }

            // A lista "QUEM ESTÁ AQUI" já é atualizada
            // pelo evento usuarios-atualizados.
        }
    );


    socket.on(
        "disconnect",
        () => {
            atualizarStatus("offline");
        }
    );
}


/* ===
   STATUS
=== */

function atualizarStatus(status) {
    if (!connectionStatus) {
        return;
    }

    if (status === "online") {
        connectionStatus.innerHTML = `
            <img
                src="https://api.iconify.design/tabler/wifi.svg?color=%23C084FC"
                width="18"
                height="18"
                alt=""
            >
            ONLINE
        `;
        return;
    }

    if (status === "conectando") {
        connectionStatus.innerHTML = `
            <img
                src="https://api.iconify.design/tabler/loader-2.svg?color=%23C084FC"
                width="18"
                height="18"
                alt=""
            >
            CONECTANDO...
        `;
        return;
    }

    if (status === "erro") {
        connectionStatus.innerHTML = `
            <img
                src="https://api.iconify.design/tabler/alert-circle.svg?color=%23C084FC"
                width="18"
                height="18"
                alt=""
            >
            ERRO
        `;
        return;
    }

    connectionStatus.innerHTML = `
        <img
            src="https://api.iconify.design/tabler/wifi-off.svg?color=%23C084FC"
            width="18"
            height="18"
            alt=""
        >
        OFFLINE
    `;
}


/* ===
   ENTRADA NA SALA
=== */

function entrarVisualmenteNaSala(dados) {
    roomCode.textContent =
        dados.codigo;

    roomInput.value =
        dados.codigo;

    if (dados.usuario) {
        identidade = dados.usuario;

        sessionStorage.setItem(
            "estacao-ti-identidade",
            JSON.stringify(identidade)
        );

        atualizarIdentidadeVisual();
    }

    const estado =
        dados.estado || {};

    estadoSala = {
        fila:
            Array.isArray(estado.fila)
                ? estado.fila
                : [],

        indiceAtual:
            Number.isInteger(
                estado.indiceAtual
            )
                ? estado.indiceAtual
                : -1,

        tocando:
            Boolean(estado.tocando),

        posicao:
            Number(estado.posicao || 0)
    };

    atualizarFila();
    atualizarMusicaAtual();
    tentarAplicarEstado();

    const url =
        new URL(window.location.href);

    url.searchParams.set(
        "room",
        dados.codigo
    );

    window.history.replaceState(
        {},
        "",
        url
    );
}


/* ===
   CONTROLE
=== */

function enviarControle(dados) {
    if (
        !socket ||
        !socket.connected
    ) {
        return;
    }

    socket.emit(
        "controle-sala",
        dados
    );
}


/* ===
   CRIAR SALA
=== */

if (createRoomButton) {
    createRoomButton.addEventListener(
        "click",
        () => {
            conectarSocket();
        }
    );
}


/* ===
   ENTRAR
=== */

if (joinRoomButton) {
    joinRoomButton.addEventListener(
        "click",
        () => {
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
}


if (roomInput) {
    roomInput.addEventListener(
        "keydown",
        event => {
            if (event.key === "Enter") {
                joinRoomButton.click();
            }
        }
    );
}


/* ===
   PESQUISA
=== */

if (searchButton) {
    searchButton.addEventListener(
        "click",
        pesquisar
    );
}


if (searchInput) {
    searchInput.addEventListener(
        "keydown",
        event => {
            if (event.key === "Enter") {
                pesquisar();
            }
        }
    );
}


async function pesquisar() {
    const query =
        searchInput.value.trim();

    if (!query) {
        return;
    }

    searchResults.innerHTML = `
        <div class="empty-message">
            <span class="empty-icon">
                <img
                    src="https://api.iconify.design/tabler/loader-2.svg?color=%23C084FC"
                    width="38"
                    height="38"
                    alt=""
                >
            </span>

            <strong>PESQUISANDO...</strong>

            <p>
                procurando no YouTube
            </p>
        </div>
    `;

    try {
        const response =
            await fetch(
                `/api/search?q=${encodeURIComponent(query)}`
            );

        const data =
            await response.json();

        if (!data.sucesso) {
            throw new Error(
                data.erro ||
                "Erro na pesquisa."
            );
        }

        resultadosPesquisa =
            Array.isArray(data.resultados)
                ? data.resultados
                : [];

        renderizarResultados(
            resultadosPesquisa
        );
    } catch (error) {
        console.error(error);

        searchResults.innerHTML = `
            <div class="empty-message">
                <span class="empty-icon">
                    <img
                        src="https://api.iconify.design/tabler/alert-triangle.svg?color=%23C084FC"
                        width="38"
                        height="38"
                        alt=""
                    >
                </span>

                <strong>ERRO</strong>

                <p>
                    ${escapeHtml(error.message)}
                </p>
            </div>
        `;
    }
}


/* ===
   RESULTADOS
=== */

function renderizarResultados(resultados) {
    if (
        !resultados ||
        !resultados.length
    ) {
        searchResults.innerHTML = `
            <div class="empty-message">
                <span class="empty-icon">
                    <img
                        src="https://api.iconify.design/tabler/music-search.svg?color=%23C084FC"
                        width="38"
                        height="38"
                        alt=""
                    >
                </span>

                <strong>NENHUM RESULTADO</strong>

                <p>
                    Não encontramos essa música.
                </p>
            </div>
        `;

        return;
    }

    searchResults.innerHTML =
        resultados
            .map(
                musica => `
                    <div class="result-card">

                        <img
                            class="result-image"
                            src="${escapeAttribute(musica.imagem)}"
                            alt=""
                        >

                        <div class="result-info">

                            <strong>
                                ${escapeHtml(musica.titulo)}
                            </strong>

                            <span>
                                ${escapeHtml(musica.canal)}
                            </span>

                        </div>

                        <div class="result-actions">

                            <button
                                class="small-metro-button"
                                onclick="tocarAgora('${escapeAttribute(musica.videoId)}')"
                            >
                                <img
                                    src="https://api.iconify.design/tabler/player-play.svg?color=%23ffffff"
                                    width="18"
                                    height="18"
                                    alt=""
                                >
                                TOCAR
                            </button>

                            <button
                                class="small-metro-button"
                                onclick="adicionarFila('${escapeAttribute(musica.videoId)}')"
                            >
                                <img
                                    src="https://api.iconify.design/tabler/playlist-add.svg?color=%23ffffff"
                                    width="18"
                                    height="18"
                                    alt=""
                                >
                                FILA
                            </button>

                        </div>

                    </div>
                `
            )
            .join("");
}


window.tocarAgora = function (videoId) {
    const musica =
        resultadosPesquisa.find(
            item =>
                item.videoId === videoId
        );

    if (!musica) {
        return;
    }

    if (
        !socket ||
        !socket.connected
    ) {
        alert(
            "Entre em uma sala primeiro."
        );
        return;
    }

    const musicaSala = {
        ...musica,
        adicionadoPor: identidade
    };

    // Aplica imediatamente no navegador de quem clicou em TOCAR.
    // Isso evita depender do autoplay depois que o evento do Socket.IO chega,
    // especialmente no navegador de quem criou a sala.
    const indiceExistente = estadoSala.fila.findIndex(
        item => item.videoId === videoId
    );

    if (indiceExistente === -1) {
        estadoSala.fila.push(musicaSala);
        estadoSala.indiceAtual =
            estadoSala.fila.length - 1;
    } else {
        estadoSala.indiceAtual = indiceExistente;
    }

    estadoSala.tocando = true;
    estadoSala.posicao = 0;

    atualizarFila();
    atualizarMusicaAtual();
    tentarAplicarEstado(false);

    enviarControle({
        tipo: "play-now",
        musica: musicaSala
    });
};


window.adicionarFila = function (videoId) {
    const musica =
        resultadosPesquisa.find(
            item =>
                item.videoId === videoId
        );

    if (!musica) {
        return;
    }

    if (
        !socket ||
        !socket.connected
    ) {
        alert(
            "Entre em uma sala primeiro."
        );
        return;
    }

    enviarControle({
        tipo: "adicionar",
        musica: {
            ...musica,
            adicionadoPor: identidade
        }
    });
};


/* ===
   FILA
=== */

function atualizarFila() {
    if (
        !estadoSala.fila.length
    ) {
        queueList.innerHTML = `
            <div class="empty-message">

                <span class="empty-icon">
                    <img
                        src="https://api.iconify.design/tabler/playlist-x.svg?color=%23C084FC"
                        width="38"
                        height="38"
                        alt=""
                    >
                </span>

                <strong>A FILA ESTÁ VAZIA</strong>

                <p>
                    Adicione músicas para criar sua playlist
                </p>

            </div>
        `;

        return;
    }

    queueList.innerHTML =
        estadoSala.fila
            .map(
                (musica, index) => {
                    const atual =
                        index ===
                        estadoSala.indiceAtual;

                    const autor =
                        musica.adicionadoPor;

                    const autorHtml =
                        autor
                            ? `
                                <div class="queue-author">
                                    <img
                                        src="/avatars/${escapeAttribute(autor.avatar)}"
                                        alt=""
                                    >

                                    <span>
                                        por
                                        <strong>
                                            ${escapeHtml(autor.nome)}
                                        </strong>
                                    </span>
                                </div>
                            `
                            : "";

                    return `
                        <div
                            class="queue-item ${atual ? "active" : ""}"
                        >

                            <img
                                class="queue-thumbnail"
                                src="${escapeAttribute(musica.imagem)}"
                                alt=""
                            >

                            <div class="queue-info">

                                <strong>
                                    ${escapeHtml(musica.titulo)}
                                </strong>

                                <span>
                                    ${escapeHtml(musica.canal)}
                                </span>

                                ${autorHtml}

                            </div>

                            <div class="queue-actions">

                                <button
                                    class="small-metro-button danger"
                                    onclick="removerIndice(${index})"
                                    title="Remover da fila"
                                >
                                    ×
                                </button>

                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}


window.removerIndice = function (index) {
    enviarControle({
        tipo: "remove",
        index: Number(index)
    });
};


/* ===
   MÚSICA ATUAL
=== */

function atualizarMusicaAtual() {
    const musica =
        estadoSala.fila[
            estadoSala.indiceAtual
        ];

    if (!musica) {
        musicTitle.textContent =
            "Nenhuma música tocando";

        musicArtist.textContent =
            "Entre em uma sala para começar";

        return;
    }

    musicTitle.textContent =
        musica.titulo;

    musicArtist.textContent =
        musica.canal;
}


/* ===
   PLAYER
=== */

function tentarAplicarEstado(sincronizarPosicao = true) {
    if (!playerPronto || !player) {
        return;
    }

    const musica =
        estadoSala.fila[
            estadoSala.indiceAtual
        ];

    if (!musica) {
        return;
    }

    const videoAtual =
        player.getVideoData?.()?.video_id ||
        "";

    aplicandoEstadoServidor = true;

    // Troca de música: aqui sim carregamos o vídeo novo.
    if (videoAtual !== musica.videoId) {
        const inicio = Math.max(
            0,
            Number(estadoSala.posicao || 0)
        );

        if (estadoSala.tocando) {
            player.loadVideoById({
                videoId: musica.videoId,
                startSeconds: inicio
            });
        } else {
            player.cueVideoById({
                videoId: musica.videoId,
                startSeconds: inicio
            });
        }
    } else {
        const estadoYoutube =
            typeof player.getPlayerState === "function"
                ? player.getPlayerState()
                : -1;

        // NÃO reposiciona por diferenças pequenas.
        // O servidor envia atualizações periodicamente e a posição
        // pode estar alguns segundos atrás por causa da rede.
        // Só corrige uma divergência realmente grande.
        if (sincronizarPosicao && estadoSala.tocando) {
            const posicaoAtual =
                Number(player.getCurrentTime?.() || 0);

            const posicaoServidor =
                Number(estadoSala.posicao || 0);

            const diferenca =
                Math.abs(
                    posicaoAtual -
                    posicaoServidor
                );

            if (diferenca > 8) {
                player.seekTo(
                    Math.max(0, posicaoServidor),
                    true
                );
            }
        }

        // Só manda tocar se o YouTube estiver realmente parado/pausado.
        // Se já estiver tocando, não chama playVideo() novamente.
        if (
            estadoSala.tocando &&
            estadoYoutube !== 1
        ) {
            player.playVideo();
        }
    }

    setTimeout(() => {
        aplicandoEstadoServidor = false;
    }, 700);
}

// Não existe mais um setInterval chamando seekTo/playVideo a cada 5 segundos.
// O estado recebido pelo Socket.IO é suficiente para manter a sala sincronizada
// sem ficar fazendo a música voltar alguns segundos.


/* ===
   ÁUDIO / MUTE
=== */

if (enableAudioButton) {
    enableAudioButton.addEventListener(
        "click",
        () => {
            if (!player) {
                return;
            }

            player.unMute();
            player.setVolume(100);

            audioMutado = false;

            atualizarMuteVisual();

            tentarAplicarEstado();

            enableAudioButton.hidden = true;
        }
    );
}


if (muteButton) {
    muteButton.addEventListener(
        "click",
        () => {
            if (!player) {
                return;
            }

            audioMutado =
                !audioMutado;

            if (audioMutado) {
                player.mute();
            } else {
                player.unMute();
                player.setVolume(100);
            }

            atualizarMuteVisual();
        }
    );
}


function atualizarMuteVisual() {
    if (!muteIcon || !muteText) {
        return;
    }

    if (audioMutado) {
        muteIcon.src =
            "https://api.iconify.design/tabler/volume-off.svg?color=%23C084FC";

        muteText.textContent =
            "DESMUTAR";
    } else {
        muteIcon.src =
            "https://api.iconify.design/tabler/volume.svg?color=%23C084FC";

        muteText.textContent =
            "MUTAR";
    }
}


/* ===
   USUÁRIOS
=== */

function renderizarUsuarios(usuarios) {
    if (
        !usuarios ||
        !usuarios.length
    ) {
        usersList.innerHTML = `
            <div class="empty-message">

                <span class="empty-icon">
                    <img
                        src="https://api.iconify.design/tabler/user-off.svg?color=%23C084FC"
                        width="34"
                        height="34"
                        alt=""
                    >
                </span>

                <strong>NENHUM USUÁRIO</strong>

                <p>
                    Entre em uma sala para aparecer aqui
                </p>

            </div>
        `;

        return;
    }

    usersList.innerHTML =
        usuarios
            .map(
                usuario => {
                    const souEu =
                        socket &&
                        (usuario.id === socket.id || usuario.socketId === socket.id);

                    return `
                        <div class="user-card">

                            <div class="user-avatar">
                                <img
                                    src="/avatars/${escapeAttribute(usuario.avatar)}"
                                    alt=""
                                >
                            </div>

                            <div class="user-info">

                                <strong>
                                    ${escapeHtml(usuario.nome)}
                                </strong>

                                <span class="user-online">
                                    <span></span>
                                    ${souEu ? "VOCÊ" : "ONLINE"}
                                </span>

                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}


/* ===
   ATIVIDADE
=== */

function renderizarAtividades(atividades) {
    if (!activityList) {
        return;
    }

    activityList.innerHTML = "";

    const lista = Array.isArray(atividades)
        ? atividades.slice(-8)
        : [];

    lista.forEach(atividade => {
        if (!atividade || !atividade.usuario) {
            return;
        }

        const item = document.createElement("div");
        item.className = "activity-item";

        const acao =
            atividade.tipo === "entrou"
                ? "entrou na sala"
                : atividade.tipo === "saiu"
                    ? "saiu da sala"
                    : String(atividade.tipo || "atividade");

        item.innerHTML = `
            <img
                src="/avatars/${escapeAttribute(atividade.usuario.avatar)}"
                alt=""
            >

            <div>
                <strong>${escapeHtml(atividade.usuario.nome)}</strong>
                <span>${escapeHtml(acao)}</span>
            </div>
        `;

        activityList.appendChild(item);
    });
}



/* ===
   INICIALIZAÇÃO
=== */

function iniciar() {
    atualizarFila();
    atualizarMusicaAtual();
    atualizarMuteVisual();
    carregarIdentidade();

    const params =
        new URLSearchParams(
            window.location.search
        );

    const sala =
        params.get("room");

    if (
        sala &&
        identidade
    ) {
        conectarSocket(sala);
    }
}

iniciar();
