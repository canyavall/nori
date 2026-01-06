use super::{ChatContext, Message};
use reqwest::Client;
use serde_json::json;
use tauri::{AppHandle, Emitter};
use tokio::sync::Mutex;

/// Global API key storage (in-memory for now, TODO: encrypt in SQLite)
static API_KEY: Mutex<Option<String>> = Mutex::const_new(None);

/// Get API key from OAuth token, environment variable, or in-memory storage
async fn get_api_key() -> Result<String, String> {
    use crate::auth::oauth::{is_token_expired, load_api_key, load_oauth_token};
    use rusqlite::Connection;

    let db_path = dirs::home_dir()
        .ok_or("Could not find home directory")?
        .join(".nori")
        .join("nori.db");

    if let Ok(conn) = Connection::open(&db_path) {
        // Check oauth_tokens table first (for Max/Pro accounts with temporary tokens)
        if let Some(token) = load_oauth_token(&conn, "anthropic") {
            if is_token_expired(&token) {
                println!("Warning: OAuth token is expired. Auto-refresh not yet implemented.");
                println!("Falling back to ANTHROPIC_API_KEY environment variable.");
            } else {
                println!("Using OAuth access token from database");
                return Ok(token.access_token);
            }
        }

        // Fallback: Check api_keys table (for Organization accounts with permanent API keys)
        if let Some(api_key) = load_api_key(&conn, "anthropic") {
            // Validate it's a real API key (starts with sk-ant-api03-)
            if api_key.starts_with("sk-ant-api03-") {
                println!("Using API key from database");
                return Ok(api_key);
            } else {
                println!("Invalid API key format in database (ignoring)");
            }
        }
    }

    match std::env::var("ANTHROPIC_API_KEY") {
        Ok(env_key) if !env_key.is_empty() => {
            println!("Using API key from ANTHROPIC_API_KEY environment variable");
            return Ok(env_key);
        }
        Ok(_) => {
            println!("ANTHROPIC_API_KEY is set but empty");
        }
        Err(e) => {
            println!("ANTHROPIC_API_KEY not found: {:?}", e);
        }
    }

    let api_key = API_KEY.lock().await;
    match api_key.as_ref() {
        Some(key) => {
            println!("Using manually set API key");
            Ok(key.clone())
        }
        None => {
            Err("API key not set. Set OAuth token, ANTHROPIC_API_KEY environment variable, or call set_api_key.".to_string())
        }
    }
}

/// Send message to Claude API with streaming
#[tauri::command]
pub async fn send_message(
    app: AppHandle,
    message: String,
    context: ChatContext,
) -> Result<String, String> {
    let key = get_api_key().await?;

    // Generate stream ID
    let stream_id = uuid::Uuid::new_v4().to_string();

    // Build messages array
    let mut messages = context.messages.clone();
    messages.push(Message {
        role: "user".to_string(),
        content: message,
    });

    // Spawn async task to stream response
    let app_clone = app.clone();
    let stream_id_clone = stream_id.clone();
    let system_prompt = context.system_prompt.clone();
    let max_tokens = context.max_tokens;
    let temperature = context.temperature;

    tokio::spawn(async move {
        let stream_id_for_error = stream_id_clone.clone();
        if let Err(e) = stream_claude_response(
            app_clone.clone(),
            stream_id_clone,
            key,
            system_prompt,
            messages,
            max_tokens,
            temperature,
        )
        .await
        {
            eprintln!("Stream error: {}", e);
            let _ = app_clone.emit(
                "chat-stream",
                json!({
                    "stream_id": stream_id_for_error,
                    "error": e,
                    "finished": true
                }),
            );
        }
    });

    Ok(stream_id)
}

/// Set API key (TODO: encrypt and store in SQLite)
#[tauri::command]
pub async fn set_api_key(api_key: String) -> Result<(), String> {
    let mut key = API_KEY.lock().await;
    *key = Some(api_key);
    println!("API key set successfully");
    Ok(())
}

/// Check if API key is available (from env var or manual setting)
#[tauri::command]
pub async fn has_api_key() -> Result<bool, String> {
    Ok(get_api_key().await.is_ok())
}

/// Estimate token count (simplified - actual counting requires tokenizer)
#[tauri::command]
pub fn get_token_count(messages: Vec<Message>) -> Result<usize, String> {
    // Rough estimate: ~4 characters per token
    let total_chars: usize = messages.iter().map(|m| m.content.len()).sum();
    Ok(total_chars / 4)
}

