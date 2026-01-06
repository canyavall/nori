# OAuth Authentication Implementation

## Current Implementation

Nori implements OAuth token storage and usage for Anthropic API authentication, matching OpenCode's pattern.

### Features

1. **Token Storage** (`oauth.rs`)
   - SQLite database storage in `~/.nori/nori.db`
   - Stores access token, refresh token, and expiry timestamp
   - Supports multiple providers (currently only "anthropic")

2. **Token Management**
   - `save_oauth_token()` - Save/update OAuth tokens
   - `load_oauth_token()` - Retrieve stored tokens
   - `is_token_expired()` - Check if token is expired
   - `refresh_oauth_token()` - Placeholder (not implemented)

3. **Tauri Commands** (`commands.rs`)
   - `set_oauth_token` - Save tokens from frontend
   - `get_oauth_token` - Retrieve tokens
   - `has_oauth_token` - Check if valid token exists
   - `is_token_valid` - Verify token not expired

4. **API Client Integration** (`claude/commands.rs`)
   - OAuth tokens preferred over API keys
   - Automatic fallback to `ANTHROPIC_API_KEY` env var
   - Warning logged if token is expired

### Authentication Priority

The Claude API client uses this priority order:

1. **OAuth access token** (if valid and not expired)
2. **ANTHROPIC_API_KEY environment variable**
3. **Manually set API key** (via `set_api_key` command)

## Missing Implementation

The following features are not yet implemented:

### 1. OAuth Authorization Flow

**Not implemented:**
- Authorization URL generation
- OAuth callback server
- Authorization code exchange for tokens

**Required:**
- Anthropic OAuth endpoint documentation
- Client ID and client secret (if required)
- Callback URL handling

**OpenCode Reference:**
```typescript
// base_repositories/opencode-fork/packages/opencode/src/provider/auth.ts
// Shows OAuth authorization flow pattern
```

### 2. Token Refresh

**Not implemented:**
- Automatic token refresh when expired
- Token refresh endpoint integration

**Required:**
- Anthropic token refresh endpoint URL
- Request format (refresh_token, client_id, etc.)
- Response format (new access_token, refresh_token, expires_in)

**Current workaround:**
- Warning logged when token is expired
- Falls back to `ANTHROPIC_API_KEY` env var

### 3. Secure Token Storage

**Current:**
- Tokens stored in plain text in SQLite

**Future:**
- OS-level keychain integration (macOS Keychain, Windows Credential Manager, Linux Secret Service)
- Token encryption at rest

## Testing with OpenCode's Tokens

### Step 1: Get OAuth Token from OpenCode

OpenCode stores OAuth tokens in `~/.local/share/opencode/auth.json`:

```json
{
  "anthropic": {
    "type": "oauth",
    "access": "sk-ant-oat01-...",
    "refresh": "sk-ant-ort01-...",
    "expires": 1767412939730
  }
}
```

### Step 2: Copy Token to Nori

Use the Tauri command to save the token:

```typescript
import { invoke } from '@tauri-apps/api/core';

await invoke('set_oauth_token', {
  provider: 'anthropic',
  accessToken: 'sk-ant-oat01-...',  // From OpenCode
  refreshToken: 'sk-ant-ort01-...',  // From OpenCode
  expiresAt: 1767412939730            // From OpenCode
});
```

### Step 3: Verify Token is Used

Check the Tauri console logs. You should see:

```
Using OAuth access token for authentication
```

Instead of:

```
Using API key from ANTHROPIC_API_KEY environment variable
```

## Future Work Roadmap

### Phase 1: Token Refresh (High Priority)

- [ ] Research Anthropic OAuth token refresh endpoint
- [ ] Implement `refresh_oauth_token()` function
- [ ] Add automatic token refresh in `get_api_key()`
- [ ] Update expired tokens in database
- [ ] Add token refresh tests

### Phase 2: Full OAuth Flow (Medium Priority)

- [ ] Research Anthropic OAuth authorization flow
- [ ] Implement OAuth callback server (local HTTP server)
- [ ] Generate authorization URL with PKCE
- [ ] Exchange authorization code for tokens
- [ ] Create UI for OAuth login flow
- [ ] Add OAuth flow tests

### Phase 3: Secure Storage (Low Priority)

- [ ] Integrate with OS keychain (Windows Credential Manager)
- [ ] Fallback to encrypted SQLite for other platforms
- [ ] Migrate existing tokens to secure storage
- [ ] Add secure storage tests

## Architecture Decisions

### Why SQLite for Token Storage?

- Consistent with existing Nori database pattern
- Simple file-based storage (no external dependencies)
- Built-in transaction support
- Easy to backup and migrate

### Why OpenCode Compatibility?

- Proven OAuth pattern in production
- Similar architecture (Tauri desktop app)
- Easier testing with existing tokens
- Future interoperability potential

### Why OAuth Over API Keys?

- Time-limited access (better security)
- Automatic refresh (no manual rotation)
- Revokable without changing credentials
- Follows industry best practices

## References

- **OpenCode OAuth Implementation**: `base_repositories/opencode-fork/packages/opencode/src/provider/auth.ts`
- **Epic Requirements**: `.claude/epics/epic-0003/requirements.md`
- **Implementation Plan**: `.claude/epics/epic-0003/plan.md`
- **Anthropic API Docs**: https://docs.anthropic.com/en/api (no OAuth docs yet)
