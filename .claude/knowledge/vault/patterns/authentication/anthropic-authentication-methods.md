# Anthropic Authentication Methods

## Overview

Anthropic provides two primary authentication methods for accessing Claude AI models: API keys and OAuth-based key generation. Understanding both approaches is critical for building third-party applications that support different user types.

## Method 1: Direct API Key (Pay-as-you-go)

### How It Works

Users create API keys via Anthropic Console and pay for usage separately from any claude.ai subscription.

**Process:**
1. Visit https://console.anthropic.com/
2. Create account with payment method
3. Purchase credits ($5 minimum)
4. Generate API key via "API Keys" section
5. Store key securely (shown only once)

**Storage:**
- Environment variable: `ANTHROPIC_API_KEY`
- Application-specific secure storage (Keychain, Credential Manager, encrypted SQLite)

**Usage:**
```rust
// Rust example
let api_key = std::env::var("ANTHROPIC_API_KEY")?;

// OR from secure storage
let api_key = get_stored_api_key().await?;

// Make API call
let response = client
    .post("https://api.anthropic.com/v1/messages")
    .header("x-api-key", api_key)
    .header("anthropic-version", "2023-06-01")
    .json(&request_body)
    .send()
    .await?;
```

**Pros:**
- Simple implementation
- No OAuth complexity
- Works for all users
- Official, supported method

**Cons:**
- Requires separate API billing
- Users need to manage keys manually
- Claude Pro/Max subscription doesn't apply

## Method 2: OAuth Key Generation (Pro/Max Subscriptions)

### How It Works

OAuth flow generates an API key from user's Claude Pro/Max subscription, allowing subscription users to access API without separate billing.

**Architecture:**
```
User clicks "Login"
  → Opens browser to claude.ai/oauth/authorize
  → User authenticates with claude.ai account
  → Grants permission (scope: org:create_api_key)
  → OAuth returns authorization code
  → Exchange code for API key
  → Store API key for future use
```

**OAuth Parameters:**
```
URL: https://claude.ai/oauth/authorize

Parameters:
  client_id: 9d1c250a-e61b-44d9-88ed-5944d1962f5e (Claude Code's client)
  scope: org:create_api_key+user:profile+user:inference
  response_type: code
  redirect_uri: https://console.anthropic.com/oauth/code/callback
  code_challenge_method: S256
  code_challenge: [PKCE challenge]
  state: [random state]
```

**Implementation Flow:**

1. **Initiate OAuth:**
```typescript
const codeVerifier = generateCodeVerifier();
const codeChallenge = await generateCodeChallenge(codeVerifier);
const state = generateRandomState();

const authUrl = `https://claude.ai/oauth/authorize?${new URLSearchParams({
  client_id: '9d1c250a-e61b-44d9-88ed-5944d1962f5e',
  scope: 'org:create_api_key+user:profile+user:inference',
  response_type: 'code',
  redirect_uri: 'https://console.anthropic.com/oauth/code/callback',
  code_challenge_method: 'S256',
  code_challenge: codeChallenge,
  state: state,
})}`;

// Open browser
window.open(authUrl);
```

2. **Handle Callback:**
```rust
// Local server listening on callback URL
// Extract authorization code from query params
let code = query_params.get("code")?;

// Exchange code for API key
let token_response = client
    .post("https://api.anthropic.com/oauth/token")
    .json(&json!({
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": "https://console.anthropic.com/oauth/code/callback",
        "code_verifier": code_verifier,
        "client_id": "9d1c250a-e61b-44d9-88ed-5944d1962f5e",
    }))
    .send()
    .await?;

let api_key = token_response.json::<TokenResponse>()?.api_key;
```

3. **Store API Key:**
```rust
// Store in SQLite with metadata
db.execute(
    "INSERT INTO api_keys (id, name, key, source, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
    params![
        uuid,
        "Pro/Max Account",
        api_key,
        "oauth",
        timestamp,
    ],
)?;
```

**Pros:**
- Uses existing claude.ai subscription
- No separate API billing
- Better UX (browser-based auth)
- Supports Pro/Max users

**Cons:**
- **Unofficial**: Reuses Claude Code's OAuth client
- **ToS gray area**: Not officially documented by Anthropic
- **Risk of breakage**: Anthropic could block this at any time
- **No support**: If it breaks, no recourse
- More complex implementation (PKCE, local callback server)

### Legal Considerations

**Important**: The OAuth method reuses Claude Code's `client_id`, which is technically using another application's credentials. This is:
- Not officially supported by Anthropic
- Potentially violates terms of service
- Could result in account suspension if detected
- Subject to change without notice

**Recommendation**: Implement both methods and clearly warn users about OAuth risks.

## Multi-Key Management

### Use Cases

Users may need multiple API keys for:
- Different projects/organizations
- Separate billing tracking
- Dev/staging/production environments
- Team member separation

### Storage Schema

```sql
CREATE TABLE api_keys (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    key TEXT NOT NULL,
    source TEXT NOT NULL, -- 'manual', 'oauth', 'env'
    organization TEXT,
    created_at INTEGER NOT NULL,
    last_used_at INTEGER,
    is_active BOOLEAN DEFAULT 1
);

CREATE TABLE key_usage (
    id INTEGER PRIMARY KEY,
    key_id TEXT NOT NULL,
    tokens_used INTEGER,
    cost_estimate REAL,
    timestamp INTEGER,
    FOREIGN KEY (key_id) REFERENCES api_keys(id)
);
```

