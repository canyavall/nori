---
tags:
  - architecture
  - nori
  - decisions
  - workspace
  - vault
  - core-concept
  - product
description: >-
  Core architectural decisions for Nori: workspace-vault separation rationale,
  atomic vault model (no composition), configuration file naming (nori.json),
  workspace linking UX (not project creation), and implementation priorities
category: nori/architecture
required_knowledge: ["workspace-vault-separation"]
---
# Nori Architecture Decisions

Foundational architectural decisions that define Nori's core design. These decisions differentiate Nori from Claude Code and OpenCode.

## Decision Log

### Decision 1: Workspace-Vault Separation

**Date**: 2026-01-03
**Status**: ✅ APPROVED

**Problem**: Current AI coding tools (Claude Code, OpenCode) tie knowledge to repository structure (1 repo = 1 knowledge boundary). This forces duplication when multiple repos need same knowledge.

**Decision**: Separate workspace (code context) from vault (knowledge storage).

**Rationale**:
- LLMs need knowledge, not repos
- Knowledge should be reusable across multiple projects
- Code organization ≠ knowledge organization (orthogonal concerns)

**Implications**:
- 1 workspace → 1 vault (configured in nori.json)
- N workspaces → 1 vault (vault reuse encouraged)
- Vaults stored outside workspace directories (~/vaults/)

**Alternatives Considered**:
- ❌ **Keep knowledge in workspace** (.nori/knowledge/)
  - Rejected: Forces duplication, couples knowledge to code
- ❌ **Multiple vaults per workspace** (composable vaults)
  - Rejected: Adds complexity (conflict resolution, priority ordering)

**Reference**: `.claude/knowledge/vault/patterns/architecture/workspace-vault-separation.md`

---

### Decision 2: Atomic Vault Model (No Composition)

**Date**: 2026-01-03
**Status**: ✅ APPROVED

**Problem**: Should vaults be composable (vault extends other vaults) or atomic (self-contained)?

**Decision**: Atomic vaults. Each vault is self-contained, no extends/inheritance.

