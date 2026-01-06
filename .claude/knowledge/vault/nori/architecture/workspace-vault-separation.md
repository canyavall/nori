---
tags:
  - architecture
  - nori
  - workspace
  - vault
  - knowledge-system
  - core-concept
description: >-
  Core Nori architecture: Workspace (code context) vs Vault (knowledge storage).
  One workspace uses one vault, but multiple workspaces can share the same vault.
  Vaults are named (nestle, xeenaa, family) and stored outside workspace directories.
category: nori/architecture
required_knowledge: []
---
# Workspace-Vault Separation

Core architectural principle for Nori: Workspace and Vault are separate concerns with different purposes and lifecycles.

## Core Concepts

### Workspace (Code Context)

**Definition**: Local folder containing code that you're actively working on

**Location**: Any directory on filesystem (e.g., `~/work/bank-client/`, `~/personal/side-project/`)

**Contains**:
- Source code (`src/`, `lib/`, etc.)
- Git repository (`.git/`)
- Nori configuration (`nori.json`)
- Build configuration (`package.json`, `tsconfig.json`, etc.)
- Work artifacts (`.nori/epics/`, `.nori/temp/`)

**Purpose**:
- Code to read/edit/execute
- Git context (branch, commits, diff)
- Build/test commands
- Ephemeral state (in-progress work)

**Lifecycle**: Tied to project duration (created, modified, possibly deleted)

**Relationship**: 1 workspace → 1 vault (configured in `nori.json`)

### Vault (Knowledge Storage)

**Definition**: Named collection of knowledge packages stored outside workspace

**Location**: Separate directory outside any workspace (e.g., `~/vaults/nestle/`, `~/vaults/xeenaa/`, `~/vaults/family/`)

**Contains**:
- Knowledge packages (`.md` files organized by category)
- Vault metadata (`vault.json` or `knowledge.json`)
- Business knowledge, engineering patterns, standards

**Purpose**:
- AI context (what patterns to follow)
- Reusable knowledge across multiple workspaces
- Static reference documentation

**Lifecycle**: Long-lived, grows over time, rarely deleted

**Relationship**: 1 vault → N workspaces (many workspaces can reference same vault)

### Named Vaults

Vaults have human-readable names separate from their filesystem path.

**Examples**:
- `nestle` → `~/vaults/nestle/` (Nestlé company knowledge)
- `xeenaa` → `~/vaults/xeenaa/` (Xeenaa company knowledge)
- `family` → `~/vaults/family/` (Shared family/personal knowledge)
- `react-patterns` → `~/vaults/community/react/` (Community knowledge)

**Purpose**:
- Human-friendly references ("use nestle vault")
- Abstraction over filesystem paths
- Easier vault switching

## Architecture Diagram

```
Workspace: ~/work/bank-client/
├── src/
├── .git/
└── nori.json → vault: "nestle"

Workspace: ~/work/admin-panel/
├── src/
├── .git/
└── nori.json → vault: "nestle" (same vault!)

Workspace: ~/personal/side-project/
├── src/
├── .git/
└── nori.json → vault: "family" (different vault)

Vault (nestle): ~/vaults/nestle/
├── business/
│   ├── trading/
│   └── risk/
├── engineering/
│   ├── react-patterns/
│   └── api-design/
└── vault.json

Vault (family): ~/vaults/family/
├── tools/
├── productivity/
└── vault.json
```

## Configuration: nori.json

Each workspace has a `nori.json` file (NOT `.claude/settings.json`).

**Location**: `<workspace-root>/nori.json`

**Example**:
```json
{
  "vault": "nestle",
  "vaultPath": "~/vaults/nestle",
  "hooks": {
    "prePrompt": "node .nori/hooks/pre-prompt.mjs"
  },
  "tools": []
}
```

**Fields**:
- `vault` (string): Vault name (human-readable)
- `vaultPath` (string): Absolute or home-relative path to vault directory
- `hooks` (object): Custom hooks configuration
- `tools` (array): Custom tools configuration

