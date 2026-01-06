# Multi-tab Workspace UI with Vault Switching

## Ticket Quality Assessment

**Domain Detected**: none
**Business Context**: ✅ Complete (references detailed UX spec)
**Technical Clarity**: ✅ Clear (comprehensive UX architecture documented)

**Missing Information**: None (UX spec provides full architecture)

## Scope

### In-Scope

- **Apps**: TBD (need to discover Nori's app structure)
- **Features**:
  - Multi-tab interface supporting independent chat sessions
  - Tab state model (TabState with workspace + vault + chat)
  - Knowledge browser with two modes (current vault vs all vaults)
  - Vault switching with confirmation and cross-tab updates
  - Cross-tab communication via event bus
  - File watching for workspace/vault changes
  - Tab auto-numbering for same workspace (workspace-2, workspace-3)
  - Global state management for vaults and tabs
  - Workspace state persistence (nori.json)

### Out-of-Scope

- Knowledge loading/search system (already exists)
- File system watching implementation (use existing libraries)
- Tab persistence across app restarts (documented as future V1.0 feature)
- Session save/restore functionality (future feature)
- E2E tests (only unit and integration tests)

### Verification Needed

- [ ] What UI framework is Nori using? (React? Tauri frontend?)
- [ ] Current state management solution? (Zustand mentioned in spec)
- [ ] Existing workspace/project management code location?
- [ ] Where is global config stored? (~/.nori/config.json per spec)

## What

Implement a multi-tab workspace interface where each tab contains an independent chat session, workspace context, and vault. Users can switch vaults within a tab (affecting all tabs using that workspace), browse all vaults in read-only mode, and receive real-time notifications when other tabs modify shared resources. The system uses an event bus for cross-tab communication and maintains state hierarchy (global, workspace, tab).

## Why

Nori needs to support multiple concurrent work contexts (different workspaces/vaults/chats) without forcing users to close and reopen the app. This enables parallel workflows like debugging one project while developing another, or maintaining separate chat histories for different feature branches in the same workspace.

## Acceptance Criteria

- [ ] Users can open multiple tabs, each with independent workspace + vault + chat
- [ ] Tab state includes workspace path, vault name, chat session, and UI state (knowledge browser mode)
- [ ] Knowledge browser defaults to "Current Vault" mode showing active vault
- [ ] Users can switch to "All Vaults" mode for read-only browsing
- [ ] Vault switching prompts confirmation and updates nori.json
- [ ] All tabs using the same workspace reload when vault is switched
- [ ] Tabs with same workspace are auto-numbered (workspace-2, workspace-3)
- [ ] Event bus handles cross-tab communication for vault/file changes
- [ ] Global state (~/.nori/config.json) stores vault registry and recent workspaces
- [ ] Workspace state (nori.json) stores vault binding
- [ ] Tab state is memory-only (no persistence for MVP)
- [ ] Build passes, type checker passes, linter passes, tests pass

## Notes

- UX architecture documented in `.claude/knowledge/vault/patterns/ux/multi-tab-workspace-vault-ux.md`
- State management uses Zustand (per spec)
- Tab = Chat + Workspace + Vault (core model)
- Cross-tab communication requires event bus architecture
- File watching for workspace/vault change detection
