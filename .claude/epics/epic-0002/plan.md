# Implementation Plan: Multi-Key Authentication System

**Epic ID**: epic-0002
**Created**: 2026-01-02
**Status**: ✅ COMPLETED (Deferred - replaced by simpler OAuth approach in epic-0003)

**Completion Note**: This epic planned a complex multi-key authentication system, but was superseded by epic-0003 which implemented a simpler OAuth-based approach. The simpler solution provides sufficient functionality without the complexity of multiple API keys per provider.

---

## Phase 1: Manual API Key Management (Priority: P0)

### TASK-001: Database Schema & Migration System
**Priority**: P0
**Estimated Time**: 4 hours
**Dependencies**: None

**Description:**
Set up SQLite schema for multi-key storage and create migration system for future schema changes.

**Implementation Steps:**
1. Create `app/src-tauri/src/db/migrations.rs`
2. Define migration system with version tracking
3. Create migration for `api_keys` table
4. Create migration for `key_usage` table
5. Add indexes for performance
6. Update `db/mod.rs` to run migrations on startup

**Files to Create/Modify:**
- `app/src-tauri/src/db/migrations.rs` (new)
- `app/src-tauri/src/db/mod.rs` (modify)
- `app/src-tauri/src/db/schema.sql` (new)

**Acceptance Criteria:**
- [ ] `api_keys` table created with all required columns
- [ ] `key_usage` table created with foreign key constraint
- [ ] Indexes created for `is_active` and `timestamp`
- [ ] Migration runs automatically on app startup
- [ ] Migration is idempotent (safe to run multiple times)

**SQL Schema:**
```sql
-- Migration V1: API Keys
CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    key TEXT NOT NULL,
    source TEXT NOT NULL CHECK(source IN ('manual', 'oauth', 'env')),
    organization TEXT,
    created_at INTEGER NOT NULL,
    last_used_at INTEGER,
    is_active BOOLEAN DEFAULT 0,
    metadata TEXT
);

CREATE TABLE IF NOT EXISTS key_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key_id TEXT NOT NULL,
    tokens_input INTEGER NOT NULL DEFAULT 0,
    tokens_output INTEGER NOT NULL DEFAULT 0,
    cost_estimate REAL NOT NULL DEFAULT 0.0,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (key_id) REFERENCES api_keys(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_active_key ON api_keys(is_active) WHERE is_active = 1;
CREATE INDEX IF NOT EXISTS idx_key_usage_timestamp ON key_usage(timestamp);
CREATE INDEX IF NOT EXISTS idx_key_usage_key_id ON key_usage(key_id);
```

---

### TASK-002: Backend API Key CRUD Operations
**Priority**: P0
**Estimated Time**: 6 hours
**Dependencies**: TASK-001

**Description:**
Implement Tauri commands for managing multiple API keys (list, add, delete, set active, validate).

**Implementation Steps:**
1. Create `app/src-tauri/src/api_keys/mod.rs` module
2. Implement `list_api_keys()` command
3. Implement `add_api_key(name, key)` command with validation
4. Implement `delete_api_key(key_id)` command
5. Implement `set_active_key(key_id)` command (deactivate others)
6. Implement `get_active_key()` command
7. Implement `validate_api_key(key)` command (test API call)
8. Update `get_api_key()` to check active DB key after env var
9. Register all commands in `lib.rs`

**Files to Create/Modify:**
- `app/src-tauri/src/api_keys/mod.rs` (new)
- `app/src-tauri/src/api_keys/commands.rs` (new)
- `app/src-tauri/src/api_keys/storage.rs` (new)
- `app/src-tauri/src/lib.rs` (modify - register commands)
- `app/src-tauri/src/claude/commands.rs` (modify - update `get_api_key`)

**Acceptance Criteria:**
- [ ] `list_api_keys()` returns all keys with metadata (no actual key value)
- [ ] `add_api_key()` validates format (starts with `sk-ant-`)
- [ ] `add_api_key()` tests key with API call before saving
- [ ] `delete_api_key()` removes key and cascades to usage records
- [ ] `set_active_key()` sets one key active, deactivates others
- [ ] `get_active_key()` returns active key info or None
- [ ] `get_api_key()` priority: env var → active DB key → error
- [ ] All commands handle errors gracefully with user-friendly messages

