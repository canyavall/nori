# Opcode - Code Quality Assessment

## Overview

The codebase is **well-structured for its complexity** but shows signs of **rapid iteration** with some rough edges. It's a sophisticated project with 18 Rust files, 121 TypeScript/React files, and ~27,000+ lines of frontend code.

## Strengths

### Architecture
- Clean module separation in both frontend and backend
- Dual-mode architecture (Tauri desktop + web) with unified API adapter
- Content-addressable storage for checkpoint deduplication (smart engineering)
- Proper async/await patterns with Tokio throughout the Rust backend
- Thread-safe shared state (Arc<Mutex<>>, Arc<RwLock<>>)

### Type Safety
- Full TypeScript strict mode enabled
- Comprehensive type definitions for all API responses
- Generic types and proper union types throughout
- Zod schema validation for forms

### Error Handling
- Consistent `anyhow::Result` + `?` operator in Rust
- Try-catch on all API calls in frontend
- User-facing error states with toast notifications
- Graceful fallbacks (REST when Tauri unavailable)

### Performance
- Virtual scrolling for large message lists (@tanstack/react-virtual)
- Memoization and debouncing where appropriate
- API response caching with timestamp validation
- Lazy loading of dashboard tabs
- Code splitting via Vite manual chunks

### Privacy
- PII sanitization in analytics (file paths, emails, API keys masked)
- Consent-first PostHog analytics
- All data stored locally by default

## Weaknesses & Issues

### Dead Code / Duplication
- **Duplicate FilePicker modal** in App.tsx (lines 423-447 and 460-485 render identical blocks)
- Multiple component variants exist: `SessionList.tsx` + `SessionList.optimized.tsx`, `UsageDashboard.tsx` + `UsageDashboard.original.tsx`, `ToolWidgets.tsx` + `ToolWidgets.new.tsx`, `App.cleaned.tsx`
- `#[allow(dead_code)]` annotations on several Rust structs/fields
- Unused state variables (`_error`, `previousView` initialized but never updated dynamically)

### Incomplete Features
- **Web server mode**: Has critical issues documented in `web_server.design.md`:
  - Session-scoped event dispatching broken (sessions interfere with each other)
  - Process cancellation is a no-op stub
  - stderr not captured from Claude processes
  - `claude-cancelled` events not implemented
- **MCP status checking**: Returns mock data (TODO in code)
- **Checkpoint diff generation**: Returns None (TODO in code)
- **Usage alerts**: Listed as "coming soon" in README

### Security Concerns
- `--dangerously-skip-permissions` used on ALL Claude executions (desktop and web)
- `storage_execute_sql` command exposes raw SQL execution to the frontend
- `storage_reset_database` could wipe all data
- Web mode has no authentication
- CORS allows any origin
- Proxy credentials stored in plaintext

### Code Smells
- **Framer Motion alpha version** (12.0.0-alpha.1) used in production
- **PostHog analytics deeply intertwined** with component logic (50+ event types)
- **92 Tauri commands** in a single registration block in main.rs
- Some components are very large (ClaudeCodeSession.tsx has extensive streaming logic)
- Path encoding (`/` to `-`) is lossy and could cause collisions

### Testing
- Rust test files exist (`src-tauri/tests/`) but extent unclear
- No frontend test infrastructure visible (no Jest, Vitest, or testing-library)
- Manual testing recommended in CONTRIBUTING.md
- No E2E test framework

## Metrics

| Metric | Value |
|--------|-------|
| Frontend files | ~121 (.ts/.tsx) |
| Frontend LOC | ~27,400 |
| Rust files | 18 (.rs) |
| Tauri IPC commands | 92 |
| Dependencies (frontend) | ~35 |
| Dependencies (Rust) | ~40 |
| Pre-built agents | 3 |
| Analytics event types | 50+ |
| Known TODOs in Rust | 3 |
| Critical web server issues | 4 |

## Technical Debt Summary

| Item | Severity | Effort |
|------|----------|--------|
| Remove duplicate FilePicker in App.tsx | Low | Minutes |
| Clean up variant files (.optimized, .original, .new, .cleaned) | Low | Hours |
| Fix web server session isolation | High | Days |
| Implement process cancellation in web mode | High | Hours |
| Add frontend tests | Medium | Days-Weeks |
| Remove/gate `--dangerously-skip-permissions` | High | Hours |
| Replace framer-motion alpha with stable | Medium | Hours |
| Add authentication to web server | High | Days |
| Implement MCP status checking | Low | Hours |
| Implement checkpoint diff generation | Medium | Hours |
