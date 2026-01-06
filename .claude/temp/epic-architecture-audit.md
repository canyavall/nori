# Epic Architecture Audit

**Date**: 2026-01-03
**Context**: Auditing existing epics against new workspace-vault separation architecture

---

## New Architecture Summary

**Core Principle**: Workspace (code) and Vault (knowledge) are separate

**Key Rules**:
- 1 workspace → 1 vault (configured in `nori.json`)
- N workspaces → 1 vault (vault reuse encouraged)
- Vaults are named (nestle, xeenaa, family)
- Vaults live outside workspace directories (`~/vaults/`)
- Configuration file is `nori.json` (NOT `.claude/settings.json`)

**Reference**: `.claude/knowledge/vault/patterns/architecture/workspace-vault-separation.md`

---

## Epic Status Analysis

### ✅ epic-0001: Claude Code Feature Testing Suite

**Status**: LOW PRIORITY / OBSOLETE

**Scope**: Testing Claude Code features (CLAUDE.md, skills, rules, hooks, compaction)

**Alignment**: ❌ NOT ALIGNED

**Issues**:
- Focused on testing Claude Code, not building Nori
- Research/investigation work, not core product development
- API interception work may be interesting but not critical path

**Recommendation**:
- **Deprioritize** or move to research backlog
- Focus on Nori core features first
- Revisit only if needed for understanding Claude Code patterns

---

### ⚠️ epic-0002: Multi-Key Authentication System

**Status**: PARTIALLY ALIGNED (needs updates)

**Scope**: UI for managing multiple API keys (manual + OAuth)

**Alignment**: ⚠️ PARTIALLY ALIGNED

**What's Good**:
- Multi-key management is useful
- Settings panel for key management makes sense
- Key selector dropdown is good UX

**Issues**:
1. **Missing workspace context**: Keys should be workspace-aware
   - Different workspaces might use different keys
   - Work repos → company key
   - Personal repos → personal key

2. **Configuration location unclear**:
   - Epic doesn't specify where keys are stored
   - Should be global (not per-workspace)
   - Workspace `nori.json` could reference active key

3. **Conflicts with epic-0003**: Both handle auth, but different approaches

**Required Changes**:

```diff
# nori.json (workspace config)
{
  "vault": "nestle",
  "vaultPath": "~/vaults/nestle",
+ "apiKey": "work-api-key",  // Reference to global key
  "hooks": {...}
}

# Global key storage (SQLite or config file)
{
  "keys": [
    {"name": "work-api-key", "key": "sk-ant-...", "source": "manual"},
    {"name": "personal-key", "key": "sk-ant-...", "source": "manual"}
  ]
}
```

**Recommendation**:
- **Update epic** to include workspace integration
- Merge with epic-0003 (decide on auth strategy)
- Add "default key per workspace" feature

---

### ❌ epic-0003: OAuth Authentication

**Status**: CONFLICTS with epic-0002

**Scope**: Replace API key with OAuth (access + refresh tokens)

**Alignment**: ❌ CONFLICTS

**Issues**:
1. **Conflicts with epic-0002**: Multi-key management vs single OAuth
   - epic-0002: Multiple manual API keys
   - epic-0003: Single OAuth token

2. **Unclear strategy**: Should Nori support BOTH or pick one?

3. **OpenCode reference may be outdated**: OAuth for Anthropic API?

**Decision Required**:

**Option A: Multi-key only** (epic-0002 wins)
- Users manually add API keys
- No OAuth complexity
- Simpler implementation

**Option B: OAuth only** (epic-0003 wins)
- OAuth access + refresh tokens
- No manual key management
- Requires OAuth provider support from Anthropic

**Option C: Both** (merge epics)
- Users can add manual keys OR use OAuth
- OAuth is just another "key source" (manual vs oauth)
- More complex but flexible

**Recommendation**:
- **Choose Option C** (merge epics)
- Update epic-0002 to include OAuth as a key source
- Delete epic-0003 (absorbed into epic-0002)
- Rename epic-0002 to "Authentication System" (not "Multi-Key")

---

### ❌ epic-0004: Project Selector - First Screen

**Status**: CRITICALLY MISALIGNED

**Scope**: Project selector that creates `.nori` folder structure

**Alignment**: ❌ CRITICALLY MISALIGNED

**Critical Issues**:

1. **Wrong folder structure**:
   ```diff
   - .nori/.settings
   - .nori/knowledge/  ← Knowledge should NOT be in workspace
   - .nori/debug/

   + nori.json  ← Workspace config
   + .nori/epics/  ← Work artifacts only
   + .nori/temp/   ← Ephemeral files
   ```

2. **Confuses workspace and vault**:
   - Epic says "create new project initializes .nori/knowledge/"
   - New architecture: Knowledge lives in vaults, NOT workspaces

3. **Missing vault selection**:
   - Epic doesn't mention selecting/creating a vault
   - Project selector should ask: "Which vault for this workspace?"

**Required Changes**:

**Old Flow** (epic-0004):
```
1. Select folder
2. Create .nori folder
3. Initialize .nori/.settings, .nori/knowledge/, .nori/debug/
4. Open terminal in project
```

**New Flow** (corrected):
```
1. Select workspace folder (e.g., ~/work/bank-client/)
2. Ask: "Which vault should this workspace use?"
   - Select existing vault (nestle, xeenaa, family)
   - Create new vault (name + location)
3. Create nori.json with vault reference
4. Create .nori/ for work artifacts (.nori/epics/, .nori/temp/)
5. Open chat session with workspace + vault contexts loaded
```

**Recommendation**:
- **REWRITE epic completely**
- Rename to "Workspace Initialization Flow"
- Add vault selection/creation step
- Remove knowledge folder creation from workspace
- Update to use `nori.json` instead of `.nori/.settings`

