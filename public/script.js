/* 
   ESTACAO-TI MUSIC NETWORK
   SCRIPT PRINCIPAL
 */


/* 
   SOCKET.IO
 */

let socket = null;

let salaAtual = null;

/* 
   YOUTUBE
 */

let player = null;

let playerPronto = false;

let aplicandoEstadoServidor = false;

/* MUDO INDIVIDUAL */
let mutadoLocalmente = false;

/* YOUTUBE API - CHAVE POR USUÁRIO */
const YOUTUBE_API_KEY_STORAGE = "estacaoTI_youtube_api_key";


/* 
   IDENTIDADE
 */

let identidade = null;

let avatarSelecionado = "avatar01.png";


const AVATARES = [

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

];


/* 
   ESTADO DA SALA
 */

let estadoSala = {

    fila: [],

    indiceAtual: -1,

    tocando: false,

    posicao: 0

};


/* 
   ELEMENTOS
 */

const identityOverlay =
    document.getElementById(
        "identity-overlay"
    );


const identityName =
    document.getElementById(
        "identity-name"
    );


const avatarSelection =
    document.getElementById(
        "avatar-selection"
    );


const identityConfirmButton =
    document.getElementById(
        "identity-confirm-button"
    );


const currentUserAvatar =
    document.getElementById(
        "current-user-avatar"
    );


const currentUserName =
    document.getElementById(
        "current-user-name"
    );


const searchInput =
    document.getElementById(
        "search-input"
    );


const searchButton =
    document.getElementById(
        "search-button"
    );


const searchResults =
    document.getElementById(
        "search-results"
    );


const resultsPanel =
    document.getElementById(
        "results-panel"
    );


const toggleResultsButton =
    document.getElementById(
        "toggle-results-button"
    );


const queueList =
    document.getElementById(
        "queue-list"
    );


const roomChatPanel = document.getElementById("room-chat-panel");
const toggleChatButton = document.getElementById("toggle-chat-button");
const roomChatMessages = document.getElementById("room-chat-messages");
const roomChatForm = document.getElementById("room-chat-form");
const roomChatInput = document.getElementById("room-chat-input");