## Nori Session Model

When you open Nori for a chat session:

```
User: nori chat (from ~/work/bank-client/)

Nori:
1. Detect workspace: CWD = ~/work/bank-client/
2. Read nori.json → vault: "nestle", vaultPath: "~/vaults/nestle"
3. Load vault knowledge from ~/vaults/nestle/
4. Start chat session with:
   - Workspace context: ~/work/bank-client/ (for file ops)
   - Vault context: ~/vaults/nestle/ (for knowledge)
```

**Session has TWO contexts**:
- **Workspace**: Where code lives (read/write files here)
- **Vault**: Where knowledge lives (load patterns from here)

**Example operations**:
- `Read src/Button.tsx` → reads from workspace (`~/work/bank-client/src/Button.tsx`)
- `Load react patterns` → loads from vault (`~/vaults/nestle/engineering/react-patterns/`)
- `Fix this bug` → uses workspace (code) + vault (patterns)

## Key Relationships

### 1 Workspace → 1 Vault

**Rule**: Each workspace references exactly ONE vault

**Why**:
- Avoids conflict resolution (no merging multiple vaults)
- Clear knowledge boundary
- Predictable loading behavior
- Simple mental model

**Not allowed**:
```json
// ❌ BAD: Multiple vaults
{
  "vaults": ["nestle", "personal", "community"]
}
```

**Correct**:
```json
// ✅ GOOD: Single vault
{
  "vault": "nestle"
}
```

### N Workspaces → 1 Vault

**Rule**: Multiple workspaces can share the same vault

