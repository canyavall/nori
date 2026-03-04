# Nori Flow System — Current State

**Date**: 2026-03-03
**Status**: Factual record of the implemented system
**Scope**: What is actually built and running today

---

## Architecture

The flow system is split across three packages:

```
packages/core/   @nori/core    — Backend flows: step JSONs + action files + orchestrators
packages/app/    @nori/app     — Frontend flows: step JSONs + SolidJS components + hooks
packages/shared/ @nori/shared  — Contracts: Zod schemas, response types, SSE event maps
```

Neither side imports the other's flows. The contract in `@nori/shared` is the only coupling. Communication happens over HTTP + SSE.

---

## Scale

| Artifact | Count |
|---|---|
| Backend step JSON files | 137 |
| Frontend step JSON files | 81 |
| Backend domains | 4 (app, knowledge, vault, project, session) |
| Frontend domains | 5 (knowledge, vault, project, session, navigation) |
| Contract files | 7 |
| Backend orchestrators | ~25 flows |
| Frontend hooks | ~20 hooks |

---

## Backend Flows

### Folder structure

```
packages/core/src/features/{domain}/{flow-name}/
├── steps/
│   ├── 01-{step-name}.json
│   ├── 02-{step-name}.json
│   └── ...
├── actions/
│   ├── {step-name}.ts
│   └── ...
└── {flow-name}.ts          # Orchestrator
```

### Step JSON format (backend)

All fields that exist in the actual step files:

```json
{
  "type": "action",
  "what": "Human-readable description of what this step does",
  "why": "Reason this step exists and why it belongs here",
  "where": {
    "entry_point": "features/domain/flow/flow.ts",
    "implementation": "features/domain/flow/actions/step-name.ts"
  },
  "output": {
    "console": "Description of what gets logged, or false",
    "file": "Description of what gets written, or false"
  },
  "success_handling": {
    "criteria": "Human description of what constitutes success",
    "event": {
      "action": "domain_flow_step",
      "status": "success",
      "message": "Template string with {placeholders}",
      "data_fields": ["field1", "field2"]
    }
  },
  "error_handling": [
    {
      "scenario": "Name of the error scenario",
      "criteria": "Technical condition that triggers this error",
      "action": "How the orchestrator handles it",
      "severity": "error | fatal | warning",
      "recoverable": true,
      "event": {
        "action": "domain_flow_step_error",
        "status": "error",
        "message": "Template string",
        "data_fields": []
      }
    }
  ],
  "decisions": [
    {
      "date": "YYYY-MM-DD",
      "reason": "What decision was made",
      "rationale": "Why it was made this way"
    }
  ],
  "calls": [
    "features/domain/flow/actions/step-name.ts"
  ]
}
```

`flow_call` steps (delegating to another flow) use a simpler format:

```json
{
  "type": "flow_call",
  "what": "Description of the delegated flow",
  "why": "Why this step delegates instead of acting directly",
  "where": {
    "entry_point": "features/domain/flow/flow.ts",
    "flow": "features/domain/target-flow/target-flow.ts"
  },
  "decisions": []
}
```

### Orchestrator pattern

All backend orchestrators follow the same pattern:

```typescript
// packages/core/src/features/knowledge/knowledge-create/knowledge-create.ts

export async function runKnowledgeCreate(
  input: KnowledgeCreateInput,
  emitter?: FlowEmitter
): Promise<FlowResult<KnowledgeCreateResult>> {
  const emit = emitter ?? createNoopEmitter();

  emit.emit('knowledge:create:started', { vault_id, title });

  // Step 01 — fatal
  emit.emit('knowledge:create:validating-frontmatter', { title });
  const frontmatterResult = await validateFrontmatter(input);
  if (!frontmatterResult.success) return frontmatterResult;

  // Step 02 — fatal
  emit.emit('knowledge:create:validating-content', { content_length });
  const contentResult = await validateContent(input);
  if (!contentResult.success) return contentResult;

  // Step 03 — fatal
  emit.emit('knowledge:create:writing-file', { vault_path, title });
  const writeResult = await writeMarkdownFile(input, frontmatterResult.data);
  if (!writeResult.success) return writeResult;

  // Step 04 — non-fatal (stub)
  emit.emit('knowledge:create:auditing', { entry_id, file_path });
  const auditResult = await auditKnowledge(writeResult.data);
  if (!auditResult.success) {
    emit.emit('knowledge:create:audit-warning', { entry_id, message: auditResult.error.message });
    // continues — non-fatal
  }

  // Step 05 — non-fatal
  emit.emit('knowledge:create:regenerating-index', { vault_id });
  const indexResult = await regenerateIndex(writeResult.data);
  if (!indexResult.success) {
    emit.emit('knowledge:create:index-warning', { entry_id, message: indexResult.error.message });
  }

  emit.emit('knowledge:create:completed', { entry_id, file_path, title });
  return { success: true, data: { entry_id, file_path, title } };
}
```

