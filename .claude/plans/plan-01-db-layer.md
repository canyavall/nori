# Plan 01 — Fix the DB Layer

**Phase**: 1 (highest priority)
**Status**: pending
**Convention violated**: TypeScript conventions skill — forbids `as` casting

## Problem

`queryAll()` and `queryOne()` return `Record<string, unknown>[]`. JSON columns (`tags`, `required_knowledge`, `rules`) are serialized strings in SQLite parsed at every call site. The pattern `JSON.parse(entry.tags as unknown as string)` appears in at least 5 hooks independently.

## Tasks

### 1a. Create `mapRow<T>()` helpers

**File**: `packages/core/src/features/shared/utils/database.ts`

```typescript
type ColumnSpec = {
  jsonFields?: string[];
  boolFields?: string[];
};

function mapRow<T>(row: Record<string, unknown>, spec: ColumnSpec): T
function mapRows<T>(rows: Record<string, unknown>[], spec: ColumnSpec): T[]
```

### 1b. Create typed query helpers per domain

**File**: `packages/core/src/features/knowledge/shared/knowledge-queries.ts`

```typescript
export function queryKnowledgeEntries(db: Database, vaultId?: string): KnowledgeEntry[]
export function queryKnowledgeEntryById(db: Database, id: string): KnowledgeEntry | null
```

These own the SQL, the column spec, and return fully-typed results. No `as unknown as` at call sites.

### 1c. Update all consumers

Remove all `as unknown as` casts related to DB rows in:
- `KnowledgeDetailSection.hook.ts`
- `KnowledgeDetailPanel.hook.ts`
- `KnowledgeEditDialog.hook.ts`
- `VaultDetailSection.hook.ts`
- `VaultKnowledgeTree.hook.ts`
- `session-archive/actions/check-active.ts`
- `session-create/actions/check-active-session.ts`
- `session-resume/actions/validate-session-exists.ts`
- `vault-audit/actions/load-all-entries.ts`
- `vault-vector-embedding/actions/load-knowledge-entries.ts`

## Definition of Done

- Zero `as unknown as` casts in non-test code related to DB rows
- `mapRow` is the only place JSON column parsing lives
