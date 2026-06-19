import { Database } from "bun:sqlite";

const DEFAULT_PORT = 18273;
const PORT = Number.parseInt(Bun.env.PORT || `${DEFAULT_PORT}`, 10);
const SQLITE_DB_PATH = Bun.env.SQLITE_DB_PATH || "./data.db";
const API_KEY = Bun.env.API_KEY;
const CORS_ORIGIN = Bun.env.CORS_ORIGIN || "*";

if (!API_KEY) {
  console.error("[Config]: API_KEY is required");
  process.exit(1);
}

let db;

try {
  db = new Database(SQLITE_DB_PATH, {
    readonly: true,
    create: false,
    strict: true,
  });

  runOptionalPragma("PRAGMA query_only = ON");
  runOptionalPragma("PRAGMA foreign_keys = ON");
  runOptionalPragma("PRAGMA busy_timeout = 5000");

  console.log(`[Database]: Opened ${SQLITE_DB_PATH} in readonly mode`);
} catch (error) {
  console.error(`[Database]: Failed to open ${SQLITE_DB_PATH}`, error);
  process.exit(1);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": CORS_ORIGIN,
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization,Content-Type",
  "Access-Control-Max-Age": "86400",
};

function runOptionalPragma(sql) {
  try {
    db.run(sql);
  } catch (error) {
    console.warn(`[Database]: Optional pragma failed: ${sql}: ${error.message}`);
  }
}

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: corsHeaders,
  });
}

function isAuthorized(req) {
  return req.headers.get("authorization") === `Bearer ${API_KEY}`;
}

function stripLeadingSqlComments(sql) {
  let value = sql.trimStart().replace(/^\uFEFF/, "");

  while (true) {
    const before = value;

    value = value.trimStart();

    if (value.startsWith("--")) {
      const newlineIndex = value.search(/\r?\n/);
      value = newlineIndex === -1 ? "" : value.slice(newlineIndex);
    } else if (value.startsWith("/*")) {
      const endIndex = value.indexOf("*/", 2);
      value = endIndex === -1 ? "" : value.slice(endIndex + 2);
    }

    if (value === before) {
      return value.trimStart();
    }
  }
}

function hasMultipleStatements(sql) {
  let quote = null;
  let lineComment = false;
  let blockComment = false;

  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index];
    const next = sql[index + 1];

    if (lineComment) {
      if (char === "\n") {
        lineComment = false;
      }
      continue;
    }

    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (char === quote) {
        if (next === quote) {
          index += 1;
        } else {
          quote = null;
        }
      }
      continue;
    }

    if (char === "-" && next === "-") {
      lineComment = true;
      index += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }

    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      continue;
    }

    if (char === ";") {
      const rest = stripLeadingSqlComments(sql.slice(index + 1));
      return rest.length > 0;
    }
  }

  return false;
}

function validateReadOnlySql(sql) {
  const trimmed = stripLeadingSqlComments(sql);
  const upper = trimmed.toUpperCase();

  if (!upper.startsWith("SELECT") && !upper.startsWith("WITH")) {
    return "Only SELECT and WITH queries are allowed";
  }

  if (hasMultipleStatements(trimmed)) {
    return "Only one SQL statement is allowed";
  }

  return null;
}

function quoteIdentifier(identifier) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function getObjectNames() {
  return db
    .query(
      `
      SELECT name, type
      FROM sqlite_master
      WHERE type IN ('table', 'view')
        AND name NOT LIKE 'sqlite_%'
      ORDER BY type, name
      `,
    )
    .all();
}

function getColumns(name) {
  return db.query(`PRAGMA table_info(${quoteIdentifier(name)})`).all();
}

function getForeignKeys(name) {
  return db.query(`PRAGMA foreign_key_list(${quoteIdentifier(name)})`).all();
}

function getIndexes(name) {
  return db
    .query(`PRAGMA index_list(${quoteIdentifier(name)})`)
    .all()
    .map((index) => ({
      ...index,
      columns: db.query(`PRAGMA index_info(${quoteIdentifier(index.name)})`).all(),
    }));
}

async function handleQuery(req) {
  let body;

  try {
    body = await req.json();
  } catch {
    return json({ error: "Request body must be valid JSON" }, 400);
  }

  const { sql, params = [] } = body || {};

  if (typeof sql !== "string" || sql.trim() === "") {
    return json({ error: "sql must be a non-empty string" }, 400);
  }

  if (!Array.isArray(params)) {
    return json({ error: "params must be an array" }, 400);
  }

  const validationError = validateReadOnlySql(sql);
  if (validationError) {
    return json({ error: validationError }, 403);
  }

  try {
    const stmt = db.prepare(sql);
    try {
      const rows = stmt.all(...params);
      const columns = stmt.columnNames || (rows[0] ? Object.keys(rows[0]) : []);

      return json({
        rows,
        rowCount: rows.length,
        columns,
      });
    } finally {
      stmt.finalize();
    }
  } catch (error) {
    return json({ error: error.message }, 400);
  }
}

function handleSchema() {
  try {
    const schema = getObjectNames().map(({ name, type }) => {
      const object = {
        name,
        type,
        columns: getColumns(name),
        indexes: getIndexes(name),
      };

      if (type === "table") {
        object.foreignKeys = getForeignKeys(name);
      }

      return object;
    });

    return json({ schema });
  } catch (error) {
    return json({ error: error.message }, 400);
  }
}

const server = Bun.serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    if (req.method === "GET" && url.pathname === "/health") {
      return json({
        status: "ok",
        database: SQLITE_DB_PATH,
        readonly: true,
      });
    }

    if (!isAuthorized(req)) {
      return json({ error: "Unauthorized" }, 401);
    }

    if (req.method === "POST" && url.pathname === "/query") {
      return handleQuery(req);
    }

    if (req.method === "GET" && url.pathname === "/schema") {
      return handleSchema();
    }

    return json({ error: "Not found" }, 404);
  },
});

console.log(`[Server]: Listening on http://localhost:${server.port}`);