**Rationale**:
- Simplicity (no merging, no conflict resolution)
- Independence (vaults don't depend on each other)
- Future sync tooling can handle duplication

**Trade-offs**:
- ✅ Simple mental model
- ✅ No dependency graph complexity
- ❌ Knowledge duplication acceptable

**Example**:
```json
// ❌ REJECTED: Composable vaults
{
  "extends": ["base-react", "base-typescript"],
  "packages": [...]
}

// ✅ APPROVED: Atomic vault
{
  "name": "nestle",
  "packages": [...],  // Includes all packages, even if duplicated elsewhere
  "created": "2026-01-03"
}
```

**Future**: Vault sync tooling can copy packages between vaults to reduce manual duplication.

---

### Decision 3: Configuration File Naming

**Date**: 2026-01-03
**Status**: ✅ APPROVED

**Problem**: What should the workspace configuration file be named?

**Decision**: `nori.json` (NOT `.claude/settings.json` or `.nori/settings.json`)

**Rationale**:
- Nori is the product name (branding)
- Flat file in workspace root (easy to find)
- JSON format (familiar, tooling-friendly)

**Alternatives Considered**:
- ❌ `.claude/settings.json` - Wrong branding (this is Nori, not Claude Code)
- ❌ `.nori/settings.json` - Adds directory nesting (unnecessary)
- ❌ `.norirc` or `.nori.yaml` - Less familiar formats

**Schema**:
```json
{
  "vault": "nestle",
  "vaultPath": "~/vaults/nestle",
  "hooks": {},
  "tools": []
}
```

---

### Decision 4: Workspace Linking (Not Project Creation)

**Date**: 2026-01-03
**Status**: ✅ APPROVED

**Problem**: Should Nori "create projects" or "link existing workspaces"?

**Decision**: Link existing workspaces (users already have code folders).

**Rationale**:
- Users already have code in ~/work/repo/
- "Link workspace" feels lightweight (not ownership transfer)
- Works with existing repos (no migration)
- Nori is a tool, not a project manager

**UX Flow**:
```
Old (rejected): Create Project
  → Name: "bank-client"
  → Location: ~/work/bank-client/ (creates folder)
  → Vault: nestle
  → [Create]

New (approved): Link Workspace
  → Select folder: ~/work/bank-client/ (already exists)
  → Select vault: nestle
  → [Link]
  → Creates nori.json in existing folder
```

**Terminology**:
- ✅ "Workspace" (existing folder with code)
- ✅ "Link" (associate workspace with vault)
- ❌ "Project" (implies Nori owns the folder)
- ❌ "Create" (implies making new folder)

---

### Decision 5: No Default Vault

**Date**: 2026-01-03
**Status**: ✅ APPROVED

**Problem**: Should Nori ship with a default vault for zero-config start?

**Decision**: No default vault. Users must create their first vault.

**Rationale**:
- We don't know what knowledge to include (company-specific)
- Forces intentional vault naming (nestle, xeenaa, personal)
- Empty state guides user: "Create your first vault to get started"

**First-time UX**:
```
1. Launch Nori
2. Empty state: "Create your first vault to get started"
3. [Create Vault] → Name: personal, Path: ~/vaults/personal
4. [Link Workspace] → Select folder + vault
5. Start chatting
```

**Alternative Rejected**: Ship with "nori-default" vault
- Why rejected: Users would accumulate knowledge in default vault without thinking about organization

---

### Decision 6: Vault Switching Allowed

**Date**: 2026-01-03
**Status**: ✅ APPROVED

**Problem**: Can users change which vault a workspace uses after linking?

**Decision**: Yes, vault switching is allowed (updates nori.json).

**Rationale**:
- Users may realize they chose wrong vault
- Work projects might switch from personal to company vault
- Flexibility is valuable

**Behavior**:
1. User selects different vault from dropdown
2. Nori asks: "Change vault for workspace 'bank-client'?"
   - ⚠️ This will update nori.json
   - ⚠️ All tabs using bank-client will reload
3. User confirms
4. Update nori.json → vault field
5. Reload all affected tabs

**Impact**: If multiple tabs use same workspace, all tabs reload (cross-tab communication via event bus).

**Reference**: `.claude/knowledge/vault/patterns/ux/multi-tab-workspace-vault-ux.md`

---

### Decision 7: Named Vaults with Path Mapping

**Date**: 2026-01-03
**Status**: ✅ APPROVED

**Problem**: How should vaults be referenced?

**Decision**: Human-readable names (nestle, xeenaa, family) that map to filesystem paths.

**Rationale**:
- Names are portable (path can change)
- Clearer in UI ("Using vault: nestle" vs "Using vault: ~/vaults/abc123")
- Easy to remember and communicate

**Configuration**:
```json
// Global registry: ~/.nori/config.json
{
  "vaults": [
    {"name": "nestle", "path": "~/vaults/nestle"},
    {"name": "xeenaa", "path": "~/vaults/xeenaa"},
    {"name": "personal", "path": "~/vaults/family"}
  ]
}

// Workspace config: nori.json
{
  "vault": "nestle",  // Name (human-readable)
  "vaultPath": "~/vaults/nestle"  // Path (for quick access)
}
```

**Benefits**:
- Vault can be moved (update global config, workspaces use name)
- Clear in UI and conversations ("Using nestle vault")

---

## Implementation Priorities

### Phase 1: Foundation (Week 1)

**Epic-0005**: Workspace-Vault Architecture Implementation

**Scope**:
1. Migrate current nori workspace
   - Create ~/vaults/nori/
   - Move .claude/knowledge/vault/ → ~/vaults/nori/
   - Create nori.json in workspace root

2. Update code to read from vault path
   - Knowledge search from vault (not workspace)
   - Knowledge editor saves to vault
   - Knowledge browser shows vault packages

3. Global vault registry
   - ~/.nori/config.json with vault list
   - Workspace linking (create nori.json)

### Phase 2: Workspace UX (Week 2)

**Epic-0004 (Rewrite)**: Workspace Initialization & Selection

**Scope**:
1. Workspace selector UI (first screen)
   - Show recent workspaces
   - Link new workspace button

2. Vault creation UI
   - Create vault modal (name + path)
   - Vault validation

3. Workspace linking flow
   - Folder picker
   - Vault selector dropdown
   - Create nori.json

### Phase 3: MVP Updates (Week 3)

**Epic nori-mvp-001 (Update)**: Update MVP features

**Scope**:
1. Knowledge browser targets vault (not workspace)
2. Vault management UI (create, list, select)
3. Multi-tab support (tab state model)
4. Vault switching UI (dropdown in knowledge browser)

---

## Comparison to Other Tools

### vs. Claude Code

**Claude Code**:
```
~/repo/.claude/
├── settings.json
└── knowledge/vault/  ← Knowledge tied to repo
```

**Nori**:
```
~/repo/nori.json → vault: "nestle"
~/vaults/nestle/  ← Knowledge independent of repo
```

**Advantage**: Knowledge reuse across repos

### vs. OpenCode

**OpenCode**: No built-in knowledge system

**Nori**: Knowledge-first architecture
- Named vaults
- Workspace-vault separation
- Visual knowledge browser

**Advantage**: Structured, reusable knowledge

---

## Open Questions (Deferred)

These questions are documented but NOT blocking for MVP:

1. **Vault versioning**: How to handle vault updates that break workspaces?
   - Future: Lock files per workspace (like package.json → package-lock.json)

2. **Vault sharing**: How to share vaults with team members?
   - Future: Git-based sync, S3 sync, or hosted vault service

3. **Vault permissions**: Who can edit company vault?
   - Future: Permissions system (read-only vs read-write vaults)

4. **Multi-tab same workspace**: Should Nori warn?
   - Decision: Show info badge, don't block

5. **Tab persistence**: Restore tabs on launch?
   - Decision: No for MVP, add in v1.0

---

## Summary

**Core decisions**:
1. ✅ Workspace-vault separation (not repo-bound)
2. ✅ Atomic vaults (no composition)
3. ✅ Configuration: nori.json (not .claude/settings.json)
4. ✅ Link workspaces (don't create projects)
5. ✅ No default vault (user creates first vault)
6. ✅ Vault switching allowed (updates nori.json)
7. ✅ Named vaults (nestle, xeenaa, family)

**Implementation order**:
1. epic-0005: Architecture migration (this workspace)
2. epic-0004: Workspace selector + linking UX
3. nori-mvp-001: Update MVP features for new architecture

**Key differentiator**: Nori is knowledge-first, not repo-first. Vaults are the source of truth, workspaces reference them.