function escaparChatHTML(valor) {
    return String(valor || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function adicionarMensagemChat(mensagem) {
    if (!roomChatMessages || !mensagem) return;
    const vazio = roomChatMessages.querySelector(".chat-empty");
    if (vazio) vazio.remove();
    const item = document.createElement("div");
    item.className = "chat-message";
    item.innerHTML =
        '<img src="/avatars/' + escaparChatHTML(mensagem.avatar || "avatar01.png") + '" alt="" aria-hidden="true">' +
        '<div><strong>' + escaparChatHTML(mensagem.nome || "Visitante") + '</strong><p>' + escaparChatHTML(mensagem.texto || "") + '</p></div>';
    roomChatMessages.appendChild(item);
    roomChatMessages.scrollTop = roomChatMessages.scrollHeight;
}

function limparChat() {
    if (roomChatMessages) roomChatMessages.innerHTML = '<div class="chat-empty">Entre em uma sala para conversar</div>';
}

function atualizarPainelChat(minimizado) {
    if (!roomChatPanel || !toggleChatButton) return;
    roomChatPanel.classList.toggle("room-chat-minimized", minimizado);
    toggleChatButton.setAttribute("aria-expanded", String(!minimizado));
    toggleChatButton.title = minimizado ? "Mostrar chat" : "Minimizar chat";
    toggleChatButton.innerHTML = minimizado
        ? '<img class="ui-icon" src="https://api.iconify.design/tabler/maximize.svg?color=%23056184" width="18" alt="" aria-hidden="true"><span>CHAT</span>'
        : '<img class="ui-icon" src="https://api.iconify.design/tabler/minimize.svg?color=%23056184" width="18" alt="" aria-hidden="true"><span>MINIMIZAR</span>';
}

if (toggleChatButton) {
    toggleChatButton.addEventListener("click", function () {
        atualizarPainelChat(!roomChatPanel.classList.contains("room-chat-minimized"));
    });
}

if (roomChatForm) {
    roomChatForm.addEventListener("submit", function (evento) {
        evento.preventDefault();

        const texto = roomChatInput.value.trim();

        if (!texto) {
            return;
        }

        if (!salaAtual) {
            alert("Entre em uma sala primeiro.");
            return;
        }

        if (!socket || !socket.connected) {
            alert("A conexão com a sala está offline. Aguarde a reconexão.");
            return;
        }

        socket.emit("chat-mensagem", texto);
        roomChatInput.value = "";
        roomChatInput.focus();
    });
}


function atualizarPainelResultados(
    minimizado
) {

    if (!resultsPanel || !toggleResultsButton) {
        return;
    }

    resultsPanel.classList.toggle(
        "results-panel-minimized",
        minimizado
    );

    toggleResultsButton.setAttribute(
        "aria-expanded",
        String(!minimizado)
    );

    toggleResultsButton.setAttribute(
        "title",
        minimizado
            ? "Mostrar resultados"
            : "Minimizar resultados"
    );

    toggleResultsButton.innerHTML = minimizado
        ? '<img class="ui-icon" src="https://api.iconify.design/tabler/maximize.svg?color=%23056184" width="18" alt="" aria-hidden="true"><span>RESULTADOS</span>'
        : '<img class="ui-icon" src="https://api.iconify.design/tabler/minimize.svg?color=%23056184" width="18" alt="" aria-hidden="true"><span>MINIMIZAR</span>';
}


if (toggleResultsButton) {
    toggleResultsButton.addEventListener(
        "click",
        function () {
            atualizarPainelResultados(
                !resultsPanel.classList.contains(
                    "results-panel-minimized"
                )
            );
        }
    );
}


const musicTitle =
    document.getElementById(
        "music-title"
    );


const musicArtist =
    document.getElementById(
        "music-artist"
    );


const roomInput =
    document.getElementById(
        "room-input"
    );


const roomCode =
    document.getElementById(
        "room-code"
    );


const roomUsers =
    document.getElementById(
        "room-users"
    );


const roomUsersList =
    document.getElementById(
        "room-users-list"
    );


const roomActivity =
    document.getElementById(
        "room-activity"
    );


const connectionStatus =
    document.getElementById(
        "connection-status"
    );


const createRoomButton =
    document.getElementById(
        "create-room-button"
    );


const joinRoomButton =
    document.getElementById(
        "join-room-button"
    );


const enableAudioButton =
    document.getElementById(
        "enable-audio-button"
    );


const previousButton =
    document.getElementById(
        "previous-button"
    );


const playPauseButton =
    document.getElementById(
        "play-pause-button"
    );


const nextButton =
    document.getElementById(
        "next-button"
    );


const youtubeApiKeyInput =
    document.getElementById(
        "youtube-api-key"
    );


const clearApiKeyButton =
    document.getElementById(
        "clear-api-key-button"
    );


const apiKeyStatus =
    document.getElementById(
        "api-key-status"
    );


/*
   YOUTUBE API - CHAVE LOCAL
*/

function obterChaveYouTube() {

    return localStorage.getItem(
        YOUTUBE_API_KEY_STORAGE
    ) || "";
}


function atualizarStatusChaveApi() {

    const chave =
        obterChaveYouTube();

    if (!apiKeyStatus) {
        return;
    }

    if (chave) {
        apiKeyStatus.textContent =
            "chave salva neste navegador";
        apiKeyStatus.classList.add("active");
    } else {
        apiKeyStatus.textContent =
            "nenhuma chave salva neste navegador";
        apiKeyStatus.classList.remove("active");
    }
}


function salvarChaveYouTube() {

    if (!youtubeApiKeyInput) {
        return "";
    }

    const chave =
        youtubeApiKeyInput.value.trim();

    if (!chave) {
        return "";
    }

    localStorage.setItem(
        YOUTUBE_API_KEY_STORAGE,
        chave
    );

    atualizarStatusChaveApi();

    return chave;
}


function limparChaveYouTube() {

    localStorage.removeItem(
        YOUTUBE_API_KEY_STORAGE
    );

    if (youtubeApiKeyInput) {
        youtubeApiKeyInput.value = "";
    }

    atualizarStatusChaveApi();
}


function carregarChaveYouTube() {

    const chave =
        obterChaveYouTube();

    if (youtubeApiKeyInput && chave) {
        youtubeApiKeyInput.value = chave;
    }

    atualizarStatusChaveApi();
}


/*
   TROCA DE CHAVE APÓS LIMITE DA API
 */

function solicitarTrocaChaveApi(
    mensagem
) {

    localStorage.removeItem(
        YOUTUBE_API_KEY_STORAGE
    );

    if (youtubeApiKeyInput) {
        youtubeApiKeyInput.value = "";
        youtubeApiKeyInput.classList.add(
            "input-error"
        );
    }

    atualizarStatusChaveApi();

    searchResults.innerHTML = `
        <div class="empty-message">
            <span class="empty-icon">
                <img class="ui-icon" src="https://api.iconify.design/tabler/key.svg?color=%2300A6D6" width="20" alt="" aria-hidden="true">
            </span>

            <strong>
                COTA DA CHAVE ESGOTADA
            </strong>

            <p>
                ${escaparHTML(
                    mensagem ||
                    "A chave atual atingiu o limite de uso."
                )}
            </p>

            <button
                type="button"
                class="api-key-change-action"
                id="api-key-change-action"
            >
                TROCAR CHAVE AGORA
            </button>
        </div>
    `;

    const trocarChaveButton =
        document.getElementById(
            "api-key-change-action"
        );

    if (trocarChaveButton) {
        trocarChaveButton.addEventListener(
            "click",
            () => {
                if (youtubeApiKeyInput) {
                    youtubeApiKeyInput.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });

                    youtubeApiKeyInput.focus();
                    youtubeApiKeyInput.classList.remove(
                        "input-error"
                    );
                }
            }
        );
    }

    setTimeout(
        () => {
            if (youtubeApiKeyInput) {
                youtubeApiKeyInput.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

                youtubeApiKeyInput.focus();
            }
        },
        100
    );
}


