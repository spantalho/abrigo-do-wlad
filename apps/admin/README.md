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
- Publicação de uma notificação temporária na visão geral do painel.

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
│   ├── audit.ts         # Trilha persistente das mutações administrativas
│   ├── cloudinary.ts    # Validação, upload e remoção de mídia
│   └── notifications.ts # Persistência e expiração das notificações
├── package.json
└── wrangler.jsonc
```

Componentes visuais reutilizáveis são consumidos do workspace `@jaci/ui`, em
[`packages/ui`](../../packages/ui).

## Desenvolvimento local

### Painel isolado com dados simulados

Para desenvolver a interface sem `.env`, Cloudflare Access, Firebase,
reCAPTCHA, Cloudinary ou qualquer outro serviço externo, execute na raiz:

```bash
npm run dev:admin:mock
```

Esse comando inicia somente o Vite, ignora arquivos de ambiente e substitui a
API administrativa por uma implementação local em memória. A sessão simulada
usa o papel `developer`, e o cabeçalho exibe **Dados simulados** durante todo o
uso. Cães, pontos de coleta, candidaturas, notificações, chaves e uploads podem
ser consultados e alterados; os dados voltam ao estado inicial quando a página
é recarregada.

O modo mock só é aceito pelo servidor de desenvolvimento. Builds e deploys não
podem ser executados nesse modo, e o Worker de produção não contém bypass de
autenticação.

### Integração local com o Worker

Na raiz do monorepo:

```bash
npm install
npm run dev:admin
```

O comando seleciona obrigatoriamente o ambiente `local` e inicia a interface
Vite junto do Worker administrativo, na mesma origem. Nesta fase, o ambiente
local não carrega secrets e ainda não possui identidade simulada: a rota
`/api/session` passa pelo Worker e responde `401` sem uma assertion válida do
Cloudflare Access. Esse comportamento confirma a integração full-stack sem
introduzir um bypass de autenticação.

O plugin da Cloudflare é ativado somente pelo servidor de desenvolvimento. Os
comandos atuais de build, preview e deploy de produção continuam usando o fluxo
existente.

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
| `GET` | `/api/admin/dashboard` | Retorna métricas, alertas de retenção e a notificação ativa. |
| `GET`, `POST` | `/api/admin/dogs` | Lista ou cadastra animais. |
| `GET`, `PATCH`, `DELETE` | `/api/admin/dogs/:id` | Consulta, altera ou remove um animal. |
| `GET`, `POST` | `/api/admin/recycle-points` | Lista ou cadastra pontos de reciclagem. |
| `GET`, `PATCH`, `DELETE` | `/api/admin/recycle-points/:id` | Consulta, altera ou remove um ponto. |
| `GET` | `/api/admin/adoptions` | Lista e descriptografa candidaturas. |
| `PATCH` | `/api/admin/adoptions/:id/status` | Atualiza o status de uma candidatura. |
| `GET` | `/api/admin/audit-log` | Lista os 100 eventos de auditoria mais recentes. Somente desenvolvedores. |
| `POST` | `/api/admin/media/upload` | Valida e envia uma imagem pelo Worker. |
| `POST` | `/api/admin/media/delete` | Remove uma imagem validada. |
| `GET` | `/api/admin/notifications` | Retorna a notificação ativa ou `null`. |
| `PUT` | `/api/admin/notifications` | Publica ou substitui a notificação do painel. Somente desenvolvedores. |
| `DELETE` | `/api/admin/notifications` | Remove a notificação atual. Somente desenvolvedores. |

As mutações exigem mesma origem, validação de payload e identidade autorizada.
O Worker aceita somente uma imagem JPEG, PNG ou WebP por upload, com original de
até 20 MB e 64 megapixels. O Cloudinary aplica uma transformação de entrada com
qualidade adaptativa, preserva a proporção e limita a mídia a 2560 × 2560. A
versão persistida deve ter no máximo 5 MB. Se a primeira otimização ainda exceder
esse teto, o Worker remove o resultado e repete automaticamente em WebP, com até
2048 × 2048 e a mesma qualidade adaptativa. A mídia recebe um ID único não
sobrescrevível e fica sujeita a 12 uploads por minuto por identidade. O Worker
também valida a conta e o caminho antes da exclusão de imagens.

### Auditoria administrativa

As principais mutações geram um evento na coleção `admin_audit_log`, incluindo
ator, papel, ação, alvo, status, resultado, duração e identificador da requisição.
Payloads, conteúdo de candidaturas e URLs de mídia não são copiados para a
auditoria. Sucessos, rejeições e falhas são registrados; uma indisponibilidade
da trilha não altera o resultado já produzido pela operação e também gera um
log estruturado `admin.audit.failed` no Workers Logs.

A consulta da trilha exige papel `developer`. Clientes Firestore continuam sem
acesso direto à coleção pela regra de negação padrão.

Cadastros, edições e remoções de cães agendam em segundo plano a reconstrução
do catálogo público rotativo no mesmo namespace KV usado pelo Worker público.
Como o KV é eventualmente consistente, uma versão anterior pode permanecer
visível por um breve período em algumas regiões.

### Notificação do painel

O endpoint `/api/admin/notifications` administra um único documento em
`system/notifications`. A leitura é permitida para qualquer identidade do
painel, enquanto publicação e remoção exigem o papel `developer`.

Uma publicação usa `PUT` com JSON:

```json
{
  "message": "O cadastro ficará indisponível às 18h.",
  "type": "info",
  "expiration": "6h"
}
```

Campos aceitos:

| Campo | Valores e regras |
| --- | --- |
| `message` | Texto obrigatório, sem espaços nas extremidades, de 1 a 240 caracteres. |
| `type` | `trivial`, `urgent`, `success` ou `info`. Define o tom e o ícone do card. |
| `expiration` | `1h`, `6h`, `12h` ou `until_deleted`. |

O Worker calcula a expiração usando o relógio do servidor e responde com o
registro completo:

```json
{
  "message": "O cadastro ficará indisponível às 18h.",
  "type": "info",
  "expiration": "6h",
  "target": "admin",
  "updatedAt": "2026-08-24T18:00:00.000Z",
  "expiresAt": "2026-08-25T00:00:00.000Z",
  "author": "developer@example.com"
}
```

Para `until_deleted`, `expiresAt` é `null`. Depois de `expiresAt`, as respostas
de leitura e do dashboard retornam `null` para a notificação, fazendo o card
desaparecer da seção **Avisos e Pendências**. Uma nova publicação substitui o
mesmo documento, e `DELETE` responde com status `204` mesmo quando não existe
notificação ativa. Documentos antigos sem os campos de expiração são tratados
como `until_deleted`.

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

O deploy administrativo continua manual e separado. Mudanças relacionadas a
autenticação local não devem ser publicadas em produção antes de passarem por
essas verificações e pelo ambiente de homologação.
