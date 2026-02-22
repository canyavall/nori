# Nori App - Flow Architecture Proposals

## Context

The KV project uses a flow system where:
- Each **feature** contains a **flow** (a sequence of steps)
- Each **step** is documented as a JSON file in `docs/` describing what, why, where, error handling, and decisions
- Each step maps to an **action** (a TypeScript function) or a **flow_call** (delegates to another flow)
- The JSON is both documentation and a contract — it defines the behavior before the code exists

This works well for a pure backend system (KV is hooks + CLI). Nori is different: it has a **frontend (SolidJS)**, a **backend server (Hono)**, and a **desktop shell (Tauri)**. Flows now need to cross the boundary between client and server.

---

## Proposal 1: Mirrored Flows (BE owns logic, FE owns presentation)

### Concept

Keep flows **strictly on the backend**, exactly like KV. The frontend doesn't know about flows — it only knows about API endpoints and SSE events. Each flow step runs server-side. The frontend reacts to state changes via SSE.

```
Frontend (SolidJS)              Backend (Hono + @nori/core)
─────────────────              ──────────────────────────
                               features/
User clicks "Sync Vault"         vault/
        │                          vault-pull/
        │  POST /api/vault/pull      docs/
        │─────────────────────►        01-validate-config.json
        │                              02-check-auth.json
        │  SSE: step:started           03-git-fetch.json
        │◄─────────────────────        04-detect-conflicts.json
        │  SSE: step:progress          05-merge-changes.json
        │◄─────────────────────        06-update-index.json
        │  SSE: step:completed         07-log-event.json
        │◄─────────────────────      actions/
        │                              validate-config.ts
        │  SSE: flow:completed         check-auth.ts
        │◄─────────────────────        git-fetch.ts
        │                              ...
  Update UI from event
```

### Flow JSON stays the same as KV

```json
{
  "type": "action",
  "what": "Fetch latest changes from vault git remote",
  "why": "Ensure local vault has latest knowledge before reconciliation",
  "where": {
    "entry_point": "src/features/vault/vault-pull/vault-pull.ts:runVaultPull()",
    "implementation": "src/features/vault/vault-pull/actions/git-fetch.ts"
  },
  "output": {
    "console": false,
    "sse_event": "vault:pull:progress"
  },
  "success_handling": {
    "criteria": "Git fetch completes with new commits or up-to-date",
    "event": {
      "action": "vault_pull_git_fetch",
      "status": "success",
      "message": "Fetched {commit_count} new commits"
    }
  },
  "error_handling": [
    {
      "scenario": "Remote unreachable",
      "action": "Abort flow, emit vault:pull:error SSE event",
      "severity": "fatal",
      "recoverable": false
    }
  ]
}
```

### Folder structure

```
packages/
├── core/
│   └── src/
│       └── features/
│           ├── vault/
│           │   ├── vault-pull/
│           │   │   ├── docs/
│           │   │   │   ├── 01-validate-config.json
│           │   │   │   ├── 02-check-auth.json
│           │   │   │   ├── 03-git-fetch.json
│           │   │   │   ├── 04-detect-conflicts.json
│           │   │   │   ├── 05-merge-changes.json
│           │   │   │   ├── 06-update-index.json
│           │   │   │   └── 07-log-event.json
│           │   │   ├── actions/
│           │   │   │   ├── validate-config.ts
│           │   │   │   ├── check-auth.ts
│           │   │   │   ├── git-fetch.ts
│           │   │   │   ├── detect-conflicts.ts
│           │   │   │   ├── merge-changes.ts
│           │   │   │   ├── update-index.ts
│           │   │   │   └── log-event.ts
│           │   │   └── vault-pull.ts          # Orchestrator
│           │   ├── vault-push/
│           │   │   ├── docs/
│           │   │   └── actions/
│           │   ├── vault-registration/
│           │   │   ├── docs/
│           │   │   └── actions/
│           │   └── vault-reconciliation/
│           │       ├── docs/
│           │       └── actions/
│           ├── knowledge/
│           │   ├── knowledge-create/
│           │   ├── knowledge-edit/
│           │   ├── knowledge-delete/
│           │   ├── knowledge-audit/
│           │   ├── knowledge-index-build/
│           │   └── knowledge-search/
│           ├── session/
│           │   ├── session-create/
│           │   ├── session-resume/
│           │   └── session-archive/
│           ├── app/
│           │   ├── integrity-check/
│           │   ├── authentication-check/
│           │   └── autoupdate/
│           └── shared/
│               └── utils/
├── server/
│   └── src/
│       ├── routes/
│       │   ├── vault.routes.ts       # Maps HTTP → core flows
│       │   ├── knowledge.routes.ts
│       │   ├── session.routes.ts
│       │   └── app.routes.ts
│       └── sse/
│           └── emitter.ts            # SSE event broadcasting
├── app/
│   └── src/
│       ├── components/vault/
│       │   └── VaultSync.tsx          # Listens to SSE, shows progress
│       └── lib/
│           └── api.ts                # fetch() + EventSource wrappers
└── shared/
    └── src/
        └── types/
            └── events.ts             # SSE event type definitions
```

