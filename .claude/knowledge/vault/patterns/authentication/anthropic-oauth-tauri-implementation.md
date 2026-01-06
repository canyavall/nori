---
tags:
  - authentication
  - oauth
  - anthropic
  - tauri
  - rust
  - pkce
  - implementation
description: >-
  OAuth 2.0 with PKCE implementation for Anthropic API in Tauri applications: reverse-engineered
  hybrid flow, authorization code format (code#state split), JSON token exchange, account type
  handling (Organization vs Max/Pro), and common pitfalls
category: patterns/authentication
required_knowledge: []
---
# Anthropic OAuth Implementation (Tauri/Rust)

OAuth 2.0 with PKCE implementation for Anthropic API in Tauri (Rust + React) desktop applications.

**Source**: Reverse-engineered from OpenCode implementation (`opencode-anthropic-auth` plugin).

## Core Architecture

### Hybrid Authorization Flow

Anthropic uses a non-standard hybrid approach:

- **Authorization page**: `https://claude.ai/oauth/authorize` (Claude Max/Pro login page)
- **Redirect URI**: `https://console.anthropic.com/oauth/code/callback` (Console callback)
- **Token endpoint**: `https://console.anthropic.com/v1/oauth/token`
- **API key endpoint**: `https://api.anthropic.com/api/oauth/claude_cli/create_api_key`

**Critical**: Don't separate "Max mode" vs "Console mode" - always use this hybrid approach.

### Client ID

```
9d1c250a-e61b-44d9-88ed-5944d1962f5e
```

This is OpenCode's public client ID, works for all Anthropic OAuth implementations.

**CRITICAL**: Tokens created with different client IDs are scoped to those clients only. Claude Code tokens show error:
```
"This credential is only authorized for use with Claude Code and cannot be used for other API requests."
```

You MUST use OpenCode's client ID to create unrestricted tokens. Don't authenticate through Claude Code's OAuth - use your own implementation with this client ID.

## Authorization URL Construction

### PKCE Generation

```rust
// 32 random bytes for verifier
let random_bytes: Vec<u8> = (0..32).map(|_| rng.gen()).collect();
let verifier = URL_SAFE_NO_PAD.encode(&random_bytes);

// SHA256 hash for challenge
let mut hasher = Sha256::new();
hasher.update(verifier.as_bytes());
let hash = hasher.finalize();
let challenge = URL_SAFE_NO_PAD.encode(&hash);
```

**Critical**: Use `base64::engine::general_purpose::URL_SAFE_NO_PAD` (no padding).

### State Parameter

```rust
// 64 bytes (matches OpenCode exactly)
let state_bytes: Vec<u8> = (0..64).map(|_| rng.gen()).collect();
let state = URL_SAFE_NO_PAD.encode(&state_bytes);
```

**Critical**: Must be 64 bytes, not 16. Anthropic validates state size.

### Scope Encoding

```rust
// CRITICAL: Encode colons as %3A, use + for spaces between scopes
let scope = "org%3Acreate_api_key+user%3Aprofile+user%3Ainference";
```

**Rules**:
- `:` → `%3A` (URL-encoded colon)
- Space between scopes → `+` (not `%20`)
- Don't double-encode

**Wrong**: `org:create_api_key user:profile` or `org%253Acreate_api_key`
**Right**: `org%3Acreate_api_key+user%3Aprofile+user%3Ainference`

### Complete URL Format

```rust
format!(
    "https://claude.ai/oauth/authorize?code=true&client_id={}&response_type=code&redirect_uri={}&scope={}&code_challenge={}&code_challenge_method=S256&state={}",
    CLIENT_ID,
    urlencoding::encode("https://console.anthropic.com/oauth/code/callback"),
    scope,  // Already encoded
    pkce.challenge,
    state
)
```

**Critical**: `code=true` parameter required.

## Authorization Code Format

### The `code#state` Split

Anthropic returns authorization code in format: `{code}#{state}`

Example:
```
abc123xyz789#def456uvw012
```

**Critical**: Both parts must be sent separately in token exchange.

```rust
let parts: Vec<&str> = code.trim().split('#').collect();
let code_part = parts.get(0).unwrap_or(&"");
let state_part = parts.get(1).unwrap_or(&"");
```

**Don't**:
- Strip the `#` and everything after
- Send the full string as `code`
- URL-encode the `#` character

**Do**:
- Split on `#`
- Send both parts as separate JSON parameters

## Token Exchange

### Request Format

**Critical**: Uses JSON, NOT `application/x-www-form-urlencoded` (despite OAuth 2.0 spec).

```rust
let body = serde_json::json!({
    "code": code_part,              // Before the #
    "state": state_part,            // After the #
    "grant_type": "authorization_code",
    "client_id": CLIENT_ID,
    "redirect_uri": "https://console.anthropic.com/oauth/code/callback",
    "code_verifier": verifier,
});

client.post("https://console.anthropic.com/v1/oauth/token")
    .json(&body)  // NOT .form()
    .send()
```

**Why JSON fails in form-urlencoded**:
- Tried `.form()` method → compilation error (method not found on RequestBuilder)
- Tried manual form encoding → "Invalid request format" error
- Anthropic expects `Content-Type: application/json`

**Common errors**:
- Using `.form()` instead of `.json()` → 400 Bad Request
- Missing `state` parameter → 400 Bad Request
- Sending `code` with `#state` still attached → 400 Bad Request

### Response

```rust
#[derive(Debug, Deserialize)]
pub struct TokenResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: u64,  // Seconds
}
```

## Account Type Handling

### Organization vs Max/Pro Accounts

**Organization/Console accounts**:
- Have `org:create_api_key` scope granted
- Can create API keys via `POST /api/oauth/claude_cli/create_api_key`
- Should use API keys for authentication

**Claude Max/Pro accounts**:
- `org:create_api_key` scope NOT granted (403 Forbidden)
- Must use OAuth access token directly for API calls
- Cannot create API keys

### Fallback Pattern

```rust
match oauth_flow::create_api_key(&tokens.access).await {
    Ok(api_key) => {
        // Organization account - save API key
        save_to_db("anthropic", &api_key)?;
        Ok(format!("✅ API key created!\nKey: {}...", &api_key[..20]))
    }
    Err(_) => {
        // Max/Pro account - save OAuth token
        save_to_db("anthropic", &tokens.access)?;
        Ok(format!("✅ OAuth token saved!\nToken: {}...", &tokens.access[..20]))
    }
}
```

**Critical**: Don't ask user for account type - try API key creation, fall back on failure.

### API Key Creation Request

```rust
client.post("https://api.anthropic.com/api/oauth/claude_cli/create_api_key")
    .header("Authorization", format!("Bearer {}", access_token))
    .send()
```

**Response for organization accounts**:
```json
{
  "raw_key": "sk-ant-api03-..."
}
```

**Response for Max accounts** (403):
```json
{
  "type": "error",
  "error": {
    "type": "permission_error",
    "message": "OAuth token does not meet scope requirement org:create_api_key"
  }
}
```

## Tauri Implementation

### State Management

```rust
pub struct OAuthState {
    pub verifier: Mutex<Option<String>>,
}
```

**Pattern**:
1. Generate PKCE in `start_oauth_flow` command
2. Store verifier in Tauri state
3. Retrieve verifier in `complete_oauth_flow` command
4. Clear after use with `.take()`

### Command Signatures

```rust
#[tauri::command]
pub fn start_oauth_flow(
    mode: String,  // Unused, kept for API compatibility
    state: State<'_, OAuthState>,
) -> Result<String, String>

#[tauri::command]
pub async fn complete_oauth_flow(
    code: String,              // Full code including #state
    use_api_key: bool,        // Unused, auto-detected
    state: State<'_, OAuthState>,
) -> Result<String, String>
```

**Frontend invocation**:
```typescript
const url = await invoke<string>('start_oauth_flow', { mode: 'console' });
window.open(url, '_blank');

// User authorizes, pastes code
const result = await invoke<string>('complete_oauth_flow', {
  code: code.trim(),  // Keep # and everything after
  useApiKey: true,    // Ignored by backend
});
```

## Common Pitfalls

### ❌ Don't Do This

1. **Separate Max vs Console modes**
   - Wrong: Different auth URLs for different accounts
   - Right: Always use hybrid approach

2. **Strip `#` from authorization code**
   - Wrong: `code.replace('#', '')`
   - Right: Split and send both parts

3. **Use form-urlencoded for token exchange**
   - Wrong: `.form()` or manual `key=value&key=value`
   - Right: `.json()` with separate `state` parameter

4. **Small state parameter (16 bytes)**
   - Wrong: 16 random bytes
   - Right: 64 random bytes (matches OpenCode)

5. **Unencoded colons in scope**
   - Wrong: `org:create_api_key`
   - Right: `org%3Acreate_api_key`

6. **Ask user for account type**
   - Wrong: "Do you have organization or Max account?"
   - Right: Try API key creation, fall back automatically

### ✅ Do This

1. Always use 64-byte state (not 16)
2. Encode scope colons as `%3A`
3. Split authorization code on `#`, send both parts
4. Use JSON format for token exchange
5. Implement automatic fallback for Max accounts
6. Store verifier securely in Tauri state with `.take()` pattern

## Debugging Tips

### Enable verbose logging

```rust
println!("🔍 Token exchange request:");
println!("  Body: {}", serde_json::to_string(&body).unwrap());
println!("📥 Response status: {}", response.status());
```

### Check authorization code format

```rust
println!("Authorization code (first 20 chars): {}",
    &code.chars().take(20).collect::<String>());
println!("Contains #: {}", code.contains('#'));
```

### Verify scope encoding

Compare your URL with OpenCode's URL directly - they should be byte-identical except for state/challenge values.

### Test API key creation separately

```bash
curl -X POST https://api.anthropic.com/api/oauth/claude_cli/create_api_key \
  -H "Authorization: Bearer <access_token>"
```

If 403 → Max account (expected)
If 200 → Organization account

## References

- **OpenCode source**: `opencode-anthropic-auth` plugin on GitHub
- **OAuth 2.0 with PKCE**: RFC 7636
- **Anthropic API**: No official OAuth documentation (reverse-engineered)

**Key insight**: Anthropic's OAuth implementation deviates from standard OAuth 2.0:
- Non-standard authorization code format (`code#state`)
- JSON instead of form-urlencoded for token exchange
- Hybrid authorization flow (Max page + Console callback)
- Account-type-specific scope support

Follow OpenCode's implementation exactly - it's battle-tested with these quirks.
