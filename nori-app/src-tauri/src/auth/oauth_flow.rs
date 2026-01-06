use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use rand::Rng;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::error::Error;

const CLIENT_ID: &str = "9d1c250a-e61b-44d9-88ed-5944d1962f5e";

#[derive(Debug, Serialize, Deserialize)]
pub struct PKCEPair {
    pub verifier: String,
    pub challenge: String,
}

/// Generate PKCE code verifier and challenge
pub fn generate_pkce() -> PKCEPair {
    // Generate 32 random bytes
    let mut rng = rand::thread_rng();
    let random_bytes: Vec<u8> = (0..32).map(|_| rng.gen()).collect();

    // Base64-URL encode the verifier
    let verifier = URL_SAFE_NO_PAD.encode(&random_bytes);

    // Create SHA256 hash of verifier
    let mut hasher = Sha256::new();
    hasher.update(verifier.as_bytes());
    let hash = hasher.finalize();

    // Base64-URL encode the challenge
    let challenge = URL_SAFE_NO_PAD.encode(&hash);

    PKCEPair {
        verifier,
        challenge,
    }
}

#[derive(Debug, Serialize)]
pub struct AuthorizationUrl {
    pub url: String,
    pub verifier: String,
}

/// Generate OAuth authorization URL for Anthropic
/// Uses OpenCode's approach: claude.ai authorization page with console.anthropic.com callback
pub fn generate_auth_url(_mode: &str) -> AuthorizationUrl {
    println!("🔑 Generating OAuth URL (OpenCode approach)");

    let pkce = generate_pkce();

    // CRITICAL: OpenCode sets state = verifier (not a separate random value)
    // This may be required for Anthropic to allow unrestricted token usage
    let state = pkce.verifier.clone();

    // OpenCode's hybrid approach:
    // - Authorization page: claude.ai (Max page)
    // - Redirect URI: console.anthropic.com/oauth/code/callback
    // - Scope: org:create_api_key for API key creation
    // - code=true parameter
    // - state = verifier (CRITICAL for unrestricted tokens!)
    // CRITICAL: Encode colons to %3A, keep + for spaces between scopes
    let scope = "org%3Acreate_api_key+user%3Aprofile+user%3Ainference";
    let url = format!(
        "https://claude.ai/oauth/authorize?code=true&client_id={}&response_type=code&redirect_uri={}&scope={}&code_challenge={}&code_challenge_method=S256&state={}",
        CLIENT_ID,
        urlencoding::encode("https://console.anthropic.com/oauth/code/callback"),
        scope,
        pkce.challenge,
        state
    );

    AuthorizationUrl {
        url,
        verifier: pkce.verifier,
    }
}

#[derive(Debug, Deserialize)]
pub struct TokenResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: u64,
}

#[derive(Debug, Serialize)]
pub struct OAuthTokens {
    pub access: String,
    pub refresh: String,
    pub expires: i64,
}

/// Exchange authorization code for access token
pub async fn exchange_code(
    code: &str,
    verifier: &str,
) -> Result<OAuthTokens, Box<dyn Error>> {
    let client = reqwest::Client::new();

    // Split code on # to extract state (Anthropic format: code#state)
    let parts: Vec<&str> = code.trim().split('#').collect();
    let code_part = parts.get(0).unwrap_or(&"");
    let state_part = parts.get(1).unwrap_or(&"");

    // Match OpenCode's exact format - state as separate parameter
    let body = serde_json::json!({
        "code": code_part,
        "state": state_part,
        "grant_type": "authorization_code",
        "client_id": CLIENT_ID,
        "redirect_uri": "https://console.anthropic.com/oauth/code/callback",
        "code_verifier": verifier,
    });

    println!("🔍 Token exchange request:");
    println!("  URL: https://console.anthropic.com/v1/oauth/token");
    println!("  Content-Type: application/json");
    println!("  Body: {}", serde_json::to_string(&body).unwrap());

    let response = client
        .post("https://console.anthropic.com/v1/oauth/token")
        .json(&body)
        .send()
        .await?;

    println!("📥 Response status: {}", response.status());

    if !response.status().is_success() {
        let status = response.status();
        let error_body = response.text().await.unwrap_or_else(|_| "Unable to read error body".to_string());
        return Err(format!("Token exchange failed ({}): {}", status, error_body).into());
    }

    let token_resp: TokenResponse = response.json().await?;

    Ok(OAuthTokens {
        access: token_resp.access_token,
        refresh: token_resp.refresh_token,
        expires: chrono::Utc::now().timestamp() + token_resp.expires_in as i64,
    })
}

#[derive(Debug, Deserialize)]
pub struct ApiKeyResponse {
    pub raw_key: String,
}

/// Create API key from OAuth access token
pub async fn create_api_key(access_token: &str) -> Result<String, Box<dyn Error>> {
    println!("Creating API key with access token (first 20 chars): {}", &access_token.chars().take(20).collect::<String>());

    let client = reqwest::Client::new();
    let response = client
        .post("https://api.anthropic.com/api/oauth/claude_cli/create_api_key")
        .header("Authorization", format!("Bearer {}", access_token))
        .send()
        .await?;

    println!("API key creation response status: {}", response.status());

    if !response.status().is_success() {
        let status = response.status();
        let error_body = response.text().await.unwrap_or_else(|_| "Unable to read error body".to_string());
        return Err(format!("API key creation failed ({}): {}", status, error_body).into());
    }

    let key_resp: ApiKeyResponse = response.json().await?;

    Ok(key_resp.raw_key)
}
