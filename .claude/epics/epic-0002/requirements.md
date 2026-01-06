# Epic: Multi-Key Authentication System

**Epic ID**: epic-0002
**Created**: 2026-01-02
**Status**: Planning
**Priority**: P0 (Critical - blocks all API usage)

## Business Context

### Problem Statement

Nori currently has backend API key support (`set_api_key` command) but no frontend UI for users to manage authentication. Users cannot:
- Add API keys through the UI
- Use their Claude Pro/Max subscriptions (via OAuth)
- Manage multiple API keys for different projects
- See which key is currently active
- Switch between keys easily

**Impact**: Users cannot use Nori without manually setting environment variables, creating significant friction and blocking adoption.

### User Stories

**US-1: First-Time User Authentication**
```
As a new Nori user
When I launch the app for the first time
I want to see a login modal that guides me through authentication
So that I can start using Nori immediately without technical setup
```

**Acceptance Criteria:**
- [ ] Modal appears on first launch if no API key is configured
- [ ] Modal is dismissible but reappears on next launch until auth is configured
- [ ] Clear instructions for both API key and OAuth methods
- [ ] Validation feedback (invalid key, network errors, etc.)

**US-2: Multiple API Key Management**
```
As a power user with multiple projects
I want to add and manage multiple API keys
So that I can separate usage by project, organization, or environment
```

**Acceptance Criteria:**
- [ ] Can add multiple API keys with custom names
- [ ] Can see list of all configured keys
- [ ] Can set one key as active
- [ ] Can delete/deactivate keys
- [ ] Can see metadata (source, last used, created date)

**US-3: OAuth-Based Authentication (Pro/Max Users)**
```
As a Claude Pro/Max subscriber
I want to authenticate using my existing subscription
So that I don't need to pay separately for API usage
```

**Acceptance Criteria:**
- [ ] "Login with Claude Account" button opens browser
- [ ] OAuth flow generates API key from subscription
- [ ] Clear warning about unofficial/unsupported nature
- [ ] Fallback to manual API key if OAuth fails
- [ ] Key is stored and managed like manual keys

**US-4: Key Switching**
```
As a user with multiple API keys
I want to quickly switch between keys
So that I can use different accounts for different conversations
```

**Acceptance Criteria:**
- [ ] Dropdown/selector in UI shows all keys
- [ ] Active key is clearly indicated
- [ ] Switching takes effect immediately (no restart required)
- [ ] Current key is persisted across app restarts

**US-5: Environment Variable Priority**
```
As a developer
I want environment variables to take precedence over UI-configured keys
So that I can use CI/CD pipelines and scripted workflows
```

**Acceptance Criteria:**
- [ ] `ANTHROPIC_API_KEY` env var checked first
- [ ] UI shows when env var is being used
- [ ] UI-configured keys are ignored when env var exists
- [ ] Clear indicator that env var overrides UI settings

## Technical Requirements

### Architecture

**Backend (Rust/Tauri)**
- SQLite table for storing multiple API keys
- Tauri commands for CRUD operations
- Key validation on save
- OAuth flow implementation (optional Phase 2)
- Active key selection logic

**Frontend (React/TypeScript)**
- Login modal component
- API key management settings panel
- Key selector dropdown in header
- OAuth browser integration
- Error handling and user feedback

### Data Model

```sql
CREATE TABLE api_keys (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    key TEXT NOT NULL,
    source TEXT NOT NULL CHECK(source IN ('manual', 'oauth', 'env')),
    organization TEXT,
    created_at INTEGER NOT NULL,
    last_used_at INTEGER,
    is_active BOOLEAN DEFAULT 0,
    metadata TEXT -- JSON for extensibility
);

CREATE TABLE key_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key_id TEXT NOT NULL,
    tokens_input INTEGER NOT NULL DEFAULT 0,
    tokens_output INTEGER NOT NULL DEFAULT 0,
    cost_estimate REAL NOT NULL DEFAULT 0.0,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (key_id) REFERENCES api_keys(id) ON DELETE CASCADE
);

CREATE INDEX idx_active_key ON api_keys(is_active) WHERE is_active = 1;
CREATE INDEX idx_key_usage_timestamp ON key_usage(timestamp);
```

### Security Requirements

1. **Encryption at Rest** (Phase 2)
   - API keys encrypted in SQLite using AES-256-GCM
   - Master key stored in platform keychain (Keychain/Credential Manager)
   - Optional: Use platform-specific secure storage instead of SQLite

2. **Validation**
   - Validate API key format before storage (starts with `sk-ant-`)
   - Test key with actual API call before saving
   - Handle validation errors gracefully

3. **No Logging**
   - Never log full API keys
   - Redact keys in error messages (show only last 4 chars)
   - Sanitize crash reports

### API Endpoints (Tauri Commands)

```rust
// Existing (already implemented)
#[tauri::command]
async fn set_api_key(api_key: String) -> Result<(), String>;

#[tauri::command]
async fn has_api_key() -> Result<bool, String>;

// New commands needed
#[tauri::command]
async fn list_api_keys() -> Result<Vec<ApiKeyInfo>, String>;

#[tauri::command]
async fn add_api_key(name: String, key: String) -> Result<String, String>;

#[tauri::command]
async fn delete_api_key(key_id: String) -> Result<(), String>;

#[tauri::command]
async fn set_active_key(key_id: String) -> Result<(), String>;

#[tauri::command]
async fn get_active_key() -> Result<Option<ApiKeyInfo>, String>;

#[tauri::command]
async fn validate_api_key(key: String) -> Result<bool, String>;

// Phase 2: OAuth
#[tauri::command]
async fn start_oauth_flow() -> Result<String, String>; // Returns auth URL

#[tauri::command]
async fn complete_oauth_flow(code: String, state: String) -> Result<String, String>; // Returns key_id
```

