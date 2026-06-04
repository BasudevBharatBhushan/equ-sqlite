# SQLite Reporting Server

A lightweight Node.js + Express + TypeScript + SQLite application that acts as a simple SQL reporting server.

## Features

- **Dynamic CSV / Excel Import**: Automatically create tables and import data from `.csv` and `.xlsx` files. If tables already exist, missing columns are added seamlessly.
- **SQL Execution Endpoint**: Discover schema and execute purely read-only queries (`SELECT`, `PRAGMA`, `WITH`). Mutating queries (`INSERT`, `DROP`, `UPDATE`) are blocked by default for security.
- **SQLite isolation**: DB interactions are abstracted inside the service layer, making it trivial to migrate to PostgreSQL.

## Prerequisites

- Node.js (v18+ recommended)
- npm
- Docker and Docker Compose (if deploying via containers)

## Installation

1. Clone or download the source code.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and adjust variables if needed:
   ```bash
   cp .env.example .env
   ```

### Configuration (`.env`)
- `PORT`: The port the server runs on (default: `18273`).
- `ALLOW_WRITE_QUERIES`: Set to `true` to allow modifying database tables directly via the `/query` endpoint. Default is `false` (read-only allowed).

## Development

To run the server locally with auto-reload:
```bash
npm run dev
```

## Production Build (Local Host)

To compile TypeScript source to JavaScript:
```bash
npm run build
```

To run the compiled output:
```bash
npm start
```

## Docker & Deployment

The application is configured to build directly from the remote Git repository (`master` branch). The SQLite database is persisted inside a Docker volume so data survives container updates and restarts.

### Initial Deployment

Run this command on your deployment server (e.g. AWS EC2) or local environment:
```bash
docker compose up -d --build
```
This builds and starts the container in detached mode. The API will be exposed on:
`http://localhost:18273`

### Updating After Code Changes

To force Docker to pull the latest commit from the Git repository and rebuild:
```bash
docker compose build --no-cache
docker compose up -d --build
```

### Viewing Logs

To stream the application logs:
```bash
docker logs -f sqlite-gateway
```

### Checking Running Containers

To check the container status:
```bash
docker ps
```

### Stopping the Container

To stop and remove the container (preserving database volume data):
```bash
docker compose down
```

---

## API Documentation

### 1. Health Check
Check if the server and database are running.

**Endpoint:** `GET /health`

**Example:**
```bash
curl http://localhost:18273/health
```

### 2. Import CSV or Excel File
Import a CSV or XLSX file to dynamically create/update a table and load its data.

**Endpoint:** `POST /import-csv`

**Parameters (multipart/form-data):**
- `tableName`: (String) The name of the table to create or insert into.
- `file`: (File) The `.csv` or `.xlsx` file to upload.

**Example:**
```bash
curl -X POST http://localhost:18273/import-csv \
  -F "tableName=employees" \
  -F "file=@/path/to/your/file.csv"
```

### 3. Execute Query
Run an arbitrary SQL query on the database. If `ALLOW_WRITE_QUERIES=false`, only `SELECT`, `PRAGMA`, and `WITH` statements are allowed.

**Endpoint:** `POST /query`

**Request Body (JSON):**
```json
{
  "sql": "SELECT * FROM employees LIMIT 10",
  "params": []
}
```

**Example:**
```bash
curl -X POST http://localhost:18273/query \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT * FROM employees LIMIT 10"}'
```

### 4. Table Discovery
List all tables in the SQLite database.

**Example:**
```bash
curl -X POST http://localhost:18273/query \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT name FROM sqlite_master WHERE type='\''table'\''"}'
```

### 5. Field Discovery
Get column information for a specific table.

**Example:**
```bash
curl -X POST http://localhost:18273/query \
  -H "Content-Type: application/json" \
  -d '{"sql": "PRAGMA table_info('\''employees'\'')"}'
```