if (youtubeApiKeyInput) {
    youtubeApiKeyInput.addEventListener(
        "change",
        salvarChaveYouTube
    );
}


if (clearApiKeyButton) {
    clearApiKeyButton.addEventListener(
        "click",
        limparChaveYouTube
    );
}


/* 
   IDENTIDADE - AVATARES
 */

function montarAvatares() {

    if (!avatarSelection) {
        return;
    }

    avatarSelection.innerHTML = "";


    AVATARES.forEach(
        (avatar, index) => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "avatar-option";


            if (
                avatar ===
                avatarSelecionado
            ) {

                button.classList.add(
                    "selected"
                );

            }


            button.innerHTML = `

                <img
                    src="avatars/${escaparAtributo(avatar)}"
                    alt="Avatar ${index + 1}"
                >

                <span>
                    ${String(index + 1).padStart(2, "0")}
                </span>

            `;


            button.addEventListener(
                "click",
                function () {

                    avatarSelecionado =
                        avatar;


                    document
                        .querySelectorAll(
                            ".avatar-option"
                        )
                        .forEach(
                            item => {

                                item.classList.remove(
                                    "selected"
                                );

                            }
                        );


                    button.classList.add(
                        "selected"
                    );

                }
            );


            avatarSelection.appendChild(
                button
            );

        }
    );

}


/* 
   SALVAR IDENTIDADE
 */

function salvarIdentidade() {

    const chaveYouTube =
        salvarChaveYouTube();

    if (!chaveYouTube) {
        if (youtubeApiKeyInput) {
            youtubeApiKeyInput.focus();
            youtubeApiKeyInput.classList.add("input-error");
            setTimeout(
                () => youtubeApiKeyInput.classList.remove("input-error"),
                800
            );
        }
        return;
    }

    const nome =
        identityName.value
            .trim()
            .replace(/\s+/g, " ")
            .slice(0, 20);


    if (!nome) {

        identityName.focus();

        identityName.classList.add(
            "input-error"
        );

        setTimeout(
            () => {

                identityName.classList.remove(
                    "input-error"
                );

            },
            800
        );

        return;

    }


    identidade = {

        nome,

        avatar:
            avatarSelecionado

    };


    sessionStorage.setItem(
        "estacaoTI_identidade",
        JSON.stringify(
            identidade
        )
    );


    atualizarIdentidadeVisual();


    identityOverlay.classList.add(
        "hidden"
    );


    console.log(
        "Identidade:",
        identidade
    );

}


/* 
   CARREGAR IDENTIDADE
 */