**API Types:**
```typescript
interface ApiKeyInfo {
  id: string;
  name: string;
  source: 'manual' | 'oauth' | 'env';
  organization?: string;
  createdAt: number;
  lastUsedAt?: number;
  isActive: boolean;
}
```

---

### TASK-003: Frontend TypeScript Types & Hooks
**Priority**: P0
**Estimated Time**: 3 hours
**Dependencies**: TASK-002

**Description:**
Create TypeScript types and React hooks for API key management.

**Implementation Steps:**
1. Create `app/src/types/apiKeys.ts` with type definitions
2. Create `app/src/hooks/useApiKeys.ts` hook
3. Implement `listKeys()`, `addKey()`, `deleteKey()`, `setActive()` functions
4. Implement `validateKey()` function
5. Add error handling and loading states
6. Add optimistic updates for better UX

**Files to Create/Modify:**
- `app/src/types/apiKeys.ts` (new)
- `app/src/hooks/useApiKeys.ts` (new)

**Acceptance Criteria:**
- [ ] `useApiKeys()` provides all CRUD operations
- [ ] Loading states tracked for each operation
- [ ] Errors exposed for UI display
- [ ] Optimistic updates for instant UI feedback
- [ ] Automatic refetch after mutations
- [ ] Type-safe Tauri invoke calls

**Hook Interface:**
```typescript
interface UseApiKeysReturn {
  keys: ApiKeyInfo[];
  activeKey: ApiKeyInfo | null;
  isLoading: boolean;
  error: string | null;
  listKeys: () => Promise<void>;
  addKey: (name: string, key: string) => Promise<string>;
  deleteKey: (keyId: string) => Promise<void>;
  setActiveKey: (keyId: string) => Promise<void>;
  validateKey: (key: string) => Promise<boolean>;
}
```

---

### TASK-004: Login Modal Component (First Launch)
**Priority**: P0
**Estimated Time**: 8 hours
**Dependencies**: TASK-003

**Description:**
Create modal that appears on first launch if no API key is configured. Guides user through adding their first key.

**Implementation Steps:**
1. Create `app/src/components/auth/LoginModal.tsx`
2. Create form for manual API key entry (name + key inputs)
3. Add validation (format check before submission)
4. Add "Validate & Save" button with loading state
5. Add "Skip for Now" button (dismisses until next launch)
6. Add "Use Environment Variable" button (closes permanently)
7. Implement modal trigger logic in `App.tsx`
8. Check for keys on mount, show modal if none exist
9. Persist "skip" state to localStorage
10. Style with Chakra UI modal components

**Files to Create/Modify:**
- `app/src/components/auth/LoginModal.tsx` (new)
- `app/src/components/auth/ApiKeyForm.tsx` (new)
- `app/src/App.tsx` (modify - add modal trigger)

**Acceptance Criteria:**
- [ ] Modal appears on first launch if no keys configured
- [ ] Modal does not appear if env var exists
- [ ] Form validates key format client-side (regex)
- [ ] Form validates key server-side (API test)
- [ ] Success: modal closes, key is active, user can chat
- [ ] Error: clear message shown inline
- [ ] "Skip" dismisses modal but shows again next launch
- [ ] "Use Env Var" permanently dismisses modal
- [ ] Modal is keyboard-navigable (Tab, Enter, Escape)
- [ ] Focus trap when modal is open

**UI Validation:**
```typescript
// Client-side format check
const isValidFormat = (key: string) => /^sk-ant-api\d{2}-/.test(key);

// Server-side API test
const testKey = async (key: string): Promise<boolean> => {
  return invoke('validate_api_key', { key });
};
```

---

### TASK-005: API Key Settings Panel
**Priority**: P0
**Estimated Time**: 6 hours
**Dependencies**: TASK-003

**Description:**
Create settings panel for managing multiple API keys (list, add, delete, set active).

**Implementation Steps:**
1. Create `app/src/components/settings/ApiKeySettings.tsx`
2. Display list of all keys with metadata
3. Show active key indicator (radio/checkmark)
4. Add "Add API Key" button → opens form modal
5. Add delete button per key (with confirmation)
6. Add "Set Active" action per key
7. Show env var warning if `ANTHROPIC_API_KEY` detected
8. Add empty state when no keys exist
9. Update `App.tsx` settings tab to include ApiKeySettings

