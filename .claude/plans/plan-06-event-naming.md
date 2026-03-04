# Plan 06 — Standardize SSE Event Naming

**Phase**: 2
**Status**: pending

## Problem

- Knowledge flows: `knowledge:create:started` (colon-separated, no hyphens in domain)
- Repo extract: `repo-extract:scanning` (domain has hyphen, different separator count)
- CLAUDE.md documents colons as separator but doesn't address domain naming

## Tasks

### 6a. Establish canonical convention

Format: `{domain}:{flow}:{step}` where domain matches the folder name.

Folder is `repo-knowledge-extract`, so options:
- `repo-knowledge-extract:started` — exact folder match, verbose
- `repo-extract:started` — shorthand, already in use, inconsistent

**Decision needed**: pick one and document it in the root CLAUDE.md with an example.

### 6b. Update all events in `repo-knowledge-extract`

If canonical is chosen:
- Update emitter calls in `repo-knowledge-extract.ts`
- Update SSE event handlers in `RepoExtractDialog.hook.ts`
- Update the server route

## Definition of Done

- All SSE events follow a documented, consistent pattern
- Root CLAUDE.md states the rule with an example