**Rules the orchestrator enforces by hand:**
- `emit()` before each step starts
- Check `result.success` after each fatal step — return immediately on failure
- Non-fatal steps emit a `-warning` event but continue
- `FlowEmitter` is optional — falls back to `createNoopEmitter()`

### Action pattern

Each action is a pure function:

```typescript
// packages/core/src/features/knowledge/knowledge-create/actions/validate-frontmatter.ts

export async function validateFrontmatter(
  input: KnowledgeCreateInput
): Promise<FlowResult<ValidatedFrontmatter>> {
  const parsed = knowledgeCreateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'INVALID_FRONTMATTER',
        message: parsed.error.message,
        step: 'validate-frontmatter',
        severity: 'error',
        recoverable: true,
      },
    };
  }
  return { success: true, data: parsed.data };
}
```

### Shared flow types

```typescript
// packages/shared/src/types/flow.ts

export interface FlowEmitter {
  emit(event: string, data?: Record<string, unknown>): void;
}

export interface StepResult<T> {
  success: true;
  data: T;
}

export interface FlowError {
  success: false;
  error: {
    code: string;
    message: string;
    step?: string;
    severity: 'error' | 'fatal' | 'warning';
    recoverable: boolean;
    details?: Record<string, unknown>;
  };
}

export type FlowResult<T> = StepResult<T> | FlowError;
```

### Event naming

- **In step JSONs** (`success_handling.event.action`): underscores — `knowledge_create_validating_frontmatter`
- **On the wire** (what `emit()` sends): colons — `knowledge:create:validating-frontmatter`

This mismatch is a known inconsistency. The wire format is used by the contracts and the FE `connectSSE` listener. The JSON format in `success_handling.event.action` is not read by any tooling — it is documentation only.

### Backend domains and flows

| Domain | Flows |
|---|---|
| knowledge | create, edit, delete, audit, ai-generate, index-build, search |
| vault | registration, local-registration, pull, push, reconciliation, regenerate-db, vector-embedding, audit, delete, link-project, unlink-project, knowledge-import, knowledge-export |
| project | register, discover-claude-code, claude-rules, claude-hooks, claude-mcps, claude-skills, claude-mds |
| session | create, resume, archive |
| app | authentication-check, autoupdate, integrity-check |

---

## Frontend Flows

### Folder structure

```
packages/app/src/features/{domain}/{flow-name}/
├── steps/
│   ├── 01-{step-name}.json
│   ├── 02-{step-name}.json
│   └── ...
├── {ComponentName}.tsx      # Orchestrator component or section
├── {ComponentName}.hook.ts  # State machine hook
├── {ComponentName}.type.ts  # Types
└── {SubComponent}.tsx       # Step components (one per visual state)
```

### Step JSON format (frontend)

Three step types exist. All share `what`, `why`, `where`, `error_handling`, `decisions`.

**`ui_action`** — renders a component:

```json
{
  "type": "ui_action",
  "what": "Show the knowledge creation form for frontmatter fields",
  "why": "Collect title, category, tags, description before writing content",
  "where": {
    "component": "features/knowledge/knowledge-create/KnowledgeCreateDialog.tsx",
    "step_component": "features/knowledge/knowledge-create/FrontmatterForm.tsx"
  },
  "ui": {
    "renders": "form",
    "fields": ["title", "category", "tags", "description", "auto_load"],
    "validation_schema": "@nori/shared:knowledgeCreateSchema",
    "layout": {
      "columns": 2,
      "full_width_fields": ["description"]
    }
  },
  "transitions": {
    "on_valid": "02-show-content-editor",
    "on_cancel": "close_dialog"
  },
  "error_handling": [
    {
      "type": "validation_error",
      "display": "inline_field_errors",
      "description": "Show field-level errors from Zod validation"
    }
  ],
  "decisions": []
}
```

**`validation`** — runs client-side logic:

