# Nexus Redacao License API

API de licencas para publicar na Vercel usando Supabase como banco.

## Fluxo

1. O cliente abre o Nexus Redacao pela primeira vez.
2. O app pede a chave de licenca.
3. O app chama `POST /api/activate` com a chave e o identificador da maquina.
4. A API valida no Supabase, registra a ativacao e devolve um `licenseToken`.
5. O app guarda esse token localmente e chama `POST /api/verify` periodicamente.

## Supabase

1. Crie um projeto no Supabase.
2. Abra o SQL Editor.
3. Execute `supabase/schema.sql`.
4. Guarde a `SUPABASE_URL` e a `service_role key`.

## Vercel

Configure estas variaveis no projeto da Vercel:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LICENSE_HASH_SECRET`
- `MACHINE_HASH_SECRET`
- `LICENSE_TOKEN_SECRET`
- `ADMIN_TOKEN`
- `OFFLINE_GRACE_DAYS`

Depois publique:

```bash
cd license-api
npm install
npm run deploy
```

## Paginas

- Site publico: `/`
- Painel admin: `/admin.html`

O painel admin pede o valor de `ADMIN_TOKEN`. Esse token nunca deve ser enviado para cliente final.

No painel voce consegue:

- Listar licencas
- Criar uma nova chave
- Suspender ou reativar cliente
- Revogar uma maquina ativada
- Excluir licenca

## Criar licenca

Gere o hash da chave:

```bash
set LICENSE_HASH_SECRET=mesmo_segredo_da_vercel
node scripts/hash-license-key.js NEXUS-CLIENTE-2026-0001
```

Depois cole o hash em `supabase/create-license.sql` e execute no Supabase.

Nunca salve a chave original no banco. Salve apenas o hash.