### How the FE knows what's happening

The server emits SSE events for each flow step:

```typescript
// server/src/routes/vault.routes.ts
app.post('/api/vault/:id/pull', async (c) => {
  const vaultId = c.req.param('id')
  const emitter = getSSEEmitter()

  // The orchestrator emits events as it runs
  const result = await runVaultPull(vaultId, {
    onStepStart: (step) => emitter.emit('flow:step:started', { flow: 'vault-pull', step }),
    onStepComplete: (step, data) => emitter.emit('flow:step:completed', { flow: 'vault-pull', step, data }),
    onStepError: (step, error) => emitter.emit('flow:step:error', { flow: 'vault-pull', step, error }),
  })

  return c.json(result)
})
```

### Pros
- Identical to KV's proven pattern — you already know it works
- Clean separation: backend owns all logic, frontend is a thin display layer
- Flows are testable without any UI
- The flow JSON docs are pure backend — no frontend complexity leaks in

### Cons
- Frontend feels "dumb" — it can only show what the server tells it
- Every user interaction requires a round-trip (click → HTTP → flow → SSE → UI update)
- No way to represent frontend-only flows (form validation, wizard steps, UI transitions)

---

## Proposal 2: Split Flows (FE flows + BE flows, connected by a contract)

### Concept

Two types of flows exist:
- **Backend flows** live in `@nori/core` — same as KV. They handle data, git, DB, LLM.
- **Frontend flows** live in `@nori/app` — they handle UI orchestration (wizards, multi-step forms, transitions).

A frontend flow can **call** a backend flow via API. The connection point is a **contract**: the shared types and events both sides agree on.

```
Frontend Flow                        Backend Flow
──────────────                       ─────────────
vault-registration/                  vault/vault-registration/
  docs/                                docs/
    01-show-form.json                    01-validate-url.json
    02-validate-input.json               02-test-git-access.json
    03-call-backend.json ──────────►     03-clone-repo.json
    04-show-result.json  ◄─ response ─   04-write-config.json
                                         05-build-index.json
```

### Frontend flow JSON has a different shape

```json
{
  "type": "ui_action",
  "what": "Show vault registration form",
  "why": "Collect git URL and vault name from user",
  "where": {
    "component": "src/components/vault/VaultRegistrationWizard.tsx",
    "step_component": "src/components/vault/steps/GitUrlStep.tsx"
  },
  "ui": {
    "renders": "form",
    "fields": ["vault_name", "git_url", "branch"],
    "validation": "src/lib/schemas/vault.schema.ts:vaultRegistrationSchema"
  },
  "transitions": {
    "on_valid": "next_step",
    "on_cancel": "close_dialog"
  }
}
```

### Backend flow JSON stays KV-style

```json
{
  "type": "action",
  "what": "Test git access to the provided URL",
  "why": "Verify credentials before persisting vault config",
  "where": {
    "entry_point": "src/features/vault/vault-registration/vault-registration.ts",
    "implementation": "src/features/vault/vault-registration/actions/test-git-access.ts"
  },
  "output": {
    "console": false,
    "api_response": { "accessible": "boolean", "error": "string|null" }
  },
  "error_handling": [
    {
      "scenario": "SSH key not found",
      "action": "Return { accessible: false, error: 'SSH key not configured' }",
      "severity": "recoverable"
    }
  ]
}
```

### The connection step (FE flow calls BE flow)

