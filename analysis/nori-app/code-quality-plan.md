# Code Quality Improvement Plan

**Date**: 2026-03-03
**Status**: Draft
**Scope**: Architecture, conventions, type safety, testing, hooks

This plan addresses the findings from the March 2026 code audit. Items are ordered by impact-to-effort ratio. Each item has a clear definition of done so progress is unambiguous.

---

## Priority 1 — Fix the DB layer (highest impact, root cause of many symptoms)

### Problem
`queryAll()` and `queryOne()` return `Record<string, unknown>[]`. JSON columns (`tags`, `required_knowledge`, `rules`) are stored as serialized strings in SQLite and parsed back at each call site. The pattern `JSON.parse(entry.tags as unknown as string)` appears in at least 5 hooks independently. The TypeScript conventions skill explicitly forbids `as` casting. This is a root cause, not a symptom.

### Plan

**1a. Add typed row mapper utilities in `packages/core/src/features/shared/utils/database.ts`**

Create a `mapRow<T>()` helper that deserializes a `Record<string, unknown>` into a typed object, with a declarative column spec for JSON fields:

```typescript
type ColumnSpec = {
  jsonFields?: string[];   // columns stored as JSON strings
  boolFields?: string[];   // columns stored as 0/1 integers
};

function mapRow<T>(row: Record<string, unknown>, spec: ColumnSpec): T
function mapRows<T>(rows: Record<string, unknown>[], spec: ColumnSpec): T[]
```

**1b. Create typed query helpers per domain, co-located with the flow**

Rather than calling `queryAll(db, sql)` and casting, each domain has its own query functions:

```typescript
// packages/core/src/features/knowledge/shared/knowledge-queries.ts
export function queryKnowledgeEntries(db: Database, vaultId?: string): KnowledgeEntry[]
export function queryKnowledgeEntryById(db: Database, id: string): KnowledgeEntry | null
```

These functions own the SQL, own the column spec, and return fully-typed results. No `as unknown as` at the call site.

**1c. Update all consumers**

Remove all `as unknown as` casts related to DB rows across:
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

**Definition of done:** Zero `as unknown as` casts in non-test code related to DB rows. `mapRow` is the only place JSON column parsing lives.

---

## Priority 2 — Fix migration versioning

### Problem
Migrations use `PRAGMA table_info()` to detect missing columns and add them. There is no migration version tracking. Ordering is implicit. Migrations cannot be safely composed or replayed.

### Plan

**2a. Add a `schema_migrations` table**

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**2b. Convert existing migrations to versioned functions**

```typescript
const MIGRATIONS: Array<{ version: number; up: (db: Database) => void }> = [
  { version: 1, up: (db) => { /* initial schema */ } },
  { version: 2, up: (db) => { /* add vault_type column */ } },
  { version: 3, up: (db) => { /* add description, required_knowledge, rules to knowledge_entries */ } },
];

export function runMigrations(db: Database): void {
  // create schema_migrations if not exists
  // get current version
  // apply all pending migrations in order
}
```

**2c. Remove the column-check workarounds**

The current `if (!colNames.has('vault_type'))` blocks are replaced by the versioned migration system.

**Definition of done:** `runMigrations` uses a version table. Adding a future migration is a single array entry. No PRAGMA-based column checks remain.

---

## Priority 3 — Wire the audit stub

### Problem
`knowledge-create/actions/audit-knowledge.ts` always returns `{ audit_passed: true }`. The real audit flow exists at `knowledge-audit/knowledge-audit.ts`. The step JSON claims auditing happens. It doesn't. The same applies to `check-ai-originality.ts` in the audit flow itself.

### Plan

**3a. Wire `knowledge-create/actions/audit-knowledge.ts` to call `runKnowledgeAudit()`**

The action should call the audit flow and return its result. The file path is already passed in.

