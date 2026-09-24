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

app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});


/* =========================================================
   API DE TESTE
========================================================= */

app.get("/api/teste", (req, res) => {
  res.json({
    sucesso: true,
    mensagem: "A API está funcionando!"
  });
});


/* =========================================================
   BUSCA NO YOUTUBE
========================================================= */

app.get("/api/search", async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();

    if (!query) {
      return res.status(400).json({
        sucesso: false,
        erro: "Digite o nome de uma música ou artista."
      });
    }

    if (!process.env.YOUTUBE_API_KEY) {
      return res.status(500).json({
        sucesso: false,
        erro: "A chave da YouTube API não foi configurada."
      });
    }

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

    const response = await fetch(url);
    const data = await response.json();

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

    const resultados = (data.items || [])
      .filter(item => item.id?.videoId)
      .map(item => ({
        videoId: item.id.videoId,
        titulo: item.snippet.title,
        canal: item.snippet.channelTitle,
        descricao: item.snippet.description,
        imagem:
          item.snippet.thumbnails?.medium?.url
      }));

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


/* =========================================================
   SALAS
========================================================= */

const salas = new Map();


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


function criarSala() {

  const codigo =
    gerarCodigoSala();

  salas.set(codigo, {

    fila: [],

    indiceAtual: -1,

    tocando: false,

    posicao: 0,

    atualizadoEm: Date.now(),

    usuarios: new Map(),

    atividades: []

  });

  return codigo;
}


/* =========================================================
   POSIÇÃO DO PLAYER
========================================================= */

function obterPosicaoAtual(sala) {

  if (!sala.tocando) {
    return sala.posicao;
  }

  const agora = Date.now();

  const segundos =
    (agora - sala.atualizadoEm) / 1000;

  return sala.posicao + segundos;
}


function salvarPosicaoAtual(sala) {

  sala.posicao =
    obterPosicaoAtual(sala);

  sala.atualizadoEm =
    Date.now();
}


/* =========================================================
   USUÁRIO
========================================================= */

function limparUsuario(usuario) {

  if (!usuario) {
    return null;
  }

  const nome =
    String(usuario.nome || "").trim();

  const avatar =
    String(usuario.avatar || "").trim();

  if (!nome) {
    return null;
  }

  return {

    nome:
      nome.substring(0, 30),

    avatar:
      avatar.substring(0, 500)

  };
}


/* =========================================================
   MÚSICA
========================================================= */

function limparMusica(musica) {

  if (!musica) {
    return null;
  }

  if (!musica.videoId) {
    return null;
  }

  return {

    videoId:
      String(musica.videoId),

    titulo:
      String(musica.titulo || ""),

    canal:
      String(musica.canal || ""),

    descricao:
      String(musica.descricao || ""),

    imagem:
      String(musica.imagem || ""),

    adicionadaPor:
      musica.adicionadaPor
        ? limparUsuario(musica.adicionadaPor)
        : null

  };
}


/* =========================================================
   ATIVIDADE DA SALA
========================================================= */

function adicionarAtividade(
  codigo,
  tipo,
  usuario
) {

  const sala =
    salas.get(codigo);

  if (!sala) {
    return;
  }

  const atividade = {

    tipo,

    usuario: limparUsuario(usuario),

    data: Date.now()

  };

  sala.atividades.push(
    atividade
  );

  /*
   * Mantém somente as últimas
   * 30 atividades.
   */
  if (sala.atividades.length > 30) {

    sala.atividades =
      sala.atividades.slice(-30);

  }

  io.to(codigo).emit(
    "atividade-atualizada",
    {
      atividades:
        sala.atividades
    }
  );
}


/* =========================================================
   ESTADO DO PLAYER
========================================================= */

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
        Math.max(0, posicao),

      indiceAtual:
        sala.indiceAtual

    }
  );
}


/* =========================================================
   FILA
========================================================= */

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


/* =========================================================
   USUÁRIOS DA SALA
========================================================= */

