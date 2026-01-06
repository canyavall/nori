# Epic Status Summary

All epics marked as complete as of 2026-01-03.

## Completed Epics

### epic-0001: Claude Code Feature Testing Suite
**Status:** ✅ COMPLETED
**Scope:** Test infrastructure for Claude Code features
**Outcome:** Test framework and documentation created

### epic-0002: Multi-Key Authentication System
**Status:** ✅ COMPLETED (Deferred)
**Scope:** Complex multi-key authentication with provider management
**Outcome:** Superseded by simpler OAuth approach in epic-0003

### epic-0003: OAuth Authentication for Anthropic API
**Status:** ✅ COMPLETED (Backend only)
**Scope:** OAuth token storage and Claude API integration
**Outcome:** Backend complete, frontend UI missing (Settings tab has no API key input)
**Note:** Users must set `ANTHROPIC_API_KEY` env var or use OAuth from OpenCode

### epic-0004: Project Selector - First Screen
**Status:** ✅ COMPLETED (Implemented in epic-0005/0006)
**Scope:** Project/workspace selection UI
**Outcome:** Workspace selector implemented using workspace terminology

### epic-0005: Multi-tab Workspace UI with Vault Switching
**Status:** ✅ COMPLETED (Tests deferred)
**Scope:** Browser-style tabs, workspace management, vault switching
**Outcome:** Core functionality complete, automated tests not written

### epic-0006: Remove Blocking Workspace Selection
**Status:** ✅ COMPLETED
**Scope:** Homepage with embedded workspace selector
**Outcome:** Non-blocking workspace selection flow implemented

## Known Gaps

1. **API Key UI Missing** (epic-0003)
   - Backend auth complete, no frontend settings UI
   - Users cannot input API key through app
   - Workaround: Set `ANTHROPIC_API_KEY` environment variable

2. **Test Coverage** (epic-0005)
   - Unit tests for vault switching deferred
   - Integration tests for multi-tab behavior missing

3. **OAuth Flow** (epic-0003)
   - Token storage works, but no OAuth authorization flow
   - No auto-refresh for expired tokens
   - Users must copy tokens from OpenCode manually

## Architecture Decisions

- **Workspaces over Projects:** Epic-0004's "project" terminology replaced with "workspace"
- **Global Config:** Single `~/.nori/nori.db` database, no per-workspace .nori folders
- **Single Window:** Browser-style tabs in one Tauri window, not separate OS windows
- **Vault System:** Knowledge separated from workspaces (workspace + vault binding)

## Next Steps

User moving to ad-hoc improvements outside epic framework.
