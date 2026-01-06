# Implementation Plan: OAuth Authentication for Anthropic API

**Spec Location**: `.claude/epics/epic-0003/requirements.md`
**Created**: 2026-01-02
**Domain**: Infrastructure (Auth)
**Total Tasks**: 5

## Tasks

## TASK-001: Create OAuth Token Storage Schema

**Status**: DONE
**Priority**: Critical

**Description**:
Create SQLite schema for storing OAuth tokens (access token, refresh token, expiry timestamp). Add table creation in `db.rs` initialization. This provides persistent storage for OAuth credentials across app restarts.

**Goal**:
Enable persistent OAuth token storage in the existing Nori SQLite database at `~/.nori/nori.db`.

**Requirements**:

- [ ] Add `oauth_tokens` table with columns: `id`, `provider`, `access_token`, `refresh_token`, `expires_at`, `created_at`, `updated_at`
- [ ] Handle errors and edge cases (table already exists, migration from existing data)
- [ ] Follow project standards (rusqlite patterns from existing code)
- [ ] Type-safe implementation (Rust)
- [ ] NO JSDoc/comments (self-documenting code)

**Testing Requirements** (MANDATORY):

- [ ] No unit tests needed: Schema creation is tested via integration
- [ ] Run test suite: Existing DB tests should pass
- [ ] Manual verification: App creates table on first run

**Acceptance Criteria**:

- [ ] Implementation complete
- [ ] Build succeeds: `cargo build --manifest-path app/src-tauri/Cargo.toml`
- [ ] Type checker passes: `cargo check --manifest-path app/src-tauri/Cargo.toml`
- [ ] All tests pass: `cargo test --manifest-path app/src-tauri/Cargo.toml`
- [ ] Database initialized with new table
- [ ] Ready to commit

**Dependencies**:

- None

**Notes**:

- Follow existing `init_database` pattern in `db.rs`
- Use `CREATE TABLE IF NOT EXISTS` for idempotency
- Store `expires_at` as Unix timestamp (milliseconds) to match OpenCode format

---

## TASK-002: Implement OAuth Token Management Module

**Status**: DONE
**Priority**: Critical

**Description**:
Create new Rust module `src/auth/oauth.rs` with functions to save, load, and check expiry of OAuth tokens. Implement database CRUD operations using rusqlite. Add module exports in `src/auth/mod.rs`.

**Goal**:
Provide core OAuth token management logic (save/load/expiry checking) as reusable functions for Tauri commands.

**Requirements**:

- [ ] Create `src-tauri/src/auth/mod.rs` and `src-tauri/src/auth/oauth.rs`
- [ ] Implement `save_oauth_token(provider, access, refresh, expires)` function
- [ ] Implement `load_oauth_token(provider) -> Option<OAuthToken>` function
- [ ] Implement `is_token_expired(token) -> bool` function
- [ ] Handle errors and edge cases (DB connection failures, invalid data)
- [ ] Follow project standards (rusqlite patterns, error handling)
- [ ] Type-safe implementation (define `OAuthToken` struct)
- [ ] NO JSDoc/comments (self-documenting code)

**Testing Requirements** (MANDATORY):

- [ ] Write unit tests: `save_oauth_token`, `load_oauth_token`, `is_token_expired` functions
- [ ] Use in-memory SQLite for testing (`:memory:`)
- [ ] Test edge cases: missing tokens, expired tokens, malformed data
- [ ] Run test suite: `cargo test --manifest-path app/src-tauri/Cargo.toml`

**Acceptance Criteria**:

- [ ] Implementation complete
- [ ] Build succeeds: `cargo build --manifest-path app/src-tauri/Cargo.toml`
- [ ] Type checker passes: `cargo check --manifest-path app/src-tauri/Cargo.toml`
- [ ] Linter passes: `cargo clippy --manifest-path app/src-tauri/Cargo.toml`
- [ ] All tests pass: `cargo test --manifest-path app/src-tauri/Cargo.toml`
- [ ] Tokens can be saved and loaded from database
- [ ] Expiry checking works correctly
- [ ] Ready to commit

