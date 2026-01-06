import Database from 'better-sqlite3';
import { homedir } from 'os';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';

let db: Database.Database | null = null;

/**
 * Get database file path (~/.nori/nori.db)
 */
export function getDatabasePath(): string {
  const homeDir = homedir();
  const noriDir = join(homeDir, '.nori');

  // Ensure .nori directory exists
  if (!existsSync(noriDir)) {
    mkdirSync(noriDir, { recursive: true, mode: 0o755 });
  }

  return join(noriDir, 'nori.db');
}

/**
 * Initialize database connection (singleton)
 */
export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = getDatabasePath();
    db = new Database(dbPath);

    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // Initialize schema
    initializeSchema(db);
  }

  return db;
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Initialize database schema with migrations
 */
function initializeSchema(conn: Database.Database): void {
  // Create roles table
  conn.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY,
      active_role TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert default role if empty
  const roleCount = conn.prepare('SELECT COUNT(*) as count FROM roles').get() as { count: number };
  if (roleCount.count === 0) {
    conn.prepare("INSERT INTO roles (id, active_role) VALUES (1, 'engineer')").run();
  }

  // Create OAuth tokens table
  conn.exec(`
    CREATE TABLE IF NOT EXISTS oauth_tokens (
      id INTEGER PRIMARY KEY,
      provider TEXT NOT NULL,
      access_token TEXT NOT NULL,
      refresh_token TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Create API keys table
  conn.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY,
      provider TEXT NOT NULL UNIQUE,
      api_key TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Migrate projects → workspaces
  migrateProjectsToWorkspaces(conn);

  // Create or migrate app_state
  migrateAppState(conn);

  // Create session tables
  initSessionTables(conn);
}

/**
 * Migrate projects table to workspaces (if exists)
 */
function migrateProjectsToWorkspaces(conn: Database.Database): void {
  const hasProjectsTable = conn
    .prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='projects'")
    .get() as { count: number };

  if (hasProjectsTable.count > 0) {
    // Create workspaces table
    conn.exec(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        path TEXT NOT NULL UNIQUE,
        vault TEXT,
        vault_path TEXT,
        created_at INTEGER NOT NULL,
        last_opened_at INTEGER NOT NULL
      )
    `);

    // Migrate data
    conn.exec(`
      INSERT OR IGNORE INTO workspaces (id, name, path, vault, vault_path, created_at, last_opened_at)
      SELECT id, name, path, NULL, NULL, created_at, last_opened_at FROM projects
    `);

    // Update app_state to use workspace_id
    const hasActiveProject = conn
      .prepare('SELECT active_project_id IS NOT NULL as has_project FROM app_state WHERE id = 1')
      .get() as { has_project: number } | undefined;

    if (hasActiveProject?.has_project) {
      conn.exec('UPDATE app_state SET active_workspace_id = active_project_id WHERE id = 1');
    }

    // Drop old table
    conn.exec('DROP TABLE projects');
  } else {
    // Fresh install - create workspaces table
    conn.exec(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        path TEXT NOT NULL UNIQUE,
        vault TEXT,
        vault_path TEXT,
        created_at INTEGER NOT NULL,
        last_opened_at INTEGER NOT NULL
      )
    `);
  }
}

/**
 * Create or migrate app_state table
 */
function migrateAppState(conn: Database.Database): void {
  const hasAppState = conn
    .prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='app_state'")
    .get() as { count: number };

  if (hasAppState.count > 0) {
    // Check if active_workspace_id column exists
    const hasWorkspaceColumn = conn
      .prepare("SELECT COUNT(*) as count FROM pragma_table_info('app_state') WHERE name='active_workspace_id'")
      .get() as { count: number };

    if (hasWorkspaceColumn.count === 0) {
      // Need to recreate table with new column
      conn.exec(`
        CREATE TABLE app_state_new (
          id INTEGER PRIMARY KEY,
          active_workspace_id INTEGER,
          FOREIGN KEY (active_workspace_id) REFERENCES workspaces(id)
        )
      `);

      // Check if old table has active_project_id
      const hasProjectColumn = conn
        .prepare("SELECT COUNT(*) as count FROM pragma_table_info('app_state') WHERE name='active_project_id'")
        .get() as { count: number };

      if (hasProjectColumn.count > 0) {
        conn.exec('INSERT INTO app_state_new (id, active_workspace_id) SELECT id, active_project_id FROM app_state');
      } else {
        conn.exec('INSERT INTO app_state_new (id, active_workspace_id) VALUES (1, NULL)');
      }

      conn.exec('DROP TABLE app_state');
      conn.exec('ALTER TABLE app_state_new RENAME TO app_state');
    }
  } else {
    // Fresh install
    conn.exec(`
      CREATE TABLE app_state (
        id INTEGER PRIMARY KEY,
        active_workspace_id INTEGER,
        FOREIGN KEY (active_workspace_id) REFERENCES workspaces(id)
      )
    `);

    conn.exec('INSERT INTO app_state (id, active_workspace_id) VALUES (1, NULL)');
  }
}

/**
 * Initialize session tables
 */
function initSessionTables(conn: Database.Database): void {
  conn.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      total_tokens INTEGER DEFAULT 0,
      message_count INTEGER DEFAULT 0
    )
  `);

  conn.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      tokens INTEGER DEFAULT 0,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    )
  `);
}
