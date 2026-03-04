# Flow System — Three Implementation Options

**Date**: 2026-03-03
**Status**: Proposal
**Prerequisite**: Read `flow-system-review.md` first

Three architecturally distinct ways to implement the flow system properly — so that step JSONs are enforced, drift is impossible or mechanically detected, and the AI-context value is preserved.

---

## Option 1 — The Validator Path

> Keep the current structure. Add mechanical enforcement around it.

### Philosophy

The existing three-layer pattern (steps/ + actions/ + orchestrator) is sound. The problem is that there is no mechanism preventing JSON and TypeScript from diverging. This option adds that mechanism without changing the model. It is the least disruptive path and the one most compatible with the current skill set.

### How it works

**A. A `flow-lint` script runs in CI and as a pre-commit hook**

The script does four checks for every flow folder it finds:

1. **File existence check** — for each step JSON, resolve `where.implementation` and verify the file exists on disk
2. **Import check** — parse the orchestrator's import statements and verify every action referenced in any step JSON appears as an import
3. **Emit check** — parse the orchestrator's source and verify a `emit(...)` call exists that mentions the step's expected event name (e.g., `knowledge:create:validating-frontmatter`)
4. **Stub check** — scan action files for a `// STUB` marker; if found, add it to a stub registry and fail CI unless the stub is registered in an allow-list file

**B. A `stubs.json` file at the repo root**

Stubs are not forbidden — they are managed. Any stub action must be declared here with a planned version:

```json
{
  "stubs": [
    {
      "file": "packages/core/src/features/knowledge/knowledge-create/actions/audit-knowledge.ts",
      "planned_for": "v2",
      "reason": "Requires knowledge-audit flow to be wired as a flow_call"
    },
    {
      "file": "packages/core/src/features/knowledge/knowledge-audit/actions/check-ai-originality.ts",
      "planned_for": "v2",
      "reason": "Requires LLM call; heuristic version acceptable for v1"
    }
  ]
}
```

Undeclared stubs fail CI. Declared stubs are visible, intentional, and versioned.

**C. The `calls` field is removed from step JSONs**

It was always redundant with imports. With the import check in `flow-lint`, the information is now verified rather than duplicated. The field is removed from the skill template and existing JSONs.

**D. Frontend step JSONs get an explicit `states` block**

Rather than just describing what renders, the frontend step JSON is extended to document the hook states that correspond to this step:

```json
{
  "type": "ui_action",
  "what": "Show the entry detail with edit, delete, and navigation actions",
  "states": {
    "view": "Entry loaded and displayed. User can trigger edit or delete.",
    "editing": "Edit form active. Awaiting save or cancel.",
    "saving": "SSE connection open. Waiting for write confirmation.",
    "audit": "Write completed. Showing audit findings.",
    "confirm-delete": "Delete confirmation dialog visible.",
    "deleting": "SSE connection open. Waiting for deletion confirmation.",
    "deleted": "Entry removed. Navigation to list pending."
  },
  "transitions": {
    "view → editing": "user clicks Edit",
    "editing → saving": "user submits form",
    "saving → audit": "SSE onResult success",
    "saving → editing": "SSE onResult error",
    "view → confirm-delete": "user clicks Delete",
    "confirm-delete → deleting": "user confirms",
    "deleting → deleted": "SSE onResult success",
    "deleting → confirm-delete": "SSE onResult error"
  }
}
```

The `flow-lint` script verifies that every state named here appears in the hook's step signal type union.

### What changes vs. the current system

| | Current | Option 1 |
|---|---|---|
| JSON drives execution | No | No |
| JSON verified against code | No | **Yes — flow-lint** |
| Stubs | Silent, invisible | **Explicit, versioned** |
| Frontend states documented | No | **Yes — states + transitions block** |
| Hook state union verified | No | **Yes — flow-lint checks** |
| Creation overhead | 4 files | 4 files (same) |
| Refactoring cost | High | Slightly lower — lint catches mistakes |

### Tradeoffs

