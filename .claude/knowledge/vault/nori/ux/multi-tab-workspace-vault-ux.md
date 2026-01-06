---
tags:
  - ux
  - nori
  - product
  - multi-tab
  - workspace
  - vault
  - state-management
description: >-
  Multi-tab UX architecture for Nori: tab state model (chat + workspace + vault),
  knowledge browser modes (current vs all vaults), vault switching behavior,
  cross-tab communication, and state management strategy
category: nori/ux
required_knowledge: ["workspace-vault-separation"]
---
# Multi-Tab Workspace-Vault UX

UX architecture for Nori's multi-tab interface supporting multiple workspaces and vaults simultaneously.

## Tab State Model

### Tab = Chat + Workspace + Vault

**Each tab contains**:
- One workspace (code folder)
- One vault (linked via workspace's nori.json)
- One chat session (independent message history)

**TypeScript model**:
```typescript
interface TabState {
  id: string;
  workspace: {
    path: string;           // ~/work/bank-client/
    vault: string;          // "nestle"
    vaultPath: string;      // ~/vaults/nestle/
  };
  chat: {
    sessionId: string;
    messages: Message[];
    loadedPackages: string[];
  };
  ui: {
    knowledgeBrowserMode: 'current' | 'all';
    selectedPackage: string | null;
  };
}
```

### Tab Sharing Scenarios

**Scenario 1: Same Workspace, Multiple Chats**
```
Tab 1: bank-client + nestle + "Fix auth bug"
Tab 2: bank-client + nestle + "Add new feature"
```
- Shared: workspace files, vault
- Isolated: chat history
- Risk: File conflicts (both tabs edit same file)

**Scenario 2: Different Workspaces, Same Vault**
```
Tab 1: bank-client + nestle + Chat A
Tab 2: admin-panel + nestle + Chat B
```
- Shared: vault (same knowledge)
- Isolated: workspace files, chat history
- Impact: Vault changes affect both tabs

**Scenario 3: Complete Isolation**
```
Tab 1: bank-client + nestle + Chat A
Tab 2: nori + personal + Chat B
```
- Nothing shared
- Fully independent

## Knowledge Browser

Shows vault linked to active workspace with vault switching capability.

**UI**:
```
┌─────────────────────┐
│ Knowledge Browser   │
├─────────────────────┤
│ Current Vault       │  ← Label
│ [nestle        ▼]   │  ← Dropdown (all vaults)
│                     │
│ 📦 business         │  ← Browsing selected vault
│   └─ trading        │
│ 📦 engineering      │
│   └─ react          │
│                     │
│ [Search packages]   │
└─────────────────────┘
```

**Behavior**:
- Knowledge loaded into chat comes from selected vault
- Dropdown lists all available vaults from vault registry
- Selecting different vault shows confirmation modal
- On confirm: updates workspace nori.json, re-indexes knowledge
- All tabs using same workspace update immediately

## Vault Switching

**User action**: Select different vault from dropdown

**Flow**:
1. User selects "xeenaa" from dropdown
2. Nori shows VaultSwitchModal confirmation:
   ```
   Switch vault to "xeenaa"?

   ⚠️ This will change the knowledge context for this chat
   ⚠️ This will update nori.json for workspace "bank-client"
   ⚠️ This will affect 1 other open tab

   [Cancel]  [Switch Vault]
   ```
3. User confirms
4. Backend updates workspace via `update_workspace_vault` Tauri command
5. All tabs using this workspace are found and updated:
   - Fetch updated workspace data via `get_workspace_by_path`
   - Update tab state via `updateTabWorkspace` (Zustand)
6. Re-index knowledge with new vault path
7. Toast: "Vault switched to xeenaa"

**Impact on other tabs**:
- All tabs using same workspace path get updated immediately
- Tabs with different workspaces are unaffected
- Updates are synchronous (shared Zustand store, single-window app)

## State Architecture

### Global State (~/.nori/config.json)

```json
{
  "vaults": [
    {"name": "nestle", "path": "~/vaults/nestle", "created": "2026-01-01"},
    {"name": "xeenaa", "path": "~/vaults/xeenaa", "created": "2025-12-15"}
  ],
  "recentWorkspaces": [
    {"path": "~/work/bank-client", "vault": "nestle", "lastOpened": "2026-01-03T10:30:00Z"}
  ],
  "apiKeys": [...],
  "settings": {...}
}
```

**Purpose**:
- Vault registry (all known vaults)
- Recent workspaces (quick access)
- Global app settings

### Workspace State (<workspace>/nori.json)

```json
{
  "vault": "nestle",
  "vaultPath": "~/vaults/nestle",
  "hooks": {},
  "tools": []
}
```

**Purpose**:
- Which vault this workspace uses
- Workspace-specific configuration

### Tab State (Memory Only)

```typescript
{
  workspace: {...},
  chat: {...},
  ui: {...}
}
```

**Purpose**:
- Active chat session
- UI state (selected package, browser mode)

**Not persisted** (future: optional session save/restore)

## Cross-Tab Communication

**Architecture**: Direct Zustand state updates (single-window, in-process sync)

**Why this works**:
- Nori uses single-window architecture with browser-style tabs (not separate Tauri windows)
- All tabs share same React instance and Zustand store
- State updates trigger React re-renders in all components subscribed to that state
- No async event bus needed for in-process communication

**Implementation** (vault switching):
```typescript
// In KnowledgeBrowser.tsx - handleVaultSwitchConfirm
const affectedTabs = tabs.filter(tab => tab.workspace?.path === workspacePath);

for (const tab of affectedTabs) {
  // Fetch updated workspace data from backend
  const updatedWorkspace = await invoke<Workspace | null>(
    'get_workspace_by_path',
    { path: workspacePath }
  );

  // Direct Zustand state update - triggers re-render in all tabs
  updateTabWorkspace(tab.id, updatedWorkspace);
}

// Re-index knowledge with new vault
await invoke('index_knowledge', { vaultPath: selectedVault.path });
```

**TabStore implementation**:
```typescript
// src/stores/tabStore.ts
updateTabWorkspace: (tabId: string, workspace: Workspace | null) => {
  set((state) => ({
    tabs: state.tabs.map((tab) =>
      tab.id === tabId ? { ...tab, workspace } : tab
    ),
  }));
}
```

**Result**:
- All tabs using same workspace update synchronously
- Knowledge browser shows new vault immediately
- Chat context switches to new vault
- No stale data, no polling, no race conditions

## UX Flows

### Flow 1: First-Time User

```
1. Launch Nori
2. Empty state:
   "Create your first vault to get started"
   [Create Vault]

3. Create vault modal:
   Name: [personal___]
   Path: [~/vaults/personal]
   [Create]

4. Empty state updates:
   "Link a workspace to start chatting"
   [Link Workspace]

5. Link workspace:
   Select folder: ~/work/repo/
   Select vault: [personal ▼]
   [Link]

6. Tab opens with workspace + vault
```

### Flow 2: Open Recent Workspace

```
1. Launch Nori
2. Recent workspaces shown:
   ● bank-client (nestle)
     admin-panel (nestle)
     nori (personal)

3. Click "bank-client"
   → Opens tab with bank-client + nestle
```

### Flow 3: Multi-Tab Same Workspace (Auto-Numbering)

```
1. Tab 1: Opens "bank-client" workspace
   → Tab name: "bank-client"

2. User opens new tab, links bank-client again
   → Tab name: "bank-client-2" (auto-numbered)

3. User opens third tab, links bank-client again
   → Tab name: "bank-client-3"

4. Tab naming makes it clear which tab is which
5. All tabs work on same workspace files
6. Tab 1 edits login.ts
7. Tab 2 sees notification: "login.ts modified in bank-client"
8. Tab 2 reloads file before editing
```

**Tab Naming Rules**:
- First tab: Use workspace folder name ("bank-client")
- Subsequent tabs: Append number ("bank-client-2", "bank-client-3")
- No warning on open (just clear naming)
- User can manually rename tabs (future: editable tab names)

### Flow 4: Vault Switch Affects Multiple Tabs

```
1. Tab 1: bank-client + nestle
2. Tab 2: bank-client + nestle
3. In Tab 1, switch vault to xeenaa
4. Confirmation: "This will affect 1 other tab"
5. Confirm
6. Tab 1 reloads with xeenaa
7. Tab 2 shows notification: "Vault changed to xeenaa"
8. Tab 2 reloads automatically
```

## Technical Challenges

### Challenge 1: Vault Hot Reload

**Problem**: User edits knowledge package. Should all tabs reload?

**Decision**: Show notification "Vault updated, reload?" (user-controlled)

**Why**: Auto-reload mid-chat disrupts user flow

### Challenge 2: File Conflict Detection

**Problem**: Tab 1 and Tab 2 both edit same file

**Decision**:
- First tab to save wins
- Second tab shows warning before save: "File modified in Tab 1, reload before saving?"

**Why**: Prevents accidental overwrites

### Challenge 3: Vault Switch Confirmation

**Problem**: User has messages in chat, switches vault. Context changes (different knowledge).

**Decision**: ✅ Always confirm, regardless of message count

**Why**: Vault switching changes AI context fundamentally. User should always be aware.

**UI**:
```
Switch vault to "xeenaa"?

⚠️ This will change the knowledge context for this chat
⚠️ This will update nori.json for workspace "bank-client"
⚠️ This will affect 1 other open tab

[Cancel]  [Switch Vault]
```

### Challenge 4: Tab Persistence

**Problem**: Should tabs restore on app launch?

**Decision**: ✅ No tab persistence for MVP

**Why**:
- Simplifies implementation
- Reduces complexity for first release
- Users can manually reopen workspaces (quick via recent list)

**Future (V1.0)**: Add "Save Session" feature
- Restore all tabs on launch
- Save/load named sessions ("morning session", "bug-fix session")
- Optional: Auto-restore last session on launch

## State Management (Zustand)

### Global Store

```typescript
interface AppStore {
  vaults: Vault[];
  recentWorkspaces: Workspace[];
  tabs: TabState[];
  activeTabId: string;

  createVault: (name: string, path: string) => void;
  linkWorkspace: (path: string, vault: string) => string; // Returns tab ID
  switchVault: (workspacePath: string, newVault: string) => void;
  closeTab: (tabId: string) => void;
}
```

### Per-Tab Store

```typescript
interface TabStore {
  workspace: WorkspaceState;
  chat: ChatState;
  knowledgeBrowser: KnowledgeBrowserState;

  sendMessage: (message: string) => void;
  loadPackage: (packagePath: string) => void;
  setKnowledgeMode: (mode: 'current' | 'all') => void;
}
```

## Design Decisions

### Why Direct State Updates Instead of Event Bus?

**Problem**: Tab 1 changes workspace state, Tab 2 needs to know

**Solution**: Direct Zustand state updates (shared store)

**Why this works**:
- Single-window app = all tabs share React instance
- Zustand store is global singleton
- State mutations trigger React re-renders automatically

**Alternatives rejected**:
- Event bus: Unnecessary complexity for in-process communication
- Polling: Inefficient, introduces lag
- Multi-window IPC: Not needed, Nori uses single window with browser-style tabs

## Summary

**Key principles**:
- Tab = Chat + Workspace + Vault (clear ownership)
- Single knowledge browser with vault dropdown
- Vault switching affects all tabs using that workspace
- Synchronous cross-tab updates via shared Zustand store
- Always confirm before vault switching

**State hierarchy**:
- Global: Vault registry (~/.nori/config.json), recent workspaces
- Workspace: Which vault (nori.json in workspace directory)
- Tab: Chat history, UI state (memory-only, not persisted)

**Cross-tab communication**: Direct Zustand state updates (single-window, in-process)

**Implementation Decisions (2026-01-03)**:
- ✅ Single-window app with browser-style tabs (not multi-window Tauri)
- ✅ Always confirm vault switching (shows warning modal)
- ✅ Auto-number tabs with same workspace (bank-client-2, bank-client-3)
- ✅ No tab persistence (manual reopen via recent workspaces)
- ✅ Synchronous cross-tab updates (shared React instance and Zustand store)
