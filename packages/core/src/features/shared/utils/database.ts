import initSqlJs, { type Database } from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

let SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null;

async function getSqlJs() {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  return SQL;
}

export interface DatabaseOptions {
  path: string;
  createIfMissing?: boolean;
}

export async function openDatabase(options: DatabaseOptions): Promise<Database> {
  const sqlJs = await getSqlJs();
  const { path, createIfMissing = false } = options;

  if (existsSync(path)) {
    const buffer = readFileSync(path);
    return new sqlJs.Database(buffer);
  }

  if (!createIfMissing) {
    throw new Error(`Database not found: ${path}`);
  }

  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  return new sqlJs.Database();
}

export function saveDatabase(db: Database, path: string): void {
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const data = db.export();
  writeFileSync(path, Buffer.from(data));
}

export function queryOne(db: Database, sql: string, params: unknown[] = []): Record<string, unknown> | null {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

export function queryAll(db: Database, sql: string, params: unknown[] = []): Record<string, unknown>[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: Record<string, unknown>[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

export function runMigrations(db: Database): void {
  // v1 schema — vault_type + nullable git_url/branch for local vaults
  db.run(`
    CREATE TABLE IF NOT EXISTS vaults (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      vault_type TEXT NOT NULL DEFAULT 'git',
      git_url TEXT,
      branch TEXT DEFAULT 'main',
      local_path TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_synced_at TEXT
    )
  `);

  // Migration: existing databases have git_url NOT NULL and no vault_type column.
  // Recreate the table with the new schema if vault_type is missing.
  const cols = queryAll(db, 'PRAGMA table_info(vaults)');
  const colNames = new Set(cols.map((c) => c.name as string));
  if (!colNames.has('vault_type')) {
    db.run(`ALTER TABLE vaults RENAME TO vaults_legacy`);
    db.run(`
      CREATE TABLE vaults (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        vault_type TEXT NOT NULL DEFAULT 'git',
        git_url TEXT,
        branch TEXT DEFAULT 'main',
        local_path TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        last_synced_at TEXT
      )
    `);
    db.run(`
      INSERT INTO vaults
        SELECT id, name, 'git', git_url, branch, local_path, created_at, updated_at, last_synced_at
        FROM vaults_legacy
    `);
    db.run(`DROP TABLE vaults_legacy`);
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS knowledge_entries (
      id TEXT PRIMARY KEY,
      vault_id TEXT NOT NULL,
      file_path TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      content_hash TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (vault_id) REFERENCES vaults(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS vault_links (
      id TEXT PRIMARY KEY,
      vault_id TEXT NOT NULL,
      project_path TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (vault_id) REFERENCES vaults(id),
      UNIQUE(vault_id, project_path)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      vault_id TEXT,
      title TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (vault_id) REFERENCES vaults(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      path TEXT NOT NULL UNIQUE,
      is_git INTEGER NOT NULL DEFAULT 0,
      connected_vaults TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}
