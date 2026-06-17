# Nexus Redacao Robust

Painel de controle para redacao jornalistica com Node.js, Express, SQLite, JWT, logs, auditoria e backups.

## Como rodar

```bash
npm install
npm start
```

O servidor abre em `http://localhost:3000`. Se a porta estiver ocupada, tenta a proxima.

## Credenciais

- Admin: `admin@nexus.com` / `admin123`
- Editor: `editor@nexus.com` / `editor123`
- Reporter: `reporter@nexus.com` / `reporter123`
- Pauteiro: `pauteiro@nexus.com` / `pauteiro123`

## Arquitetura

- `src/server.js`: servidor Express
- `src/database/database.js`: SQLite, migrations e conexao
- `src/routes`: rotas de auth, estado e backup
- `src/middlewares`: autenticacao e erros
- `src/services/backupService.js`: backups JSON
- `src/utils/logger.js`: logs com Winston
- `data/nexus.db`: banco SQLite
- `backups/`: backups gerados
- `logs/`: logs da aplicacao

## Funcionalidades

- Autenticacao JWT com perfis.
- SQLite com migrations automaticas.
- Painel, todas as paginas do menu e submenus recolhiveis.
- CRUD visual em todos os modulos.
- Espelhos, blocos e laudas.
- Persistencia do estado da aplicacao no SQLite.
- Auditoria basica de salvamento/reset.
- Backup manual e exportacao CSV.
- Logs estruturados.
- Rate limiting, Helmet, CORS e compression.