**Files to Create/Modify:**
- `app/src/components/settings/ApiKeySettings.tsx` (new)
- `app/src/components/settings/ApiKeyList.tsx` (new)
- `app/src/components/settings/ApiKeyCard.tsx` (new)
- `app/src/App.tsx` (modify - add to settings tab)

**Acceptance Criteria:**
- [ ] List shows all keys with name, source, last used
- [ ] Active key clearly indicated (bold, checkmark, radio)
- [ ] Click to set different key as active
- [ ] Delete button shows confirmation dialog
- [ ] Delete removes key from list immediately
- [ ] Add button opens modal with same form as LoginModal
- [ ] Env var warning shown when env var exists
- [ ] Empty state: "No API keys configured. Add one to get started."
- [ ] Responsive layout (works on small screens)

---

### TASK-006: Active Key Selector (Header Dropdown)
**Priority**: P1
**Estimated Time**: 4 hours
**Dependencies**: TASK-003

**Description:**
Add dropdown in app header to quickly view and switch active API key.

**Implementation Steps:**
1. Create `app/src/components/header/ApiKeySelector.tsx`
2. Show active key name in header (truncate if long)
3. Dropdown shows all keys with active indicator
4. Click key to set as active
5. Add "Add New Key" option at bottom
6. Add "Manage Keys" option (navigates to settings)
7. Show loading state while switching
8. Update `App.tsx` header to include selector

**Files to Create/Modify:**
- `app/src/components/header/ApiKeySelector.tsx` (new)
- `app/src/App.tsx` (modify - add to header)

**Acceptance Criteria:**
- [ ] Header shows active key name (e.g., "🔑 My Work Key ▼")
- [ ] Shows env var name if env var is active ("🔑 Env Var ▼")
- [ ] Dropdown lists all keys with active checkmark
- [ ] Click key → switches immediately (< 50ms)
- [ ] "Add New Key" opens LoginModal
- [ ] "Manage Keys" navigates to Settings → API Keys tab
- [ ] Keyboard accessible (Arrow keys, Enter, Escape)
- [ ] Works on mobile (touch-friendly)

**UI Layout:**
```tsx
<Menu>
  <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
    🔑 {activeKey?.name || 'No Key'}
  </MenuButton>
  <MenuList>
    {keys.map(key => (
      <MenuItem key={key.id} onClick={() => setActiveKey(key.id)}>
        {key.isActive && <CheckIcon />} {key.name}
      </MenuItem>
    ))}
    <MenuDivider />
    <MenuItem onClick={openAddModal}>+ Add New Key</MenuItem>
    <MenuItem onClick={() => navigate('/settings')}>⚙️ Manage Keys</MenuItem>
  </MenuList>
</Menu>
```

---

### TASK-007: Error Handling & User Feedback
**Priority**: P1
**Estimated Time**: 3 hours
**Dependencies**: TASK-004, TASK-005

**Description:**
Implement comprehensive error handling and user-friendly error messages for all authentication scenarios.

**Implementation Steps:**
1. Create `app/src/utils/apiErrorMessages.ts` with error formatter
2. Map Tauri errors to user-friendly messages
3. Add toast notifications for success/error
4. Add inline validation errors in forms
5. Handle network errors gracefully
6. Add retry logic for transient errors

**Files to Create/Modify:**
- `app/src/utils/apiErrorMessages.ts` (new)
- `app/src/hooks/useApiKeys.ts` (modify - add error handling)
- `app/src/components/auth/LoginModal.tsx` (modify - show errors)

**Error Scenarios:**
```typescript
const errorMessages = {
  'invalid_api_key': 'Invalid API key. Please check and try again.',
  'network_error': 'Network error. Check your connection and retry.',
  'rate_limit': 'Too many requests. Please wait a moment.',
  'server_error': 'Anthropic API is having issues. Try again later.',
  'key_exists': 'This API key is already added.',
  'validation_failed': 'Could not validate API key. Check it's correct.',
};
```

