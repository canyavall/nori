# Nori App - Flow Architecture Decision

**Date**: 2026-02-18
**Status**: Approved
**Choice**: Proposal 2 — Split Flows (FE flows + BE flows, connected by contracts)

---

## Decision

Two independent flow systems, each living next to its own code:

- **Backend flows** in `@nori/core` — KV-style. Docs + actions in the same folder.
- **Frontend flows** in `@nori/app` — UI-style. Docs + components in the same folder.
- **Contracts** in `@nori/shared` — types, Zod schemas, and SSE event maps that both sides agree on.

Neither side imports the other's flow definitions. They communicate through HTTP + SSE, and the contract in `@nori/shared` is the only coupling.

## Why Proposal 2 over the others

| | Proposal 1 (BE only) | **Proposal 2 (Split)** | Proposal 3 (Unified) |
|---|---|---|---|
| FE logic documented | No | **Yes** | Yes |
| Docs next to code | BE only | **Both sides** | Mixed — references cross packages |
| Complexity | Low | **Medium** | High |
| Risk of doc rot | FE rots | **Low — each side owns its docs** | High — one JSON references two packages |
| KV pattern preserved | Yes | **Yes (BE side)** | No — different format |

Proposal 3 was rejected because a single flow JSON that references files in two different packages will drift. When code moves, the JSON breaks silently. Proposal 2 keeps each side's docs colocated with its code — the pattern that works in KV.

---

## How it works

### Backend flow (KV-style, unchanged)

```
packages/core/src/features/vault/vault-registration/
├── docs/
│   ├── 01-validate-url.json
│   ├── 02-test-git-access.json
│   ├── 03-clone-repo.json
│   ├── 04-write-config.json
│   └── 05-build-index.json
├── actions/
│   ├── validate-url.ts
│   ├── test-git-access.ts
│   ├── clone-repo.ts
│   ├── write-config.ts
│   └── build-index.ts
└── vault-registration.ts          # Orchestrator
```

BE flow JSON — same format as KV:

```json
{
  "type": "action",
  "what": "Test git access to the provided URL",
  "why": "Fail fast before cloning — validate credentials in ~2s vs 30s+ clone",
  "where": {
    "entry_point": "features/vault/vault-registration/vault-registration.ts",
    "implementation": "features/vault/vault-registration/actions/test-git-access.ts"
  },
  "output": {
    "console": false,
    "file": false
  },
  "success_handling": {
    "criteria": "Repository accessible with provided credentials",
    "event": {
      "action": "vault_registration_test_access",
      "status": "success",
      "message": "Repository accessible",
      "data_fields": ["git_url", "duration_ms"]
    }
  },
  "error_handling": [
    {
      "scenario": "SSH key not configured",
      "action": "Return { accessible: false, error: 'SSH key not configured' }",
      "severity": "recoverable",
      "recoverable": true
    },
    {
      "scenario": "Repository not found (404)",
      "action": "Return { accessible: false, error: 'Repository not found' }",
      "severity": "recoverable",
      "recoverable": true
    }
  ],
  "decisions": [],
  "calls": [
    "features/vault/vault-registration/actions/test-git-access"
  ]
}
```

### Frontend flow (new, UI-focused)

```
packages/app/src/features/vault/vault-registration/
├── docs/
│   ├── 01-show-form.json
│   ├── 02-validate-input.json
│   ├── 03-call-backend.json
│   └── 04-show-result.json
├── VaultRegistrationWizard.tsx    # Orchestrator component
├── GitUrlForm.tsx
├── validate-input.ts
└── SuccessStep.tsx
```

FE flow JSON — adapted format for UI steps:

```json
{
  "type": "ui_action",
  "what": "Show vault registration form",
  "why": "Collect git URL, vault name, and branch from user",
  "where": {
    "component": "features/vault/vault-registration/VaultRegistrationWizard.tsx",
    "step_component": "features/vault/vault-registration/GitUrlForm.tsx"
  },
  "ui": {
    "renders": "form",
    "fields": ["vault_name", "git_url", "branch"],
    "validation_schema": "@nori/shared:vaultRegistrationSchema"
  },
  "transitions": {
    "on_valid": "02-validate-input",
    "on_cancel": "close_dialog"
  }
}
```

The step that crosses the boundary uses `type: "api_call"`:

```json
{
  "type": "api_call",
  "what": "Submit vault registration to backend",
  "why": "Server validates git access, clones repo, persists config, builds index",
  "where": {
    "component": "features/vault/vault-registration/VaultRegistrationWizard.tsx"
  },
  "contract": {
    "endpoint": "POST /api/vault",
    "request_type": "@nori/shared:VaultRegistrationRequest",
    "response_type": "@nori/shared:VaultRegistrationResponse",
    "error_type": "@nori/shared:ApiError",
    "sse_events": [
      "vault:registration:started",
      "vault:registration:testing-access",
      "vault:registration:cloning",
      "vault:registration:completed",
      "vault:registration:error"
    ]
  },
  "backend_flow": "core/features/vault/vault-registration",
  "transitions": {
    "on_success": "04-show-result",
    "on_error": "01-show-form"
  },
  "decisions": [
    {
      "date": "2026-02-18",
      "reason": "Listen to SSE events during backend execution",
      "rationale": "Clone + index build can take 30s+. SSE events let the UI show progress per step instead of a generic spinner."
    }
  ]
}
```

### The contract (in @nori/shared)

```typescript
// packages/shared/src/contracts/vault.contract.ts

import { z } from 'zod'

// --- Request/Response schemas ---

export const vaultRegistrationSchema = z.object({
  vault_name: z.string().min(1).max(100),
  git_url: z.string().url(),
  branch: z.string().default('main'),
})

export type VaultRegistrationRequest = z.infer<typeof vaultRegistrationSchema>

export interface VaultRegistrationResponse {
  vault_id: string
  vault_name: string
  status: 'created'
  knowledge_count: number
}

// --- SSE event map ---

export interface VaultRegistrationEvents {
  'vault:registration:started': { vault_name: string }
  'vault:registration:testing-access': { git_url: string }
  'vault:registration:cloning': { git_url: string, progress?: number }
  'vault:registration:completed': { vault_id: string, knowledge_count: number }
  'vault:registration:error': { step: string, error: string, recoverable: boolean }
}

// --- API route definition ---

export const VAULT_REGISTRATION_API = {
  method: 'POST' as const,
  path: '/api/vault',
  request: vaultRegistrationSchema,
  response: {} as VaultRegistrationResponse,
} as const
```

Both sides import from `@nori/shared`. The FE uses the schema for form validation. The BE uses it for request parsing. The SSE event types are shared so the FE knows exactly what to listen for.

---

## Flow JSON formats

### Backend step types

| type | what it does | where field |
|---|---|---|
| `action` | Executes a TypeScript function | `entry_point` + `implementation` (paths within core) |
| `flow_call` | Delegates to another BE flow | `flow_id` pointing to another feature flow |

### Frontend step types

| type | what it does | where field |
|---|---|---|
| `ui_action` | Renders a component (form, display, editor) | `component` + `step_component` (paths within app) |
| `validation` | Runs a client-side validation function | `implementation` (path within app) |
| `api_call` | Calls the backend — the **bridge** between FE and BE | `contract` with endpoint, types, SSE events |

### Shared fields (both sides)

Every step JSON has these fields regardless of type:

```json
{
  "type": "...",
  "what": "Human-readable description of this step",
  "why": "Reason this step exists",
  "where": { "...": "paths to implementation" },
  "success_handling": { "criteria": "...", "event": { "..." } },
  "error_handling": [{ "scenario": "...", "action": "...", "severity": "..." }],
  "decisions": [{ "date": "...", "reason": "...", "rationale": "..." }]
}
```

FE steps add:
- `ui` — what renders (form fields, validation schema)
- `transitions` — what happens on success/cancel/error (next step or navigation)
- `contract` — (api_call only) the HTTP + SSE contract to the backend

---

## Complete feature example: create-knowledge

### Backend flow

```
packages/core/src/features/knowledge/knowledge-create/
├── docs/
│   ├── 01-validate-frontmatter.json
│   ├── 02-validate-content.json
│   ├── 03-write-markdown-file.json
│   ├── 04-audit-knowledge.json          # flow_call → knowledge-audit
│   └── 05-regenerate-index.json          # flow_call → knowledge-index-build
├── actions/
│   ├── validate-frontmatter.ts
│   ├── validate-content.ts
│   └── write-markdown-file.ts
└── knowledge-create.ts
```

### Frontend flow