```json
{
  "type": "validation",
  "what": "Validate that the entered git URL is reachable before submission",
  "why": "Fail fast on the client side before waiting for a backend SSH handshake",
  "where": {
    "component": "features/vault/vault-registration/VaultRegistrationWizard.tsx",
    "implementation": "features/vault/vault-registration/validate-git-url.ts"
  },
  "transitions": {
    "on_valid": "03-call-backend",
    "on_invalid": "01-show-form"
  },
  "decisions": []
}
```

**`api_call`** — bridges to backend:

```json
{
  "type": "api_call",
  "what": "Submit the knowledge entry to the backend for creation",
  "why": "Server validates, writes the file, audits, and updates the index",
  "where": {
    "component": "features/knowledge/knowledge-create/KnowledgeCreateDialog.tsx"
  },
  "contract": {
    "endpoint": "POST /api/knowledge",
    "request_type": "@nori/shared:KnowledgeCreateRequest",
    "response_type": "@nori/shared:KnowledgeCreateResponse",
    "error_type": "@nori/shared:ApiError",
    "sse_events": [
      "knowledge:create:started",
      "knowledge:create:validating-frontmatter",
      "knowledge:create:validating-content",
      "knowledge:create:writing-file",
      "knowledge:create:auditing",
      "knowledge:create:audit-warning",
      "knowledge:create:regenerating-index",
      "knowledge:create:completed"
    ]
  },
  "backend_flow": "core/features/knowledge/knowledge-create",
  "transitions": {
    "on_success": "05-show-audit-results",
    "on_error": "01-show-frontmatter-form"
  },
  "decisions": [
    {
      "date": "2026-02-20",
      "reason": "SSE instead of polling",
      "rationale": "Creation + audit + index rebuild can take 5-15s. SSE gives per-step progress without polling overhead."
    }
  ]
}
```

### Transition target formats

| Pattern | Example | Meaning |
|---|---|---|
| Step reference | `"02-show-content-editor"` | Go to another step in this flow |
| Navigation | `"navigate:/knowledge/{entry_id}"` | Client-side route with param interpolation |
| Navigate back | `"navigate_back"` | Browser history back |
| Close dialog | `"close_dialog"` | Close current dialog/wizard |

### Hook state machine pattern

Frontend state logic lives entirely in hooks. The step JSONs are documentation of the states — the hook is the actual implementation.

```typescript
// packages/app/src/features/knowledge/knowledge-detail/KnowledgeDetailPanel/KnowledgeDetailPanel.hook.ts

export type PanelStep =
  | 'loading'
  | 'view'
  | 'editing'
  | 'saving'
  | 'confirm-delete'
  | 'deleting'
  | 'deleted'
  | 'error';

export const useKnowledgeDetailPanel = (props: KnowledgeDetailPanelProps) => {
  const [step, setStep] = createSignal<PanelStep>('loading');
  const [entry, setEntry] = createSignal<KnowledgeEntry | null>(null);
  const [error, setError] = createSignal('');

  // State entry: loading
  const loadEntry = async () => {
    setStep('loading');
    try {
      const entryRes = await apiGet<{ data: KnowledgeEntry }>(`/api/knowledge/${props.entryId}`);
      setEntry(entryRes.data);
      setStep('view');           // Transition: loading → view
    } catch (err) {
      setError(err.message);
      setStep('error');          // Transition: loading → error
    }
  };

  // Transition: view → editing
  function handleEdit() {
    setStep('editing');
  }

  // Transition: editing → saving (opens SSE connection)
  function handleSave(data: KnowledgeEditInput) {
    setStep('saving');
    connectSSE(`/api/knowledge/${props.entryId}`, data, {
      onEvent: (event) => { /* update progress message */ },
      onResult: (result) => {
        if (result.success) {
          loadEntry();           // Transition: saving → loading → view
        } else {
          setSaveError(result.error.message);
          setStep('editing');   // Transition: saving → editing (error)
        }
      },
    }, 'PUT');
  }

  // Transition: view → confirm-delete
  function handleDelete() {
    setStep('confirm-delete');
  }

  // Transition: confirm-delete → deleting
  function handleConfirmDelete() {
    setStep('deleting');
    connectSSE(`/api/knowledge/${props.entryId}/delete`, {}, {
      onResult: (result) => {
        if (result.success) {
          setStep('deleted');    // Transition: deleting → deleted
        } else {
          setStep('confirm-delete'); // Transition: deleting → confirm-delete (error)
        }
      },
    }, 'DELETE');
  }

  return { step, entry, error, handleEdit, handleSave, handleDelete, handleConfirmDelete };
};
```

