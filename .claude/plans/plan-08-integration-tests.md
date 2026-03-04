# Plan 08 — Add Integration Tests for Critical Flows

**Phase**: 4
**Status**: pending

## Problem

Vault registration, knowledge create, and knowledge search have no end-to-end tests. Unit tests exist but nothing verifies that routes, core flows, and DB work together.

## Tasks

### 8a. Set up integration test harness

**Location**: `packages/server/tests/integration/`

Helper that:
- Starts the Hono app with an in-memory sql.js DB
- Provides typed request helpers
- Cleans up between tests

### 8b. Write three integration tests

1. `POST /api/vault` → `runVaultRegistration` → DB has vault, files cloned
2. `POST /api/knowledge` → `runKnowledgeCreate` → DB has entry, file written
3. `GET /api/knowledge/search?q=X` → `runKnowledgeSearch` → results returned

## Definition of Done

- Three integration tests pass in CI
- They use a real (in-memory) DB, not mocks