```json
{
  "type": "api_call",
  "what": "Submit vault registration to backend",
  "why": "Backend validates, clones, and persists the vault",
  "where": {
    "component": "src/components/vault/VaultRegistrationWizard.tsx",
    "api_endpoint": "POST /api/vault"
  },
  "request": {
    "body_schema": "shared/types/vault.ts:VaultRegistrationRequest"
  },
  "response": {
    "success_schema": "shared/types/vault.ts:VaultRegistrationResponse",
    "error_schema": "shared/types/errors.ts:ApiError"
  },
  "backend_flow": "features/vault/vault-registration",
  "transitions": {
    "on_success": "next_step",
    "on_error": "show_error_state"
  }
}
```

### Folder structure

```
packages/
├── core/
│   └── src/
│       └── features/                     # BACKEND FLOWS (same as KV)
│           ├── vault/
│           │   ├── vault-registration/
│           │   │   ├── docs/
│           │   │   │   ├── 01-validate-url.json
│           │   │   │   ├── 02-test-git-access.json
│           │   │   │   ├── 03-clone-repo.json
│           │   │   │   ├── 04-write-config.json
│           │   │   │   └── 05-build-index.json
│           │   │   ├── actions/
│           │   │   └── vault-registration.ts
│           │   ├── vault-pull/
│           │   │   ├── docs/
│           │   │   └── actions/
│           │   └── vault-push/
│           │       ├── docs/
│           │       └── actions/
│           ├── knowledge/
│           │   ├── knowledge-create/
│           │   ├── knowledge-edit/
│           │   ├── knowledge-delete/
│           │   ├── knowledge-audit/
│           │   └── knowledge-index-build/
│           ├── session/
│           │   ├── session-create/
│           │   ├── session-resume/
│           │   └── session-archive/
│           └── app/
│               ├── integrity-check/
│               ├── authentication-check/
│               └── autoupdate/
├── server/
│   └── src/
│       ├── routes/
│       │   ├── vault.routes.ts
│       │   ├── knowledge.routes.ts
│       │   ├── session.routes.ts
│       │   └── app.routes.ts
│       └── sse/
│           └── emitter.ts
├── app/
│   └── src/
│       ├── flows/                        # FRONTEND FLOWS
│       │   ├── vault/
│       │   │   ├── vault-registration-wizard/
│       │   │   │   ├── docs/
│       │   │   │   │   ├── 01-show-form.json
│       │   │   │   │   ├── 02-validate-input.json
│       │   │   │   │   ├── 03-call-backend.json
│       │   │   │   │   └── 04-show-result.json
│       │   │   │   └── VaultRegistrationWizard.tsx
│       │   │   └── vault-sync-panel/
│       │   │       ├── docs/
│       │   │       │   ├── 01-show-sync-status.json
│       │   │       │   ├── 02-trigger-pull.json
│       │   │       │   └── 03-display-results.json
│       │   │       └── VaultSyncPanel.tsx
│       │   ├── knowledge/
│       │   │   ├── knowledge-create-wizard/
│       │   │   │   ├── docs/
│       │   │   │   └── KnowledgeCreateWizard.tsx
│       │   │   └── knowledge-editor/
│       │   │       ├── docs/
│       │   │       └── KnowledgeEditor.tsx
│       │   └── settings/
│       │       └── theme-switch/
│       │           ├── docs/
│       │           └── ThemeSwitch.tsx
│       ├── components/
│       │   ├── ui/                       # Generic UI components (no flow)
│       │   └── layout/
│       ├── stores/
│       └── pages/
└── shared/
    └── src/
        ├── types/
        │   ├── vault.ts                  # Request/response contracts
        │   ├── knowledge.ts
        │   └── events.ts                 # SSE event types
        └── schemas/
            ├── vault.schema.ts           # Zod validation (used by FE + BE)
            └── knowledge.schema.ts
```

### Pros
- Frontend logic is documented and structured, not scattered across random components
- Clear contract between FE and BE (shared types + API endpoint in the flow JSON)
- Frontend wizards become first-class citizens with their own step docs
- You can review a feature end-to-end: FE flow → API call → BE flow

### Cons
- Two types of flow JSON formats to maintain (ui_action vs action)
- More files and directories than Proposal 1
- Need discipline to keep FE flows and BE flows in sync

---

## Proposal 3: Unified Flow Registry (Single flow definition, auto-routed to FE/BE)

### Concept