**Pros:** Lowest change cost. No new mental model. The AI context value is fully preserved. Works within the existing skill set. Can be shipped incrementally — the linter starts with just the file existence check and grows.

**Cons:** Drift is *detectable* but not *impossible* — a developer can still write a step JSON that lies about what the code does; the linter only checks structural references, not semantic correctness. The enforcement is as good as the linter rules, which need to be maintained. Frontend state documentation is still manually written, just in a richer format.

---

## Option 2 — The Generator Path

> Flip the model. TypeScript is the source of truth. JSON is derived.

### Philosophy

The fundamental problem is that the JSON is written by hand and the TypeScript is written by hand — two independent artifacts that are supposed to describe the same thing. The solution is to have one source of truth and derive the other. Since TypeScript must exist for the code to run, TypeScript becomes the source. JSON is generated from it.

This is the same relationship that Zod has with JSON Schema: you write the Zod schema, you get JSON Schema for free. You never maintain both.

### How it works

**A. Flows are defined in TypeScript using a typed builder**

```typescript
// knowledge-create/knowledge-create.flow.ts
import { defineFlow, defineStep } from '@nori/core/flow-builder';
import { validateFrontmatter } from './actions/validate-frontmatter.js';
import { validateContent } from './actions/validate-content.js';
import { writeMarkdownFile } from './actions/write-markdown-file.js';
import { auditKnowledge } from './actions/audit-knowledge.js';
import { regenerateIndex } from './actions/regenerate-index.js';

export const knowledgeCreateFlow = defineFlow({
  name: 'knowledge-create',
  domain: 'knowledge',
  decisions: [
    { date: '2026-02-20', reason: 'Audit is non-fatal', rationale: 'A quality warning should not block creation' }
  ],
  steps: [
    defineStep({
      id: '01-validate-frontmatter',
      what: 'Validate title, category, tags, description against schema rules',
      why: 'Fail fast before writing to disk — validation is cheap, file IO is not',
      action: validateFrontmatter,
      fatal: true,
      errors: [
        { code: 'INVALID_FRONTMATTER', scenario: 'Required fields missing or malformed', severity: 'error', recoverable: true }
      ],
    }),
    defineStep({
      id: '02-validate-content',
      what: 'Check content is non-empty and meets minimum length',
      why: 'Prevent writing empty or trivially short knowledge entries',
      action: validateContent,
      fatal: true,
    }),
    defineStep({
      id: '03-write-markdown-file',
      what: 'Write the markdown file to the vault directory',
      why: 'Persist the knowledge entry as a file — files are the source of truth',
      action: writeMarkdownFile,
      fatal: true,
      errors: [
        { code: 'FILE_ALREADY_EXISTS', scenario: 'Slug collision', severity: 'error', recoverable: true },
        { code: 'PERMISSION_DENIED', scenario: 'Vault directory not writable', severity: 'fatal', recoverable: false },
      ],
    }),
    defineStep({
      id: '04-audit-knowledge',
      what: 'Run quality audit on the written entry',
      why: 'Surface frontmatter and content quality issues immediately after creation',
      action: auditKnowledge,
      fatal: false,   // non-fatal: audit warning does not block creation
      stub: { reason: 'Stub until knowledge-audit flow_call is wired', plannedFor: 'v2' },
    }),
    defineStep({
      id: '05-regenerate-index',
      what: 'Insert new entry into the search index DB',
      why: 'Make the entry immediately searchable without a full index rebuild',
      action: regenerateIndex,
      fatal: false,
    }),
  ],
});
```

**B. The `defineStep` builder enforces at compile time:**
- `action` must be a function with the standard signature `(input: I, context: FlowContext) => StepResult<O> | FlowError`
- If `stub` is set, the type system infers that the action's return is a placeholder and marks it in the generated JSON
- `errors` are typed against a shared error code registry in `@nori/shared` — unknown error codes fail TypeScript compilation

**C. The orchestrator is generated from the flow definition**

