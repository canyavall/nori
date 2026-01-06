use rusqlite::{Connection, Result};
use std::path::PathBuf;

/// Initialize SQLite database for storing app state
pub fn init_database(db_path: PathBuf) -> Result<Connection> {
    let conn = Connection::open(db_path)?;

    // Create roles table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS roles (
            id INTEGER PRIMARY KEY,
            active_role TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    // Insert default active role if table is empty
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM roles", [], |row| row.get(0))?;
    if count == 0 {
        conn.execute(
            "INSERT INTO roles (id, active_role) VALUES (1, 'engineer')",
            [],
        )?;
    }

    // Create OAuth tokens table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS oauth_tokens (
            id INTEGER PRIMARY KEY,
            provider TEXT NOT NULL,
            access_token TEXT NOT NULL,
            refresh_token TEXT NOT NULL,
            expires_at INTEGER NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        )",
        [],
    )?;

    // Migrate projects table to workspaces table
    let has_projects_table: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='projects'",
            [],
            |row| {
                let count: i64 = row.get(0)?;
                Ok(count > 0)
            },
        )?;

    if has_projects_table {
        // Create workspaces table with vault columns
        conn.execute(
            "CREATE TABLE IF NOT EXISTS workspaces (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                path TEXT NOT NULL UNIQUE,
                vault TEXT,
                vault_path TEXT,
                created_at INTEGER NOT NULL,
                last_opened_at INTEGER NOT NULL
            )",
            [],
        )?;

        // Migrate data from projects to workspaces
        conn.execute(
            "INSERT OR IGNORE INTO workspaces (id, name, path, vault, vault_path, created_at, last_opened_at)
             SELECT id, name, path, NULL, NULL, created_at, last_opened_at FROM projects",
            [],
        )?;

        // Update app_state to reference workspaces
        let has_active_project: bool = conn
            .query_row(
                "SELECT active_project_id IS NOT NULL FROM app_state WHERE id = 1",
                [],
                |row| row.get(0),
            )
            .unwrap_or(false);

        if has_active_project {
            conn.execute(
                "UPDATE app_state SET active_workspace_id = active_project_id WHERE id = 1",
                [],
            )?;
        }

        // Drop old projects table
        conn.execute("DROP TABLE projects", [])?;
    } else {
        // Fresh install - just create workspaces table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS workspaces (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                path TEXT NOT NULL UNIQUE,
                vault TEXT,
                vault_path TEXT,
                created_at INTEGER NOT NULL,
                last_opened_at INTEGER NOT NULL
            )",
            [],
        )?;
    }

    // Create or update app_state table
    let has_app_state: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='app_state'",
            [],
            |row| {
                let count: i64 = row.get(0)?;
                Ok(count > 0)
            },
        )?;

    if has_app_state {
        // Check if we need to add active_workspace_id column
        let has_workspace_column: bool = conn
            .query_row(
                "SELECT COUNT(*) FROM pragma_table_info('app_state') WHERE name='active_workspace_id'",
                [],
                |row| {
                    let count: i64 = row.get(0)?;
                    Ok(count > 0)
                },
            )
            .unwrap_or(false);

        if !has_workspace_column {
            // Column doesn't exist - need to recreate table
            conn.execute(
                "CREATE TABLE app_state_new (
                    id INTEGER PRIMARY KEY,
                    active_workspace_id INTEGER,
                    FOREIGN KEY (active_workspace_id) REFERENCES workspaces(id)
                )",
                [],
            )?;

            // Copy data from old table (only if active_project_id column exists)
            let has_project_column: bool = conn
                .query_row(
                    "SELECT COUNT(*) FROM pragma_table_info('app_state') WHERE name='active_project_id'",
                    [],
                    |row| {
                        let count: i64 = row.get(0)?;
                        Ok(count > 0)
                    },
                )
                .unwrap_or(false);

            if has_project_column {
                conn.execute(
                    "INSERT INTO app_state_new (id, active_workspace_id) SELECT id, active_project_id FROM app_state",
                    [],
                )?;
            } else {
                conn.execute(
                    "INSERT INTO app_state_new (id, active_workspace_id) VALUES (1, NULL)",
                    [],
                )?;
            }

            conn.execute("DROP TABLE app_state", [])?;
            conn.execute("ALTER TABLE app_state_new RENAME TO app_state", [])?;
        }
    } else {
        // Fresh install
        conn.execute(
            "CREATE TABLE app_state (
                id INTEGER PRIMARY KEY,
                active_workspace_id INTEGER,
                FOREIGN KEY (active_workspace_id) REFERENCES workspaces(id)
            )",
            [],
        )?;

        conn.execute(
            "INSERT INTO app_state (id, active_workspace_id) VALUES (1, NULL)",
            [],
        )?;
    }

    // Initialize session tables
    crate::session::init_session_tables(&conn)?;

    Ok(conn)
}

/// Save active role to database
pub fn save_active_role(conn: &Connection, role: &str) -> Result<()> {
    conn.execute(
        "UPDATE roles SET active_role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1",
        [role],
    )?;
    Ok(())
}

/// Load active role from database
pub fn load_active_role(conn: &Connection) -> Result<String> {
    conn.query_row("SELECT active_role FROM roles WHERE id = 1", [], |row| {
        row.get(0)
    })
}
