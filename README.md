<div align="center">

# <img src="https://api.iconify.design/tabler/headphones.svg?color=%2300A6D6" width="34" /> ESTAÇÃO TI

### <img src="https://api.iconify.design/tabler/waves.svg?color=%2300C6C7" width="18" /> Música compartilhada • Tecnologia • Conexão

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:00B4D8,45:48CAE4,75:90E0EF,100:80ED99&height=130&section=header&text=ESTA%C3%87%C3%83O%20TI&fontSize=38&fontColor=ffffff&animation=fadeIn&fontAlignY=38" />

<img src="https://img.shields.io/badge/STATUS-EM%20DESENVOLVIMENTO-00A6D6?style=for-the-badge&labelColor=E8FBFF" />
<img src="https://img.shields.io/badge/NODE.JS-24.x-00B894?style=for-the-badge&labelColor=E8FBFF" />
<img src="https://img.shields.io/badge/EXPRESS-5.x-00A6D6?style=for-the-badge&labelColor=E8FBFF" />
<img src="https://img.shields.io/badge/SOCKET.IO-4.x-00B894?style=for-the-badge&labelColor=E8FBFF" />

<br><br>

<img src="https://api.iconify.design/tabler/player-play.svg?color=%2300A6D6" width="16" />
<a href="https://estacao-ti.onrender.com/"><strong> ACESSE O ESTAÇÃO TI </strong></a>
&nbsp;&nbsp;•&nbsp;&nbsp;
<a href="https://github.com/Markeis24/Estacao-TI"><strong> GITHUB </strong></a>

<br><br>

<sub>☁️ Um player musical colaborativo com salas em tempo real, visual Frutiger Aero e pesquisa pelo YouTube.</sub>

</div>

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:00B4D8,50:48CAE4,100:80ED99&height=5" />

## <img src="https://api.iconify.design/tabler/sparkles.svg?color=%2300A6D6" width="22" /> SOBRE O PROJETO

O **Estação TI** é uma aplicação web de música compartilhada criada para transformar a reprodução musical em uma experiência coletiva.

A proposta é simples: **criar uma sala, escolher um avatar, compartilhar o código da sala e ouvir músicas junto com outras pessoas**.

O projeto combina:

- 🎵 Pesquisa de músicas através da **YouTube Data API v3**
- 🌊 Salas compartilhadas em tempo real
- 👤 Identidade temporária com nome e avatar
- 📋 Fila de reprodução compartilhada
- ⚡ Sincronização através do **Socket.IO**
- ▶️ Reprodução utilizando o **YouTube IFrame Player API**
- 🔇 Controle de áudio local, sem interromper a reprodução dos outros participantes
- 🔑 Cada usuário utiliza sua própria chave da YouTube Data API
- 🌱 Interface inspirada na estética **Frutiger Aero / Aquatic**

> **A ideia:** é como uma Jam de música, mas com identidade própria, gratuita e sem anúncios adicionados pelo projeto.

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:00B4D8,50:48CAE4,100:80ED99&height=5" />

## <img src="https://api.iconify.design/tabler/target-arrow.svg?color=%2300B894" width="22" /> PROPOSTA

O Estação TI foi pensado para facilitar momentos em que várias pessoas querem participar da mesma seleção musical.

Cada sala mantém um estado compartilhado, permitindo que os participantes acompanhem:

```text
SALA
 │
 ├── Usuários conectados
 │    ├── Nome
 │    └── Avatar
 │
 ├── Fila de músicas
 │
 ├── Música atual
 │
 ├── Posição da reprodução
 │
 └── Estado do player
```

As alterações da sala são transmitidas em tempo real pelo servidor para os usuários conectados.

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:00B4D8,50:48CAE4,100:80ED99&height=5" />

## <img src="https://api.iconify.design/tabler/player-play.svg?color=%2300A6D6" width="22" /> FUNCIONALIDADES

### <img src="https://api.iconify.design/tabler/door-enter.svg?color=%2300B894" width="18" /> Salas compartilhadas

- Criar uma nova sala.
- Entrar em uma sala através do código.
- Compartilhar o código da sala com outras pessoas.
- Atualizar os participantes conectados em tempo real.

### <img src="https://api.iconify.design/tabler/user-circle.svg?color=%2300A6D6" width="18" /> Identidade e avatares

