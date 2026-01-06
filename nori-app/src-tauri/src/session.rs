use rusqlite::{Connection, Result};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: String,
    pub role: String,
    pub title: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub total_tokens: usize,
    pub message_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionMessage {
    pub id: String,
    pub session_id: String,
    pub role: String,
    pub content: String,
    pub timestamp: i64,
    pub tokens: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionWithMessages {
    pub session: Session,
    pub messages: Vec<SessionMessage>,
}

/// Initialize session tables
pub fn init_session_tables(conn: &Connection) -> Result<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            role TEXT NOT NULL,
            title TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            total_tokens INTEGER DEFAULT 0,
            message_count INTEGER DEFAULT 0
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            tokens INTEGER DEFAULT 0,
            FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
        )",
        [],
    )?;

    Ok(())
}

/// Save a session with messages
#[tauri::command]
pub fn save_session(
    session_id: String,
    role: String,
    title: String,
    messages: Vec<SessionMessage>,
) -> Result<(), String> {
    let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;
    let db_path = home_dir.join(".nori").join("nori.db");
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    let now = chrono::Utc::now().timestamp();
    let total_tokens: usize = messages.iter().map(|m| m.tokens).sum();
    let message_count = messages.len();

    // Check if session exists
    let exists: bool = conn
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM sessions WHERE id = ?)",
            [&session_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    if exists {
        // Update existing session
        conn.execute(
            "UPDATE sessions SET updated_at = ?, total_tokens = ?, message_count = ? WHERE id = ?",
            rusqlite::params![now, total_tokens as i64, message_count as i64, &session_id],
        )
        .map_err(|e| e.to_string())?;
    } else {
        // Insert new session
        conn.execute(
            "INSERT INTO sessions (id, role, title, created_at, updated_at, total_tokens, message_count)
             VALUES (?, ?, ?, ?, ?, ?, ?)",
            rusqlite::params![
                &session_id,
                &role,
                &title,
                now,
                now,
                total_tokens as i64,
                message_count as i64
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    // Delete old messages for this session
    conn.execute("DELETE FROM messages WHERE session_id = ?", [&session_id])
        .map_err(|e| e.to_string())?;

    // Insert messages
    for msg in messages {
        conn.execute(
            "INSERT INTO messages (id, session_id, role, content, timestamp, tokens)
             VALUES (?, ?, ?, ?, ?, ?)",
            rusqlite::params![
                &msg.id,
                &session_id,
                &msg.role,
                &msg.content,
                msg.timestamp,
                msg.tokens as i64
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Load a session with messages
#[tauri::command]
pub fn load_session(session_id: String) -> Result<SessionWithMessages, String> {
    let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;
    let db_path = home_dir.join(".nori").join("nori.db");
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    // Load session
    let session: Session = conn
        .query_row(
            "SELECT id, role, title, created_at, updated_at, total_tokens, message_count FROM sessions WHERE id = ?",
            [&session_id],
            |row| {
                Ok(Session {
                    id: row.get(0)?,
                    role: row.get(1)?,
                    title: row.get(2)?,
                    created_at: row.get(3)?,
                    updated_at: row.get(4)?,
                    total_tokens: row.get::<_, i64>(5)? as usize,
                    message_count: row.get::<_, i64>(6)? as usize,
                })
            },
        )
        .map_err(|e| format!("Session not found: {}", e))?;

    // Load messages
    let mut stmt = conn
        .prepare("SELECT id, session_id, role, content, timestamp, tokens FROM messages WHERE session_id = ? ORDER BY timestamp ASC")
        .map_err(|e| e.to_string())?;

    let messages = stmt
        .query_map([&session_id], |row| {
            Ok(SessionMessage {
                id: row.get(0)?,
                session_id: row.get(1)?,
                role: row.get(2)?,
                content: row.get(3)?,
                timestamp: row.get(4)?,
                tokens: row.get::<_, i64>(5)? as usize,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(SessionWithMessages { session, messages })
}

/// List all sessions
#[tauri::command]
pub fn list_sessions() -> Result<Vec<Session>, String> {
    let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;
    let db_path = home_dir.join(".nori").join("nori.db");
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, role, title, created_at, updated_at, total_tokens, message_count FROM sessions ORDER BY updated_at DESC")
        .map_err(|e| e.to_string())?;

    let sessions = stmt
        .query_map([], |row| {
            Ok(Session {
                id: row.get(0)?,
                role: row.get(1)?,
                title: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
                total_tokens: row.get::<_, i64>(5)? as usize,
                message_count: row.get::<_, i64>(6)? as usize,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(sessions)
}

/// Delete a session
#[tauri::command]
pub fn delete_session(session_id: String) -> Result<(), String> {
    let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;
    let db_path = home_dir.join(".nori").join("nori.db");
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM sessions WHERE id = ?", [&session_id])
        .map_err(|e| e.to_string())?;

    Ok(())
}