One flow definition describes the **entire user journey** — from button click to database write. Each step is tagged with where it runs: `client`, `server`, or `shared`. A flow runner reads the definition and routes each step to the right place.

The flow JSON becomes the **single source of truth** for the entire feature. From it, you can:
1. Generate the API contract (request/response types)
2. Know which component renders which step
3. Know which server action executes which step
4. See the full sequence without jumping between FE and BE folders

```
One flow definition:
  vault-registration.flow.json
      │
      ├── step 01 [client]  → Show form
      ├── step 02 [client]  → Validate input
      ├── step 03 [server]  → Test git access        ← auto HTTP boundary
      ├── step 04 [server]  → Clone repository
      ├── step 05 [server]  → Write config
      ├── step 06 [server]  → Build index
      └── step 07 [client]  → Show success + redirect ← auto SSE event
```

### The unified flow JSON

```json
{
  "flow_id": "vault-registration",
  "feature": "vault",
  "description": "Register a new vault from a git repository",
  "trigger": {
    "type": "ui_event",
    "component": "VaultPage",
    "event": "onClickCreateVault"
  },
  "steps": [
    {
      "id": "01-show-form",
      "runs_on": "client",
      "type": "ui_render",
      "what": "Show vault registration form",
      "component": "src/app/flows/vault/vault-registration/steps/GitUrlForm.tsx",
      "ui": {
        "fields": ["vault_name", "git_url", "branch"],
        "validation_schema": "shared/schemas/vault.schema.ts:vaultFormSchema"
      },
      "transitions": {
        "on_submit": "02-validate-input",
        "on_cancel": "abort"
      }
    },
    {
      "id": "02-validate-input",
      "runs_on": "client",
      "type": "validation",
      "what": "Validate git URL format and vault name uniqueness",
      "implementation": "src/app/flows/vault/vault-registration/steps/validate-input.ts",
      "transitions": {
        "on_valid": "03-test-git-access",
        "on_invalid": "01-show-form"
      }
    },
    {
      "id": "03-test-git-access",
      "runs_on": "server",
      "type": "action",
      "what": "Verify git credentials and repository accessibility",
      "why": "Fail fast before cloning — prevent saving broken vault configs",
      "implementation": "src/core/features/vault/vault-registration/actions/test-git-access.ts",
      "error_handling": [
        {
          "scenario": "SSH key not configured",
          "action": "Return error, transition to show-form with error message",
          "severity": "recoverable"
        },
        {
          "scenario": "Repository not found",
          "action": "Return error, transition to show-form with error message",
          "severity": "recoverable"
        }
      ],
      "transitions": {
        "on_success": "04-clone-repo",
        "on_error": "01-show-form"
      }
    },
    {
      "id": "04-clone-repo",
      "runs_on": "server",
      "type": "action",
      "what": "Clone vault repository to local storage",
      "implementation": "src/core/features/vault/vault-registration/actions/clone-repo.ts",
      "sse_event": "vault:registration:cloning",
      "error_handling": [
        {
          "scenario": "Disk full",
          "action": "Abort flow, emit error event",
          "severity": "fatal"
        }
      ],
      "transitions": {
        "on_success": "05-write-config",
        "on_error": "abort"
      }
    },
    {
      "id": "05-write-config",
      "runs_on": "server",
      "type": "action",
      "what": "Persist vault configuration to database",
      "implementation": "src/core/features/vault/vault-registration/actions/write-config.ts",
      "transitions": {
        "on_success": "06-build-index"
      }
    },
    {
      "id": "06-build-index",
      "runs_on": "server",
      "type": "flow_call",
      "what": "Build knowledge index for the new vault",
      "flow_id": "knowledge-index-build",
      "transitions": {
        "on_success": "07-show-success"
      }
    },
    {
      "id": "07-show-success",
      "runs_on": "client",
      "type": "ui_render",
      "what": "Show registration success and navigate to vault",
      "component": "src/app/flows/vault/vault-registration/steps/SuccessStep.tsx",
      "transitions": {
        "on_continue": "navigate:/vaults/{vault_id}"
      }
    }
  ],
  "decisions": [
    {
      "date": "2026-02-18",
      "reason": "Test git access before cloning",
      "rationale": "Cloning can take 30s+. Fail fast with a lightweight ls-remote check (~2s) to validate credentials and URL."
    }
  ]
}
```

### The flow runner