Ao entrar no sistema, o usuário pode configurar:

- Nome de exibição.
- Avatar.
- Chave pessoal da YouTube Data API.

Os avatares são carregados a partir de `public/avatars/`.

### <img src="https://api.iconify.design/tabler/search.svg?color=%2300B894" width="18" /> Pesquisa de músicas

A pesquisa utiliza a **YouTube Data API v3**.

O usuário informa sua própria chave da API no sistema e a chave é enviada ao backend através do cabeçalho:

```text
X-YouTube-API-Key
```

A chave não faz parte da URL da pesquisa e não é compartilhada com os demais usuários da sala.

### <img src="https://api.iconify.design/tabler/list.svg?color=%2300A6D6" width="18" /> Fila colaborativa

Os participantes podem adicionar músicas à fila da sala.

A fila é compartilhada entre todos os usuários conectados à mesma sala.

### <img src="https://api.iconify.design/tabler/player-skip-forward.svg?color=%2300B894" width="18" /> Reprodução

A sala mantém informações sobre:

- Música atual.
- Índice da música.
- Posição da reprodução.
- Estado do player.
- Fila de músicas.

### <img src="https://api.iconify.design/tabler/volume-3.svg?color=%2300A6D6" width="18" /> Áudio individual

O botão central de áudio controla **somente o player local do usuário**.

Isso significa que:

> 🔊 Se uma pessoa silenciar o próprio player, a música continua normalmente para os outros participantes da sala.

O estado de reprodução da sala não é pausado apenas porque um usuário silenciou o próprio áudio.

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:00B4D8,50:48CAE4,100:80ED99&height=5" />

## <img src="https://api.iconify.design/tabler/api.svg?color=%2300A6D6" width="22" /> YOUTUBE DATA API

O Estação TI utiliza a **YouTube Data API v3** para pesquisar conteúdos do YouTube.

### Cada usuário utiliza sua própria chave

A chave da API não é mais uma configuração compartilhada do servidor.

O fluxo funciona assim:

```text
USUÁRIO
   │
   ├── informa sua chave da YouTube Data API
   │
   ▼
NAVEGADOR
   │
   │  X-YouTube-API-Key
   ▼
BACKEND
   │
   ▼
YOUTUBE DATA API v3
```

A aplicação bloqueia pesquisas quando nenhuma chave foi configurada e trata respostas relacionadas a chave inválida ou limite de cota.

### 🔐 Segurança da chave

A chave informada pelo usuário:

- Fica armazenada localmente no navegador.
- É enviada ao backend somente quando necessário para pesquisar.
- Não é colocada na URL da aplicação.
- Não é enviada como parte do estado da sala.
- Não é compartilhada com os outros usuários.
- Não deve ser colocada no código-fonte do projeto.

### 📘 Guia para criar a chave

O projeto possui um guia em PDF para configurar uma chave da **YouTube Data API v3**:

<a href="https://github.com/Markeis24/Estacao-TI/blob/main/public/docs/Guia_Criar_Chave_YouTube_Estacao_TI.pdf">
<strong>📄 Abrir Guia — Criar Chave da YouTube API</strong>
</a>

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:00B4D8,50:48CAE4,100:80ED99&height=5" />

## <img src="https://api.iconify.design/tabler/brand-youtube.svg?color=%23FF0000" width="22" /> REPRODUÇÃO

A reprodução é realizada através da **YouTube IFrame Player API**.

O projeto utiliza o player incorporado do YouTube e não realiza download ou extração do áudio dos vídeos.

```text
Pesquisa
   ↓
YouTube Data API v3
   ↓
Resultado da pesquisa
   ↓
Usuário adiciona à fila
   ↓
Sala compartilha a fila
   ↓
YouTube IFrame Player API
   ↓
Reprodução
```

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:00B4D8,50:48CAE4,100:80ED99&height=5" />

## <img src="https://api.iconify.design/tabler/brand-socket-io.svg?color=%2300B894" width="22" /> COMUNICAÇÃO EM TEMPO REAL

O **Socket.IO** é responsável pela comunicação entre o navegador e o servidor.

Ele permite que alterações realizadas em uma sala sejam transmitidas aos demais participantes.

Entre os eventos utilizados pelo sistema estão:

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

O servidor mantém o estado das salas e distribui as atualizações para os clientes conectados.

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:00B4D8,50:48CAE4,100:80ED99&height=5" />

