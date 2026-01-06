use super::oauth_flow;
use rusqlite::Connection;
use std::sync::Mutex;
use tauri::State;

/// Storage for PKCE verifier during OAuth flow
pub struct OAuthState {
    pub verifier: Mutex<Option<String>>,
}

impl OAuthState {
    pub fn new() -> Self {
        Self {
            verifier: Mutex::new(None),
        }
    }
}

/// Generate OAuth authorization URL
#[tauri::command]
pub fn start_oauth_flow(
    mode: String,
    state: State<'_, OAuthState>,
) -> Result<String, String> {
    let auth_url = oauth_flow::generate_auth_url(&mode);

    // Store verifier for later use
    *state.verifier.lock().unwrap() = Some(auth_url.verifier);

    Ok(auth_url.url)
}

/// Clear all stored OAuth tokens and API keys for a provider
#[tauri::command]
pub fn clear_auth_tokens(provider: String) -> Result<String, String> {
    let db_path = dirs::home_dir()
        .ok_or("Could not find home directory")?
        .join(".nori")
        .join("nori.db");

    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;

    // Delete OAuth tokens
    conn.execute(
        "DELETE FROM oauth_tokens WHERE provider = ?1",
        [&provider],
    )
    .map_err(|e| format!("Failed to delete OAuth tokens: {}", e))?;

    // Delete API keys
    conn.execute(
        "DELETE FROM api_keys WHERE provider = ?1",
        [&provider],
    )
    .map_err(|e| format!("Failed to delete API keys: {}", e))?;

    println!("Cleared all auth tokens for provider: {}", provider);
    Ok(format!("All {} authentication cleared. Please re-authenticate.", provider))
}

/// Complete OAuth flow by exchanging code for API key
/// Using OpenCode's approach: always creates an API key with org:create_api_key scope
#[tauri::command]
pub async fn complete_oauth_flow(
    code: String,
    use_api_key: bool,
    state: State<'_, OAuthState>,
) -> Result<String, String> {
    println!("Starting OAuth completion (OpenCode approach - always creates API key)");
    println!("Authorization code received (first 20 chars): {}", &code.chars().take(20).collect::<String>());

    // Retrieve stored verifier
    let verifier = state
        .verifier
        .lock()
        .unwrap()
        .take()
        .ok_or("OAuth flow not started. Call start_oauth_flow first.")?;

    println!("Verifier retrieved, exchanging code for tokens...");

    // Exchange code for tokens (will split on # internally)
    let tokens = oauth_flow::exchange_code(&code, &verifier)
        .await
        .map_err(|e| {
            eprintln!("Token exchange error: {}", e);
            format!("Failed to exchange code: {}", e)
        })?;

    println!("Token exchange successful");

    // IMPORTANT: Do NOT use claude_cli/create_api_key endpoint
    // That endpoint creates tokens restricted to "Claude Code only"
    // Instead, use OAuth access token directly
    println!("Using OAuth token directly (avoids Claude Code restriction)");

    let db_path = dirs::home_dir()
        .ok_or("Could not find home directory")?
        .join(".nori")
        .join("nori.db");

    if let Ok(conn) = Connection::open(&db_path) {
        // tokens.expires is Unix timestamp in seconds, convert to milliseconds
        let expires_at_ms = tokens.expires * 1000;

        // Save as OAuth token (with refresh token and expiry)
        super::oauth::save_oauth_token(
            &conn,
            "anthropic",
            &tokens.access,
            &tokens.refresh,
            expires_at_ms,
        )
        .map_err(|e| format!("Failed to save OAuth token: {}", e))?;
    }

    let now = chrono::Utc::now().timestamp();
    let expires_in_seconds = tokens.expires - now;
    println!("OAuth token saved with expiry");
    Ok(format!("✅ OAuth token saved!\nToken: {}...\nExpires in: {} seconds", &tokens.access[..20], expires_in_seconds))
}
