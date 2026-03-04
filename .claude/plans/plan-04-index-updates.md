# Plan 04 — Consolidate Index Update Paths

**Phase**: 1 (4c) + 2 (4a, 4b)
**Status**: pending
**Convention violated**: TypeScript conventions skill — 3-arg maximum before switching to object

## Problem

Two code paths update the knowledge index:
1. `knowledge-create/actions/regenerate-index.ts` — inserts a single entry directly into DB
2. `knowledge-index-build` flow — scans all vault files and rebuilds the entire DB table

These can diverge silently. `regenerateIndex` also takes 11 positional arguments.

## Tasks

### 4a. Decide on the canonical update path

**Decision**: Option A (single-entry insert is canonical for mutations; full rebuild for integrity checks).
Document in `analysis/nori-app/decision.md`.

### 4b. Standardize the single-entry path

Create `upsertKnowledgeEntry(db, entry)` in the domain query helpers from Plan 01.
`regenerate-index.ts` in create/edit/delete all call this shared function instead of duplicating SQL.

### 4c. Convert `regenerateIndex` to an input object (Phase 1)

```typescript
// Before
regenerateIndex(entry_id, vault_id, file_path, title, category, tags, ...)

// After
regenerateIndex({ entry_id, vault_id, file_path, title, category, tags, ... })
```

This is the highest-priority sub-task — do it in Phase 1 alongside Plan 01.

## Definition of Done

- One function (`upsertKnowledgeEntry`) owns single-entry DB upsert
- The 11-arg signature is gone
- Decision is documented
