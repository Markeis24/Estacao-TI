
<div align="center">

# <img src="https://api.iconify.design/tabler/headphones.svg?color=%23C084FC" width="32" /> ESTAÇÃO TI

### <img src="https://api.iconify.design/tabler/music.svg?color=%23F472B6" width="18" /> Música • Tecnologia • Conexão

<br>

<img src="https://img.shields.io/badge/STATUS-EM%20DESENVOLVIMENTO-C084FC?style=for-the-badge&labelColor=0D0B12" />
<img src="https://img.shields.io/badge/NODE.JS-22.23.2-F472B6?style=for-the-badge&labelColor=0D0B12" />
<img src="https://img.shields.io/badge/RENDER-ONLINE-A855F7?style=for-the-badge&labelColor=0D0B12" />

<br><br>

<img src="https://api.iconify.design/tabler/player-play.svg?color=%23C084FC" width="16" />
<a href="https://estacao-ti.onrender.com/">ACESSE O PROJETO</a>

</div>

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:7f00b2,100:fc6998&height=4" />

<div align="center">

<img src="https://api.iconify.design/tabler/line.svg?color=%23C084FC" width="50%" />

</div>

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:7f00b2,100:fc6998&height=4" />


## <img src="https://api.iconify.design/tabler/list-details.svg?color=%23C084FC" width="20" /> SOBRE O PROJETO

O **Estação TI** é um projeto desenvolvido para criar uma experiência de música compartilhada entre os integrantes do grupo.

A proposta é unir **música, tecnologia e interação em tempo real**, permitindo que diferentes usuários entrem em uma mesma sala e compartilhem uma fila de músicas.

O sistema utiliza a API do YouTube para realizar pesquisas e o **Socket.IO** para manter as informações da sala sincronizadas entre os usuários.

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:7f00b2,100:fc6998&height=4" />

## <img src="https://api.iconify.design/tabler/target.svg?color=%23F472B6" width="20" /> OBJETIVO

Criar um player de música online com salas compartilhadas, permitindo que os usuários:

- Pesquisem músicas
- Adicionem músicas à fila
- Reproduzam músicas
- Pausem e continuem a reprodução
- Avancem ou voltem músicas
- Removam músicas da fila
- Criem salas
- Entrem em salas existentes
- Compartilhem a mesma fila de reprodução

A ideia principal é fazer com que todos os usuários conectados à mesma sala tenham uma experiência sincronizada.

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:7f00b2,100:fc6998&height=4" />

## <img src="https://api.iconify.design/tabler/player-play.svg?color=%23A855F7" width="20" /> FUNCIONALIDADES

### <img src="https://api.iconify.design/tabler/search.svg?color=%23C084FC" width="18" /> Pesquisa de músicas

O usuário pode pesquisar músicas diretamente pelo sistema utilizando a API do YouTube.

### <img src="https://api.iconify.design/tabler/playlist.svg?color=%23F472B6" width="18" /> Fila compartilhada

As músicas adicionadas ficam disponíveis para todos os usuários conectados à mesma sala.

### <img src="https://api.iconify.design/tabler/door-enter.svg?color=%23C084FC" width="18" /> Salas

Cada sala possui um código próprio que pode ser compartilhado com outras pessoas.

### <img src="https://api.iconify.design/tabler/player-pause.svg?color=%23F472B6" width="18" /> Controles

Os usuários podem controlar a reprodução através dos comandos:

- Play
- Pause
- Próxima música
- Música anterior
- Remover música

### <img src="https://api.iconify.design/tabler/users.svg?color=%23C084FC" width="18" /> Usuários conectados

O sistema mantém informações sobre os usuários presentes na sala.

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:7f00b2,100:fc6998&height=4" />

<div align="center">

<img src="https://api.iconify.design/tabler/line.svg?color=%23F472B6" width="50%" />

</div>

## <img src="https://api.iconify.design/tabler/tool.svg?color=%23C084FC" width="20" /> ARSENAL