A `runFlow(flow, input, emitter)` generic executor calls each step's `action` in sequence, checks `fatal`, emits events using the step `id` as the event segment, and handles errors according to the step policy. The hand-written orchestrator disappears.

```typescript
// Before (hand-written orchestrator)
const frontmatterResult = validateFrontmatter(...);
if (!frontmatterResult.success) return frontmatterResult;

// After (generated by the executor)
// The executor does this automatically for every step
// The developer only writes the action function
```

**D. A build script generates the step JSONs from the flow definition**

```
bun run flow:generate
```

This walks all `*.flow.ts` files, calls `.toJSON()` on each flow definition, and writes the step JSON files to `steps/`. The JSON is now always accurate. The AI gets the same JSON context it had before, but it can never drift.

**E. Frontend flows use a typed state machine builder**

```typescript
// knowledge-detail/knowledge-detail.flow.ts
export const knowledgeDetailFlow = defineFrontendFlow({
  name: 'knowledge-detail',
  states: {
    loading:        { what: 'Fetching entry data from API' },
    view:           { what: 'Entry displayed. Edit and delete available.' },
    editing:        { what: 'Edit form active' },
    saving:         { what: 'SSE connection open, write in progress' },
    audit:          { what: 'Audit results displayed' },
    'confirm-delete': { what: 'Delete confirmation dialog' },
    deleting:       { what: 'SSE connection open, delete in progress' },
    deleted:        { what: 'Entry removed' },
    error:          { what: 'Load failed' },
  },
  transitions: {
    'loading → view':           'API fetch success',
    'loading → error':          'API fetch failure',
    'view → editing':           'user clicks Edit',
    'editing → saving':         'user submits form',
    'saving → audit':           'SSE onResult success',
    'saving → editing':         'SSE onResult error',
    'view → confirm-delete':    'user clicks Delete',
    'confirm-delete → deleting':'user confirms',
    'deleting → deleted':       'SSE onResult success',
    'deleting → confirm-delete':'SSE onResult error',
  },
});
```

The builder infers the state union type from the `states` keys. The hook's `createSignal<Step>` is typed from `typeof knowledgeDetailFlow.StateType`. TypeScript errors if a state used in the hook is not declared in the flow definition.

### What changes vs. the current system

| | Current | Option 2 |
|---|---|---|
| Source of truth | JSON (manual) | **TypeScript (builder)** |
| JSON files | Hand-written | **Generated — always accurate** |
| Type safety on flow definition | None | **Full — action signatures checked at compile time** |
| Orchestrator | Hand-written | **Generic executor — no hand-writing** |
| Frontend state machine typed | No | **Yes — states typed from builder** |
| AI context (JSON) | Manual, can drift | **Generated, always correct** |
| Stubs | Invisible | **Typed property on defineStep — surfaced in generated JSON** |
| Creation overhead | 4 files | **2 files — flow definition + action files** |

### Tradeoffs

**Pros:** Drift is eliminated by construction. TypeScript enforces the structure. The AI gets accurate JSON. Stubs are visible in the type system. Refactoring is safer — rename a step in the builder, regenerate, the JSON updates automatically. Less boilerplate — no hand-written orchestrator.

**Cons:** The builder API must be designed well or it becomes more complex than what it replaces. The `defineFlow` / `defineStep` types are non-trivial to get right — variadic generics are needed to thread input/output types across steps. The generated orchestrator is less readable than a hand-written one because it's generic. The `decisions` field becomes a property on `defineFlow` rather than a prominent first-class section — it may feel less natural. This is a significant upfront investment before the first flow can be migrated.

---

## Option 3 — The Runtime Path

> The JSON is the execution plan. The TypeScript actions are registered plugins. The engine reads the JSON and runs the registered functions.

### Philosophy

Push the current model to its logical conclusion. If the step JSONs describe what should happen, make them actually happen. The JSON becomes a workflow definition that a generic flow engine executes. Actions are registered by name and looked up at runtime. The engine handles sequencing, event emission, error policy, and fatal/non-fatal distinction. Writing a new flow means writing action functions and a JSON — the engine needs no changes.