function carregarIdentidade() {

    const salva =
        sessionStorage.getItem(
            "estacaoTI_identidade"
        );


    if (salva) {

        try {

            const dados =
                JSON.parse(
                    salva
                );


            if (
                dados &&
                dados.nome &&
                dados.avatar &&
                AVATARES.includes(
                    dados.avatar
                )
            ) {

                identidade = {

                    nome:
                        String(
                            dados.nome
                        )
                        .trim()
                        .slice(0, 20),

                    avatar:
                        dados.avatar

                };


                avatarSelecionado =
                    identidade.avatar;


                identityName.value =
                    identidade.nome;


                atualizarIdentidadeVisual();


                identityOverlay.classList.add(
                    "hidden"
                );


                return;

            }

        } catch (erro) {

            console.error(
                "Erro ao carregar identidade:",
                erro
            );

        }

    }


    identityOverlay.classList.remove(
        "hidden"
    );

}


/* 
   VISUAL DA IDENTIDADE
 */

function atualizarIdentidadeVisual() {

    if (!identidade) {

        return;

    }


    currentUserName.textContent =
        identidade.nome;


    currentUserAvatar.src =
        `avatars/${identidade.avatar}`;


    currentUserAvatar.alt =
        identidade.nome;

}


/* 
   YOUTUBE API
 */

window.onYouTubeIframeAPIReady =
    function () {

        console.log(
            "YouTube Player API carregada."
        );


        player =
            new YT.Player(
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

                        onReady:
                            function () {

                                console.log(
                                    "Player do YouTube pronto."
                                );


                                playerPronto =
                                    true;


                                tentarAplicarEstado();

                            },


                        onStateChange:
                            function (
                                event
                            ) {

                                tratarEstadoPlayer(
                                    event
                                );

                            },


                        onError:
                            function (
                                event
                            ) {

                                console.error(
                                    "Erro no player do YouTube:",
                                    event.data
                                );

                            }

                    }

                }
            );

    };


/* 
   ESTADO DO YOUTUBE
 */

function tratarEstadoPlayer(
    event
) {

    if (
        aplicandoEstadoServidor
    ) {

        return;

    }


    if (
        event.data ===
        YT.PlayerState.PLAYING
    ) {

        enviarControle({

            tipo:
                "play"

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

            tipo:
                "ended",

            videoId:
                musicaAtual.videoId

        });

    }

}


/* 
   CRIAR SALA
 */

createRoomButton.addEventListener(
    "click",
    function () {

        if (!identidade) {

            identityOverlay.classList.remove(
                "hidden"
            );

            return;

        }

        if (salaAtual) {
            alert("Você já está em uma sala. Saia da sala atual antes de criar outra.");
            return;
        }

        conectarSocket();

    }
);


/*
   ESTADO DO BOTÃO DA SALA
*/

function atualizarBotaoSala(
    dentroDaSala
) {

    if (!joinRoomButton) {
        return;
    }

    if (dentroDaSala) {
        joinRoomButton.innerHTML =
            '<img class="ui-icon" src="https://api.iconify.design/tabler/logout.svg?color=%23056384" width="18" alt="" aria-hidden="true"> SAIR';

        joinRoomButton.classList.add(
            "leave-room-button"
        );

        roomInput.disabled = true;

    } else {
        joinRoomButton.innerHTML =
            "ENTRAR";

        joinRoomButton.classList.remove(
            "leave-room-button"
        );

        roomInput.disabled = false;

    }
}


/*
   SAIR DA SALA
*/

function sairDaSala() {

    const salaParaSair =
        salaAtual;

    salaAtual = null;

    if (socket && salaParaSair) {
        if (socket.connected) {
            socket.emit(
                "sair-sala"
            );
        }

        // A saída é intencional. Desconectamos o socket para que
        // uma reconexão posterior não crie uma nova sala sozinha.
        socket.disconnect();
        socket = null;
    }

    roomCode.textContent =
        "------";

    roomInput.value =
        "";

    estadoSala = {
        fila: [],
        indiceAtual: -1,
        tocando: false,
        posicao: 0
    };

    atualizarFila();
    atualizarMusicaAtual();
    limparChat();

    roomActivity.innerHTML = "";
    roomUsersList.innerHTML = "";
    roomUsers.textContent = "0";

    atualizarBotaoSala(false);

    const novaUrl =
        window.location.pathname;

    window.history.replaceState(
        {},
        "",
        novaUrl
    );
}


/* 
   ENTRAR EM SALA
 */

joinRoomButton.addEventListener(
    "click",
    function () {

        if (salaAtual) {
            sairDaSala();
            return;
        }

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


        if (!identidade) {

            identityOverlay.classList.remove(
                "hidden"
            );

            return;

        }


        conectarSocket(
            codigo
        );

    }
);


