# Abrigo do Wlad - Plataforma Web

Repositório oficial do site do Abrigo do Wlad. Plataforma digital para divulgação de animais para adoção, campanhas de arrecadação e transparência das atividades da organização.

Este projeto foi criado para suprir uma necessidade crítica da ONG: a listagem e divulgação de animais. Anteriormente, o abrigo utilizava arquivos em PDF para lidar com as adoções, um processo que se mostrava ineficiente e insustentável. Com a plataforma web, a ONG agora possui um catálogo dinâmico, acessível e de fácil manutenção.

## Funcionalidades

- 🐶 **Vitrine de Adoção:** Catálogo digital completo e filtrável dos animais disponíveis, aposentando as antigas listagens em PDF.
- 📝 **Solicitação de Adoção:** Formulário multi-etapas (_Wizard_) intuitivo para avaliação de possíveis tutores, garantindo a segurança e privacidade através da criptografia *client-side* de dados sensíveis antes do envio para a base de dados.
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

## Estrutura e Componentes

Abaixo está listada a estrutura atual do projeto:

```text
functions/
├── api/
│   ├── [[path]].ts            # Roteador central de endpoints
│   ├── _lib/
│   │   ├── constants.ts       # Constantes e status HTTP
│   │   ├── email.ts           # Envio de e-mails
│   │   ├── encryption.ts      # Criptografia de dados sensíveis
│   │   ├── env.ts             # Helpers para leitura do env do Cloudflare
│   │   ├── firebase.ts        # Conexão com Firebase Admin
│   │   ├── kv.ts              # Store de cache (Cloudflare KV + fallback local)
│   │   ├── response.ts        # Helpers de resposta JSON (legado, em transição)
│   │   ├── security.ts        # Validação, origem, recaptcha e rate limit
│   │   └── validation.ts      # Validação de rotas e métodos HTTP
│   ├── adoption/
│   │   └── create.ts          # Cria candidatura de adoção
│   ├── hero-dog/
│   │   ├── get.ts             # Retorna o dog em destaque
│   │   └── update.ts          # Atualiza o dog destaque via cron/auth
│   └── tests/
│       └── email.ts          # Rota de debug para envio de e-mail em ambiente local
├── public/
│   └── legal/
│       └── privacy-policy.json
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

    # Runtime serverless / API
    ALLOWED_ORIGIN=http://localhost:5173
    RECAPTCHA_PUBLIC_KEY=
    RECAPTCHA_SECRET_KEY=
    # Binding Cloudflare KV (ex.: CACHE_KV)
    MASTER_KEY=
    CRON_SECRET=

    # Firebase Admin / API
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

    O build gera saída estática compatível com deploy em hosts que suportem arquivos estáticos e funções serverless.

## Arquitetura da API

A API foi organizada em funções serverless, com a pasta `functions/api` e roteamento centralizado em [functions/api/[[path]].ts](functions/api/[[path]].ts). A implementação foi escrita para funcionar em runtimes compatíveis com serverless, sem depender de integrações exclusivas de um provedor.

### Estrutura de rotas

- `GET /api/hero-dog/get` — retorna o cachorro em destaque
- `POST /api/adoption/create` — cria a submissão da adoção
- `GET /api/tests/email` — rota de debug para teste de e-mail local
- `GET /api/hero-dog/update` — atualização do destaque via autenticidade configurada em `CRON_SECRET`

### Convenção de ambiente

Todos os módulos internos da API devem ler variáveis a partir do ambiente do runtime em execução, com suporte a fallback local para desenvolvimento:

```ts
const value = env?.MY_KEY ?? process.env.MY_KEY;
```

Isso garante que os serviços de cache em Cloudflare KV, Firebase, reCAPTCHA, e-mail e criptografia funcionem corretamente em diferentes provedores de deploy, sem acoplamento exclusivo a um ambiente.

## Autores

Desenvolvido e mantido por **[Alan](https://github.com/AlanClimaco)** e **[Luis](https://github.com/spantalho)**.

## Licença

Este projeto é de propriedade exclusiva do Abrigo do Wlad. O código-fonte está disponível para fins de estudo e manutenção, mas a utilização comercial ou réplica da identidade visual sem autorização prévia é vedada. Todos os direitos reservados.