**Why**:
- Knowledge reuse (don't duplicate patterns)
- Consistency (all Nestlé repos use nestle vault)
- Centralized updates (update vault, all workspaces benefit)

**Example**:
```
Workspaces sharing nestle vault:
- ~/work/bank-client/nori.json → vault: "nestle"
- ~/work/admin-panel/nori.json → vault: "nestle"
- ~/work/trading-app/nori.json → vault: "nestle"
- ~/work/onboarding/nori.json → vault: "nestle"
```

## Vault Duplication is Acceptable

**Principle**: Vaults are self-contained, duplication is fine

**Why**:
- Simplicity (no composition, no inheritance)
- Independence (vaults don't depend on each other)
- Tooling can sync (future: vault sync/merge tools)

**Example**:
If `react-patterns` is useful in both `nestle` and `family` vaults:
- Copy package to both vaults (duplication)
- Maintain separately (or sync with tooling later)
- Each vault is independent

**NOT**:
```json
// ❌ Don't do this (vault composition)
{
  "extends": ["base-react", "base-typescript"],
  "packages": [...]
}
```

## What Gets Stored Where

### Workspace Storage

**Directory**: `<workspace>/.nori/`

**Contents**:
- `epics/` - Work artifacts (requirements, plans, temp files)
- `temp/` - Session scratch files
- `hooks/` - Workspace-specific hooks (optional)

**NOT in workspace**:
- Knowledge packages (those go in vault)
- Cross-workspace patterns (those go in vault)

### Vault Storage

**Directory**: `~/vaults/<vault-name>/`

**Contents**:
- `business/` - Business domain knowledge
- `engineering/` - Technical patterns
- `patterns/` - Architecture patterns
- `vault.json` or `knowledge.json` - Vault metadata

**NOT in vault**:
- Code files (those stay in workspace)
- Work artifacts (epics, plans)
- Session state (temp files, chat history)
- Build artifacts (node_modules, dist/)

## Migration from Current Structure

**Current** (Claude Code style):
```
~/work/bank-client/
└── .claude/
    ├── settings.json
    └── knowledge/vault/  ← Knowledge inside workspace
```

**New** (Nori style):
```
~/work/bank-client/
└── nori.json → vault: "nestle"

~/vaults/nestle/  ← Knowledge outside workspace
├── business/
├── engineering/
└── vault.json
```

**Migration steps**:
1. Create vault directory: `mkdir -p ~/vaults/nestle`
2. Move knowledge: `mv .claude/knowledge/vault/* ~/vaults/nestle/`
3. Create nori.json: `{"vault": "nestle", "vaultPath": "~/vaults/nestle"}`
4. Remove old structure: `rm -rf .claude/knowledge/vault`

## Design Rationale

### Why Separate Workspace and Vault?

**Problem**: LLMs need knowledge, not repos. Current tools (Claude Code, OpenCode) tie knowledge to repository structure.

**Solution**: Decouple knowledge (vault) from code (workspace).

**Benefits**:
1. **Knowledge reuse**: Same vault across multiple projects
2. **Flexibility**: Work projects use company vault, personal projects use personal vault
3. **Separation of concerns**: Code organization ≠ knowledge organization
4. **Scalability**: Vaults grow independently of workspace count

### Why Named Vaults?

**Problem**: Filesystem paths are brittle (`~/vaults/company-2024-nestlé-frontend/`)

**Solution**: Human-readable names (`nestle`) that map to paths

**Benefits**:
1. **Readability**: `nori.json` says `"vault": "nestle"` not `"/Users/john/vaults/v2-nestlé-2024"`
2. **Portability**: Path can change, name stays same
3. **Clarity**: "Using nestle vault" is clearer than "using ~/vaults/abc123"

### Why 1 Workspace → 1 Vault?

**Problem**: Multiple vaults require conflict resolution, priority, merging

**Solution**: Each workspace uses exactly one vault

**Benefits**:
1. **Simplicity**: No conflict resolution needed
2. **Predictability**: Always know which knowledge is loaded
3. **Performance**: Smaller scope, faster loading

**Trade-off**: Duplication is acceptable (sync tooling can solve later)

### Why Allow N Workspaces → 1 Vault?

**Problem**: Duplicating knowledge across repos is wasteful

**Solution**: Multiple workspaces can share the same vault

**Benefits**:
1. **DRY**: Update vault once, all workspaces benefit
2. **Consistency**: All company repos use same patterns
3. **Centralized curation**: One vault to maintain

## Comparison to Other Tools

### vs. Claude Code

**Claude Code**:
```
~/repo/.claude/
├── settings.json
└── knowledge/vault/  ← Knowledge locked to repo
```

**Nori**:
```
~/repo/nori.json → vault: "nestle"
~/vaults/nestle/  ← Knowledge independent of repo
```

**Advantage**: Knowledge reuse across repos

### vs. OpenCode

**OpenCode**: No built-in knowledge system

**Nori**: Knowledge-first architecture with vault abstraction

**Advantage**: Structured, reusable knowledge

## Future: Vault Management

**Vault registry** (future):
```json
// ~/.nori/vaults.json
{
  "vaults": {
    "nestle": {
      "path": "~/vaults/nestle",
      "description": "Nestlé company knowledge",
      "created": "2026-01-03"
    },
    "xeenaa": {
      "path": "~/vaults/xeenaa",
      "description": "Xeenaa company knowledge",
      "created": "2025-12-01"
    },
    "family": {
      "path": "~/vaults/family",
      "description": "Personal/family knowledge",
      "created": "2025-11-15"
    }
  }
}
```

**CLI commands** (future):
```bash
nori vault create nestle ~/vaults/nestle
nori vault list
nori vault rename nestle nestle-2024
nori vault sync nestle xeenaa  # Sync common packages
```

## Summary

**Core principle**: Workspace (code) and Vault (knowledge) are separate concerns

**Key rules**:
- 1 workspace → 1 vault (no multiple vaults per workspace)
- N workspaces → 1 vault (vault reuse is encouraged)
- Vaults are named (nestle, xeenaa, family)
- Vaults live outside workspace directories
- Duplication is acceptable (sync tooling can help later)

**Configuration**: `nori.json` in workspace root, NOT `.claude/settings.json`

**Mental model**: Workspace is WHERE you work, Vault is WHAT you know
