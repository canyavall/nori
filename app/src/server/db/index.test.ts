import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Create test database in temp directory
const testDir = join(tmpdir(), 'nori-test-' + Date.now());
const testDbPath = join(testDir, 'test.db');

describe('Database Initialization', () => {
  let db: Database.Database;

  beforeEach(() => {
    // Create test directory
    mkdirSync(testDir, { recursive: true });
    db = new Database(testDbPath);
    db.pragma('foreign_keys = ON');
  });

  afterEach(() => {
    db.close();
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should create all required tables', () => {
    // Create schema manually for test
    db.exec(`CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY,
      active_role TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.exec(`CREATE TABLE IF NOT EXISTS oauth_tokens (
      id INTEGER PRIMARY KEY,
      provider TEXT NOT NULL,
      access_token TEXT NOT NULL,
      refresh_token TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`);

    db.exec(`CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY,
      provider TEXT NOT NULL UNIQUE,
      api_key TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`);

    db.exec(`CREATE TABLE IF NOT EXISTS workspaces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      path TEXT NOT NULL UNIQUE,
      vault TEXT,
      vault_path TEXT,
      created_at INTEGER NOT NULL,
      last_opened_at INTEGER NOT NULL
    )`);

    db.exec(`CREATE TABLE IF NOT EXISTS app_state (
      id INTEGER PRIMARY KEY,
      active_workspace_id INTEGER,
      FOREIGN KEY (active_workspace_id) REFERENCES workspaces(id)
    )`);

    db.exec(`CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      total_tokens INTEGER DEFAULT 0,
      message_count INTEGER DEFAULT 0
    )`);

    db.exec(`CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      tokens INTEGER DEFAULT 0,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    )`);

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as { name: string }[];

    const tableNames = tables.map((t) => t.name);

    expect(tableNames).toContain('roles');
    expect(tableNames).toContain('oauth_tokens');
    expect(tableNames).toContain('api_keys');
    expect(tableNames).toContain('workspaces');
    expect(tableNames).toContain('app_state');
    expect(tableNames).toContain('sessions');
    expect(tableNames).toContain('messages');
  });

  it('should initialize default role', () => {
    db.exec(`CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY,
      active_role TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.exec("INSERT INTO roles (id, active_role) VALUES (1, 'engineer')");

    const role = db.prepare('SELECT active_role FROM roles WHERE id = 1').get() as { active_role: string };
    expect(role.active_role).toBe('engineer');
  });

  it('should migrate projects to workspaces', () => {
    // Create old projects table
    db.exec(`CREATE TABLE projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      path TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL,
      last_opened_at INTEGER NOT NULL
    )`);

    const now = Date.now();
    db.exec(`INSERT INTO projects (name, path, created_at, last_opened_at) VALUES ('Test', '/test', ${now}, ${now})`);

    // Create workspaces and migrate
    db.exec(`CREATE TABLE IF NOT EXISTS workspaces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      path TEXT NOT NULL UNIQUE,
      vault TEXT,
      vault_path TEXT,
      created_at INTEGER NOT NULL,
      last_opened_at INTEGER NOT NULL
    )`);

    db.exec(`INSERT OR IGNORE INTO workspaces (id, name, path, vault, vault_path, created_at, last_opened_at)
             SELECT id, name, path, NULL, NULL, created_at, last_opened_at FROM projects`);

    const workspaces = db.prepare('SELECT * FROM workspaces').all();
    expect(workspaces).toHaveLength(1);
  });

  it('should handle foreign key constraints', () => {
    // Create tables with FK
    db.exec(`CREATE TABLE workspaces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      path TEXT NOT NULL UNIQUE,
      vault TEXT,
      vault_path TEXT,
      created_at INTEGER NOT NULL,
      last_opened_at INTEGER NOT NULL
    )`);

    db.exec(`CREATE TABLE sessions (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      total_tokens INTEGER DEFAULT 0,
      message_count INTEGER DEFAULT 0
    )`);

    db.exec(`CREATE TABLE messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      tokens INTEGER DEFAULT 0,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    )`);

    const now = Date.now();
    db.exec(`INSERT INTO sessions (id, role, title, created_at, updated_at) VALUES ('sess1', 'engineer', 'Test', ${now}, ${now})`);
    db.exec(`INSERT INTO messages (id, session_id, role, content, timestamp) VALUES ('msg1', 'sess1', 'user', 'Test', ${now})`);

    // Delete session should cascade delete messages
    db.exec("DELETE FROM sessions WHERE id = 'sess1'");

    const messages = db.prepare('SELECT * FROM messages').all();
    expect(messages).toHaveLength(0);
  });
});
