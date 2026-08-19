# Abrigo do Wlad - Plataforma Web

Repositório oficial do site do Abrigo do Wlad. Plataforma digital para divulgação de animais para adoção, campanhas de arrecadação e transparência das atividades da organização.

Este projeto foi criado para suprir uma necessidade crítica da ONG: a listagem e divulgação de animais. Anteriormente, o abrigo utilizava arquivos em PDF para lidar com as adoções, um processo que se mostrava ineficiente e insustentável. Com a plataforma web, a ONG agora possui um catálogo dinâmico, acessível e de fácil manutenção.

## Funcionalidades

- 🐶 **Vitrine de Adoção:** Catálogo digital completo e filtrável dos animais disponíveis, aposentando as antigas listagens em PDF.
- 📝 **Solicitação de Adoção:** Formulário multi-etapas (_Wizard_) intuitivo para avaliação de possíveis tutores, com criptografia dos dados sensíveis antes da persistência.
- ♻️ **Reciclagem Solidária:** Relação dos pontos de coleta parceiros para auxiliar nas arrecadações do abrigo.
- 🌓 **Acessibilidade e Usabilidade:** Suporte a tema claro/escuro nativo, animações fluidas e design responsivo.

## Tecnologias

- **React** e **TypeScript**
- **Vite** (Build tool)
- **CSS Modules** (Estilização escopada)
- **React Router** (Roteamento)
- **Lucide React** (Ícones)
- **Radix UI** (Componentes acessíveis)
- **Motion** (Animações)
- **Cloudflare Workers** (API, Static Assets e Cron Triggers)
- **Cloudflare KV** (cache compartilhado entre Workers)

## Estrutura e Componentes

Abaixo está listada a estrutura atual do projeto:

```text
workers/
├── app/
│   └── index.ts               # Worker HTTP e roteador da API
├── cron/
│   ├── index.ts               # Worker exclusivo do Cron Trigger
│   └── wrangler.jsonc         # Configuração do abrigo-do-wlad-cron
└── shared/
    └── api/                    # Serviços compartilhados pelos dois Workers
        ├── _lib/               # Firebase Admin, KV, segurança e e-mail
        ├── adoption/           # Submissão de candidatura
        ├── hero-dog/           # Leitura e atualização do destaque
        └── tests/              # Endpoint de debug local
public/
└── legal/
    └── privacy-policy.json
src/
├── assets/                   # Arquivos estáticos e metadados JSON
├── components/               # Componentes globais e reutilizáveis
│   ├── common/
│   ├── ui/
│   ├── Header/
│   ├── Footer/
│   └── ...
├── hooks/                    # Custom hooks
├── lib/                      # Utilitários e configs gerais
├── pages/                    # Páginas e rotas da aplicação
│   ├── About/
│   ├── BetaForm/
│   ├── Home/
│   ├── Legal/
│   └── Recycle/
├── services/
├── types/
├── utils/
├── routes.tsx
├── main.tsx
├── index.css
└── vite-env.d.ts
```

## Instalação e Execução

Para rodar o projeto localmente:

1.  Clone este repositório.
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Configure as variáveis de ambiente. Para desenvolvimento local, use um arquivo `.env` na raiz. Para *deploy*, configure as mesmas chaves no painel do projeto.

    ```env
    NODE_ENV=development

    # Frontend
    VITE_FIREBASE_API_KEY=
    VITE_FIREBASE_AUTH_DOMAIN=
    VITE_FIREBASE_PROJECT_ID=
    VITE_FIREBASE_STORAGE_BUCKET=
    VITE_FIREBASE_MESSAGING_SENDER_ID=
    VITE_FIREBASE_APP_ID=
    VITE_RECAPTCHA_PUBLIC_KEY=

    # Runtime do Worker do app
    ALLOWED_ORIGIN=http://localhost:5173
    RECAPTCHA_SECRET_KEY=
    MASTER_KEY=

    # Firebase Admin (app e cron)
    FIREBASE_PROJECT_ID=
    FIREBASE_CLIENT_EMAIL=
    FIREBASE_PRIVATE_KEY=

    # E-mail / Admin
    GMAIL_USER=
    GMAIL_PASS=
    ADOPTION_EMAIL_RECIPIENT=
    DEBUG_EMAIL_RECIPIENT=
    ADMIN_PANEL_URL=
    ```

4.  Inicie o servidor local:
    ```bash
    npm run dev
    ```

5.  Para build de produção, use:
    ```bash
    npm run build
    ```

    O plugin Cloudflare gera o Worker do app, os Static Assets e uma configuração de deploy dentro de `dist/`. O comando `wrangler deploy` usa automaticamente essa configuração gerada.

## Arquitetura da API

O projeto possui dois Workers independentes:

1. `abrigo-do-wlad`: serve a SPA por Static Assets e executa as rotas `/api/*` em [workers/app/index.ts](workers/app/index.ts).
2. `abrigo-do-wlad-cron`: executa somente a atualização diária do cachorro em destaque, definida em [workers/cron/index.ts](workers/cron/index.ts).

Os dois Workers compartilham o mesmo namespace KV. Apenas o Worker de cron possui `triggers.crons`; o Worker do app não exporta um handler `scheduled`.

### Estrutura de rotas

- `GET /api/hero-dog/get` — retorna o cachorro em destaque
- `POST /api/adoption/create` — cria a submissão da adoção
- `GET /api/tests/email` — rota disponível somente com `NODE_ENV=development`

### Convenção de ambiente

Todos os módulos internos da API devem ler variáveis a partir do ambiente do runtime em execução, com suporte a fallback local para desenvolvimento:

```ts
const value = env?.MY_KEY ?? process.env.MY_KEY;
```

As variáveis `VITE_*` existem somente durante o build e são incorporadas ao frontend. Credenciais do Firebase Admin, reCAPTCHA, criptografia e e-mail são variáveis ou secrets de runtime configurados separadamente em cada Worker.

| Destino | Configuração necessária |
| --- | --- |
| Build do `abrigo-do-wlad` | Todas as variáveis `VITE_*` do `.env.example` |
| Runtime do `abrigo-do-wlad` | `NODE_ENV`, `ALLOWED_ORIGIN`, `RECAPTCHA_SECRET_KEY`, `MASTER_KEY`, credenciais Firebase Admin e configurações de e-mail |
| Runtime do `abrigo-do-wlad-cron` | Credenciais Firebase Admin; o binding `KV` já está no Wrangler |

Os dois arquivos Wrangler usam `keep_vars: true` para preservar as variáveis configuradas pelo painel durante novos deploys. Valores sensíveis não devem ser adicionados aos arquivos Wrangler.

## Deploy

O Worker do app é o deploy principal conectado ao Git:

```bash
npm run deploy
```

O Worker de cron possui deploy separado:

```bash
npm run deploy:cron
```

No Workers Builds, mantenha `npm run build` como Build command e `npx wrangler deploy` como Deploy command do Worker `abrigo-do-wlad`. O Worker `abrigo-do-wlad-cron` deve ser publicado separadamente com seu próprio comando/configuração; não use comandos `wrangler pages` neste repositório.

## Autores

Desenvolvido e mantido por **[Alan](https://github.com/AlanClimaco)** e **[Luis](https://github.com/spantalho)**.

## Licença

Este projeto é de propriedade exclusiva do Abrigo do Wlad. O código-fonte está disponível para fins de estudo e manutenção, mas a utilização comercial ou réplica da identidade visual sem autorização prévia é vedada. Todos os direitos reservados.