**Acceptance Criteria:**
- [ ] All errors show user-friendly messages (no raw error strings)
- [ ] Network errors trigger retry prompt
- [ ] Invalid keys show specific validation message
- [ ] Success actions show toast notification
- [ ] Inline errors don't block UI (graceful degradation)
- [ ] Errors are logged to console for debugging

---

### TASK-008: Update chat/commands.rs to Use Active Key
**Priority**: P0
**Estimated Time**: 2 hours
**Dependencies**: TASK-002

**Description:**
Modify existing `get_api_key()` function to check active database key after environment variable.

**Implementation Steps:**
1. Modify `get_api_key()` in `app/src-tauri/src/claude/commands.rs`
2. Priority: env var → active DB key → in-memory key (legacy) → error
3. Update last_used_at when key is retrieved
4. Add debug logging (without exposing key value)

**Files to Modify:**
- `app/src-tauri/src/claude/commands.rs`

**New Logic:**
```rust
async fn get_api_key() -> Result<String, String> {
    // 1. Check environment variable
    if let Ok(env_key) = std::env::var("ANTHROPIC_API_KEY") {
        if !env_key.is_empty() {
            println!("Using API key from ANTHROPIC_API_KEY environment variable");
            return Ok(env_key);
        }
    }

    // 2. Check active database key
    if let Some(active_key) = get_active_db_key().await? {
        println!("Using active API key from database: {}", active_key.name);
        update_last_used(&active_key.id).await?;
        return Ok(active_key.key);
    }

    // 3. Fall back to in-memory key (legacy, for backwards compat)
    let api_key = API_KEY.lock().await;
    if let Some(key) = api_key.as_ref() {
        println!("Using manually set API key (legacy)");
        return Ok(key.clone());
    }

    Err("No API key configured. Add a key in Settings → API Keys.".to_string())
}
```

**Acceptance Criteria:**
- [ ] Env var takes precedence over DB keys
- [ ] Active DB key used if no env var
- [ ] Legacy in-memory key works (backwards compatibility)
- [ ] Clear error message if no keys exist
- [ ] last_used_at updated when key is used
- [ ] No API key values in logs (only names/sources)

---

### TASK-009: Testing & Documentation
**Priority**: P1
**Estimated Time**: 4 hours
**Dependencies**: TASK-001 through TASK-008

**Description:**
Write tests for critical paths and update documentation.

**Implementation Steps:**
1. Unit tests for API key validation
2. Integration tests for CRUD operations
3. UI tests for LoginModal flow
4. Update README with authentication instructions
5. Create troubleshooting guide for common issues
6. Add inline code comments for complex logic

**Files to Create/Modify:**
- `app/src-tauri/src/api_keys/tests.rs` (new)
- `app/src/components/auth/__tests__/LoginModal.test.tsx` (new)
- `README.md` (modify - add auth section)
- `docs/authentication.md` (new)

**Acceptance Criteria:**
- [ ] Unit tests cover validation, CRUD, key priority
- [ ] Integration tests verify full flow (add → set active → use)
- [ ] UI tests verify LoginModal happy path
- [ ] README has "Getting Started" with auth instructions
- [ ] Troubleshooting guide covers env var, missing keys, invalid keys
- [ ] Code comments explain non-obvious logic

---

## Phase 2: OAuth Integration (Priority: P2)

### TASK-010: OAuth Backend Implementation
**Priority**: P2
**Estimated Time**: 12 hours
**Dependencies**: TASK-002

**Description:**
Implement OAuth flow using Claude Code's client credentials (PKCE flow, local callback server).

**Implementation Steps:**
1. Create `app/src-tauri/src/oauth/mod.rs` module
2. Implement PKCE code verifier/challenge generation
3. Implement `start_oauth_flow()` command (returns auth URL)
4. Start local HTTP server for OAuth callback
5. Implement `complete_oauth_flow(code, state)` command
6. Exchange authorization code for API key
7. Store generated key in database with source='oauth'
8. Add state validation (CSRF protection)
9. Handle OAuth errors (timeout, invalid code, network)

**Files to Create/Modify:**
- `app/src-tauri/src/oauth/mod.rs` (new)
- `app/src-tauri/src/oauth/pkce.rs` (new)
- `app/src-tauri/src/oauth/server.rs` (new)
- `app/src-tauri/src/lib.rs` (modify - register commands)
- `Cargo.toml` (add dependencies: reqwest, base64, sha2)