**Key characteristics:**
- State union is a TypeScript type (`PanelStep`) — typed but not enforced against any JSON
- Transitions are ad-hoc `setStep()` calls — no transition table, no guard validation
- `connectSSE()` is a shared helper that wraps EventSource and parses the SSE stream
- Effects (API calls, SSE connections) are triggered by user actions, not state entry
- No automatic cleanup on state exit — managed manually where needed

---

## Contracts

### Structure

Each contract file in `packages/shared/src/contracts/` contains three sections:

```typescript
// packages/shared/src/contracts/knowledge.contract.ts

// 1. Request types (re-exported from schemas)
export type { KnowledgeCreateInput as KnowledgeCreateRequest } from '../schemas/knowledge.schema.js';

// 2. Response types
export interface KnowledgeCreateResponse {
  entry_id: string;
  title: string;
  file_path: string;
}

// 3. SSE event maps
export interface KnowledgeCreateEvents {
  'knowledge:create:started': { vault_id: string; title: string };
  'knowledge:create:validating-frontmatter': { title: string };
  'knowledge:create:writing-file': { vault_path: string; title: string };
  'knowledge:create:auditing': { entry_id: string; file_path: string };
  'knowledge:create:audit-warning': { entry_id: string; message: string };
  'knowledge:create:completed': { entry_id: string; file_path: string; title: string };
}
```

### Contract files

| File | Covers |
|---|---|
| `app.contract.ts` | App startup, auth status |
| `claude-config.contract.ts` | Rules, hooks, MCPs, skills read/write |
| `knowledge.contract.ts` | Create, edit, delete, search |
| `project.contract.ts` | Register, discover, dashboard |
| `repo-knowledge-extract.contract.ts` | Repo extraction flow |
| `session.contract.ts` | Create, resume, archive |
| `vault.contract.ts` | Registration, pull, push, sync, import/export |

---

## What is working

1. **Consistent structure** — every flow has the same folder layout; new developers and Claude know exactly where to look
2. **Readable orchestrators** — the emit → call → check pattern in ~80 lines tells the complete business logic
3. **SSE progress** — `connectSSE()` + `FlowEmitter` gives per-step progress for long operations (clone, index build, LLM calls)
4. **Contracts as the only coupling** — FE and BE are genuinely independent; neither imports the other's code
5. **`decisions` field** — the only place in the codebase where dated architectural rationale is recorded
6. **Error handling documented** — `error_handling` arrays name failure scenarios before code is written

---

## What is not working

### 1. No enforcement — JSONs can diverge silently

There is no `flow-lint` script, no Zod schema for step JSONs, no CI step that validates flow structure. A step JSON can say the implementation is at `actions/audit-knowledge.ts` and that file can return a stub that always succeeds — and nothing will catch it.

### 2. Frontend step JSONs are decorative

The real frontend state machine is in the hook (`PanelStep` union + `setStep()` calls). The step JSONs describe an idealized version of the flow. The actual state machine has more states (`audit`, `error`) and more transitions than any frontend step JSON captures. They cannot be used to regenerate or verify the hook.

### 3. The stub problem

`knowledge-create/actions/audit-knowledge.ts` always returns `{ audit_passed: true, findings_count: 0 }`. The step JSON documents it as a real audit step. Nothing in CI flags this. The documentation creates false confidence.

### 4. The `calls` field is redundant

Every step JSON has `"calls": ["features/.../actions/step-name.ts"]`. The same information is in the orchestrator's import statements. No tooling reads `calls`. It will drift.

### 5. Event naming inconsistency

Step JSON `success_handling.event.action` uses underscores (`knowledge_create_writing_file`). Wire events use colons (`knowledge:create:writing-file`). Both are maintained manually with no validator connecting them.

### 6. Refactoring is penalized

Renaming or merging a step requires: renumbering JSONs, updating the orchestrator, updating CLAUDE.md, updating the contract's SSE events. This friction discourages iterative improvement.

### 7. TypeScript-only — not language-agnostic

The entire system is built around TypeScript. The step JSONs reference `.ts` file paths. The skills generate TypeScript. The system has no path to supporting Python, Go, Java, or Rust flows even though Nori will analyze projects written in those languages.