/* 
   SOCKET
 */

function conectarSocket(
    codigoSala = null
) {

    salaAtual =
        codigoSala || null;

    if (socket) {

        socket.disconnect();

        socket = null;

    }


    socket = io();


    connectionStatus.innerHTML =
        `<img class="ui-icon" src="https://api.iconify.design/tabler/loader-2.svg?color=%23FFB703" width="16" alt="" aria-hidden="true"> CONECTANDO...`;


    socket.on(
        "connect",
        function () {

            console.log(
                "Socket conectado:",
                socket.id
            );


            connectionStatus.innerHTML =
                `<img class="ui-icon" src="https://api.iconify.design/tabler/circle-check.svg?color=%2300B894" width="16" alt="" aria-hidden="true"> ONLINE`;


            socket.emit(
                "definir-identidade",
                identidade
            );


            if (salaAtual) {

                socket.emit(
                    "entrar-sala",
                    {
                        codigo:
                            salaAtual,

                        usuario:
                            identidade
                    }
                );

            } else {

                socket.emit(
                    "criar-sala",
                    identidade
                );

            }

        }
    );


    /* ======================================================
       SALA CRIADA
    ====================================================== */

    socket.on(
        "chat-historico",
        function (mensagens) {
            limparChat();
            (mensagens || []).forEach(adicionarMensagemChat);
        }
    );

    socket.on(
        "chat-mensagem",
        function (mensagem) {
            adicionarMensagemChat(mensagem);
        }
    );


    socket.on(
        "sala-criada",
        function (dados) {

            entrarVisualmenteNaSala(
                dados
            );


            adicionarAtividade(
                identidade,
                "criou a sala"
            );

        }
    );


    /* ======================================================
       ENTROU
    ====================================================== */

    socket.on(
        "entrou-sala",
        function (dados) {

            entrarVisualmenteNaSala(
                dados
            );

        }
    );


    /* ======================================================
       ERRO
    ====================================================== */

    socket.on(
        "erro-sala",
        function (mensagem) {

            salaAtual = null;

            alert(
                mensagem
            );

            roomCode.textContent = "------";
            roomInput.value = "";
            estadoSala = {
                fila: [],
                indiceAtual: -1,
                tocando: false,
                posicao: 0
            };
            atualizarFila();
            atualizarMusicaAtual();
            limparChat();
            roomActivity.innerHTML = "";
            roomUsersList.innerHTML = "";
            roomUsers.textContent = "0";
            atualizarBotaoSala(false);

            // Um erro de entrada/criação encerra esta tentativa de socket.
            // Isso evita que o Socket.IO reconecte e crie uma sala inesperadamente.
            if (socket) {
                socket.disconnect();
                socket = null;
            }

            connectionStatus.innerHTML =
                `<img class="ui-icon" src="https://api.iconify.design/tabler/circle-x.svg?color=%23FF4D6D" width="16" alt="" aria-hidden="true"> ERRO`;

        }
    );


    /* ======================================================
       FILA
    ====================================================== */

    socket.on(
        "fila-atualizada",
        function (dados) {

            estadoSala.fila =
                dados.fila || [];


            estadoSala.indiceAtual =
                dados.indiceAtual ?? -1;


            atualizarFila();


            atualizarMusicaAtual();

            /*
             * IMPORTANTE:
             *
             * NÃO sincronizar o player aqui.
             *
             * Adicionar música não deve
             * reiniciar a música atual.
             */

        }
    );


    /* ======================================================
       ESTADO PLAYER
    ====================================================== */

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


    /* ======================================================
       USUÁRIOS
    ====================================================== */

    socket.on(
        "usuarios-atualizados",
        function (dados) {

            roomUsers.textContent =
                dados.quantidade || 0;


            atualizarUsuarios(
                dados.usuarios || []
            );

        }
    );


    /* ======================================================
       USUÁRIO ENTROU
    ====================================================== */

    socket.on(
        "usuario-entrou",
        function (usuario) {

            adicionarAtividade(
                usuario,
                "entrou na sala"
            );

        }
    );


    /* ======================================================
       USUÁRIO SAIU
    ====================================================== */

    socket.on(
        "usuario-saiu",
        function (usuario) {

            adicionarAtividade(
                usuario,
                "saiu da sala"
            );

        }
    );


    /* ======================================================
       DISCONNECT
    ====================================================== */

    socket.on(
        "disconnect",
        function () {

            connectionStatus.innerHTML =
                `<img class="ui-icon" src="https://api.iconify.design/tabler/circle.svg?color=%23FF4D6D" width="16" alt="" aria-hidden="true"> OFFLINE`;

            // Mantém "SAIR" enquanto a sala ainda é a sala desejada.
            atualizarBotaoSala(Boolean(salaAtual));

        }
    );

}


