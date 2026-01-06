---
tags:
  - knowledge-system
  - roles
  - preloading
  - session-management
  - shared-namespace
description: >-
  Role-based knowledge preloading with session state tracking and shared
  namespace
category: meta/knowledge-system
required_knowledge:
  - knowledge-loading-system
---
# Knowledge Role System

**Category**: Meta / Knowledge System
**Audience**: AI agents, developers
**Purpose**: Role-based knowledge preloading with session state tracking

## Overview

The role system allows team members to preload role-specific knowledge packages at session start, with automatic deduplication via session state tracking.

## Architecture

```
User Role (settings.json)
    ↓
/role command
    ↓
load-role.mjs script
    ↓
Session Manager (checks loaded packages)
    ↓
Load only new packages
    ↓
Update session state
```

## Available Roles

### Frontend Developer (fe-dev)
**Packages**: 18 packages
**Focus**: React, TypeScript, forms, state management, testing

**Includes**:
- **Shared**: code-conventions, api-contracts, git-workflow
- **Core**: React patterns, TypeScript, routing, i18n
- **Forms**: Yoda Form basics, fields, validation
- **State**: Sygnum Store, Sygnum Query
- **UI**: Sygnum UI, SUIL components
- **Testing**: Jest, RTL, mocking, providers

### Backend Developer (be-dev)
**Packages**: 12 packages
**Focus**: API design, TypeScript, testing

**Includes**:
- **Shared**: code-conventions, api-contracts, git-workflow
- **TypeScript**: Project conventions, pitfalls
- **API**: Query architecture, mutations
- **Testing**: Core, mocking
- **Tooling**: NX, linting

### QA Engineer (qa)
**Packages**: 17 packages
**Focus**: Testing, QA scenarios, quality assurance

**Includes**:
- **Shared**: code-conventions, api-contracts, git-workflow
- **Testing**: Core, components, mocking, providers, checklist
- **QA Scenarios**: Fundamentals, heuristics, examples, antipatterns
- **Context**: Component structure, forms, routing, i18n

### Product Owner (po)
**Packages**: 16 packages
**Focus**: Feature understanding, acceptance criteria, UX

**Includes**:
- **Shared**: code-conventions, api-contracts, git-workflow
- **Components**: Structure, implementation patterns
- **QA**: Scenarios, fundamentals, heuristics
- **UX**: Routing, forms, UI components, i18n

### Site Reliability Engineer (sre)
**Packages**: 10 packages
**Focus**: Infrastructure, observability, performance

**Includes**:
- **Shared**: code-conventions, api-contracts, git-workflow
- **Infrastructure**: NX conventions, Vite proxy, Storybook
- **Performance**: Query optimization, cache configuration
- **Quality**: Testing, linting

## Configuration

### User Settings (`.claude/knowledge/settings.json`)

**Gitignored** - Each developer has their own:

```json
{
  "role_preload": {
    "enabled": true,
    "role": "fe-dev"
  }
}
```

**Available roles**: `fe-dev`, `be-dev`, `qa`, `po`, `sre`

### Role Definitions (`knowledge.json`)

Roles defined centrally in `knowledge.json`:

```json
{
  "roles": {
    "fe-dev": {
      "name": "Frontend Developer",
      "packages": ["shared-code-conventions", "api-contracts", ...]
    }
  }
}
```

## Session State Tracking

**Purpose**: Prevent duplicate loading within a session

**File**: `.claude/knowledge/tracker/session-state.json` (gitignored)

**Structure**:
```json
{
  "session_id": "session-2025-12-22T10-30-00",
  "started_at": "2025-12-22T10:30:00.000Z",
  "loaded_packages": ["shared-code-conventions", "api-contracts", ...]
}
```

**Lifecycle**:
1. Session starts → `session-manager.mjs init` → state cleared
2. `/role` command → loads packages → updates state
3. Task-specific hooks → check state → skip already-loaded → load new ones
4. Session cleared on restart or `/clear`

## Usage Flow

### 1. Initial Setup

```bash
# Copy settings template
cp .claude/knowledge/settings.json.example .claude/knowledge/settings.json

# Edit to set your role
{
  "role_preload": {
    "enabled": true,
    "role": "fe-dev"  # or be-dev, qa, po, sre
  }
}
```

### 2. Load Role Knowledge

