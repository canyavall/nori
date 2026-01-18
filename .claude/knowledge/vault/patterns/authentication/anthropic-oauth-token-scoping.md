---
tags:
  - authentication
  - oauth
  - anthropic
  - troubleshooting
  - token-scoping
  - client-id
description: >-
  OAuth token scoping issue: tokens created with Claude Code CLI are restricted to Claude Code only,
  causing 400 "only authorized for Claude Code" errors. Solution: delete old tokens and re-authenticate
  with OpenCode's client ID
category: patterns/authentication
required_knowledge: []
---
# Anthropic OAuth Token Scoping Issue

**Problem**: 400 error "This credential is only authorized for use with Claude Code and cannot be used for other API requests"

**Root cause**: OAuth tokens are scoped to the client ID used during authentication. Tokens created through Claude Code CLI are restricted.

## Symptom

```json
{
  "type": "error",
  "error": {
    "type": "invalid_request_error",
    "message": "This credential is only authorized for use with Claude Code and cannot be used for other API requests."
  }
}
```

**Even with correct headers:**
- `anthropic-beta: claude-code-20250219,oauth-2025-04-20`
- `user-agent: anthropic-cli/0.4.7`
- `x-anthropic-client-name: claude-code`
- `anthropic-dangerous-direct-browser-access: true`

Headers don't fix token scoping - the restriction is in the token itself.

## Why This Happens

**Anthropic scopes OAuth tokens to client IDs**:

1. **Claude Code CLI** (client ID: unknown, proprietary)
   - Creates tokens scoped ONLY to Claude Code
   - Cannot be used in other applications
   - Error: "only authorized for use with Claude Code"

2. **OpenCode** (client ID: `9d1c250a-e61b-44d9-88ed-5944d1962f5e`)
   - Creates unrestricted tokens
   - Works for all API requests
   - No usage restrictions

**The client ID is embedded in the token during OAuth flow.** You can't change it after creation.

## Detection

**Check logs for token source:**

```rust
// If you see this:
println!("Using OAuth access token from database");

// And get 400 "only authorized for Claude Code"
// → Token was created with Claude Code CLI
```

**Database inspection:**

```sql
SELECT provider, substr(access_token, 1, 20)
FROM oauth_tokens
WHERE provider = 'anthropic';
```

If token starts with `sk-ant-oat01-` but still fails → wrong client ID was used.

## Fix

### Step 1: Delete Old Tokens

**SQL:**
```sql
DELETE FROM oauth_tokens WHERE provider = 'anthropic';
DELETE FROM api_keys WHERE provider = 'anthropic';
```

**Bash:**
```bash
sqlite3 ~/.nori/nori.db "DELETE FROM oauth_tokens WHERE provider = 'anthropic'; DELETE FROM api_keys WHERE provider = 'anthropic';"
```

### Step 2: Re-authenticate Through Your App

**Critical**: Must use YOUR OAuth flow with OpenCode's client ID.

1. Open Nori app
2. Click Settings → OAuth Login
3. Complete authorization flow
4. New token will be created with correct client ID

**Don't**:
- ❌ Copy tokens from Claude Code CLI
- ❌ Use `claude auth` command
- ❌ Manually set tokens from environment variables

**Do**:
- ✅ Use Nori's built-in OAuth flow
- ✅ Verify client ID is `9d1c250a-e61b-44d9-88ed-5944d1962f5e`

### Step 3: Verify

**Check logs after re-auth:**

```rust
Using OAuth access token from database
🔍 API Request:
  URL: https://api.anthropic.com/v1/messages
  Auth: Bearer sk-ant-oat01-...
  Headers: [all correct]
  Body: { "model": "claude-sonnet-4-5-20250929", ... }
```

**Should get 200 response, not 400.**

## Prevention

### Architecture Decision

**Never load tokens from external sources:**

```rust
// ❌ BAD: Load from Claude Code
let claude_code_token = std::env::var("ANTHROPIC_API_KEY")?;

// ❌ BAD: Copy from another app
save_oauth_token(&conn, "anthropic", copied_token)?;

// ✅ GOOD: Only use tokens from your own OAuth flow
if let Some(token) = load_oauth_token(&conn, "anthropic") {
    // Token created by this app's OAuth flow
}
```

### User Communication

**In UI, show token source:**

```
🟢 Connected
Token created: 2025-01-04 via Nori OAuth
Expires: 2025-02-04 (30 days)
```

vs

```
🔴 Connection Error
Token may be from external source.
Please re-authenticate using Settings → OAuth Login
```

### Database Schema

**Track token origin:**

```sql
ALTER TABLE oauth_tokens ADD COLUMN created_by TEXT DEFAULT 'nori-oauth-flow';
ALTER TABLE oauth_tokens ADD COLUMN client_id TEXT;

-- When saving token:
INSERT INTO oauth_tokens (provider, access_token, created_by, client_id)
VALUES ('anthropic', ?, 'nori-oauth-flow', '9d1c250a-e61b-44d9-88ed-5944d1962f5e');
```

This helps debug "where did this token come from?" issues.

## Why Headers Don't Help

**Common misconception**: "If I add all Claude Code headers, my token will work"

**Wrong.** Headers only affect:
- Server routing (`x-anthropic-client-name`)
- Beta feature access (`anthropic-beta`)
- Rate limiting (`user-agent`)

**Token scoping is set at OAuth authorization time:**

```
OAuth Flow:
User → claude.ai/oauth/authorize?client_id=9d1c250a-... → Authorizes → Token Created
                                          ↑
                                  Client ID embedded in token
```

No header can change the client ID after token creation.

## Related Issues

**Similar error patterns:**

1. **"API key not valid"** → Wrong API key format
2. **"Authentication required"** → No token/key provided
3. **"Only authorized for Claude Code"** → Wrong client ID (this doc)

**Key difference**: #3 requires re-authentication, #1-2 are configuration issues.

## Testing

**Verify your OAuth implementation:**

```rust
#[test]
fn test_oauth_uses_correct_client_id() {
    let auth_url = generate_auth_url("console");

    // Must include OpenCode's client ID
    assert!(auth_url.contains("client_id=9d1c250a-e61b-44d9-88ed-5944d1962f5e"));

    // Must NOT include Claude Code's endpoints
    assert!(!auth_url.contains("claude.code"));
}
```

## References

- **Client ID**: Reverse-engineered from OpenCode
- **Token Format**: `sk-ant-oat01-` = OAuth access token, `sk-ant-api03-` = API key
- **Current Implementation**: `app/src/server/auth/oauth.ts` (Electron/Node.js)