/* 
   ENTRAR VISUALMENTE NA SALA
 */

function entrarVisualmenteNaSala(
    dados
) {

    salaAtual =
        String(dados.codigo || "").trim().toUpperCase() || null;

    atualizarBotaoSala(true);

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


    limparChat();


    roomActivity.innerHTML = "";


    adicionarAtividade(
        identidade,
        "está na sala"
    );


    const novaUrl =
        `${window.location.pathname}?room=${dados.codigo}`;


    window.history.replaceState(
        {},
        "",
        novaUrl
    );


    tentarAplicarEstado();

}


/* 
   USUÁRIOS
 */

function atualizarUsuarios(
    usuarios
) {

    roomUsersList.innerHTML = "";


    if (
        usuarios.length === 0
    ) {

        roomUsersList.innerHTML = `

            <div class="community-empty">
                ninguém na sala
            </div>

        `;

        return;

    }


    usuarios.forEach(
        usuario => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "room-user";


            const souEu =
                identidade &&
                usuario.nome ===
                identidade.nome &&
                usuario.avatar ===
                identidade.avatar;


            if (souEu) {

                item.classList.add(
                    "me"
                );

            }


            item.innerHTML = `

                <img
                    src="avatars/${escaparAtributo(usuario.avatar)}"
                    alt="${escaparAtributo(usuario.nome)}"
                >

                <div class="room-user-info">

                    <strong>
                        ${escaparHTML(usuario.nome)}
                    </strong>

                    <span>
                        ${souEu ? "VOCÊ" : "ONLINE"}
                    </span>

                </div>

                <span class="user-online-dot">
                    ●
                </span>

            `;


            roomUsersList.appendChild(
                item
            );

        }
    );

}


/* 
   ATIVIDADE DA SALA
 */

function adicionarAtividade(
    usuario,
    texto
) {

    if (!usuario) {

        return;

    }


    const empty =
        roomActivity.querySelector(
            ".community-empty"
        );


    if (empty) {

        empty.remove();

    }


    const item =
        document.createElement(
            "div"
        );


    item.className =
        "activity-item";


    item.innerHTML = `

        <img
            src="avatars/${escaparAtributo(usuario.avatar)}"
            alt="${escaparAtributo(usuario.nome)}"
        >

        <div>

            <strong>
                ${escaparHTML(usuario.nome)}
            </strong>

            <span>
                ${escaparHTML(texto)}
            </span>

        </div>

    `;


    roomActivity.prepend(
        item
    );


    while (
        roomActivity.children.length >
        8
    ) {

        roomActivity.lastElementChild.remove();

    }

}


/* 
   SOCKET CONECTADO?
 */

function socketConectado() {

    return (

        socket &&
        socket.connected &&
        Boolean(salaAtual)

    );

}


/* 
   CONTROLE
 */

function enviarControle(
    dados
) {

    if (
        !socketConectado()
    ) {

        return;

    }


    socket.emit(
        "controle-sala",
        dados
    );

}


/*
   ÍCONES ICONIFY
 */

function icon(nome, cor = "00A6D6", tamanho = 18) {
    return '<img class="ui-icon" src="https://api.iconify.design/tabler/' +
        encodeURIComponent(nome) +
        '.svg?color=%23' +
        encodeURIComponent(cor) +
        '" width="' +
        Number(tamanho) +
        '" alt="" aria-hidden="true">';
}