## UI/UX Requirements

### Login Modal (First Launch)

**Layout:**
```
┌────────────────────────────────────────────┐
│  Welcome to Nori                      [×]  │
├────────────────────────────────────────────┤
│                                            │
│  To get started, add your Anthropic API   │
│  key or login with your Claude account.   │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │  Method 1: API Key (Recommended)     │ │
│  │                                      │ │
│  │  Name: [My API Key...............]  │ │
│  │  Key:  [sk-ant-***************...]  │ │
│  │                                      │ │
│  │       [Validate & Save]              │ │
│  │                                      │ │
│  │  Don't have a key?                   │ │
│  │  → Create one at console.anthropic   │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │  Method 2: Claude Pro/Max Account    │ │
│  │                                      │ │
│  │  [🔐 Login with Claude Account]     │ │
│  │                                      │ │
│  │  ⚠️ Unofficial method - use at own   │ │
│  │     risk. May violate ToS.           │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  [Skip for Now]          [Environment Var]│
└────────────────────────────────────────────┘
```

### API Key Management (Settings Tab)

**Layout:**
```
┌────────────────────────────────────────────┐
│  ⚙️ API Keys                               │
├────────────────────────────────────────────┤
│                                            │
│  Active Key:  [My Work Key ▼]             │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │ Name         Source    Last Used     │ │
│  │ ────────────────────────────────────│ │
│  │ ● My Work Key   Manual   2 mins ago  │ │
│  │   Personal      OAuth    Yesterday   │ │
│  │   Dev Testing   Manual   1 week ago  │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  [+ Add API Key]  [🔐 Login with OAuth]   │
│                                            │
│  ℹ️ Environment Variable Detected          │
│  ANTHROPIC_API_KEY is set. UI keys are    │
│  ignored. Unset to use managed keys.      │
└────────────────────────────────────────────┘
```

### Key Selector (Header)

**Layout:**
```
┌────────────────────────────────────────────┐
│  Nori    🔑 My Work Key ▼    👤 Role ▼     │
└────────────────────────────────────────────┘
     Dropdown shows:
     ┌──────────────────────┐
     │ ● My Work Key        │
     │   Personal           │
     │   Dev Testing        │
     │ ──────────────────── │
     │ + Add New Key        │
     │ ⚙️ Manage Keys       │
     └──────────────────────┘
```

## Non-Functional Requirements

### Performance
- Login modal appears within 100ms of app launch
- Key validation completes within 2 seconds
- Key switching is instant (< 50ms)
- SQLite queries optimized with indexes

### Reliability
- Graceful degradation if API is unavailable
- Offline mode: Allow key entry, validate on next online session
- Atomic transactions for key operations
- Automatic retry for transient network errors

### Usability
- Clear error messages for all failure scenarios
- Inline validation feedback (real-time key format check)
- Progress indicators for async operations
- Keyboard shortcuts (Ctrl+K to open key selector)

### Accessibility
- Modal is keyboard-navigable
- ARIA labels for screen readers
- Focus trap in modal
- Escape key closes modal

## Success Metrics

### Quantitative
- 95% of users complete authentication within 2 minutes
- < 5% support requests related to authentication
- 0 API key leaks in logs/crash reports
- Average time to switch keys: < 3 seconds

### Qualitative
- Users report authentication is "easy" or "very easy"
- No confusion about which key is active
- Clear understanding of OAuth risks

## Out of Scope (Future Phases)

- **Phase 3**: Team key sharing
- **Phase 3**: Organization-level key management
- **Phase 3**: Key rotation automation
- **Phase 3**: Usage analytics per key
- **Phase 3**: Cost tracking and budgets
- **Phase 3**: SSO integration (Google Workspace, Okta)

## Dependencies

### Technical
- SQLite migration system (for schema updates)
- Tauri 2.0 stable
- OAuth library for PKCE flow

### External
- Anthropic API availability
- Claude OAuth endpoints (unofficial, may break)

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| OAuth method breaks | High | Medium | Fallback to manual API key, clear ToS warning |
| API keys leaked in logs | Critical | Low | Strict no-logging policy, code review |
| SQLite corruption | High | Low | Regular backups, WAL mode, transaction safety |
| Users lose API keys | Medium | Medium | Export/import functionality (Phase 2) |
| Anthropic changes API auth | High | Low | Monitor Anthropic changelog, version API calls |

## Timeline Estimate

**Phase 1: Manual API Keys** (1 week)
- Backend: Multi-key storage, CRUD commands (2 days)
- Frontend: Login modal, settings panel (3 days)
- Testing & polish (2 days)

**Phase 2: OAuth Integration** (1 week)
- Backend: OAuth flow implementation (3 days)
- Frontend: OAuth UI, error handling (2 days)
- Testing, ToS warnings, docs (2 days)

**Total**: 2 weeks for complete authentication system

## Approval

**Stakeholders:**
- [ ] Product Owner: Authentication approach approved
- [ ] Security Review: Key storage and OAuth risks reviewed
- [ ] Engineering: Technical design approved

**Next Steps:**
1. Create implementation plan with detailed tasks
2. Set up SQLite migration for api_keys table
3. Begin Phase 1 implementation