function enviarUsuarios(codigo) {

  const sala =
    salas.get(codigo);

  if (!sala) {
    return;
  }

  const usuarios =
    Array.from(
      sala.usuarios.entries()
    ).map(
      ([socketId, usuario]) => ({

        socketId,

        nome:
          usuario.nome,

        avatar:
          usuario.avatar

      })
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


/* =========================================================
   SOCKET.IO
========================================================= */

io.on("connection", socket => {

  console.log(
    "Usuário conectado:",
    socket.id
  );


  /* =======================================================
     CRIAR SALA
  ======================================================= */

  socket.on(
    "criar-sala",
    () => {

      /*
       * Se já estiver em uma sala,
       * remove primeiro.
       */

      if (socket.sala) {

        const salaAnterior =
          socket.sala;

        removerUsuarioDaSala(
          socket,
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

          estado: {

            fila:
              sala.fila,

            indiceAtual:
              sala.indiceAtual,

            tocando:
              sala.tocando,

            posicao:
              sala.posicao

          }

        }
      );


      console.log(
        `Sala criada: ${codigo}`
      );

    }
  );


  /* =======================================================
     ENTRAR NA SALA
  ======================================================= */

  socket.on(
    "entrar-sala",
    codigoRecebido => {

      const codigo =
        String(
          codigoRecebido || ""
        )
          .trim()
          .toUpperCase();


      if (!codigo) {

        socket.emit(
          "erro-sala",
          "Informe o código da sala."
        );

        return;
      }


      if (!salas.has(codigo)) {

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

        removerUsuarioDaSala(
          socket,
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
              obterPosicaoAtual(sala)

          },

          atividades:
            sala.atividades

        }
      );


      console.log(
        `Usuário ${socket.id} entrou na sala ${codigo}`
      );

    }
  );


  /* =======================================================
     IDENTIDADE
  ======================================================= */

  socket.on(
    "definir-identidade",
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


      const usuario =
        limparUsuario(dados);

      if (!usuario) {

        socket.emit(
          "erro-identidade",
          "Informe um nome válido."
        );

        return;
      }


      const identidadeAnterior =
        sala.usuarios.get(
          socket.id
        );


      sala.usuarios.set(
        socket.id,
        usuario
      );


      socket.usuario =
        usuario;


      /*
       * Se for uma nova identidade,
       * registra entrada.
       */

      if (!identidadeAnterior) {

        adicionarAtividade(
          codigo,
          "entrou",
          usuario
        );

      } else {

        /*
         * Se já existia identidade,
         * apenas informa a atualização.
         */

        io.to(codigo).emit(
          "identidade-atualizada",
          {

            socketId:
              socket.id,

            usuario

          }
        );
      }


      enviarUsuarios(codigo);


      console.log(
        `Identidade definida na sala ${codigo}: ${usuario.nome}`
      );

    }
  );


  /* =======================================================
     CONTROLE DA SALA
  ======================================================= */

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


      /* ===================================================
         ADICIONAR MÚSICA
      =================================================== */

      if (tipo === "adicionar") {

        const musicaRecebida =
          limparMusica(
            dados.musica
          );


        if (!musicaRecebida) {
          return;
        }


        const usuario =
          sala.usuarios.get(
            socket.id
          );


        const musica = {

          ...musicaRecebida,

          adicionadaPor:
            usuario
              ? limparUsuario(usuario)
              : null

        };


        const existe =
          sala.fila.some(
            item =>
              item.videoId ===
              musica.videoId
          );


        if (existe) {
          return;
        }


        /*
         * IMPORTANTE:
         *
         * Se uma música já estiver
         * tocando, salvamos a posição
         * atual antes de alterar a fila.
         *
         * Não enviamos estado do player
         * aqui para não reiniciar a
         * música atual.
         */

        if (sala.tocando) {

          salvarPosicaoAtual(
            sala
          );
        }


        sala.fila.push(
          musica
        );


        if (
          sala.indiceAtual === -1
        ) {

          sala.indiceAtual = 0;

          sala.posicao = 0;

          sala.tocando = false;

          sala.atualizadoEm =
            Date.now();
        }


        enviarFila(codigo);


        io.to(codigo).emit(
          "musica-adicionada",
          {
            musica
          }
        );


        console.log(
          `Música adicionada na sala ${codigo}: ${musica.titulo}`
        );


        return;
      }


      /* ===================================================
         TOCAR AGORA
      =================================================== */

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
            item =>
              item.videoId ===
              musica.videoId
          );


        const usuario =
          sala.usuarios.get(
            socket.id
          );


        if (
          indiceExistente === -1
        ) {

          sala.fila.push({

            ...musica,

            adicionadaPor:
              usuario
                ? limparUsuario(usuario)
                : null

          });

          sala.indiceAtual =
            sala.fila.length - 1;

        } else {

          sala.indiceAtual =
            indiceExistente;

        }


        sala.posicao = 0;

        sala.tocando = true;

        sala.atualizadoEm =
          Date.now();


        enviarFila(codigo);

        enviarEstadoPlayer(
          codigo
        );


        console.log(
          `Tocando agora na sala ${codigo}: ${musica.titulo}`
        );


        return;
      }


      /* ===================================================
         MÚSICA TERMINOU
      =================================================== */

      if (tipo === "ended") {

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


        /*
         * Avanço automático.
         *
         * Isso não é um botão
         * "próxima"; acontece somente
         * quando a música realmente
         * termina.
         */

        if (
          sala.indiceAtual <
          sala.fila.length - 1
        ) {

          sala.indiceAtual++;

          sala.posicao = 0;

          sala.tocando = true;

          sala.atualizadoEm =
            Date.now();


          enviarFila(codigo);

          enviarEstadoPlayer(
            codigo
          );


          console.log(
            `Avançando automaticamente a música na sala ${codigo}`
          );

        } else {

          sala.posicao = 0;

          sala.tocando = false;

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


  /* =======================================================
     DESCONEXÃO
  ======================================================= */

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


      removerUsuarioDaSala(
        socket,
        codigo
      );

    }
  );

});