/* 
   PESQUISA
 */

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
                <img class="ui-icon" src="https://api.iconify.design/tabler/search.svg?color=%2300A6D6" width="26" alt="" aria-hidden="true">
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
                )}`,
                {
                    headers: {
                        "X-YouTube-API-Key":
                            obterChaveYouTube()
                    }
                }
            );


        const dados =
            await resposta.json();


        if (
            !resposta.ok ||
            !dados.sucesso
        ) {

            const erroApi =
                new Error(
                    dados.erro ||
                    "Erro ao pesquisar."
                );

            erroApi.codigo =
                dados.codigo || "";

            erroApi.status =
                resposta.status;

            throw erroApi;

        }


        mostrarResultados(
            dados.resultados
        );


    } catch (erro) {

        console.error(
            "Erro na pesquisa:",
            erro
        );


        if (
            erro.codigo ===
                "QUOTA_EXCEDIDA"
        ) {
            solicitarTrocaChaveApi(
                erro.message
            );

            return;
        }


        searchResults.innerHTML = `

            <div class="empty-message">

                <span class="empty-icon">
                    <img class="ui-icon" src="https://api.iconify.design/tabler/alert-triangle.svg?color=%23FFB703" width="26" alt="" aria-hidden="true">
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


/* 
   RESULTADOS
 */

