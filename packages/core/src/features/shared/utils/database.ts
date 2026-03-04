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

export type ColumnSpec = {
  jsonFields?: string[];
  boolFields?: string[];
};

export function mapRow<T>(row: Record<string, unknown>, spec: ColumnSpec): T {
  const result: Record<string, unknown> = { ...row };
  for (const field of spec.jsonFields ?? []) {
    if (typeof result[field] === 'string') {
      try { result[field] = JSON.parse(result[field] as string); }
      catch { result[field] = []; }
    }
  }
  for (const field of spec.boolFields ?? []) {
    result[field] = Boolean(result[field]);
  }
  return result as T;
}

export function mapRows<T>(rows: Record<string, unknown>[], spec: ColumnSpec): T[] {
  return rows.map(row => mapRow<T>(row, spec));
}

interface Migration {
  version: number;
  up: (db: Database) => void;
}

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    up: (db) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS vaults (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          git_url TEXT NOT NULL,
          branch TEXT DEFAULT 'main',
          local_path TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now')),
          last_synced_at TEXT
        )
      `);
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
    },
  },
  {
    version: 2,
    up: (db) => {
      // vault_type requires changing NOT NULL on git_url — SQLite needs table recreate
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
    },
  },
  {
    version: 3,
    up: (db) => {
      db.run(`ALTER TABLE knowledge_entries ADD COLUMN description TEXT NOT NULL DEFAULT ''`);
      db.run(`ALTER TABLE knowledge_entries ADD COLUMN required_knowledge TEXT NOT NULL DEFAULT '[]'`);
      db.run(`ALTER TABLE knowledge_entries ADD COLUMN rules TEXT NOT NULL DEFAULT '[]'`);
    },
  },
];

function detectExistingVersion(db: Database): number {
  const vaultCols = new Set(
    queryAll(db, 'PRAGMA table_info(vaults)').map((c) => c.name as string)
  );
  if (!vaultCols.has('id')) return 0; // No tables at all — fresh DB

  const keCols = new Set(
    queryAll(db, 'PRAGMA table_info(knowledge_entries)').map((c) => c.name as string)
  );
  if (keCols.has('description') && keCols.has('rules')) return 3;
  if (vaultCols.has('vault_type')) return 2;
  return 1;
}

export function runMigrations(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const versionRow = queryOne(db, 'SELECT MAX(version) as v FROM schema_migrations');
  let currentVersion = (versionRow?.v as number | null) ?? 0;

  if (currentVersion === 0) {
    const detected = detectExistingVersion(db);
    if (detected > 0) {
      const placeholders = Array.from({ length: detected }, (_, i) => `(${i + 1})`).join(', ');
      db.run(`INSERT INTO schema_migrations (version) VALUES ${placeholders}`);
      currentVersion = detected;
    }
  }

  for (const migration of MIGRATIONS) {
    if (migration.version > currentVersion) {
      migration.up(db);
      db.run('INSERT INTO schema_migrations (version) VALUES (?)', [migration.version]);
      currentVersion = migration.version;
    }
  }
}
