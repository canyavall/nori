# Migrate Nori Backend from Tauri/Rust to Node.js/TypeScript

## Ticket Quality Assessment

**Domain Detected**: None (infrastructure migration)
**Business Context**: ⚠️ Partial - Eliminates CMake/NASM build dependencies, enables OpenCode OAuth pattern reuse
**Technical Clarity**: ✅ Clear - Complete backend rewrite while preserving frontend

**Missing Information**:
- Desktop packaging strategy (Electron? NW.js? Tauri with Node backend?)
- Performance requirements (startup time, memory usage)
- Database migration strategy (SQLite compatibility in Node.js)
- IPC mechanism for frontend-backend communication

## Scope

### In-Scope

- **Backend Rewrite**: Complete migration of `app/src-tauri/` (28 Rust files, 8 modules) to Node.js/TypeScript
- **Modules to Migrate**:
  - `auth/` - OAuth flow, token management (5 files)
  - `claude/` - Anthropic API integration (2 files)
  - `db.rs` - SQLite database layer (1 file)
  - `hooks/` - Hook execution system (3 files)
  - `knowledge/` - Knowledge vault management (4 files)
  - `projects/` - Project management (3 files)
  - `role.rs` - Personality system (1 file)
  - `session.rs` - Session persistence (1 file)
  - `vaults/` - Vault management (3 files)
  - `workspaces/` - Workspace management (3 files)
  - `lib.rs`, `main.rs` - Entry points (2 files)

- **Frontend Integration**: Replace Tauri IPC calls with new Node.js backend communication
- **OpenCode OAuth**: Replicate OpenCode's TypeScript OAuth implementation exactly
- **Database**: Maintain SQLite with Node.js adapter (`better-sqlite3` or similar)
- **Feature Parity**: All existing functionality must work identically

### Out-of-Scope

- Frontend UI changes or redesigns
- Business logic changes
- New features
- Performance optimizations beyond migration needs
- E2E testing (focus on unit/integration tests only)

### Verification Needed

- [ ] **Desktop packaging**: Electron? Tauri with Node backend? Standalone Node.js?
- [ ] **IPC mechanism**: WebSocket? HTTP? Electron IPC? Tauri invoke from Node?
- [ ] **Build tooling**: How does frontend communicate with Node backend in dev vs production?
- [ ] **Database location**: Keep `~/.nori/nori.db`? Migrate to different location?

## What

Replace the Tauri/Rust backend (28 files across 8 modules) with a Node.js/TypeScript backend that provides identical functionality. Preserve the React frontend with minimal changes (only IPC layer). Replicate OpenCode's OAuth authentication approach to eliminate TLS fingerprinting issues and CMake/NASM build dependencies.

## Why

**Technical Debt Elimination**:
- Removes CMake and NASM build requirements (Windows compilation blocker)
- Enables direct reuse of OpenCode's proven OAuth implementation (TypeScript)
- Eliminates Rust/Node.js language boundary complexity

**Development Velocity**:
- Frontend and backend in same language ecosystem
- Easier debugging with unified stack
- Faster iteration without Rust recompilation overhead

**Authentication Reliability**:
- OpenCode's OAuth flow is proven working with Anthropic API
- Native Node.js TLS fingerprint matches OpenCode's successful pattern
- Eliminates "only authorized for Claude Code" token restrictions

## Acceptance Criteria

- [ ] All 8 Rust modules migrated to TypeScript with equivalent functionality
- [ ] OAuth authentication works using OpenCode's exact approach
- [ ] Frontend communicates with Node.js backend successfully
- [ ] SQLite database operations work identically
- [ ] All existing features functional: personalities, knowledge, sessions, hooks, workspaces, vaults
- [ ] No CMake or NASM dependencies required for build
- [ ] Development mode (`bun run dev`) works
- [ ] Production build packages successfully
- [ ] All unit and integration tests pass

## Notes

**Critical Decision Required**: Desktop packaging strategy impacts architecture:

1. **Option A: Electron**
   - Pros: Standard Node.js + desktop, mature ecosystem
   - Cons: Larger bundle size, different from current Tauri approach

2. **Option B: Tauri with Node.js backend**
   - Pros: Keeps Tauri frontend wrapper, smaller bundle
   - Cons: Still some Rust (minimal), complexity of Rust calling Node

3. **Option C: Pure Node.js + Web UI**
   - Pros: Simplest, no desktop packaging
   - Cons: Not a desktop app, loses native integration

**Recommendation**: Option A (Electron) for consistency with OpenCode's potential Electron compatibility and full Node.js ecosystem access.

**Migration Strategy**: Incremental module-by-module migration is NOT feasible (Rust and Node can't coexist easily in Tauri). This is an all-at-once migration.

**Risk**: High - complete rewrite with no rollback path once started. Thorough testing required before replacing production Tauri build.
