# RadiationMonitoring

Deployable Node.js + Postgres backend with IoT simulator, i18n, and data export/import.

## Quick Start (Docker)

1. Create `.env` with database URL and secrets:

```
DATABASE_URL=postgres://postgres:1234@postgres:5432/mydb
JWT_SECRET=change_me
API_URL=http://localhost:3000/api
```

2. Start services:

```
docker compose up -d --build
```

3. Initialize schema (inside backend container or locally with psql):

```
docker exec -i radiation_backend node -e "require('fs'); const { sequelize } = require('./models'); (async ()=>{await sequelize.authenticate(); const sql=require('fs').readFileSync('./sql/create_tables.sql','utf8'); const { sequelize: s } = require('./models'); await s.query(sql); console.log('Schema applied'); process.exit(0); })().catch(e=>{console.error(e); process.exit(1);})"
```

4. Open API docs (Docker): http://localhost:3001/api-docs

## Development (local)

```
npm install
export DATABASE_URL=postgres://postgres:1234@localhost:5432/mydb
npm run dev
```

## IoT Simulator

See `iot_client_python/README.md`. Configure `.env` and run locally or enable the Docker service.

```
cd iot_client_python
python device_simulator.py
```

### IoT in Docker

Add a device in the backend and set `DEVICE_TOKEN` in `.env`, then start the stack:

```
export DEVICE_TOKEN=demo-token-12345   # or your real device token
docker compose up -d --build
```

The IoT simulator container will call `http://backend:3000/api/readings` using `DEVICE_TOKEN`. Adjust `IOT_INTERVAL` and `IOT_MAX_RETRIES` in `.env` if needed.

## Container vs Local URLs

- Containerized backend (Docker): use `http://localhost:3001/api` in Postman.
- Local dev server (`npm run dev`): uses `http://localhost:3000/api`.

Only run one at a time to avoid port conflicts. If you send requests to `http://localhost:3001/api`, data will be stored in the container Postgres (`pgdb` volume).

## Export / Import

- Export all tables to JSON (timestamped dir):

```
npm run db:export -- --out dumps/backup-$(date +%F)
```

- Import from a directory (replace or append):

```
npm run db:import -- --in dumps/backup-2025-12-23 --mode replace
```