## <img src="https://api.iconify.design/tabler/stack-2.svg?color=%2300A6D6" width="22" /> TECNOLOGIAS

### 🌐 Frontend

- HTML5
- CSS3
- JavaScript
- YouTube IFrame Player API

### ⚙️ Backend

- Node.js
- Express
- Socket.IO
- CORS
- dotenv

### ☁️ Serviços

- YouTube Data API v3
- YouTube IFrame Player API
- Render
- GitHub

### 🛠️ Desenvolvimento

- Git
- GitHub
- Nodemon
- npm

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:00B4D8,50:48CAE4,100:80ED99&height=5" />

## <img src="https://api.iconify.design/tabler/folder.svg?color=%2300B894" width="22" /> ESTRUTURA DO PROJETO

```text
Estacao-TI/
│
├── backend/
│   └── server.js
│
├── public/
│   ├── assets/
│   │   └── frutiger-aero-bg.png
│   │
│   ├── avatars/
│   │   ├── avatar01.png
│   │   ├── avatar02.png
│   │   ├── ...
│   │   └── avatar10.png
│   │
│   ├── docs/
│   │   └── Guia_Criar_Chave_YouTube_Estacao_TI.pdf
│   │
│   ├── index.html
│   ├── script.js
│   ├── style.css
│   └── style-backup.css
│
├── .gitignore
├── package.json
└── package-lock.json
```

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:00B4D8,50:48CAE4,100:80ED99&height=5" />

## <img src="https://api.iconify.design/tabler/activity.svg?color=%2300A6D6" width="22" /> COMO O SISTEMA FUNCIONA

### 1. 🌊 Entrada

O usuário acessa o Estação TI e informa seu nome e avatar.

### 2. 🔑 Configuração da API

O usuário informa sua própria chave da YouTube Data API v3.

### 3. 🏠 Sala

O usuário pode criar uma sala ou entrar em uma sala existente utilizando o código.

### 4. 🎵 Pesquisa

A busca de músicas é realizada através da chave configurada pelo próprio usuário.

### 5. 📋 Fila

As músicas escolhidas são adicionadas à fila compartilhada.

### 6. ⚡ Sincronização

O servidor utiliza Socket.IO para manter os usuários da sala atualizados.

### 7. ▶️ Reprodução

O vídeo atual é reproduzido através do YouTube IFrame Player API.

### 8. 🔇 Controle local

O usuário pode silenciar ou ativar o próprio áudio sem pausar a reprodução compartilhada da sala.

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:00B4D8,50:48CAE4,100:80ED99&height=5" />

## <img src="https://api.iconify.design/tabler/shield-check.svg?color=%2300B894" width="22" /> SEGURANÇA E PRIVACIDADE

O projeto foi estruturado para evitar que chaves pessoais da API sejam tratadas como informação compartilhada da sala.

### A chave da API não deve ser:

- Commitada no Git.
- Colocada no `server.js`.
- Colocada no HTML.
- Colocada no CSS.
- Colocada na URL.
- Enviada pelo Socket.IO como parte do estado da sala.

### O que deve ser feito

Cada usuário deve criar sua própria chave da **YouTube Data API v3** e configurá-la no próprio navegador.

Recomenda-se restringir a chave no Google Cloud para utilização com a **YouTube Data API v3**, conforme o guia disponibilizado no projeto.

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:00B4D8,50:48CAE4,100:80ED99&height=5" />

## <img src="https://api.iconify.design/tabler/download.svg?color=%2300A6D6" width="22" /> INSTALAÇÃO LOCAL

### Pré-requisitos

- Node.js
- npm
- Uma chave da YouTube Data API v3 para realizar pesquisas

### 1. Clonar o projeto

```bash
git clone https://github.com/Markeis24/Estacao-TI.git
```

### 2. Entrar na pasta

```bash
cd Estacao-TI
```

### 3. Instalar as dependências

```bash
npm install
```

### 4. Iniciar o servidor

```bash
npm start
```

### 5. Desenvolvimento com Nodemon

```bash
npm run dev
```

O servidor utiliza a porta definida pela configuração do ambiente e, quando executado localmente, pode ser acessado pelo endereço local correspondente.

