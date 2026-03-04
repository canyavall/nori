# Plan 02 — Fix Migration Versioning

**Phase**: 2
**Status**: pending

## Problem

Migrations use `PRAGMA table_info()` to detect missing columns. No version tracking. Ordering is implicit. Cannot be safely composed or replayed.

## Tasks

### 2a. Add `schema_migrations` table

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 2b. Convert existing migrations to versioned functions

```typescript
const MIGRATIONS: Array<{ version: number; up: (db: Database) => void }> = [
  { version: 1, up: (db) => { /* initial schema */ } },
  { version: 2, up: (db) => { /* add vault_type column */ } },
  { version: 3, up: (db) => { /* add description, required_knowledge, rules */ } },
];

export function runMigrations(db: Database): void {
  // create schema_migrations if not exists
  // get current version
  // apply all pending migrations in order
}
```

### 2c. Remove column-check workarounds

The current `if (!colNames.has('vault_type'))` blocks are replaced by the versioned system.

## Definition of Done

- `runMigrations` uses a version table
- Adding a future migration is a single array entry
- No PRAGMA-based column checks remain