function mostrarResultados(
    resultados
) {

    searchResults.innerHTML = "";


    if (
        !resultados ||
        resultados.length === 0
    ) {

        searchResults.innerHTML = `

            <div class="empty-message">

                <span class="empty-icon">
                    <img class="ui-icon" src="https://api.iconify.design/tabler/music.svg?color=%2300A6D6" width="26" alt="" aria-hidden="true">
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
        musica => {

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
                        ${icon("player-play","FFFFFF",18)} TOCAR
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


/* 
   TOCAR AGORA
 */

function tocarMusica(
    musica
) {

    if (
        !socketConectado()
    ) {

        alert(
            "Entre em uma sala primeiro."
        );

        return;

    }


    enviarControle({

        tipo:
            "play-now",

        musica:
            musica

    });

}


/* 
   ADICIONAR À FILA
 */

function adicionarNaFila(
    musica
) {

    if (
        !socketConectado()
    ) {

        alert(
            "Entre em uma sala primeiro."
        );

        return;

    }


    enviarControle({

        tipo:
            "adicionar",

        musica:
            musica

    });

}


/* 
   PRÓXIMA
 */

function proxima() {

    if (!socketConectado()) {
        return;
    }

    enviarControle({

        tipo:
            "next"

    });

}


/* 
   ANTERIOR
 */

function anterior() {

    if (!socketConectado()) {
        return;
    }

    enviarControle({

        tipo:
            "previous"

    });

}


/* 
   REMOVER
 */

function remover(
    index
) {

    if (!socketConectado()) {
        return;
    }

    enviarControle({

        tipo:
            "remove",

        index:
            index

    });

}


/* 
   MÚSICA ATUAL
 */

function obterMusicaAtual() {

    if (
        estadoSala.indiceAtual <
        0
    ) {

        return null;

    }


    return (
        estadoSala.fila[
            estadoSala.indiceAtual
        ] || null
    );

}


/*
   MUDO INDIVIDUAL
*/

function atualizarBotaoMudo() {

    if (!playPauseButton) {
        return;
    }

    if (mutadoLocalmente) {
        playPauseButton.innerHTML =
            `<img class="ui-icon" src="https://api.iconify.design/tabler/volume-3.svg?color=%2300A6D6" width="20" alt="" aria-hidden="true"> <small>DESMUTAR</small>`;
    } else {
        playPauseButton.innerHTML =
            `<img class="ui-icon" src="https://api.iconify.design/tabler/volume-off.svg?color=%2300A6D6" width="20" alt="" aria-hidden="true"> <small>MUTAR</small>`;
    }
}


function alternarMudo() {

    if (!playerPronto || !player) {
        return;
    }

    mutadoLocalmente =
        !mutadoLocalmente;

    if (mutadoLocalmente) {
        player.mute();
    } else {
        player.unMute();
    }

    atualizarBotaoMudo();
}


/* 
   ATUALIZAR MÚSICA
 */

function atualizarMusicaAtual() {

    const musica =
        obterMusicaAtual();


    if (!musica) {

        musicTitle.textContent =
            "Nenhuma música tocando";


        musicArtist.textContent =
            "Entre em uma sala para começar";


        playPauseButton.innerHTML =
            `<img class="ui-icon" src="https://api.iconify.design/tabler/volume-off.svg?color=%23FFFFFF" width="20" alt="" aria-hidden="true"> <small>MUTAR</small>`;


        return;

    }


    musicTitle.textContent =
        musica.titulo;


    musicArtist.textContent =
        musica.canal;


    atualizarBotaoMudo();

}


/* 
   ATUALIZAR FILA
 */

function atualizarFila() {

    queueList.innerHTML = "";


    if (
        estadoSala.fila.length ===
        0
    ) {

        queueList.innerHTML = `

            <div class="empty-message">

                <span class="empty-icon">
                    <img class="ui-icon" src="https://api.iconify.design/tabler/list.svg?color=%2300A6D6" width="26" alt="" aria-hidden="true">
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
        (musica, index) => {

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


            const autor =
                musica.adicionadoPor || {

                    nome:
                        "Visitante",

                    avatar:
                        "avatar01.png"

                };


            item.innerHTML = `

                <img
                    class="queue-thumbnail"
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


                    <div class="queue-author">

                        <img
                            src="avatars/${escaparAtributo(
                                autor.avatar
                            )}"
                            alt="${escaparAtributo(
                                autor.nome
                            )}"
                        >

                        <span>
                            adicionada por
                            <strong>
                                ${escaparHTML(
                                    autor.nome
                                )}
                            </strong>
                        </span>

                    </div>

                </div>


                <button
                    class="queue-play-button"
                    title="Tocar"
                >
                    ${icon("player-play","00A6D6",18)}
                </button>


                <button
                    class="queue-remove-button"
                    title="Remover"
                >
                    ${icon("x","FF4D6D",18)}
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

                        tipo:
                            "play-index",

                        index:
                            index

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

                    remover(
                        index
                    );

                }
            );


            queueList.appendChild(
                item
            );

        }
    );

}


/* 
   APLICAR ESTADO NO YOUTUBE
 */

function tentarAplicarEstado(
    sincronizarPosicao = true
) {

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


        /* ==============================================
           VÍDEO DIFERENTE
        ============================================== */

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

            if (mutadoLocalmente) {
                player.mute();
            }


        } else {


            let tempoLocal = 0;


            try {

                tempoLocal =
                    player.getCurrentTime();

            } catch (erro) {

                tempoLocal = 0;

            }


            const tempoServidor =
                estadoSala.posicao || 0;


            if (
                sincronizarPosicao
            ) {

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


/* 
   ATIVAR ÁUDIO
 */

enableAudioButton.addEventListener(
    "click",
    function () {

        if (!playerPronto) {

            return;

        }


        aplicandoEstadoServidor =
            true;


        mutadoLocalmente = false;

        player.unMute();


        if (
            estadoSala.tocando
        ) {

            player.playVideo();

        } else {

            player.pauseVideo();

        }


        setTimeout(
            function () {

                aplicandoEstadoServidor =
                    false;

            },
            1200
        );


        atualizarBotaoMudo();

        enableAudioButton.hidden =
            true;

    }
);


/* 
   PLAY / PAUSE
 */

playPauseButton.addEventListener(
    "click",
    function () {
        if (!socketConectado()) {
            return;
        }

        alternarMudo();
    }
);


/* 
   PRÓXIMA
 */

nextButton.addEventListener(
    "click",
    function () {

        proxima();

    }
);


/* 
   ANTERIOR
 */

previousButton.addEventListener(
    "click",
    function () {

        anterior();

    }
);


/* 
   PESQUISA
 */

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
            event.key ===
            "Enter"
        ) {

            pesquisarMusicas();

        }

    }
);


/* 
   IDENTIDADE
 */

identityConfirmButton.addEventListener(
    "click",
    function () {

        salvarIdentidade();

    }
);


identityName.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key ===
            "Enter"
        ) {

            salvarIdentidade();

        }

    }
);


/* 
   TECLADO
 */

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
            document.activeElement ===
            identityName
        ) {

            return;

        }


        if (!socketConectado()) {
            return;
        }

        if (
            event.key ===
            "ArrowRight"
        ) {

            proxima();

        }


        if (
            event.key ===
            "ArrowLeft"
        ) {

            anterior();

        }

    }
);


/* 
   SEGURANÇA HTML
 */

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


/* 
   SALA PELA URL
 */

const parametros =
    new URLSearchParams(
        window.location.search
    );


const salaInicial =
    parametros.get(
        "room"
    );


if (salaInicial) {

    roomInput.value =
        salaInicial.toUpperCase();

}


/* 
   INICIALIZAÇÃO
 */

montarAvatares();

carregarChaveYouTube();

carregarIdentidade();

atualizarFila();

atualizarMusicaAtual();


console.log(
    "★ ESTACAO-TI MUSIC NETWORK carregado ★"
);


