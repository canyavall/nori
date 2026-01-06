# OAuth Authentication for Anthropic API

## Ticket Quality Assessment

**Domain Detected**: Infrastructure (Auth)
**Business Context**: ✅ Complete (replace simple API key with OAuth)
**Technical Clarity**: ⚠️ Partial (need to clarify OAuth provider and integration points)

**Missing Information**:
- OAuth provider details (Anthropic's OAuth endpoint/docs)
- Token storage mechanism (filesystem, database, memory)
- Token refresh strategy (automatic vs manual)
- UI requirements (if any for OAuth flow)

## Scope

### In-Scope

- **Apps**: `app/` (Tauri desktop application)
- **Modules**:
  - `app/src-tauri/src/claude/` (API client)
  - Authentication storage mechanism
  - Token refresh logic
- **Features**:
  - OAuth access token handling
  - OAuth refresh token handling
  - Token expiry detection and automatic refresh
  - Secure token storage

### Out-of-Scope

- OAuth provider selection UI (assume Anthropic only)
- Multiple provider support (focus on Anthropic)
- Token encryption (will use OS-level security)
- Web-based OAuth callback server (desktop app flow)

### Verification Needed

- [ ] Anthropic OAuth endpoint and flow documentation
- [ ] Desktop OAuth flow pattern (device code flow vs browser callback)
- [ ] Token storage security requirements

## What

Replace the current simple API key authentication (`ANTHROPIC_API_KEY` env var) with OAuth 2.0 authentication matching OpenCode's implementation. This includes:
- Storing OAuth access and refresh tokens
- Detecting token expiry and automatically refreshing
- Persisting tokens between app restarts

## Why

API keys are static and require manual rotation. OAuth tokens are time-limited and auto-refreshing, providing better security. OpenCode already implements this successfully, and Nori should match this architecture.

## Acceptance Criteria

- [ ] OAuth access tokens are used for API calls instead of static API keys
- [ ] Refresh tokens automatically renew expired access tokens
- [ ] Tokens persist between app restarts (secure storage)
- [ ] Token expiry is detected and handled gracefully
- [ ] Fallback to env var `ANTHROPIC_API_KEY` still works for development
- [ ] No breaking changes to existing API call interface

## Notes

**Critical Constraints**:
- Must maintain backward compatibility with `ANTHROPIC_API_KEY` env var for dev/testing
- Token storage must be secure (use OS keychain/credential manager if possible)
- OpenCode reference: `~/.local/share/opencode/auth.json` with `type: "oauth"`, `access`, `refresh`, `expires` fields