This is the pattern used by workflow engines like Temporal, AWS Step Functions, and GitHub Actions. It applies the same idea at a smaller, embedded scale.

### How it works

**A. A `FlowRegistry` maps action names to functions**

```typescript
// packages/core/src/flow-engine/registry.ts
export class FlowRegistry {
  private actions = new Map<string, ActionFn>();

  register(name: string, fn: ActionFn): void {
    this.actions.set(name, fn);
  }

  resolve(name: string): ActionFn {
    const fn = this.actions.get(name);
    if (!fn) throw new Error(`Action not registered: ${name}`);
    return fn;
  }
}

export type ActionFn = (input: unknown, context: FlowContext) => Promise<StepResult<unknown> | FlowError>;
```

**B. The flow engine reads step JSONs and executes them**

```typescript
// packages/core/src/flow-engine/executor.ts
export async function runFlow(
  stepsDir: string,
  input: unknown,
  registry: FlowRegistry,
  emitter: FlowEmitter
): Promise<FlowResult<unknown>> {
  const stepFiles = readdirSync(stepsDir)
    .filter(f => f.endsWith('.json'))
    .sort();

  let context: FlowContext = { data: input };

  for (const stepFile of stepFiles) {
    const step = JSON.parse(readFileSync(join(stepsDir, stepFile), 'utf-8'));
    const actionName = step.action_id;     // e.g. "knowledge-create:validate-frontmatter"
    const fatal = step.fatal ?? true;

    emitter.emit(`${step.domain}:${step.flow}:${step.event_name}`, context.data);

    const action = registry.resolve(actionName);
    const result = await action(context.data, context);

    if (!result.success) {
      if (fatal) return result;
      emitter.emit(`${step.domain}:${step.flow}:${step.event_name}-warning`, { error: result.error });
      continue;
    }

    // Merge step output into context for next step
    context = { data: { ...context.data, ...result.data } };
  }

  return { success: true, data: context.data };
}
```

**C. Actions are registered at startup**

```typescript
// packages/core/src/features/knowledge/knowledge-create/register.ts
import { registry } from '../../../flow-engine/registry.js';
import { validateFrontmatter } from './actions/validate-frontmatter.js';
import { validateContent } from './actions/validate-content.js';
import { writeMarkdownFile } from './actions/write-markdown-file.js';
import { auditKnowledge } from './actions/audit-knowledge.js';
import { regenerateIndex } from './actions/regenerate-index.js';

registry.register('knowledge-create:validate-frontmatter', validateFrontmatter);
registry.register('knowledge-create:validate-content', validateContent);
registry.register('knowledge-create:write-markdown-file', writeMarkdownFile);
registry.register('knowledge-create:audit-knowledge', auditKnowledge);
registry.register('knowledge-create:regenerate-index', regenerateIndex);
```

**D. The step JSON gains an `action_id` field and `fatal` flag**

```json
{
  "type": "action",
  "action_id": "knowledge-create:write-markdown-file",
  "fatal": true,
  "what": "Write the markdown file to the vault directory",
  "why": "Persist the knowledge entry as a file — files are the source of truth",
  "domain": "knowledge",
  "flow": "create",
  "event_name": "writing-file",
  "error_handling": [
    {
      "code": "FILE_ALREADY_EXISTS",
      "scenario": "Slug collision with an existing entry",
      "severity": "error",
      "recoverable": true
    }
  ],
  "decisions": [
    { "date": "2026-02-20", "reason": "Use slug from title for filename", "rationale": "Predictable, human-readable filenames" }
  ]
}
```

**E. Drift becomes a runtime error, not a silent documentation divergence**

If `action_id` doesn't match a registered function, `registry.resolve()` throws immediately on startup. You cannot run a flow whose JSON references an unregistered action. The connection between JSON and TypeScript is now enforced at runtime.

**F. Frontend flows: a client-side state machine engine reads the frontend step JSONs**

