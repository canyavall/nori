use super::oauth::{is_token_expired, load_oauth_token, save_oauth_token, OAuthToken};
use rusqlite::Connection;
use std::path::PathBuf;

fn get_db_path() -> Result<PathBuf, String> {
    let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;
    Ok(home_dir.join(".nori").join("nori.db"))
}

fn open_db_connection() -> Result<Connection, String> {
    let db_path = get_db_path()?;
    Connection::open(db_path).map_err(|e| format!("Failed to open database: {}", e))
}

#[tauri::command]
pub async fn set_oauth_token(
    provider: String,
    access_token: String,
    refresh_token: String,
    expires_at: i64,
) -> Result<(), String> {
    let conn = open_db_connection()?;
    save_oauth_token(&conn, &provider, &access_token, &refresh_token, expires_at)
        .map_err(|e| format!("Failed to save OAuth token: {}", e))
}

#[tauri::command]
pub async fn get_oauth_token(provider: String) -> Result<Option<OAuthToken>, String> {
    let conn = open_db_connection()?;
    Ok(load_oauth_token(&conn, &provider))
}

#[tauri::command]
pub async fn has_oauth_token(provider: String) -> Result<bool, String> {
    let conn = open_db_connection()?;
    match load_oauth_token(&conn, &provider) {
        Some(token) => Ok(!is_token_expired(&token)),
        None => Ok(false),
    }
}

#[tauri::command]
pub async fn is_token_valid(provider: String) -> Result<bool, String> {
    let conn = open_db_connection()?;
    match load_oauth_token(&conn, &provider) {
        Some(token) => Ok(!is_token_expired(&token)),
        None => Err(format!("No token found for provider: {}", provider)),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_db_path() {
        let path = get_db_path();
        assert!(path.is_ok());
        let db_path = path.unwrap();
        assert!(db_path.to_string_lossy().contains(".nori"));
        assert!(db_path.ends_with("nori.db"));
    }
}
