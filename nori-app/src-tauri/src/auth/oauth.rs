use chrono::Utc;
use rusqlite::{Connection, Result};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OAuthToken {
    pub provider: String,
    pub access_token: String,
    pub refresh_token: String,
    pub expires_at: i64,
}

pub fn save_oauth_token(
    conn: &Connection,
    provider: &str,
    access_token: &str,
    refresh_token: &str,
    expires_at: i64,
) -> Result<()> {
    let now = Utc::now().timestamp_millis();

    let existing: std::result::Result<i64, _> = conn.query_row(
        "SELECT id FROM oauth_tokens WHERE provider = ?1",
        [provider],
        |row| row.get(0),
    );

    match existing {
        Ok(id) => {
            conn.execute(
                "UPDATE oauth_tokens SET access_token = ?1, refresh_token = ?2, expires_at = ?3, updated_at = ?4 WHERE id = ?5",
                [access_token, refresh_token, &expires_at.to_string(), &now.to_string(), &id.to_string()],
            )?;
        }
        Err(_) => {
            conn.execute(
                "INSERT INTO oauth_tokens (provider, access_token, refresh_token, expires_at, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                [provider, access_token, refresh_token, &expires_at.to_string(), &now.to_string(), &now.to_string()],
            )?;
        }
    }

    Ok(())
}

pub fn load_oauth_token(conn: &Connection, provider: &str) -> Option<OAuthToken> {
    conn.query_row(
        "SELECT provider, access_token, refresh_token, expires_at FROM oauth_tokens WHERE provider = ?1",
        [provider],
        |row| {
            Ok(OAuthToken {
                provider: row.get(0)?,
                access_token: row.get(1)?,
                refresh_token: row.get(2)?,
                expires_at: row.get(3)?,
            })
        },
    )
    .ok()
}

pub fn is_token_expired(token: &OAuthToken) -> bool {
    let now = Utc::now().timestamp_millis();
    now >= token.expires_at
}

pub fn save_api_key(conn: &Connection, provider: &str, api_key: &str) -> Result<()> {
    let now = Utc::now().timestamp_millis();

    // Check if api_keys table exists, create if not
    conn.execute(
        "CREATE TABLE IF NOT EXISTS api_keys (
            id INTEGER PRIMARY KEY,
            provider TEXT NOT NULL UNIQUE,
            api_key TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        )",
        [],
    )?;

    let existing: std::result::Result<i64, _> = conn.query_row(
        "SELECT id FROM api_keys WHERE provider = ?1",
        [provider],
        |row| row.get(0),
    );

    match existing {
        Ok(id) => {
            conn.execute(
                "UPDATE api_keys SET api_key = ?1, updated_at = ?2 WHERE id = ?3",
                [api_key, &now.to_string(), &id.to_string()],
            )?;
        }
        Err(_) => {
            conn.execute(
                "INSERT INTO api_keys (provider, api_key, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4)",
                [provider, api_key, &now.to_string(), &now.to_string()],
            )?;
        }
    }

    Ok(())
}

pub fn load_api_key(conn: &Connection, provider: &str) -> Option<String> {
    conn.query_row(
        "SELECT api_key FROM api_keys WHERE provider = ?1",
        [provider],
        |row| row.get(0),
    )
    .ok()
}

pub fn refresh_oauth_token(
    _conn: &Connection,
    _provider: &str,
    _refresh_token: &str,
) -> Result<OAuthToken, String> {
    Err(
        "OAuth token refresh not yet implemented. \
        Requires Anthropic OAuth endpoint documentation for:\n\
        - Token refresh endpoint URL\n\
        - Request format (refresh_token, client_id, etc.)\n\
        - Response format (new access_token, refresh_token, expires_in)\n\
        \n\
        For now, manually copy tokens from OpenCode's ~/.local/share/opencode/auth.json \
        or use ANTHROPIC_API_KEY environment variable."
            .to_string(),
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    fn setup_test_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute(
            "CREATE TABLE oauth_tokens (
                id INTEGER PRIMARY KEY,
                provider TEXT NOT NULL,
                access_token TEXT NOT NULL,
                refresh_token TEXT NOT NULL,
                expires_at INTEGER NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )",
            [],
        )
        .unwrap();
        conn
    }

    #[test]
    fn test_save_and_load_oauth_token() {
        let conn = setup_test_db();
        let provider = "anthropic";
        let access = "sk-ant-oat01-test-access";
        let refresh = "sk-ant-ort01-test-refresh";
        let expires = Utc::now().timestamp_millis() + 3600000;

        save_oauth_token(&conn, provider, access, refresh, expires).unwrap();

        let token = load_oauth_token(&conn, provider).unwrap();
        assert_eq!(token.provider, provider);
        assert_eq!(token.access_token, access);
        assert_eq!(token.refresh_token, refresh);
        assert_eq!(token.expires_at, expires);
    }

    #[test]
    fn test_update_existing_token() {
        let conn = setup_test_db();
        let provider = "anthropic";

        save_oauth_token(&conn, provider, "old-access", "old-refresh", 1000).unwrap();
        save_oauth_token(&conn, provider, "new-access", "new-refresh", 2000).unwrap();

        let token = load_oauth_token(&conn, provider).unwrap();
        assert_eq!(token.access_token, "new-access");
        assert_eq!(token.refresh_token, "new-refresh");
        assert_eq!(token.expires_at, 2000);
    }

    #[test]
    fn test_load_missing_token() {
        let conn = setup_test_db();
        let token = load_oauth_token(&conn, "nonexistent");
        assert!(token.is_none());
    }

    #[test]
    fn test_is_token_expired() {
        let now = Utc::now().timestamp_millis();

        let expired_token = OAuthToken {
            provider: "test".to_string(),
            access_token: "test".to_string(),
            refresh_token: "test".to_string(),
            expires_at: now - 1000,
        };
        assert!(is_token_expired(&expired_token));

        let valid_token = OAuthToken {
            provider: "test".to_string(),
            access_token: "test".to_string(),
            refresh_token: "test".to_string(),
            expires_at: now + 10000,
        };
        assert!(!is_token_expired(&valid_token));
    }

    #[test]
    fn test_edge_case_exact_expiry_time() {
        let now = Utc::now().timestamp_millis();
        let token = OAuthToken {
            provider: "test".to_string(),
            access_token: "test".to_string(),
            refresh_token: "test".to_string(),
            expires_at: now,
        };
        assert!(is_token_expired(&token));
    }
}