**OAuth Parameters:**
```rust
const CLIENT_ID: &str = "9d1c250a-e61b-44d9-88ed-5944d1962f5e";
const AUTH_URL: &str = "https://claude.ai/oauth/authorize";
const TOKEN_URL: &str = "https://api.anthropic.com/oauth/token";
const REDIRECT_URI: &str = "http://localhost:8765/oauth/callback";
const SCOPES: &str = "org:create_api_key+user:profile+user:inference";
```

**Acceptance Criteria:**
- [ ] `start_oauth_flow()` generates PKCE challenge
- [ ] Returns auth URL with correct parameters
- [ ] Local server starts on port 8765
- [ ] Callback extracts code and state from query params
- [ ] State validation prevents CSRF attacks
- [ ] Code exchange returns valid API key
- [ ] Key stored in DB with source='oauth'
- [ ] Server shuts down after callback received
- [ ] Timeout after 5 minutes if no callback
- [ ] All errors handled with user-friendly messages

---

### TASK-011: OAuth Frontend UI
**Priority**: P2
**Estimated Time**: 6 hours
**Dependencies**: TASK-010

**Description:**
Add OAuth login button to LoginModal and settings, handle browser flow.

**Implementation Steps:**
1. Add "Login with Claude Account" button to LoginModal
2. Add OAuth button to ApiKeySettings
3. Implement browser opening on button click
4. Show loading state while waiting for callback
5. Add ToS warning modal before OAuth
6. Handle OAuth completion (success/error)
7. Add fallback to manual key if OAuth fails

**Files to Modify:**
- `app/src/components/auth/LoginModal.tsx`
- `app/src/components/settings/ApiKeySettings.tsx`
- `app/src/components/auth/OAuthWarningModal.tsx` (new)
- `app/src/hooks/useOAuth.ts` (new)

**ToS Warning:**
```
⚠️ Unofficial Authentication Method

This uses Claude Code's OAuth credentials to generate an API key
from your Claude Pro/Max subscription. This method:

• Is not officially supported by Anthropic
• May violate Anthropic's Terms of Service
• Could result in account suspension
• May stop working without notice

Use at your own risk.

[Cancel]  [I Understand, Continue]
```

**Acceptance Criteria:**
- [ ] Button opens browser to OAuth URL
- [ ] Loading state shows "Waiting for authentication..."
- [ ] ToS warning shown before OAuth starts
- [ ] Success: key added, set as active, modal closes
- [ ] Error: clear message, option to retry or use manual key
- [ ] Timeout after 5 minutes with helpful message
- [ ] Works on macOS, Windows, Linux

---

### TASK-012: OAuth Error Handling & Recovery
**Priority**: P2
**Estimated Time**: 4 hours
**Dependencies**: TASK-011

**Description:**
Handle OAuth edge cases and provide recovery options.

**Implementation Steps:**
1. Handle authorization denied by user
2. Handle network errors during code exchange
3. Handle invalid/expired codes
4. Handle Anthropic API errors
5. Provide "Try Again" and "Use Manual Key" options
6. Add detailed error logging (sanitized)

**Error Scenarios:**
- User closes browser without authorizing
- Authorization code expires (10 min timeout)
- Network failure during token exchange
- Anthropic API returns error
- Local callback server fails to start (port in use)

**Acceptance Criteria:**
- [ ] All error scenarios show user-friendly message
- [ ] "Try Again" restarts OAuth flow
- [ ] "Use Manual Key" switches to manual entry
- [ ] Timeout shows helpful next steps
- [ ] Errors logged with context (no sensitive data)
- [ ] Port conflict detected and user notified

---

## Phase 3: Polish & Testing (Priority: P1)

### TASK-013: End-to-End Testing
**Priority**: P1
**Estimated Time**: 6 hours
**Dependencies**: All previous tasks

**Description:**
Comprehensive testing of entire authentication system.

**Test Scenarios:**
1. Fresh install → LoginModal → Manual key → Success
2. Fresh install → LoginModal → OAuth → Success
3. Fresh install → Skip → Chat fails with helpful error
4. Multiple keys → Switch active → Chat uses new key
5. Delete active key → Automatically select another
6. Env var set → UI shows warning, can't change keys
7. Invalid key → Validation fails with clear message
8. Network offline → Graceful error, retry option