A thin runtime reads the flow JSON and routes steps:

```typescript
// packages/app/src/lib/flow-runner.ts
export function createFlowRunner(flowDef: FlowDefinition) {
  return {
    async runStep(stepId: string, context: FlowContext) {
      const step = flowDef.steps.find(s => s.id === stepId)

      if (step.runs_on === 'client') {
        // Execute locally (render component or run validation)
        return executeClientStep(step, context)
      }

      if (step.runs_on === 'server') {
        // HTTP call to server, which runs the action
        const result = await fetch(`/api/flow/${flowDef.flow_id}/step/${stepId}`, {
          method: 'POST',
          body: JSON.stringify(context.data)
        })
        return result.json()
      }
    },

    getNextStep(currentStepId: string, outcome: 'on_success' | 'on_error' | 'on_submit') {
      const step = flowDef.steps.find(s => s.id === currentStepId)
      return step.transitions[outcome]
    }
  }
}
```

### Folder structure

```
packages/
├── core/
│   └── src/
│       └── features/                     # SERVER-SIDE ACTIONS ONLY
│           ├── vault/
│           │   ├── vault-registration/
│           │   │   └── actions/
│           │   │       ├── test-git-access.ts
│           │   │       ├── clone-repo.ts
│           │   │       ├── write-config.ts
│           │   │       └── build-index.ts
│           │   ├── vault-pull/
│           │   │   └── actions/
│           │   └── vault-push/
│           │       └── actions/
│           ├── knowledge/
│           │   ├── knowledge-create/
│           │   │   └── actions/
│           │   ├── knowledge-edit/
│           │   │   └── actions/
│           │   ├── knowledge-delete/
│           │   │   └── actions/
│           │   ├── knowledge-audit/
│           │   │   └── actions/
│           │   └── knowledge-index-build/
│           │       └── actions/
│           ├── session/
│           │   ├── session-create/
│           │   │   └── actions/
│           │   └── session-archive/
│           │       └── actions/
│           └── app/
│               ├── integrity-check/
│               │   └── actions/
│               ├── authentication-check/
│               │   └── actions/
│               └── autoupdate/
│                   └── actions/
├── server/
│   └── src/
│       ├── routes/
│       │   ├── vault.routes.ts
│       │   ├── knowledge.routes.ts
│       │   ├── session.routes.ts
│       │   └── app.routes.ts
│       ├── flow-executor.ts              # Runs server-side steps from flow defs
│       └── sse/
│           └── emitter.ts
├── app/
│   └── src/
│       ├── flows/                        # UNIFIED FLOW DEFINITIONS + CLIENT STEPS
│       │   ├── vault/
│       │   │   ├── vault-registration/
│       │   │   │   ├── vault-registration.flow.json   # THE SINGLE SOURCE OF TRUTH
│       │   │   │   └── steps/
│       │   │   │       ├── GitUrlForm.tsx
│       │   │   │       ├── validate-input.ts
│       │   │   │       └── SuccessStep.tsx
│       │   │   ├── vault-pull/
│       │   │   │   ├── vault-pull.flow.json
│       │   │   │   └── steps/
│       │   │   │       ├── SyncProgress.tsx
│       │   │   │       └── ConflictResolver.tsx
│       │   │   └── vault-push/
│       │   │       ├── vault-push.flow.json
│       │   │       └── steps/
│       │   ├── knowledge/
│       │   │   ├── knowledge-create/
│       │   │   │   ├── knowledge-create.flow.json
│       │   │   │   └── steps/
│       │   │   │       ├── FrontmatterForm.tsx
│       │   │   │       ├── ContentEditor.tsx
│       │   │   │       ├── validate-knowledge.ts
│       │   │   │       └── AuditResults.tsx
│       │   │   ├── knowledge-edit/
│       │   │   │   ├── knowledge-edit.flow.json
│       │   │   │   └── steps/
│       │   │   └── knowledge-delete/
│       │   │       ├── knowledge-delete.flow.json
│       │   │       └── steps/
│       │   ├── session/
│       │   │   ├── session-create/
│       │   │   │   ├── session-create.flow.json
│       │   │   │   └── steps/
│       │   │   └── session-resume/
│       │   │       ├── session-resume.flow.json
│       │   │       └── steps/
│       │   ├── app/
│       │   │   ├── integrity-check/
│       │   │   │   └── integrity-check.flow.json    # Pure server, no client steps
│       │   │   ├── authentication-check/
│       │   │   │   └── authentication-check.flow.json
│       │   │   └── theme-switch/
│       │   │       ├── theme-switch.flow.json        # Pure client, no server steps
│       │   │       └── steps/
│       │   │           └── ThemeToggle.tsx
│       │   └── chat/
│       │       ├── send-message/
│       │       │   ├── send-message.flow.json
│       │       │   └── steps/
│       │       └── session-lifecycle/
│       │           ├── session-lifecycle.flow.json
│       │           └── steps/
│       ├── lib/
│       │   ├── flow-runner.ts            # Client-side flow executor
│       │   └── flow-loader.ts            # Load + validate flow JSONs
│       ├── components/
│       │   ├── ui/
│       │   └── layout/
│       ├── stores/
│       └── pages/
└── shared/
    └── src/
        ├── types/
        │   ├── flow.ts                   # FlowDefinition, StepDefinition types
        │   ├── vault.ts
        │   ├── knowledge.ts
        │   └── events.ts
        └── schemas/
            ├── flow.schema.ts            # Zod schema to validate flow JSONs
            ├── vault.schema.ts
            └── knowledge.schema.ts
```

