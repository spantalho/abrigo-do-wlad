# Painel administrativo

Aplicação interna do Abrigo do Wlad para manutenção dos dados apresentados no
site público e acompanhamento das candidaturas de adoção.

## Funcionalidades

- Visão geral dos animais, pontos de reciclagem e candidaturas.
- Cadastro, edição e remoção de animais.
- Cadastro, edição e remoção de pontos parceiros de reciclagem.
- Consulta de candidaturas e atualização de status.
- Upload e exclusão controlada de imagens.
- Aviso de candidaturas próximas do prazo de retenção.

## Segurança e autenticação

O domínio administrativo é protegido pelo Cloudflare Access. O Worker valida o
JWT emitido pelo Access antes de servir a sessão ou qualquer rota da API. A
autorização é definida no runtime por listas de e-mails separadas por papel:

- `ADMIN_DEVELOPER_EMAILS`
- `ADMIN_ADMINISTRATOR_EMAILS`

O frontend não contém credenciais administrativas e não acessa o Firestore
diretamente. Operações de banco de dados, descriptografia e mídia passam pelas
rotas do Worker. As credenciais de service account, a chave de criptografia e o
segredo do Cloudinary permanecem no runtime.

O roteiro de configuração do Access e as regras finais do Firestore estão em
[`docs/security/access-and-rules-rollout.md`](../../docs/security/access-and-rules-rollout.md).

## Estrutura

```text
apps/admin/
├── public/              # Arquivos estáticos
├── src/
│   ├── components/      # Layout e componentes do painel
│   ├── contexts/        # Estado da sessão
│   ├── lib/             # Cliente da API e utilitários
│   ├── pages/           # Telas administrativas
│   └── routes.tsx       # Rotas protegidas da SPA
├── worker/
│   ├── index.ts         # Validação do Access e entrega da aplicação
│   ├── admin-api.ts     # Operações administrativas
│   ├── access.ts        # Validação de identidade e papéis
│   └── cloudinary.ts    # Assinatura e remoção de mídia
├── package.json
└── wrangler.jsonc
```

Componentes visuais reutilizáveis são consumidos do workspace `@abrigo/ui`, em
[`packages/ui`](../../packages/ui).

## Desenvolvimento local

Na raiz do monorepo:

```bash
npm install
cp .env.example .env
cp apps/admin/.dev.vars.example apps/admin/.dev.vars
npm run dev:admin
```

O comando inicia a interface Vite. As rotas protegidas dependem de uma sessão
válida do Cloudflare Access e do Worker administrativo configurado com seus
bindings e secrets.

## Variáveis de runtime

| Variável | Finalidade |
| --- | --- |
| `CF_ACCESS_TEAM_DOMAIN` | Domínio da organização no Cloudflare Access. |
| `CF_ACCESS_AUD` | Audience da aplicação protegida. |
| `ADMIN_DEVELOPER_EMAILS` | Lista de desenvolvedores autorizados, separada por vírgulas. |
| `ADMIN_ADMINISTRATOR_EMAILS` | Lista de administradores autorizados, separada por vírgulas. |
| `FIREBASE_PROJECT_ID` | Projeto do Firestore. |
| `FIREBASE_CLIENT_EMAIL` | Identidade da service account. |
| `FIREBASE_PRIVATE_KEY` | Chave privada da service account. |
| `MASTER_KEY` | Chave usada para descriptografar dados protegidos. |
| `CLOUDINARY_CLOUD_NAME` | Identificador da conta de mídia. |
| `CLOUDINARY_API_KEY` | Identificador da API de mídia. |
| `CLOUDINARY_API_SECRET` | Segredo usado para assinar operações de mídia. |

Os valores locais de referência ficam em
[`apps/admin/.dev.vars.example`](.dev.vars.example). Valores reais são secrets de
runtime e não devem ser versionados.

## API administrativa

Todas as rotas exigem identidade válida do Cloudflare Access.

| Método | Rota | Função |
| --- | --- | --- |
| `GET` | `/api/session` | Retorna a identidade e o papel autorizados. |
| `GET` | `/api/admin/dashboard` | Retorna métricas e alertas de retenção. |
| `GET`, `POST` | `/api/admin/dogs` | Lista ou cadastra animais. |
| `GET`, `PATCH`, `DELETE` | `/api/admin/dogs/:id` | Consulta, altera ou remove um animal. |
| `GET`, `POST` | `/api/admin/recycle-points` | Lista ou cadastra pontos de reciclagem. |
| `GET`, `PATCH`, `DELETE` | `/api/admin/recycle-points/:id` | Consulta, altera ou remove um ponto. |
| `GET` | `/api/admin/adoptions` | Lista e descriptografa candidaturas. |
| `PATCH` | `/api/admin/adoptions/:id/status` | Atualiza o status de uma candidatura. |
| `POST` | `/api/admin/media/sign-upload` | Gera parâmetros de upload assinado. |
| `POST` | `/api/admin/media/delete` | Remove uma imagem validada. |

As mutações exigem mesma origem, validação de payload e identidade autorizada.
O Worker restringe uploads a uma pasta fixa e valida a conta e o caminho antes
da exclusão de imagens.

## Build, verificação e publicação

```bash
npm run build:admin
npm run typecheck:admin-worker
npm run check:admin-worker
npm run deploy:admin
```

A configuração do Worker e dos Static Assets fica em
[`apps/admin/wrangler.jsonc`](wrangler.jsonc). O painel é publicado de forma
independente do site público e do Worker agendado.
