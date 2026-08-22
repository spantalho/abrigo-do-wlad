# Publicação segura do painel administrativo

O admin não usa Firebase Auth nem acessa o Firestore pelo navegador. O
Cloudflare Access autentica a pessoa, o Worker valida o JWT e mapeia o e-mail
verificado para um papel configurado exclusivamente no runtime. Todas as
operações administrativas usam a conta de serviço do Worker.

## Fronteiras de segurança

| Papel           | Origem da lista              | Escopo atual                                     |
| --------------- | ---------------------------- | ------------------------------------------------ |
| `developer`     | `ADMIN_DEVELOPER_EMAILS`     | Operações administrativas e manutenção técnica   |
| `administrator` | `ADMIN_ADMINISTRATOR_EMAILS` | Animais, reciclagem, candidaturas e estatísticas |

As listas acima não devem ser versionadas com identidades reais. Configure-as
como valores de runtime e repita as mesmas identidades na política `Allow` da
aplicação Access. Exija MFA e mantenha uma política de negação como padrão.

As Firestore Rules permitem ao cliente somente leitura de `dogs`,
`recycle_points` e `system/settings`. Escritas, candidaturas, usuários, chaves e
estatísticas são negados inclusive para clientes Firebase autenticados. A conta
de serviço dos Workers é controlada por IAM e não pelas Rules.

## Variáveis do Worker do admin

Valores de configuração:

```text
CF_ACCESS_TEAM_DOMAIN
CF_ACCESS_AUD
ADMIN_DEVELOPER_EMAILS
ADMIN_ADMINISTRATOR_EMAILS
CLOUDINARY_CLOUD_NAME
```

Secrets:

```text
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
MASTER_KEY
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

Use `apps/admin/.dev.vars` apenas localmente; o arquivo é ignorado. Em produção,
cadastre os secrets no Cloudflare e não em `wrangler.jsonc` nem em variáveis
`VITE_*`.

## Ordem de publicação

1. Execute toda a verificação local e confirme que o secret scan está limpo.
2. Configure o Worker admin, o hostname e a aplicação Access sem expor o
   hostname fora da política.
3. Publique e valide `/api/session` e os CRUDs com uma identidade de cada papel;
   confirme também a negação para uma identidade externa.
4. Publique as Firestore Rules finais somente após o Worker admin estar
   operacional, evitando interromper o painel durante o corte.
5. Configure o cron com `ADOPTION_CLEANUP_MODE=dry-run`, revise os logs e faça o
   backup operacional necessário. O log informa `matched`, `deleted` e
   `hasMore`; o dry-run nunca chama a exclusão.
6. Altere o modo para `delete` somente após validar o conjunto de candidaturas
   vencidas. `disabled` é o padrão quando a variável está ausente ou inválida.

O deploy não é executado automaticamente pelos comandos de verificação.

## Verificação antes do push

```bash
npm ci
npm run check:secrets
npm audit --omit=dev --audit-level=high
npm run lint
npm run build
npm run typecheck:worker
npm run typecheck:admin-worker
npm run test:unit
npm run test:frontend
npm run test:worker
npm run test:rules
npm run check:public-worker
npm run check:admin-worker
npm run check:cron
```

O CI repete essas verificações e usa Gitleaks com o histórico completo.
