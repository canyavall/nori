import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const testDir = join(tmpdir(), 'nori-crud-test-' + Date.now());
const testDbPath = join(testDir, 'test.db');
let db: Database.Database;

// Helper to initialize schema
function initSchema(database: Database.Database) {
  database.exec(`CREATE TABLE roles (
    id INTEGER PRIMARY KEY,
    active_role TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  database.exec(`CREATE TABLE workspaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    path TEXT NOT NULL UNIQUE,
    vault TEXT,
    vault_path TEXT,
    created_at INTEGER NOT NULL,
    last_opened_at INTEGER NOT NULL
  )`);

  database.exec(`CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    total_tokens INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0
  )`);

  database.exec(`CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    tokens INTEGER DEFAULT 0,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
  )`);

  database.exec(`CREATE TABLE api_keys (
    id INTEGER PRIMARY KEY,
    provider TEXT NOT NULL UNIQUE,
    api_key TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`);

  database.exec("INSERT INTO roles (id, active_role) VALUES (1, 'engineer')");
}

describe('Roles CRUD', () => {
  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
    db = new Database(testDbPath);
    db.pragma('foreign_keys = ON');
    initSchema(db);
  });

  afterEach(() => {
    db.close();
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should update active role', () => {
    db.prepare('UPDATE roles SET active_role = ? WHERE id = 1').run('architect');
    const result = db.prepare('SELECT active_role FROM roles WHERE id = 1').get() as { active_role: string };
    expect(result.active_role).toBe('architect');
  });

  it('should read active role', () => {
    const result = db.prepare('SELECT active_role FROM roles WHERE id = 1').get() as { active_role: string };
    expect(result.active_role).toBe('engineer');
  });
});

describe('Workspaces CRUD', () => {
  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
    db = new Database(testDbPath);
    db.pragma('foreign_keys = ON');
    initSchema(db);
  });

  afterEach(() => {
    db.close();
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should create workspace', () => {
    const now = Date.now();
    const result = db
      .prepare(
        `INSERT INTO workspaces (name, path, vault, vault_path, created_at, last_opened_at)
         VALUES (?, ?, ?, ?, ?, ?) RETURNING *`
      )
      .get('Test Project', '/test/path', null, null, now, now);

    expect(result).toMatchObject({
      name: 'Test Project',
      path: '/test/path',
    });
  });

  it('should read all workspaces', () => {
    const now = Date.now();
    db.prepare(
      'INSERT INTO workspaces (name, path, created_at, last_opened_at) VALUES (?, ?, ?, ?)'
    ).run('Project 1', '/path1', now, now);
    db.prepare(
      'INSERT INTO workspaces (name, path, created_at, last_opened_at) VALUES (?, ?, ?, ?)'
    ).run('Project 2', '/path2', now, now);

    const workspaces = db.prepare('SELECT * FROM workspaces').all();
    expect(workspaces).toHaveLength(2);
  });

  it('should update workspace', () => {
    const now = Date.now();
    const created = db
      .prepare(
        'INSERT INTO workspaces (name, path, created_at, last_opened_at) VALUES (?, ?, ?, ?) RETURNING id'
      )
      .get('Test', '/test', now, now) as { id: number };

    db.prepare('UPDATE workspaces SET name = ? WHERE id = ?').run('Updated Name', created.id);

    const updated = db.prepare('SELECT name FROM workspaces WHERE id = ?').get(created.id) as { name: string };
    expect(updated.name).toBe('Updated Name');
  });

  it('should delete workspace', () => {
    const now = Date.now();
    const created = db
      .prepare(
        'INSERT INTO workspaces (name, path, created_at, last_opened_at) VALUES (?, ?, ?, ?) RETURNING id'
      )
      .get('Test', '/test', now, now) as { id: number };

    db.prepare('DELETE FROM workspaces WHERE id = ?').run(created.id);

    const result = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(created.id);
    expect(result).toBeUndefined();
  });
});

describe('Sessions CRUD', () => {
  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
    db = new Database(testDbPath);
    db.pragma('foreign_keys = ON');
    initSchema(db);
  });

  afterEach(() => {
    db.close();
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should save session with messages', () => {
    const now = Date.now();
    db.prepare(
      'INSERT INTO sessions (id, role, title, created_at, updated_at, total_tokens, message_count) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run('sess1', 'engineer', 'Test Session', now, now, 100, 2);

    db.prepare(
      'INSERT INTO messages (id, session_id, role, content, timestamp, tokens) VALUES (?, ?, ?, ?, ?, ?)'
    ).run('msg1', 'sess1', 'user', 'Hello', now, 50);

    db.prepare(
      'INSERT INTO messages (id, session_id, role, content, timestamp, tokens) VALUES (?, ?, ?, ?, ?, ?)'
    ).run('msg2', 'sess1', 'assistant', 'Hi there', now, 50);

    const messages = db.prepare('SELECT * FROM messages WHERE session_id = ?').all('sess1');
    expect(messages).toHaveLength(2);
  });

  it('should load session with messages', () => {
    const now = Date.now();
    db.prepare(
      'INSERT INTO sessions (id, role, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).run('sess1', 'engineer', 'Test', now, now);

    db.prepare(
      'INSERT INTO messages (id, session_id, role, content, timestamp) VALUES (?, ?, ?, ?, ?)'
    ).run('msg1', 'sess1', 'user', 'Test message', now);

    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get('sess1');
    const messages = db.prepare('SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp').all('sess1');

    expect(session).toBeDefined();
    expect(messages).toHaveLength(1);
  });

  it('should cascade delete messages when session is deleted', () => {
    const now = Date.now();
    db.prepare(
      'INSERT INTO sessions (id, role, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).run('sess1', 'engineer', 'Test', now, now);

    db.prepare(
      'INSERT INTO messages (id, session_id, role, content, timestamp) VALUES (?, ?, ?, ?, ?)'
    ).run('msg1', 'sess1', 'user', 'Test', now);

    db.prepare('DELETE FROM sessions WHERE id = ?').run('sess1');

    const messages = db.prepare('SELECT * FROM messages WHERE session_id = ?').all('sess1');
    expect(messages).toHaveLength(0);
  });
});

describe('API Keys CRUD', () => {
  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
    db = new Database(testDbPath);
    db.pragma('foreign_keys = ON');
    initSchema(db);
  });

  afterEach(() => {
    db.close();
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should save API key', () => {
    const now = Date.now();
    db.prepare(
      'INSERT INTO api_keys (provider, api_key, created_at, updated_at) VALUES (?, ?, ?, ?)'
    ).run('anthropic', 'test-key-123', now, now);

    const result = db.prepare('SELECT api_key FROM api_keys WHERE provider = ?').get('anthropic') as {
      api_key: string;
    };
    expect(result.api_key).toBe('test-key-123');
  });

  it('should update existing API key', () => {
    const now = Date.now();
    db.prepare(
      'INSERT INTO api_keys (provider, api_key, created_at, updated_at) VALUES (?, ?, ?, ?)'
    ).run('anthropic', 'old-key', now, now);

    db.prepare('UPDATE api_keys SET api_key = ?, updated_at = ? WHERE provider = ?').run('new-key', now, 'anthropic');

    const result = db.prepare('SELECT api_key FROM api_keys WHERE provider = ?').get('anthropic') as {
      api_key: string;
    };
    expect(result.api_key).toBe('new-key');
  });

  it('should delete API key', () => {
    const now = Date.now();
    db.prepare(
      'INSERT INTO api_keys (provider, api_key, created_at, updated_at) VALUES (?, ?, ?, ?)'
    ).run('anthropic', 'test-key', now, now);

    db.prepare('DELETE FROM api_keys WHERE provider = ?').run('anthropic');

    const result = db.prepare('SELECT * FROM api_keys WHERE provider = ?').get('anthropic');
    expect(result).toBeUndefined();
  });
});