```bash
# In Claude Code session
/role
```

**What happens**:
1. Reads your role from settings.json
2. Gets package list from knowledge.json
3. Checks session state for already-loaded packages
4. Loads only new packages (skips duplicates)
5. Updates session state with loaded packages

### 3. Task-Specific Loading

When hooks prompt to load additional packages:
- Session state is checked first
- Already-loaded packages skipped
- Only new packages loaded

**Example**:
```
Session start:
  /role → loads 26 fe-dev packages → session state updated

Work on forms task:
  Hook says load yoda-form-advanced
  Session check: yoda-form-basics already loaded ✓
  Load: only yoda-form-advanced (new)
```

## Scripts

### `session-manager.mjs`

**Commands**:
- `init` - Initialize new session (clears state)
- `add <packages>` - Add packages to loaded list
- `check <packages>` - Check if packages loaded
- `list` - List all loaded packages
- `clear` - Clear session state
- `filter <packages>` - Filter out already-loaded packages

**Usage**:
```bash
node .claude/knowledge/scripts/session-manager.mjs init
node .claude/knowledge/scripts/session-manager.mjs add pkg1,pkg2
node .claude/knowledge/scripts/session-manager.mjs list
```

### `load-role.mjs`

**Purpose**: Load knowledge packages for configured role

**Usage**:
```bash
# Use role from settings.json
node .claude/knowledge/scripts/load-role.mjs

# Override role
node .claude/knowledge/scripts/load-role.mjs --role qa
```

**Output**: JSON with role info and package paths
```json
{
  "role": "fe-dev",
  "packages_to_load": 18,
  "already_loaded": 8,
  "knowledge_paths": ["path1.md", "path2.md", ...]
}
```

## Shared Namespace

**Purpose**: Cross-cutting knowledge all roles need

**Location**: `.claude/knowledge/vault/shared/`

**Categories**:
- `shared/api-contracts` - API standards for FE + BE
- `shared/standards` - Universal code conventions
- `shared/tooling` - Git workflow, shared tools

**Packages**:
- `api-contracts` - API contract standards (FE, BE, QA)
- `shared-code-conventions` - Universal coding standards (all)
- `git-workflow` - Git/PR workflow (all)

**Rationale**:
- Avoids duplication across roles
- Single source of truth for cross-team standards
- FE devs need API contracts, BE devs need FE integration patterns

## Session Hooks

### SessionStart Hook

**File**: `.claude/knowledge/hooks/session-start-cleanup.mjs`

**Actions**:
1. Clears tracking JSONL files
2. Initializes session manager (clears loaded packages)

**Runs**: Automatically when Claude Code starts

### Example Session Flow

```
1. Start Claude Code
   → SessionStart hook runs
   → session-manager.mjs init
   → Session state cleared

2. User runs /role
   → load-role.mjs reads settings.json (role: fe-dev)
   → Checks session state (empty)
   → Returns 26 packages to load
   → Agent reads all 26 files
   → session-manager.mjs add <26 packages>
   → Session state: 26 packages loaded

3. User works on forms task
   → Hook says load yoda-form-advanced
   → session-manager.mjs filter yoda-form-advanced
   → Returns: not loaded, load it
   → Agent loads yoda-form-advanced
   → session-manager.mjs add yoda-form-advanced
   → Session state: 27 packages

4. User works on routing task
   → Hook says load react-router-basics
   → session-manager.mjs filter react-router-basics
   → Returns: already loaded (from /role), skip
   → No redundant loading
```

## Benefits

1. **Faster session start**: Preload common packages once
2. **No duplicate loading**: Session tracking prevents waste
3. **Role-appropriate context**: FE devs get FE knowledge, BE gets BE
4. **Shared knowledge access**: All roles get cross-team standards
5. **Namespace clarity**: `shared/` for cross-cutting, `frontend/` for FE-specific

## Package Counts

| Role | Packages |
|------|----------|
| FE Dev | 18 |
| BE Dev | 12 |
| QA | 17 |
| PO | 16 |
| SRE | 10 |

## Related Knowledge

- `knowledge-loading-system` - How agents load knowledge
- `knowledge-tracking` - Tracking what's loaded
- `session-manager.mjs` - Session state management
- `load-role.mjs` - Role loading script

## Tags

knowledge-system, roles, preloading, session-management, shared-namespace