**Files to Create:**
- `app/src/tests/e2e/authentication.test.ts` (new)

**Acceptance Criteria:**
- [ ] All 8 scenarios pass
- [ ] No console errors during tests
- [ ] UI remains responsive during operations
- [ ] Database state consistent after all operations

---

### TASK-014: Performance Optimization
**Priority**: P2
**Estimated Time**: 3 hours
**Dependencies**: TASK-013

**Description:**
Optimize performance of key operations.

**Optimizations:**
1. Index SQLite queries on is_active
2. Cache active key in memory (invalidate on change)
3. Debounce key format validation
4. Lazy load key list (only when settings opened)
5. Optimize re-renders (React.memo, useMemo)

**Acceptance Criteria:**
- [ ] Key switching < 50ms
- [ ] LoginModal renders < 100ms
- [ ] Settings panel renders < 200ms
- [ ] No unnecessary re-renders (React DevTools)
- [ ] SQLite queries use indexes (EXPLAIN QUERY PLAN)

---

### TASK-015: Security Audit
**Priority**: P0
**Estimated Time**: 4 hours
**Dependencies**: All tasks

**Description:**
Security review of authentication implementation.

**Audit Checklist:**
- [ ] API keys never logged to console/files
- [ ] API keys redacted in error messages
- [ ] SQLite file permissions restricted (0600)
- [ ] PKCE properly implemented (OAuth)
- [ ] State parameter prevents CSRF
- [ ] No API keys in crash reports
- [ ] No API keys in Git history
- [ ] Env var takes precedence (can't be overridden by UI)

**Deliverables:**
- Security audit report
- List of findings and fixes
- Updated security documentation

---

## Task Summary

### Phase 1: Manual API Keys (P0)
| Task | Hours | Status |
|------|-------|--------|
| TASK-001: Database Schema | 4 | Pending |
| TASK-002: Backend CRUD | 6 | Pending |
| TASK-003: Frontend Hooks | 3 | Pending |
| TASK-004: Login Modal | 8 | Pending |
| TASK-005: Settings Panel | 6 | Pending |
| TASK-006: Header Dropdown | 4 | Pending |
| TASK-007: Error Handling | 3 | Pending |
| TASK-008: Update get_api_key | 2 | Pending |
| TASK-009: Testing & Docs | 4 | Pending |
| **Phase 1 Total** | **40 hours** | **~1 week** |

### Phase 2: OAuth Integration (P2)
| Task | Hours | Status |
|------|-------|--------|
| TASK-010: OAuth Backend | 12 | Pending |
| TASK-011: OAuth Frontend | 6 | Pending |
| TASK-012: OAuth Error Handling | 4 | Pending |
| **Phase 2 Total** | **22 hours** | **~3 days** |

### Phase 3: Polish & Testing (P1)
| Task | Hours | Status |
|------|-------|--------|
| TASK-013: E2E Testing | 6 | Pending |
| TASK-014: Performance | 3 | Pending |
| TASK-015: Security Audit | 4 | Pending |
| **Phase 3 Total** | **13 hours** | **~2 days** |

**Grand Total**: 75 hours (~2 weeks at 40 hours/week)

---

## Implementation Order

1. **Week 1**: Phase 1 (Manual API Keys)
   - TASK-001, TASK-002, TASK-003, TASK-008 (Backend - Days 1-2)
   - TASK-004, TASK-005 (Frontend - Days 3-4)
   - TASK-006, TASK-007, TASK-009 (Polish - Day 5)

2. **Week 2**: Phase 2 & 3 (OAuth + Polish)
   - TASK-010, TASK-011, TASK-012 (OAuth - Days 1-3)
   - TASK-013, TASK-014, TASK-015 (Testing - Days 4-5)

---

## Next Steps

1. ✅ Requirements approved (epic-0002/requirements.md)
2. ✅ Implementation plan created (this document)
3. ⏳ Begin TASK-001 (Database Schema)
4. ⏳ Set up project tracking (GitHub Issues or similar)
5. ⏳ Schedule security review before Phase 3

Ready to begin implementation!