**Dependencies**:

- TASK-001: OAuth schema must exist

**Notes**:

- Use `chrono` crate for timestamp handling (already in dependencies)
- Follow Tauri state management pattern from knowledge docs
- Return `Result<T, String>` for all public functions (Tauri command pattern)

---

## TASK-003: Create Tauri Commands for OAuth Flow

**Status**: DONE
**Priority**: High

**Description**:
Create Tauri commands in `src/auth/commands.rs` to expose OAuth functionality to frontend: `set_oauth_token`, `get_oauth_token`, `has_oauth_token`, `is_token_valid`. Register commands in `lib.rs` invoke_handler. This provides the IPC bridge for frontend OAuth UI.

**Goal**:
Expose OAuth token management to React frontend via Tauri commands, enabling future OAuth UI implementation.

**Requirements**:

- [ ] Create `src-tauri/src/auth/commands.rs`
- [ ] Implement `set_oauth_token` command (saves token to DB)
- [ ] Implement `get_oauth_token` command (loads token from DB)
- [ ] Implement `has_oauth_token` command (checks if valid token exists)
- [ ] Implement `is_token_valid` command (checks expiry)
- [ ] Register commands in `src-tauri/src/lib.rs`
- [ ] Handle errors and edge cases (invalid inputs, DB failures)
- [ ] Follow project standards (Tauri command patterns)
- [ ] Type-safe implementation (use `OAuthToken` struct)
- [ ] NO JSDoc/comments (self-documenting code)

**Testing Requirements** (MANDATORY):

- [ ] Write integration tests: Call Tauri commands with test app instance
- [ ] Test happy path: save → load → check expiry workflow
- [ ] Test error cases: invalid data, missing tokens
- [ ] Run test suite: `cargo test --manifest-path app/src-tauri/Cargo.toml`

**Acceptance Criteria**:

- [ ] Implementation complete
- [ ] Build succeeds: `cargo build --manifest-path app/src-tauri/Cargo.toml`
- [ ] Type checker passes: `cargo check --manifest-path app/src-tauri/Cargo.toml`
- [ ] Linter passes: `cargo clippy --manifest-path app/src-tauri/Cargo.toml`
- [ ] All tests pass: `cargo test --manifest-path app/src-tauri/Cargo.toml`
- [ ] Commands registered and callable from frontend
- [ ] Ready to commit

**Dependencies**:

- TASK-002: OAuth module must exist

**Notes**:

- Follow existing command pattern in `claude/commands.rs`
- Use `#[tauri::command]` macro
- Return `Result<T, String>` for error handling

---

## TASK-004: Update Claude API Client to Use OAuth Tokens

**Status**: DONE
**Priority**: Critical

**Description**:
Modify `src-tauri/src/claude/commands.rs` to check for OAuth tokens before falling back to `ANTHROPIC_API_KEY` env var. Implement token expiry checking and auto-refresh placeholder. Use OAuth access token as `x-api-key` header in API requests. Maintain backward compatibility with env var for development.

**Goal**:
Integrate OAuth token authentication into existing Claude API client while preserving backward compatibility with API key approach.

**Requirements**:

- [ ] Modify `get_api_key()` function in `commands.rs`
- [ ] Check for OAuth token first (via `load_oauth_token`)
- [ ] Check token expiry, log warning if expired (auto-refresh TODO for future)
- [ ] Fall back to `ANTHROPIC_API_KEY` env var if no OAuth token
- [ ] Use OAuth access token as API key in API requests
- [ ] Handle errors and edge cases (DB failures, expired tokens)
- [ ] Follow project standards (existing patterns in `commands.rs`)
- [ ] Type-safe implementation
- [ ] NO JSDoc/comments (self-documenting code)

**Testing Requirements** (MANDATORY):

- [ ] Write unit tests: Test token preference order (OAuth > env var)
- [ ] Write unit tests: Test expiry detection
- [ ] Write integration tests: Mock OAuth token, verify API call uses it
- [ ] Update existing tests: Ensure env var fallback still works
- [ ] Run test suite: `cargo test --manifest-path app/src-tauri/Cargo.toml`
- [ ] Manual verification: Test with real OAuth token from OpenCode