```text
YouTube
Socket.IO
Node.js
Express
JavaScript
HTML
CSS
Render
GitHub
````

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:7f00b2,100:fc6998&height=4" />

## <img src="https://api.iconify.design/tabler/stack-2.svg?color=%23F472B6" width="20" /> STACK

### Backend

* Node.js
* Express
* Socket.IO
* CORS
* dotenv

### Frontend

* HTML
* CSS
* JavaScript
* YouTube IFrame Player API

### APIs

* YouTube Data API v3
* YouTube IFrame Player API

### Deploy

* Render

### Versionamento

* Git
* GitHub

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:7f00b2,100:fc6998&height=4" />

## <img src="https://api.iconify.design/tabler/folder.svg?color=%23C084FC" width="20" /> ESTRUTURA

```text
my-player/
│
├── backend/
│   └── server.js
│
├── public/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── .env
├── .gitignore
├── package.json
└── package-lock.json
```

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:7f00b2,100:fc6998&height=4" />

## <img src="https://api.iconify.design/tabler/settings.svg?color=%23F472B6" width="20" /> FUNCIONAMENTO

O funcionamento do sistema é dividido entre frontend e backend.

### Frontend

O navegador é responsável pela interface e pela reprodução do vídeo utilizando o player do YouTube.

### Backend

O servidor Node.js controla as salas e mantém o estado compartilhado.

Cada sala possui informações como:

```text
Fila de músicas
Música atual
Índice da música atual
Estado de reprodução
Posição atual
Usuários conectados
```

O servidor envia as alterações para os usuários conectados através do Socket.IO.

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:7f00b2,100:fc6998&height=4" />

## <img src="https://api.iconify.design/tabler/brand-youtube.svg?color=%23F472B6" width="20" /> YOUTUBE

O projeto utiliza a **YouTube Data API v3** para realizar as pesquisas de músicas.

A API retorna informações utilizadas pelo sistema, como:

* Título
* Thumbnail
* ID do vídeo
* Informações necessárias para reprodução

A reprodução é feita através do **YouTube IFrame Player API**.

O projeto não realiza download ou extração do áudio dos vídeos.

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:7f00b2,100:fc6998&height=4" />

## <img src="https://api.iconify.design/tabler/brand-socket-io.svg?color=%23C084FC" width="20" /> SOCKET.IO

O Socket.IO é utilizado para comunicação em tempo real entre o servidor e os navegadores.

Entre os eventos utilizados estão:

```text
criar-sala
entrar-sala
sala-criada
entrou-sala
erro-sala
fila-atualizada
estado-player
usuarios-atualizados
controle-sala
```

Dessa forma, quando uma alteração acontece na sala, os outros usuários podem receber a atualização.

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:7f00b2,100:fc6998&height=4" />

<div align="center">

<img src="https://api.iconify.design/tabler/line.svg?color=%23A855F7" width="50%" />

</div>

## <img src="https://api.iconify.design/tabler/palette.svg?color=%23C084FC" width="20" /> IDENTIDADE VISUAL

O projeto possui uma identidade visual inspirada em:

* Estética digital
* Roxo
* Rosa
* Preto
* Brilhos
* Elementos tecnológicos

A proposta visual busca transmitir uma sensação de tecnologia, música e nostalgia.

### Paleta utilizada

```text
#0D0B12
#C084FC
#F472B6
#A855F7
```

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:7f00b2,100:fc6998&height=4" />

## <img src="https://api.iconify.design/tabler/code.svg?color=%23F472B6" width="20" /> HARD SKILLS

Durante o desenvolvimento do projeto são utilizados conhecimentos relacionados a:

* JavaScript
* Node.js
* Express
* APIs
* WebSockets
* Socket.IO
* HTML
* CSS
* Git
* GitHub
* Deploy
* Integração com APIs externas
* Desenvolvimento de aplicações web

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:7f00b2,100:fc6998&height=4" />

## <img src="https://api.iconify.design/tabler/download.svg?color=%23C084FC" width="20" /> INSTALAÇÃO

Clone o projeto:

```bash
git clone https://github.com/Markeis24/Estacao-TI.git
```

Entre na pasta:

```bash
cd Estacao-TI
```

Instale as dependências:

```bash
npm install
```

Crie o arquivo:

```text
.env
```

Adicione a chave da API do YouTube:

```env
YOUTUBE_API_KEY=SUA_CHAVE_AQUI
```

Para iniciar o projeto:

```bash
npm start
```

Durante o desenvolvimento:

```bash
npm run dev
```

O servidor ficará disponível localmente através da porta configurada no projeto.

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:7f00b2,100:fc6998&height=4" />

## <img src="https://api.iconify.design/tabler/shield-check.svg?color=%23F472B6" width="20" /> SEGURANÇA

A chave da API do YouTube deve permanecer armazenada no arquivo `.env`.

O arquivo `.env` não deve ser enviado para o GitHub.

O projeto utiliza o `.gitignore` para impedir que arquivos sensíveis sejam adicionados ao repositório.

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:7f00b2,100:fc6998&height=4" />

## <img src="https://api.iconify.design/tabler/cloud-upload.svg?color=%23C084FC" width="20" /> DEPLOY

O projeto está hospedado utilizando o **Render**.

Sempre que novas alterações são enviadas para o GitHub, o Render pode realizar um novo deploy automaticamente de acordo com a configuração do serviço.

### Projeto online

<a href="https://estacao-ti.onrender.com/">
https://estacao-ti.onrender.com/
</a>

### Repositório

<a href="https://github.com/Markeis24/Estacao-TI">
https://github.com/Markeis24/Estacao-TI
</a>

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:7f00b2,100:fc6998&height=4" />

## <img src="https://api.iconify.design/tabler/activity.svg?color=%23F472B6" width="20" /> STATUS

<img src="https://img.shields.io/badge/PROJETO-EM%20DESENVOLVIMENTO-C084FC?style=for-the-badge&labelColor=0D0B12" />

O projeto encontra-se em desenvolvimento e novas funcionalidades podem ser adicionadas futuramente.

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:7f00b2,100:fc6998&height=4" />

## <img src="https://api.iconify.design/tabler/flag.svg?color=%23C084FC" width="20" /> MISSÃO

Criar uma experiência de música compartilhada utilizando tecnologia web, comunicação em tempo real e uma interface com identidade visual própria.

A ideia é transformar o projeto em uma experiência que una:

```text
Música
+
Tecnologia
+
Programação
+
Interação
```

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:7f00b2,100:fc6998&height=4" />

## <img src="https://api.iconify.design/tabler/users-group.svg?color=%23F472B6" width="20" /> GRUPO

Projeto desenvolvido pelo grupo **Estação TI**.

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:7f00b2,100:fc6998&height=4" />

## <img src="https://api.iconify.design/tabler/link.svg?color=%23C084FC" width="20" /> LINKS

### <img src="https://api.iconify.design/tabler/world.svg?color=%23F472B6" width="16" /> Projeto

[https://estacao-ti.onrender.com/](https://estacao-ti.onrender.com/)

### <img src="https://api.iconify.design/tabler/brand-github.svg?color=%23C084FC" width="16" /> GitHub

[https://github.com/Markeis24/Estacao-TI](https://github.com/Markeis24/Estacao-TI)

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:7f00b2,100:fc6998&height=4" />

<div align="center">

<img src="https://api.iconify.design/tabler/line.svg?color=%23A855F7" width="50%" />

<br>

<img src="https://api.iconify.design/tabler/headphones.svg?color=%23C084FC" width="28" />

### ESTAÇÃO TI

<sub>Música • Tecnologia • Conexão</sub>

<br><br>

<img src="https://img.shields.io/badge/MADE%20WITH-LOVE-F472B6?style=for-the-badge&labelColor=0D0B12" />

</div>
