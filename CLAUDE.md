# Nori App

Cross-platform desktop application for AI-assisted development with knowledge vault management.

## Architecture

Monorepo with four packages connected by contracts:

```
packages/
  core/     @nori/core    — Pure TypeScript engine (flows, sessions, vault, knowledge, LLM)
  server/   @nori/server  — Hono REST API + SSE (imports core)
  app/      @nori/app     — Tauri desktop shell + SolidJS UI
  shared/   @nori/shared  — Types, Zod schemas, SSE event maps, contracts
```

## Tech Stack

- **Runtime**: Bun (dev), Node >= 20 (core/server compatible)
- **Desktop**: Tauri 2 (Rust)
- **Frontend**: SolidJS + Kobalte + Tailwind CSS v4
- **Server**: Hono + SSE
- **Database**: sql.js (WASM SQLite) in core, better-sqlite3 optional in app
- **Git**: isomorphic-git (pure JS)
- **LLM**: Vercel AI SDK (multi-provider)
- **Validation**: Zod
- **Monorepo**: Turbo

## Flow System

Nori uses a **split flow architecture** (see `analysis/nori-app/flow-architecture.md`):

- **Backend flows** live in `packages/core/src/features/{domain}/{flow-name}/` with `steps/` (JSON) and `actions/` (TypeScript) folders next to each other.
- **Frontend flows** live in `packages/app/src/features/{domain}/{flow-name}/` with `steps/` (JSON) and component files next to each other.
- **Contracts** in `packages/shared/src/contracts/` connect FE and BE flows.

### Flow rules

1. Every flow has a `steps/` folder with numbered JSON files (`01-step-name.json`)
2. Backend step types: `action` (runs a function) or `flow_call` (delegates to another flow)
3. Frontend step types: `ui_action` (renders component), `validation` (client check), `api_call` (bridge to backend)
4. Feature names match across packages: `core/features/vault/vault-pull/` ↔ `app/features/vault/vault-sync-panel/`
5. The `api_call` step in FE references a contract in `@nori/shared` — this is the only coupling

### Step JSON format (backend)

```json
{
  "type": "action",
  "what": "Human-readable description",
  "why": "Reason this step exists",
  "where": {
    "entry_point": "features/{domain}/{flow}/{flow}.ts",
    "implementation": "features/{domain}/{flow}/actions/{step}.ts"
  },
  "output": { "console": false, "file": false },
  "success_handling": { "criteria": "...", "event": { "action": "...", "status": "success", "message": "...", "data_fields": [] } },
  "error_handling": [{ "scenario": "...", "criteria": "...", "action": "...", "severity": "...", "recoverable": true }],
  "decisions": [{ "date": "YYYY-MM-DD", "reason": "...", "rationale": "..." }],
  "calls": ["path/to/action"]
}
```

### Step JSON format (frontend)

```json
{
  "type": "ui_action|validation|api_call",
  "what": "...",
  "why": "...",
  "where": { "component": "features/{domain}/{flow}/{Component}.tsx" },
  "ui": { "renders": "form|display|editor|form+editor|dialog", "fields": [], "validation_schema": "@nori/shared:schemaName" },
  "transitions": { "on_valid": "next_step", "on_cancel": "close_dialog" },
  "contract": { "endpoint": "METHOD /api/path", "request_type": "...", "response_type": "...", "sse_events": [] },
  "error_handling": [],
  "decisions": []
}
```

### Transition target types (frontend)

Transition values can be:

| Pattern | Example | Meaning |
|---------|---------|---------|
| Step reference | `"02-show-form"` | Go to another step in the same flow |
| Navigation | `"navigate:/knowledge/{entry_id}"` | Client-side route navigation with param interpolation |
| Navigate back | `"navigate_back"` | Go to previous page in browser history |
| Close dialog | `"close_dialog"` | Close the current dialog/wizard |

## Package-specific guidance

See each package's CLAUDE.md:
- `packages/core/CLAUDE.md` — Backend flows, actions, orchestrators
- `packages/server/CLAUDE.md` — Routes, SSE, middleware
- `packages/app/CLAUDE.md` — SolidJS components, frontend flows, stores
- `packages/shared/CLAUDE.md` — Contracts, types, schemas

## Analysis

Design decisions and competitive analysis in `analysis/nori-app/`:
- `decision.md` — Tech stack decision
- `flow-architecture.md` — Flow system architecture
- `flow-proposals.md` — The three proposals evaluated
- `proposals.md` — The three tech stack proposals
- `nori.txt` — Original feature specification