**Acceptance Criteria**:

- [ ] Implementation complete
- [ ] Build succeeds: `cargo build --manifest-path app/src-tauri/Cargo.toml`
- [ ] Type checker passes: `cargo check --manifest-path app/src-tauri/Cargo.toml`
- [ ] Linter passes: `cargo clippy --manifest-path app/src-tauri/Cargo.toml`
- [ ] All tests pass: `cargo test --manifest-path app/src-tauri/Cargo.toml`
- [ ] OAuth tokens are used when available
- [ ] Env var fallback works for development
- [ ] Expired token warning is logged
- [ ] API calls succeed with OAuth access token
- [ ] Ready to commit

**Dependencies**:

- TASK-002: OAuth module must exist
- TASK-003: OAuth commands must exist

**Notes**:

- OAuth access tokens (`sk-ant-oat01-...`) work exactly like API keys
- Use existing `reqwest` client, just change the key source
- Add TODO comment for auto-refresh implementation (requires Anthropic OAuth endpoint documentation)
- Verify with OpenCode's OAuth token from `~/.local/share/opencode/auth.json`

---

## TASK-005: Add Token Refresh Placeholder and Documentation

**Status**: DONE
**Priority**: Medium

**Description**:
Add placeholder function for OAuth token refresh in `oauth.rs` with TODO comments explaining what's needed. Document the OAuth flow in code comments. Create README in `src/auth/` explaining the OAuth implementation and future work needed for full OAuth flow (authorization URL, callback server).

**Goal**:
Document current OAuth implementation limitations and provide clear path for future full OAuth flow implementation.

**Requirements**:

- [ ] Add `refresh_oauth_token()` placeholder function in `oauth.rs`
- [ ] Add TODO comments explaining Anthropic OAuth endpoint requirements
- [ ] Create `src-tauri/src/auth/README.md` documenting:
  - Current implementation (token storage, usage)
  - Missing pieces (OAuth authorization flow, callback server, refresh endpoint)
  - How to manually copy tokens from OpenCode for testing
  - Future work roadmap
- [ ] Handle errors and edge cases (not applicable - documentation only)
- [ ] Follow project standards (clear, concise documentation)
- [ ] Type-safe implementation (placeholder function signature)
- [ ] NO JSDoc/comments (except this doc task)

**Testing Requirements** (MANDATORY):

- [ ] No new tests needed: Documentation and placeholder only
- [ ] Run test suite: Verify existing tests still pass
- [ ] Manual verification: README is clear and accurate

**Acceptance Criteria**:

- [ ] Implementation complete
- [ ] Build succeeds: `cargo build --manifest-path app/src-tauri/Cargo.toml`
- [ ] Type checker passes: `cargo check --manifest-path app/src-tauri/Cargo.toml`
- [ ] All tests pass: `cargo test --manifest-path app/src-tauri/Cargo.toml`
- [ ] Documentation clearly explains current state and future work
- [ ] Placeholder function compiles but returns error (not implemented)
- [ ] Ready to commit

**Dependencies**:

- TASK-004: OAuth integration must be complete

**Notes**:

- Reference OpenCode's OAuth flow in `provider/auth.ts` and `cli/cmd/auth.ts`
- Explain that Anthropic OAuth endpoint documentation is needed for full implementation
- Document how to test with OpenCode's tokens as temporary solution

---

## Suggested Commit Message

```
[EPIC-0003] Implement OAuth authentication for Anthropic API

- Add SQLite schema for OAuth token storage
- Implement OAuth token management (save/load/expiry check)
- Create Tauri commands for OAuth flow
- Update Claude API client to prefer OAuth over API key
- Add token refresh placeholder and documentation
- Maintain backward compatibility with ANTHROPIC_API_KEY env var

This implements OAuth token authentication matching OpenCode's pattern
while preserving existing API key workflow for development.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```