---

### ⚠️ nori-mvp-001: Nori MVP

**Status**: PARTIALLY ALIGNED (needs major updates)

**Scope**: Desktop app MVP (role switcher, knowledge browser, chat, hooks)

**Alignment**: ⚠️ PARTIALLY ALIGNED

**What's Good**:
- Role switcher: ✅ No changes needed
- Chat interface: ✅ No changes needed
- Custom hooks: ✅ No changes needed (already workspace-specific)

**Critical Issues**:

1. **Knowledge Browser assumes local knowledge**:
   - Epic says: "Visual tree view of knowledge packages"
   - Question: Browsing workspace knowledge or vault knowledge?
   - Answer: Should browse VAULT (not workspace)

2. **Knowledge Editor saves to wrong location**:
   ```diff
   - Save to local `.nori/knowledge/` directory
   + Save to vault directory (e.g., ~/vaults/nestle/)
   ```

3. **Knowledge Visibility unclear**:
   - "Badge showing count of loaded packages"
   - From which vault? Multiple vaults?
   - New architecture: Only one vault per workspace

4. **Missing workspace selector**:
   - MVP should have workspace selection (like epic-0004 intended)
   - User needs to choose workspace folder BEFORE chat

5. **Vault management UI missing**:
   - No UI for creating/selecting vaults
   - No vault switcher (only workspace switcher)

**Required Updates**:

**Knowledge Browser**:
```diff
- Browse packages from `.nori/knowledge/`
+ Browse packages from active vault (~/vaults/{vault-name}/)
+ Show vault name in browser header ("Vault: nestle")
+ Allow switching vaults (changes workspace nori.json)
```

**Knowledge Editor**:
```diff
- Save to `.nori/knowledge/`
+ Save to vault directory
+ Validate package structure
+ Update vault knowledge.json index
```

**Knowledge Visibility**:
```diff
- "15 packages loaded"
+ "15 packages loaded from vault: nestle"
+ Tooltip shows vault path
```

**New Feature: Workspace Selector** (integrate epic-0004):
```
First screen on launch:
┌─────────────────────────────────┐
│  Recent Workspaces              │
│  ● bank-client (vault: nestle)  │
│    admin-panel (vault: nestle)  │
│    nori (vault: personal)       │
│                                 │
│  [Open Folder]  [New Workspace] │
└─────────────────────────────────┘
```

**New Feature: Vault Management**:
```
Settings > Vaults
┌─────────────────────────────────┐
│  Available Vaults               │
│  ● nestle      ~/vaults/nestle  │
│    xeenaa      ~/vaults/xeenaa  │
│    personal    ~/vaults/family  │
│                                 │
│  [Create Vault]  [Import Vault] │
└─────────────────────────────────┘
```

**Recommendation**:
- **Update requirements.md** to reflect workspace-vault separation
- Add workspace selector as core feature
- Add vault management UI (create, list, select)
- Update knowledge browser to target vault (not workspace)
- Update knowledge editor to save to vault
- Merge workspace initialization flow from epic-0004

---

## Summary

| Epic | Status | Action Required |
|------|--------|-----------------|
| epic-0001 | ❌ Obsolete | Deprioritize or move to research backlog |
| epic-0002 | ⚠️ Partial | Update to include workspace integration, merge with epic-0003 |
| epic-0003 | ❌ Conflicts | Merge into epic-0002, delete standalone epic |
| epic-0004 | ❌ Critical | Complete rewrite to align with workspace-vault separation |
| nori-mvp-001 | ⚠️ Partial | Major updates: workspace selector, vault management, knowledge paths |

---

## Recommended Actions

### Immediate (Today)

1. **Create new epic-0005: "Workspace-Vault Architecture Implementation"**
   - Migrate current `.claude/knowledge/vault/` to `~/vaults/nori/`
   - Create `nori.json` in workspace root
   - Update all references from `.claude/` to `.nori/`

2. **Rewrite epic-0004**:
   - New title: "Workspace Initialization & Selection"
   - Remove knowledge folder creation
   - Add vault selection/creation flow
   - Update to use `nori.json`

3. **Merge epic-0002 + epic-0003**:
   - Title: "Authentication System"
   - Support both manual keys and OAuth
   - Add workspace-specific key references

### Near-term (This Week)

4. **Update nori-mvp-001 requirements**:
   - Add workspace selector feature
   - Add vault management UI
   - Update knowledge browser to target vault
   - Update knowledge editor save path

5. **Archive epic-0001**:
   - Move to `.claude/epics/archive/`
   - Not critical path for Nori MVP

### Before Implementation

6. **Validate architecture with prototype**:
   - Manually create `~/vaults/nori/`
   - Create `nori.json` with vault reference
   - Test knowledge loading from external vault
   - Ensure workspace isolation works

---

## Open Questions for User

1. **Vault creation UX**: When user creates new workspace, should they:
   - A) Always select existing vault (no new vault creation)?
   - B) Optionally create new vault on-the-fly?
   - C) Required vault selection (block if no vaults exist)?

2. **Default vault**: Should Nori have a built-in default vault (e.g., "nori-default")?
   - Pros: Users can start immediately
   - Cons: Less explicit about vault concept

3. **Vault switching**: Should users be able to switch vaults for existing workspace?
   - Yes: Edit `nori.json` "vault" field in UI
   - No: Vault is set once during workspace creation

4. **Epic priority**: Which epic should be implemented first?
   - Option A: Authentication (epic-0002) → Needed for API access
   - Option B: Workspace selector (epic-0004) → Needed for project setup
   - Option C: Architecture migration (new epic-0005) → Needed for foundation

---

**Audit complete. Awaiting user decisions before updating epics.**