```typescript
export async function auditKnowledge(
  entryId: string,
  filePath: string
): Promise<StepResult<AuditResult> | FlowError> {
  const result = await runKnowledgeAudit({ file_path: filePath });
  if (!result.success) return result;
  return {
    success: true,
    data: {
      audit_passed: result.data.status === 'pass',
      findings_count: result.data.findings.length,
    },
  };
}
```

**3b. Decide on `check-ai-originality.ts`**

This is a harder stub — it would require an LLM call. Two valid options:
- Mark it as intentionally deferred with a `// STUB(v2): LLM-based AI originality check` comment and a note in the flow CLAUDE.md
- Implement a heuristic version (pattern matching for common AI phrases) as a v1

**3c. Add stub tracking to all CLAUDE.md files**

Each flow CLAUDE.md should have a `## Known Stubs` section listing functions that are not yet implemented and the version they're planned for.

**Definition of done:** `runKnowledgeCreate` triggers a real audit. Remaining stubs are explicitly documented in the relevant CLAUDE.md.

---

## Priority 4 — Consolidate the index update paths

### Problem
Two code paths update the knowledge index:
1. `knowledge-create/actions/regenerate-index.ts` — inserts a single new entry directly into the DB
2. `knowledge-index-build` flow — scans all vault files and rebuilds the entire DB table

These can diverge. A bug in either one creates invisible inconsistency between the DB and the filesystem.

### Plan

**4a. Decide on the canonical path** (requires a decision)

Option A — Single-entry insert is canonical for mutations (create/edit/delete). Full rebuild is for integrity checks and vault registration.
Option B — All mutations go through a full rebuild. Slower but simpler consistency guarantee.

For a desktop app at current scale, Option A is reasonable. Document this decision in `analysis/nori-app/decision.md`.

**4b. Standardize the single-entry path**

If Option A is chosen, `regenerate-index.ts` in create/edit/delete should call a shared `upsertKnowledgeEntry(db, entry)` function rather than duplicating SQL. This function lives in the domain query helpers created in Priority 1.

**4c. Convert `regenerateIndex` from 11 positional arguments to an input object**

```typescript
// Before
regenerateIndex(entry_id, vault_id, file_path, title, category, tags, ...)

// After
regenerateIndex({ entry_id, vault_id, file_path, title, category, tags, ... })
```

This is also a TypeScript conventions violation (the skill sets a 3-arg maximum before switching to an object).

**Definition of done:** One function owns single-entry DB upsert. The 11-arg signature is gone.

---

## Priority 5 — Split large hooks using the sideHooks pattern

### Problem
`useKnowledgeDetailSection` is 285 lines handling: loading, viewing, editing (with SSE), auditing, deleting (with SSE), and navigation. `useRepoExtractDialog` is 285 lines handling: state machine, SSE conversation, proposals management, and sequential saves. Both violate the hook-patterns skill's complexity levels and the sideHooks extraction pattern.

### Plan

**5a. Split `useKnowledgeDetailSection` into three sideHooks**

```
useKnowledgeDetailSection.hook.ts          # orchestrator, ~60 lines
  ├── useKnowledgeDetailLoad.hook.ts       # onMount fetch, entry state, JSON normalization
  ├── useKnowledgeDetailEdit.hook.ts       # edit mode, SSE save, audit step
  └── useKnowledgeDetailDelete.hook.ts     # delete confirmation, SSE delete, navigation
```

The orchestrator imports all three and composes their return values.

**5b. Split `useRepoExtractDialog` into two sideHooks**

```
useRepoExtractDialog.hook.ts               # orchestrator, ~60 lines
  ├── useRepoExtractConversation.hook.ts   # scanning, SSE, conversation state
  └── useRepoExtractProposals.hook.ts      # proposals editing, save loop
```

**5c. Fix the `handleSkipQuestions` bug**

Current code calls `handleReply()` with an empty string (which returns early), then sets `userReply()` and calls `handleReply()` again via setTimeout. The first call is dead code. Simplify to:

```typescript
function handleSkipQuestions() {
  setUserReply('Please skip the questions and generate proposals with your best judgment.');
  handleReply();
}
```