The frontend step JSONs define states and transitions. A small `useFlowMachine(stepsDir)` hook loads the JSONs, builds a state machine, and provides `currentState`, `transition(event)`, and `canTransition(event)`. The hook in each component uses this machine instead of a manually written step signal.

```typescript
// Generated from the step JSONs
const { state, transition } = useFlowMachine('/knowledge-detail/steps');

// In the component
<Show when={state() === 'view'}>
  <KnowledgeDetailView onEdit={() => transition('user-edit')} />
</Show>
```

SSE events trigger transitions via `transition('sse:knowledge:edit:completed')`. The JSON defines which SSE event maps to which transition.

### What changes vs. the current system

| | Current | Option 3 |
|---|---|---|
| JSON drives execution | No | **Yes** |
| Drift possible | Yes | **No — runtime error on startup** |
| Hand-written orchestrator | Yes | **No — engine handles sequencing** |
| Action signature standardized | No | **Yes — required for registration** |
| TypeScript type safety across steps | Full | **Lost — input/output is `unknown` between steps** |
| Frontend state machine | Hook-managed | **Engine-managed** |
| AI context | JSON (documentation) | **JSON (execution plan — always accurate)** |
| Debuggability | Easy — read the orchestrator | **Harder — execution is indirect** |
| New flow | 4 files | **3 files — step JSONs, action files, register.ts** |

### Tradeoffs

**Pros:** The JSON is genuinely the source of truth — not documentation, not a code-generation input, but the actual execution plan. Drift is impossible. Writing a new flow is simpler — no orchestrator to write. The engine handles event emission, fatal/non-fatal logic, and context threading consistently for all flows. The AI context (step JSONs) is accurate by construction because the engine reads and validates it on startup.

**Cons:** TypeScript type safety across step boundaries is lost. Between steps, `context.data` is `unknown` — the engine can't know the output type of step 3 to pass as input to step 4 without explicit type declarations or runtime validation (Zod schemas per step). Debugging is harder — instead of reading a linear orchestrator, you follow the engine through the registry. SSE events in the frontend transition model may not cover all the non-deterministic cases (e.g., an LLM that can return either questions or proposals — the JSON can model this but becomes more complex than the hook it replaces). This is the highest-risk, highest-investment option.

---

## Comparison

| | Option 1 — Validator | Option 2 — Generator | Option 3 — Runtime |
|---|---|---|---|
| **Source of truth** | JSON (manual, verified) | TypeScript (generates JSON) | JSON (drives execution) |
| **Drift prevention** | Detectable (CI lint) | Impossible (generated) | Impossible (runtime error) |
| **TypeScript safety** | Full | Full | Lost across step boundaries |
| **Frontend solved** | Partially (documented states) | Yes (typed state builder) | Yes (engine manages states) |
| **Investment to implement** | Low | Medium | High |
| **Risk** | Low | Medium | High |
| **Reversibility** | High — add linter, done | Medium — migration required | Low — full architectural change |
| **Readable orchestrators** | Yes | No (generic executor) | No (indirect via registry) |
| **AI context accuracy** | Manual + verified | Generated (always accurate) | Always accurate (execution plan) |
| **Best for** | Preserving current model | Long-term maintainability | Full commitment to JSON-as-truth |

---

## Recommendation logic

If the priority is **lowest risk, fastest improvement**: Option 1. The linter closes the enforcement gap without changing how flows are written. It can be shipped in a week and immediately catches the stub problem.

If the priority is **long-term correctness and AI-context reliability**: Option 2. The builder pattern eliminates drift entirely, maintains TypeScript safety, and reduces boilerplate. It requires designing the builder API well — a non-trivial upfront investment — but every new flow after that is faster and safer.

If the priority is **fully committing to the flow system as a core architectural pattern**: Option 3. The JSON becomes infrastructure, not documentation. This is the path if the flow system itself is a product feature of Nori (i.e., users will eventually define their own flows and see the engine execute them).

The options are not mutually exclusive in their philosophies. Option 1 can be implemented now. Option 2 can be built alongside it as the migration target. Option 3 is a future bet worth prototyping in isolation before committing.