### What this enables that the others don't

**1. Visual flow builder can read and render real flows**

Your planned visual flow tool can load `vault-registration.flow.json` and render it as a node graph — client steps as blue nodes, server steps as green nodes, transitions as edges. You can visualize the entire feature without reading code.

**2. Flow validation at build time**

A build script can validate every `.flow.json`: does every `implementation` path exist? Does every `component` path exist? Do all `transitions` point to valid step IDs? This catches broken flows before runtime.

**3. Auto-generate API routes from flow definitions**

The server can scan all `.flow.json` files, find steps with `runs_on: "server"`, and auto-register the routes. No manual route wiring.

**4. Pure-server and pure-client flows are just edge cases**

`integrity-check.flow.json` has all steps `runs_on: "server"` — it's equivalent to a KV flow.
`theme-switch.flow.json` has all steps `runs_on: "client"` — it's a pure UI flow.
Mixed flows are the general case. The format handles all three.

### Pros
- One file to understand an entire feature end-to-end
- The visual flow builder has real data to render
- Auto-validation and auto-routing are possible
- Scales naturally: pure-server, pure-client, and mixed flows all use the same format
- Decisions, error handling, and transitions are visible in one place

### Cons
- The flow JSON is more complex (more fields, more concepts)
- Client step components and server actions live in different packages but reference each other — need discipline
- The flow runner is a new runtime concept to build and maintain
- Risk of the flow JSON becoming a DSL that's harder to read than code

---

## Comparison

| Criterion | P1: Mirrored | P2: Split | P3: Unified |
|---|---|---|---|
| **Similarity to KV** | Identical | Close (BE side) | Different format |
| **FE documentation** | None (FE is ad-hoc) | FE has own flow docs | FE steps in same file |
| **End-to-end visibility** | Must read BE + FE separately | Must read 2 flow dirs | **One file per feature** |
| **Visual flow builder** | Can render BE flows only | Can render both separately | **Can render full journey** |
| **Complexity** | **Low** | Medium | Higher |
| **Number of files** | Fewer | More (2x flow dirs) | Medium (one JSON + steps) |
| **Pure server flows** | Native | Native | Supported |
| **Pure client flows** | Not covered | Supported | Supported |
| **Auto-route generation** | No | No | **Yes** |
| **Build-time validation** | BE only | BE + FE separately | **Full cross-validation** |
| **Learning curve** | **Easiest** | Moderate | Steeper |

## Recommendation

**Proposal 3 (Unified Flow Registry)** is the most ambitious but directly supports your vision of a visual flow tool. If every feature is defined as a single `.flow.json`, the visual builder isn't just a nice-to-have — it becomes the natural way to explore, debug, and eventually design flows.

**Proposal 2 (Split Flows)** is the pragmatic middle ground if Proposal 3 feels too experimental. You keep the KV pattern for backend and add structured frontend flows separately.

**Proposal 1 (Mirrored)** is the right choice only if the frontend is truly just a thin display layer — but given that you want a visual flow builder, chat interface, and knowledge editor, the frontend has real logic that deserves documentation.
