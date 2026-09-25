/* 
   ESTACAO-TI MUSIC NETWORK
   SCRIPT PRINCIPAL
 */


/* 
   SOCKET.IO
 */

let socket = null;


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


const queueList =
    document.getElementById(
        "queue-list"
    );


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


        conectarSocket();

    }
);


/* 
   ENTRAR EM SALA
 */

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


            socket.emit(
                "definir-identidade",
                identidade
            );


            if (codigoSala) {

                socket.emit(
                    "entrar-sala",
                    {
                        codigo:
                            codigoSala,

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

            alert(
                mensagem
            );


            connectionStatus.textContent =
                "🔴 ERRO";

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

            connectionStatus.textContent =
                "🔴 OFFLINE";

        }
    );

}


/* 
   ENTRAR VISUALMENTE NA SALA
 */

function entrarVisualmenteNaSala(
    dados
) {

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
        socket.connected

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

    enviarControle({

        tipo:
            "next"

    });

}


/* 
   ANTERIOR
 */

function anterior() {

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
            `✕ <small>DESMUTAR</small>`;
    } else {
        playPauseButton.innerHTML =
            `▶ <small>MUTAR</small>`;
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
            `▶ <small>TOCAR</small>`;


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