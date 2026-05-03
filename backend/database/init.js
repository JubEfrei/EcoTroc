const fs = require('fs');
const path = require('path');
const { createClient } = require('@libsql/client');

// Try Turso first, fall back to local SQLite for development
const TURSO_URL = process.env.TURSO_CONNECTION_URL || process.env.DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

let client;
let isSQLite = false;

if (TURSO_URL && TURSO_AUTH_TOKEN) {
  // Use Turso
  client = createClient({
    url: TURSO_URL,
    authToken: TURSO_AUTH_TOKEN
  });
  console.log('Using Turso database');
} else {
  // Fall back to local SQLite for development
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.join(__dirname, 'local.db');
  
  // Create a promise-based wrapper for sqlite3
  class SQLiteClient {
    constructor(dbPath) {
      this.db = new sqlite3.Database(dbPath);
    }

    async execute({ sql, args = [] }) {
      return new Promise((resolve, reject) => {
        // For SELECT queries
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
          this.db.all(sql, args, (err, rows) => {
            if (err) {
              reject(err);
              return;
            }
            
            resolve({
              rows: rows || [],
              columns: rows && rows.length > 0 ? Object.keys(rows[0]) : []
            });
          });
        } else {
          // For other queries (INSERT, UPDATE, DELETE)
          this.db.run(sql, args, function(err) {
            if (err) {
              reject(err);
              return;
            }
            
            resolve({
              rows: [],
              columns: [],
              lastInsertRowid: this.lastID
            });
          });
        }
      });
    }

    async close() {
      return new Promise((resolve) => {
        this.db.close(() => resolve());
      });
    }
  }

  client = new SQLiteClient(dbPath);
  isSQLite = true;
  console.log('Using local SQLite database for development');
}

let initialized = false;

async function initDatabase() {
  if (initialized) return;

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const statements = schema
    .split(';')
    .map(stmt => stmt.trim())
    .filter(Boolean);

  console.log('Executing schema statements:', statements.length);
  for (const statement of statements) {
    const preview = statement.substring(0, 50).replace(/\n/g, ' ');
    console.log('Executing:', preview + (statement.length > 50 ? '...' : ''));
    await client.execute({ sql: statement, args: [] });
  }

  initialized = true;
  console.log('✓ Base de données Turso initialisée avec succès');
}

function normalizeValue(value) {
  if (typeof value === 'bigint') {
    return Number(value);
  }
  if (typeof value === 'string' && /^-?\d+$/.test(value)) {
    const numberValue = Number(value);
    if (Number.isSafeInteger(numberValue)) {
      return numberValue;
    }
  }
  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, normalizeValue(val)]));
  }
  return value;
}

function normalizeResult(result) {
  if (!result || !Array.isArray(result.rows) || !Array.isArray(result.columns)) {
    return result;
  }

  return {
    ...result,
    rows: result.rows.map(row => {
      if (!Array.isArray(row)) return normalizeValue(row);
      const obj = {};
      result.columns.forEach((column, index) => {
        obj[column] = normalizeValue(row[index]);
      });
      return obj;
    })
  };
}

async function run(sql, params = []) {
  return client.execute({ sql, args: params });
}

async function get(sql, params = []) {
  const result = normalizeResult(await run(sql, params));
  return Array.isArray(result.rows) ? result.rows[0] : undefined;
}

async function all(sql, params = []) {
  const result = normalizeResult(await run(sql, params));
  return Array.isArray(result.rows) ? result.rows : [];
}

module.exports = {
  initDatabase,
  client,
  run,
  get,
  all,
  db: { run, get, all },
  normalizeValue
};