### Key Selection UI

```typescript
interface ApiKey {
  id: string;
  name: string;
  source: 'manual' | 'oauth' | 'env';
  organization?: string;
  createdAt: number;
  lastUsedAt?: number;
  isActive: boolean;
}

// UI Component
function ApiKeySelector({ keys, onSelect, onCreateNew }: Props) {
  return (
    <Select>
      {keys.map(key => (
        <Option key={key.id}>
          {key.name} ({key.source})
          {key.lastUsedAt && ` - Last used ${formatDate(key.lastUsedAt)}`}
        </Option>
      ))}
      <Option onClick={onCreateNew}>+ Add new API key</Option>
    </Select>
  );
}
```

## Comparison: OpenCode vs Claude Code vs Nori

| Feature | Claude Code | OpenCode | Nori (Proposed) |
|---------|-------------|----------|-----------------|
| API Key (env var) | ✅ `ANTHROPIC_API_KEY` | ✅ `ANTHROPIC_API_KEY` | ✅ `ANTHROPIC_API_KEY` |
| Manual API key entry | ✅ Via `setup-token` | ✅ Via `/connect` | ✅ Via UI modal |
| OAuth (Pro/Max) | ✅ Official client | ✅ Reuses Claude Code's | ✅ Planned (reuse) |
| Multiple keys | ❌ Single key | ✅ Stored in `auth.json` | ✅ SQLite storage |
| Key switching | ❌ | ✅ Via `/connect` | ✅ Via UI dropdown |

## Security Best Practices

### 1. Never Log API Keys
```rust
// BAD
println!("API key: {}", api_key);

// GOOD
println!("API key loaded successfully");
```

### 2. Encrypt Keys at Rest
```rust
// Use platform keychain
#[cfg(target_os = "macos")]
use keyring::Entry;

let entry = Entry::new("nori", "anthropic_api_key")?;
entry.set_password(&api_key)?;

// OR encrypt in SQLite
let encrypted = encrypt_aes_256_gcm(&api_key, &master_key)?;
db.execute("INSERT INTO api_keys (key) VALUES (?)", params![encrypted])?;
```

### 3. Validate Keys Before Storage
```rust
async fn validate_api_key(key: &str) -> Result<bool> {
    // Make test API call
    let response = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", key)
        .header("anthropic-version", "2023-06-01")
        .json(&json!({
            "model": "claude-sonnet-4-20250514",
            "max_tokens": 1,
            "messages": [{"role": "user", "content": "test"}]
        }))
        .send()
        .await?;

    Ok(response.status().is_success())
}
```

### 4. Handle Key Rotation
```rust
// Allow users to update keys without app restart
async fn rotate_key(old_key_id: &str, new_key: &str) -> Result<()> {
    // Validate new key
    if !validate_api_key(new_key).await? {
        return Err("Invalid API key");
    }

    // Deactivate old
    db.execute("UPDATE api_keys SET is_active = 0 WHERE id = ?", params![old_key_id])?;

    // Store new
    let new_id = uuid::Uuid::new_v4().to_string();
    db.execute(
        "INSERT INTO api_keys (id, name, key, source, created_at, is_active) VALUES (?1, ?2, ?3, ?4, ?5, 1)",
        params![new_id, "Rotated Key", new_key, "manual", timestamp()],
    )?;

    Ok(())
}
```

## Error Handling

### Common Errors

1. **Invalid API Key**
```
Error: 401 Unauthorized
Response: {"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"}}
```

2. **Quota Exceeded**
```
Error: 429 Too Many Requests
Response: {"type":"error","error":{"type":"rate_limit_error","message":"..."}}
```

3. **OAuth Failure**
```
Error: OAuth code exchange failed
Possible causes:
- Code expired (10 minute timeout)
- Code already used
- Invalid code_verifier
- Network issues
```

### User-Friendly Error Messages

```rust
fn format_api_error(error: &ApiError) -> String {
    match error.status {
        401 => "Invalid API key. Please check your key and try again.",
        429 => "API rate limit exceeded. Please wait a few minutes.",
        500 => "Anthropic API is experiencing issues. Try again later.",
        _ => format!("API error: {}", error.message),
    }
}
```

## Implementation Checklist

- [ ] Environment variable support (`ANTHROPIC_API_KEY`)
- [ ] Manual API key entry UI
- [ ] API key validation on save
- [ ] Secure storage (SQLite encrypted or platform keychain)
- [ ] Multiple key management
- [ ] Active key selection UI
- [ ] OAuth flow (optional, with ToS warning)
- [ ] Key rotation support
- [ ] Usage tracking per key
- [ ] Error handling with user-friendly messages
- [ ] Key deletion/deactivation
- [ ] Export/import keys (encrypted)

## References

- **Anthropic Console**: https://console.anthropic.com/
- **Anthropic API Docs**: https://docs.anthropic.com/
- **OpenCode Auth Implementation**: https://github.com/sst/opencode-anthropic-auth
- **OAuth 2.0 PKCE**: https://oauth.net/2/pkce/
- **GitHub Issue (OpenCode OAuth)**: https://github.com/sst/opencode/issues/1461
- **GitHub Issue (Goose OAuth)**: https://github.com/block/goose/issues/3647

## Tags

`authentication`, `api-key`, `oauth`, `security`, `anthropic`, `claude`, `multi-key`, `key-management`