```
packages/app/src/features/knowledge/knowledge-create/
├── docs/
│   ├── 01-show-frontmatter-form.json
│   ├── 02-show-content-editor.json
│   ├── 03-preview-knowledge.json
│   ├── 04-call-backend.json              # api_call → POST /api/knowledge
│   └── 05-show-audit-results.json
├── KnowledgeCreateWizard.tsx
├── FrontmatterForm.tsx
├── ContentEditor.tsx
├── KnowledgePreview.tsx
└── AuditResults.tsx
```

### Contract

```
packages/shared/src/contracts/knowledge.contract.ts
  → KnowledgeCreateRequest (Zod schema)
  → KnowledgeCreateResponse (interface)
  → KnowledgeCreateEvents (SSE event map)
```

### How they connect

```
User clicks "Create Knowledge"
    │
    ▼
FE: 01-show-frontmatter-form      ← FrontmatterForm.tsx renders
    │ user fills tags, description, auto_load patterns
    ▼
FE: 02-show-content-editor         ← ContentEditor.tsx renders
    │ user writes markdown content
    ▼
FE: 03-preview-knowledge           ← KnowledgePreview.tsx renders
    │ user reviews and confirms
    ▼
FE: 04-call-backend ──────────────► BE: POST /api/knowledge
    │ listens to SSE                     │
    │ ◄── knowledge:create:validating    ├── 01-validate-frontmatter
    │ ◄── knowledge:create:writing       ├── 02-validate-content
    │ ◄── knowledge:create:auditing      ├── 03-write-markdown-file
    │ ◄── knowledge:create:indexing      ├── 04-audit-knowledge (flow_call)
    │ ◄── knowledge:create:completed     └── 05-regenerate-index (flow_call)
    ▼
FE: 05-show-audit-results          ← AuditResults.tsx renders
```

---

## Naming conventions

### Backend (core)
- Feature folder: `features/{domain}/{flow-name}/`
- Doc files: `docs/{NN}-{step-name}.json`
- Action files: `actions/{step-name}.ts`
- Orchestrator: `{flow-name}.ts` at feature root

### Frontend (app)
- Feature folder: `features/{domain}/{flow-name}/`
- Doc files: `docs/{NN}-{step-name}.json`
- Components: `{StepName}.tsx` at feature root
- Orchestrator: `{FlowName}Wizard.tsx` or `{FlowName}Panel.tsx`

### Contracts (shared)
- Contract files: `contracts/{domain}.contract.ts`
- One contract file per domain (vault, knowledge, session, app)
- Contains: Zod schemas, response types, SSE event maps, API route definitions

### Feature names match across packages

```
core/features/vault/vault-registration/   ← BE flow
app/features/vault/vault-registration/    ← FE flow
shared/contracts/vault.contract.ts        ← contract
```

Same `{domain}/{flow-name}` path in both core and app. When you're working on vault registration, you know exactly where everything is.

---

## What is NOT a flow

Not everything needs a flow. Flows are for **multi-step operations with side effects**.

| Not a flow | Why |
|---|---|
| Theme toggle | One signal change. One line of code. |
| Sidebar open/close | Component state. |
| Search input filtering | Reactive derived state. |
| Navigate to a page | Router call. |
| Display a list | Data fetch + render. |

If it doesn't have steps, error handling, or side effects, it's just a component. Don't over-document.

---

## Rules

1. **BE flows live in `@nori/core` next to their actions.** Same pattern as KV. Never changes.
2. **FE flows live in `@nori/app` next to their components.** Docs sit with the `.tsx` files.
3. **The contract is the only coupling.** `@nori/shared` defines types, schemas, and SSE events. Neither side imports the other's flows.
4. **Feature names match.** `core/features/vault/vault-pull/` and `app/features/vault/vault-pull/` are the same feature's two sides.
5. **`api_call` is the bridge step.** Any FE step that talks to the BE must be `type: "api_call"` and reference the contract explicitly.
6. **Pure-server flows have no FE counterpart.** `integrity-check`, `autoupdate` — these run on startup with no UI. They only exist in core.
7. **Pure-client flows are rare.** If they exist, they live in app with their own docs. But most "pure client" things aren't flows — they're just components.
8. **The visual flow builder reads both.** It fetches BE flows via `GET /api/flows` and reads FE flows from the app bundle. It renders them as two connected graphs with the `api_call` step as the bridge node.