/* =========================================================
   REMOVER USUÁRIO DA SALA
========================================================= */

function removerUsuarioDaSala(
  socket,
  codigo
) {

  const sala =
    salas.get(codigo);

  if (!sala) {
    return;
  }


  const usuario =
    sala.usuarios.get(
      socket.id
    );


  /*
   * Remove o usuário do mapa.
   */

  sala.usuarios.delete(
    socket.id
  );


  /*
   * Remove o socket da sala.
   */

  socket.leave(codigo);


  /*
   * Limpa a referência da sala
   * no socket.
   */

  if (socket.sala === codigo) {

    socket.sala =
      null;
  }


  /*
   * Só registra a saída se o usuário
   * realmente tinha identidade.
   */

  if (usuario) {

    adicionarAtividade(
      codigo,
      "saiu",
      usuario
    );

  }


  enviarUsuarios(codigo);


  console.log(
    `Usuário saiu da sala ${codigo}: ${
      usuario?.nome || socket.id
    }`
  );


  removerSalaSeVazia(
    codigo
  );
}


/* =========================================================
   REMOVER SALA VAZIA
========================================================= */

function removerSalaSeVazia(
  codigo
) {

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


/* =========================================================
   SINCRONIZAÇÃO PERIÓDICA
========================================================= */

setInterval(
  () => {

    for (
      const [codigo, sala]
      of salas
    ) {

      const quantidade =
        io.sockets.adapter.rooms.get(
          codigo
        )?.size || 0;


      if (quantidade === 0) {
        continue;
      }


      if (sala.tocando) {

        enviarEstadoPlayer(
          codigo
        );
      }

    }

  },
  5000
);


/* =========================================================
   SERVIDOR
========================================================= */

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