> **Importante:** a chave da YouTube Data API é configurada pelo usuário na própria interface. Ela não precisa ser colocada em um `.env` para o funcionamento da pesquisa.

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:00B4D8,50:48CAE4,100:80ED99&height=5" />

## <img src="https://api.iconify.design/tabler/palette.svg?color=%2300B894" width="22" /> IDENTIDADE VISUAL — FRUTIGER AERO

A identidade visual atual do Estação TI foi construída em torno da estética **Frutiger Aero**, trazendo referências de interfaces e tecnologias dos anos 2000 com elementos naturais e digitais.

### 🌐 Elementos visuais

- Céu e água
- Bolhas
- Brilhos
- Reflexos
- Gradientes suaves
- Tons de azul e ciano
- Verde aquático
- Elementos translúcidos
- Formas arredondadas
- Atmosfera leve e tecnológica

### 🎨 Paleta aproximada

```text
Azul céu       #48CAE4
Ciano          #00B4D8
Azul profundo  #0077B6
Verde água     #80ED99
Branco         #F7FEFF
```

O projeto utiliza uma composição visual inspirada em **água + natureza + tecnologia**, mantendo a interface leve, colorida e nostálgica.

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:00B4D8,50:48CAE4,100:80ED99&height=5" />

## <img src="https://api.iconify.design/tabler/code.svg?color=%2300A6D6" width="22" /> CONHECIMENTOS DESENVOLVIDOS

O projeto envolve conhecimentos práticos de:

- JavaScript
- Node.js
- Express
- Socket.IO
- APIs REST
- YouTube Data API
- YouTube IFrame Player API
- WebSockets
- HTML
- CSS
- Git
- GitHub
- Deploy
- Render
- Armazenamento local no navegador
- Integração entre frontend e backend
- Comunicação em tempo real
- Desenvolvimento de aplicações web

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:00B4D8,50:48CAE4,100:80ED99&height=5" />

## <img src="https://api.iconify.design/tabler/cloud-upload.svg?color=%2300B894" width="22" /> DEPLOY

O projeto está hospedado no **Render**.

### 🌎 Aplicação online

<a href="https://estacao-ti.onrender.com/">
<strong>https://estacao-ti.onrender.com/</strong>
</a>

### 🐙 Repositório

<a href="https://github.com/Markeis24/Estacao-TI">
<strong>https://github.com/Markeis24/Estacao-TI</strong>
</a>

O serviço utiliza:

```text
GitHub
  ↓
Render
  ↓
Node.js
  ↓
Express
  ↓
Estação TI
```

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:00B4D8,50:48CAE4,100:80ED99&height=5" />

## <img src="https://api.iconify.design/tabler/heart-handshake.svg?color=%2300A6D6" width="22" /> MISSÃO

Criar uma experiência musical colaborativa que una:

```text
🎵 MÚSICA
   +
💻 TECNOLOGIA
   +
🌊 DESIGN
   +
⚡ TEMPO REAL
   +
👥 CONEXÃO
```

O Estação TI busca transformar uma simples fila de músicas em um espaço compartilhado, com identidade visual própria e participação coletiva.

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:00B4D8,50:48CAE4,100:80ED99&height=5" />

## <img src="https://api.iconify.design/tabler/info-circle.svg?color=%2300B894" width="22" /> STATUS

<img src="https://img.shields.io/badge/PROJETO-EM%20DESENVOLVIMENTO-00A6D6?style=for-the-badge&labelColor=E8FBFF" />

O projeto está em desenvolvimento. A estrutura atual já contempla salas compartilhadas, usuários com identidade temporária, avatares, fila colaborativa, sincronização em tempo real, pesquisa através da YouTube Data API e configuração individual da chave da API.

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:80ED99,45:48CAE4,75:00B4D8,100:0077B6&height=120&section=footer" />

<div align="center">

<img src="https://api.iconify.design/tabler/headphones.svg?color=%23FFFFFF" width="30" />

### ESTAÇÃO TI

<sub>☁️ Música • Tecnologia • Conexão • 🌊</sub>

<br><br>

<sub>Projeto desenvolvido por <strong>Giovanna Marques Rodrigues</strong></sub>

<br><br>

<a href="https://estacao-ti.onrender.com/">🌐 Projeto online</a>
&nbsp;&nbsp;•&nbsp;&nbsp;
<a href="https://github.com/Markeis24/Estacao-TI">🐙 GitHub</a>

</div>