**Definition of done:** No hook file exceeds 200 lines. `handleSkipQuestions` bug is fixed.

---

## Priority 6 — Standardize event naming

### Problem
Knowledge flows use `knowledge:create:started` (colon-separated, domain has no hyphens). Repo extract uses `repo-extract:scanning` (domain has a hyphen, different separator count). CLAUDE.md states colons as the separator but doesn't address domain naming.

### Plan

**6a. Establish the canonical convention**

`{domain}:{flow}:{step}` where domain matches the folder name. Since the folder is `repo-knowledge-extract`, options are:
- `repo-knowledge-extract:started` — matches folder exactly, verbose
- `repo-extract:started` — shorthand, already in use, inconsistent with folder name

Pick one and document it in the root CLAUDE.md.

**6b. Update all events in `repo-knowledge-extract`**

If the canonical is chosen, update the emitter calls in `repo-knowledge-extract.ts` and the SSE event handlers in `RepoExtractDialog.hook.ts` and the server route.

**Definition of done:** All SSE events follow a documented, consistent pattern. Root CLAUDE.md states the rule with an example.

---

## Priority 7 — Add error boundaries

### Problem
SolidJS supports `<ErrorBoundary>`. None exist in the codebase. An uncaught component error in any section propagates to a blank screen with no recovery path.

### Plan

**7a. Wrap each page in a basic `<ErrorBoundary>`**

```tsx
<ErrorBoundary fallback={(err) => <PageError message={err.message} />}>
  <KnowledgeDetailSection />
</ErrorBoundary>
```

**7b. Create a reusable `<PageError>` component**

Simple — shows the error message and a "Go back" button.

**Definition of done:** Every page-level component is wrapped in an `<ErrorBoundary>`.

---

## Priority 8 — Add integration tests for three critical flows

### Problem
The most important user-facing flows — vault registration, knowledge create, knowledge search — have no end-to-end tests. Tests exist at the unit level but nothing verifies that routes, core flows, and DB work together.

### Plan

**8a. Set up an integration test harness**

In `packages/server`, create a `tests/integration/` folder with a helper that:
- Starts the Hono app with an in-memory sql.js DB
- Provides typed request helpers
- Cleans up between tests

**8b. Write integration tests for three flows**

1. `POST /api/vault` → `runVaultRegistration` → DB has vault, files cloned
2. `POST /api/knowledge` → `runKnowledgeCreate` → DB has entry, file written
3. `GET /api/knowledge/search?q=X` → `runKnowledgeSearch` → results returned

**Definition of done:** Three integration tests pass in CI. They use a real (in-memory) DB, not mocks.

---

## Priority 9 — Resolve the `.style.ts` gap

### Problem
The styling conventions skill mandates `.style.ts` files for dynamic/theme-dependent styles. One file exists. The skill either needs to be followed or updated.

### Plan

**Decide (team decision required):**

Option A — Adopt `.style.ts` fully. Add style hooks to components with dynamic classes (e.g., anything with `classList`, conditional Tailwind strings, theme-dependent values). Update the simplify skill to flag missing style files.

Option B — Update the skill to state that Tailwind-only is acceptable for components with fewer than 5 dynamic style conditions. Reserve `.style.ts` for components using theme tokens or complex dynamic logic.

**Definition of done:** The skill and the codebase agree. No gap between documented convention and practice.

---

## Execution order

| Phase | Items | Goal |
|---|---|---|
| Phase 1 | 1 (DB layer), 4c (11-arg function) | Eliminate `as unknown as`. Highest-impact, self-contained |
| Phase 2 | 2 (migrations), 3 (audit stub), 6 (event naming) | Correctness and consistency |
| Phase 3 | 5 (hook splits), 7 (error boundaries) | Maintainability and resilience |
| Phase 4 | 8 (integration tests), 9 (style decision) | Coverage and convention alignment |

Phase 1 should be done first because the DB layer fix unblocks several downstream improvements and eliminates the most widespread convention violation.