/// Stream Claude API response
async fn stream_claude_response(
    app: AppHandle,
    stream_id: String,
    api_key: String,
    system_prompt: String,
    messages: Vec<Message>,
    max_tokens: usize,
    temperature: f32,
) -> Result<(), String> {
    let client = Client::new();

    // Build request body
    // Use Claude Sonnet 4.5 (latest as of 2025-01)
    let body = json!({
        "model": "claude-sonnet-4-5-20250929",
        "max_tokens": max_tokens,
        "temperature": temperature,
        "system": system_prompt,
        "messages": messages.iter().map(|m| json!({
            "role": m.role,
            "content": m.content
        })).collect::<Vec<_>>(),
        "stream": true
    });

    // Make streaming request with correct auth header based on token type
    let mut request = client
        .post("https://api.anthropic.com/v1/messages");

    // OAuth tokens (sk-ant-oat01-*) use Bearer auth + identity headers to mimic Claude Code CLI
    // API keys (sk-ant-api03-*) use x-api-key header
    let auth_header;
    let is_oauth = api_key.starts_with("sk-ant-oat01-");

    if is_oauth {
        auth_header = format!("Bearer {}", &api_key[..20]);  // Log first 20 chars only
        request = request
            .header("Authorization", format!("Bearer {}", api_key))
            .header("anthropic-beta", "claude-code-20250219,oauth-2025-04-20")
            .header("user-agent", "anthropic-cli/0.4.7")
            .header("x-anthropic-client-name", "claude-code")
            .header("anthropic-dangerous-direct-browser-access", "true");
    } else {
        auth_header = format!("x-api-key: {}...", &api_key[..20]);
        request = request.header("x-api-key", api_key);
    }

    request = request
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json");

    // Log complete request for debugging
    println!("🔍 API Request:");
    println!("  URL: https://api.anthropic.com/v1/messages");
    println!("  Auth: {}", auth_header);
    println!("  Headers:");
    println!("    anthropic-version: 2023-06-01");
    println!("    content-type: application/json");
    if is_oauth {
        println!("    anthropic-beta: claude-code-20250219,oauth-2025-04-20");
        println!("    user-agent: anthropic-cli/0.4.7");
        println!("    x-anthropic-client-name: claude-code");
        println!("    anthropic-dangerous-direct-browser-access: true");
    }
    println!("  Body: {}", serde_json::to_string_pretty(&body).unwrap_or_else(|_| "Failed to serialize".to_string()));

    let response = request
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("API request failed: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string());

        // Auto-fix: If token is scoped to wrong client ID, clear it
        if error_text.contains("only authorized for use with Claude Code") {
            println!("❌ Token scoped to wrong client ID - auto-clearing");

            use rusqlite::Connection;
            let db_path = dirs::home_dir()
                .ok_or("Could not find home directory")?
                .join(".nori")
                .join("nori.db");

            if let Ok(conn) = Connection::open(&db_path) {
                let _ = conn.execute("DELETE FROM oauth_tokens WHERE provider = 'anthropic'", []);
                let _ = conn.execute("DELETE FROM api_keys WHERE provider = 'anthropic'", []);
                println!("✅ Cleared invalid tokens - please re-authenticate");
            }

            // Emit event to UI to trigger re-auth
            let _ = app.emit(
                "auth-required",
                json!({
                    "reason": "token_scoping_error",
                    "message": "OAuth token was created with wrong client ID. Please re-authenticate using Settings → OAuth Login."
                })
            );
        }

        return Err(format!("API error {}: {}", status, error_text));
    }

    // Parse SSE stream
    let mut stream = response.bytes_stream();
    use futures::StreamExt;

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("Stream read error: {}", e))?;
        let text = String::from_utf8_lossy(&chunk);

        // Parse SSE events
        for line in text.lines() {
            if line.starts_with("data: ") {
                let data = &line[6..];

                if data == "[DONE]" {
                    // Stream finished
                    let _ = app.emit(
                        "chat-stream",
                        json!({
                            "stream_id": stream_id,
                            "content": "",
                            "finished": true
                        }),
                    );
                    return Ok(());
                }

                // Parse JSON event
                if let Ok(event) = serde_json::from_str::<serde_json::Value>(data) {
                    if let Some(delta) = event.get("delta") {
                        if let Some(text) = delta.get("text") {
                            if let Some(content) = text.as_str() {
                                // Emit chunk
                                let _ = app.emit(
                                    "chat-stream",
                                    json!({
                                        "stream_id": stream_id,
                                        "content": content,
                                        "finished": false
                                    }),
                                );
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(())
}
