# SQLite Reporting Server

A lightweight Bun service that exposes a read-only SQLite database over HTTP for reporting clients such as KiBiAI.

## Features

- `POST /query` accepts parameterized `SELECT` and `WITH` SQL and returns JSON rows.
- `GET /schema` returns user tables, views, columns, indexes, and foreign keys.
- Bearer token authentication protects all endpoints except `GET /health`.
- SQLite is opened in readonly mode through Bun's built-in `bun:sqlite` driver.

## Prerequisites & Installation

- **Bun 1.x**:
  If you don't have Bun installed, you can install it using:
  - **macOS/Linux (via Homebrew)**:
    ```bash
    brew install oven-sh/bun/bun
    ```
  - **macOS/Linux/WSL (via Curl)**:
    ```bash
    curl -fsSL https://bun.sh/install | bash
    ```
- **SQLite**: An existing SQLite database file.
- **Docker & Docker Compose**: (Optional) if deploying or running with containers.

## Initialization & Configuration

1. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and set the appropriate configuration:
   ```bash
   cp .env.example .env
   ```
   *Note: `SQLITE_DB_PATH` must point to an existing database file because the service opens SQLite in readonly mode.*

2. **Ensure Database File Exists**:
   Because the server opens the database in strict read-only mode, the file must exist before starting the server. If you don't have a database ready and want to run tests locally, you can create a dummy database:
   ```bash
   sqlite3 data.db "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT); INSERT INTO users (name) VALUES ('Alice'), ('Bob');"
   ```

## Run Locally

Install the dependencies (lockfile setup) and start the server:

```bash
bun install
bun run dev
```

The API defaults to `http://localhost:18273`.

## Docker

Mount an existing database into `/app/data` and set `SQLITE_DB_PATH` to that file path.

```bash
docker compose up -d --build
```

The compose file reads environment variables from `.env`.

## API

### Health

```bash
curl http://localhost:18273/health
```

### Query

```bash
curl -X POST http://localhost:18273/query \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"sql":"SELECT * FROM invoices WHERE date BETWEEN ?1 AND ?2 LIMIT ?3","params":["2025-01-01","2025-12-31",1000]}'
```

Successful response:

```json
{
  "rows": [],
  "rowCount": 0,
  "columns": ["id", "date", "amount"]
}
```

### Schema

```bash
curl http://localhost:18273/schema \
  -H "Authorization: Bearer $API_KEY"
```

Successful response:

```json
{
  "schema": [
    {
      "name": "invoices",
      "type": "table",
      "columns": [],
      "indexes": [],
      "foreignKeys": []
    }
  ]
}
```

## Smoke Tests

Unauthorized requests should fail:

```bash
curl -i -X POST http://localhost:18273/query \
  -H "Content-Type: application/json" \
  -d '{"sql":"SELECT 1"}'
```

Mutating SQL should fail:

```bash
curl -i -X POST http://localhost:18273/query \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"sql":"DROP TABLE invoices"}'
```

CORS preflight should return `204`:

```bash
curl -i -X OPTIONS http://localhost:18273/query \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST"
```
