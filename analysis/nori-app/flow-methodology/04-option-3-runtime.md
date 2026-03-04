# Option 3 — The Runtime Path

**Date**: 2026-03-03
**Status**: Proposal
**Prerequisite**: Read `00-current-state.md` and `01-universal-schema.md`

---

## Philosophy

> The JSON is the execution plan. Actions are registered plugins. The engine reads the JSON and runs the registered functions.

Push the current model to its logical conclusion. If the step JSONs describe what should happen, make them *actually happen*. The JSON becomes a workflow definition that a generic flow engine executes at runtime. Actions are registered by name and resolved by the engine. Writing a new flow means writing action functions and a JSON — the engine needs no changes.

This is the pattern used by workflow engines like Temporal, AWS Step Functions, GitHub Actions, and Prefect. Option 3 applies the same idea at an embedded, co-located scale.

In a polyglot context, this is the only option where actions in different languages can participate in the same flow. The engine routes steps to their language runtime via RPC.

---

## How it works

### A. A `FlowRegistry` maps action names to functions

```typescript
// packages/core/src/flow-engine/registry.ts
export type ActionFn = (input: unknown, context: FlowContext) => Promise<StepResult<unknown> | FlowError>;

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
```

### B. The flow engine reads step JSONs and executes them

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
    .sort(); // numeric sort: 01-..., 02-...

  let context: FlowContext = { data: input };

  for (const stepFile of stepFiles) {
    const step = JSON.parse(readFileSync(join(stepsDir, stepFile), 'utf-8'));

    if (step.stub) {
      // Stub steps emit a warning event but are skipped
      emitter.emit(`step:${step.id}:stub`, { reason: step.stub.reason });
      continue;
    }

    emitter.emit(`step:${step.id}:started`, context.data);

    const action = registry.resolve(step.action_id);
    const result = await action(context.data, context);

    if (!result.success) {
      emitter.emit(`step:${step.id}:failed`, result.error);
      if (step.fatal) return result;
      emitter.emit(`step:${step.id}:warning`, result.error);
      continue;
    }

    context = { data: { ...context.data, ...result.data } };
    emitter.emit(`step:${step.id}:completed`, context.data);
  }

  return { success: true, data: context.data };
}
```

### C. Actions are registered at startup

```typescript
// packages/core/src/features/knowledge/knowledge-create/register.ts
import { registry } from '../../../flow-engine/registry.js';
import { validateFrontmatter } from './actions/validate-frontmatter.js';
import { validateContent } from './actions/validate-content.js';
import { writeMarkdownFile } from './actions/write-markdown-file.js';
import { auditKnowledge } from './actions/audit-knowledge.js';
import { regenerateIndex } from './actions/regenerate-index.js';

registry.register('knowledge-create:01-validate-frontmatter', validateFrontmatter);
registry.register('knowledge-create:02-validate-content', validateContent);
registry.register('knowledge-create:03-write-markdown-file', writeMarkdownFile);
registry.register('knowledge-create:04-audit-knowledge', auditKnowledge);
registry.register('knowledge-create:05-regenerate-index', regenerateIndex);
```

### D. The step JSON gains `action_id`

The JSON now references the registered action by name:

```json
{
  "$schema": "https://nori.dev/schemas/flow/v1",
  "nori_version": "1",
  "type": "pipeline",
  "name": "knowledge-create",
  "domain": "knowledge",
  "language": "typescript",
  "steps": [
    {
      "id": "01-validate-frontmatter",
      "action_id": "knowledge-create:01-validate-frontmatter",
      "what": "Validate title, category, tags, description against schema rules",
      "why": "Fail fast before file IO",
      "fatal": true,
      "stub": null,
      "errors": [
        { "code": "INVALID_FRONTMATTER", "scenario": "Required fields missing", "severity": "error", "recoverable": true }
      ],
      "decisions": []
    }
  ]
}
```

### E. Drift becomes a runtime error on startup

If `action_id` does not match any registered function, `registry.resolve()` throws immediately at startup — before any request is served. You cannot start the server with a flow whose JSON references an unregistered action. Drift is discovered at the first `bun run dev`, not in production.

### F. Frontend: a state machine engine reads the step JSONs

The frontend step JSONs define states and transitions. A `useFlowMachine(stepsDir)` hook loads the JSON, builds a state machine, and manages the current state.

```typescript
// SolidJS
const { state, send, context } = useFlowMachine('/features/knowledge/knowledge-detail/steps');

// In the component
<Switch>
  <Match when={state() === 'view'}>
    <KnowledgeDetailView onEdit={() => send('user:edit')} />
  </Match>
  <Match when={state() === 'editing'}>
    <KnowledgeEditForm onSubmit={(data) => send('user:submit', data)} />
  </Match>
  <Match when={state() === 'saving'}>
    <ProgressView />
  </Match>
</Switch>
```

SSE events drive transitions:

```typescript
connectSSE('/api/knowledge/edit', data, {
  onResult: (result) => {
    send(result.success ? 'sse:success' : 'sse:error', result);
  }
});
```

Invalid transitions (not declared in the JSON) are rejected with a console error. The JSON is the authoritative state machine definition — the component just calls `send()`.

---

## How this extends to all languages

Option 3 is the only option that can execute steps written in different languages within the same flow. This is its defining advantage in a polyglot context.

### Cross-language execution via RPC

When a step's `action_id` is not registered in the local TypeScript registry, the engine looks for it in an RPC registry:

```json
{
  "id": "02-train-model",
  "action_id": "ml-pipeline:02-train-model",
  "language": "python",
  "rpc": {
    "transport": "grpc",
    "endpoint": "localhost:50051",
    "service": "MLPipelineService",
    "method": "TrainModel"
  }
}
```

The engine calls the Python gRPC service, passes the current `context.data` as JSON, receives the result, and continues the flow. From the engine's perspective, it does not matter whether the action runs in TypeScript, Python, Go, or Java — it calls a function and gets a result back.

```typescript
// packages/core/src/flow-engine/rpc-executor.ts
async function executeStepRPC(step: StepJSON, context: FlowContext): Promise<StepResult<unknown>> {
  if (step.rpc.transport === 'grpc') {
    return callGRPC(step.rpc.endpoint, step.rpc.service, step.rpc.method, context.data);
  }
  if (step.rpc.transport === 'json-rpc') {
    return callJSONRPC(step.rpc.endpoint, step.rpc.method, context.data);
  }
  if (step.rpc.transport === 'subprocess') {
    return callSubprocess(step.rpc.command, context.data);
  }
}
```

### Language-side registration (each language registers its own actions)

**Python (FastAPI + gRPC)**:

```python
# knowledge/knowledge_create/register.py
from nori_flow import registry

@registry.action("knowledge-create:04-train-model")
async def train_model(ctx: dict) -> dict:
    # Real implementation
    model = await run_training(ctx["dataset_path"])
    return {"model_path": model.path, "accuracy": model.accuracy}
```

**Go**:

```go
// knowledge/knowledge_create/register.go
func init() {
    registry.Register("knowledge-create:02-validate-schema", ValidateSchema)
    registry.Register("knowledge-create:03-write-output", WriteOutput)
}
```

**Java**:

```java
@Component
public class KnowledgeCreateActions {
    @NoriAction("knowledge-create:01-validate-frontmatter")
    public StepResult validateFrontmatter(FlowContext ctx) { ... }
}
```

### Frontend language support

The `useFlowMachine` hook is framework-specific but the JSON it reads is identical. The same `knowledge-detail.flow.json` works for SolidJS, React, Vue, and Angular — each has its own reference implementation of the hook that reads the same JSON.

```typescript
// React version
const { state, send } = useFlowMachine('/steps', { initial: 'loading' });

// Vue version (Composition API)
const { state, send } = useFlowMachine('/steps', { initial: 'loading' });

// SolidJS version
const { state, send } = useFlowMachine('/steps', { initial: 'loading' });
```

The API surface is identical. Only the reactive primitives differ (`useState` vs `ref()` vs `createSignal()`).

---

## What changes vs. the current system

| | Current | Option 3 |
|---|---|---|
| JSON drives execution | No | **Yes — engine reads JSON to decide what to call** |
| Drift possible | Yes | **No — startup fails if action_id is unregistered** |
| Hand-written orchestrator | Yes | **No — engine handles sequencing** |
| Cross-language steps | No | **Yes — RPC-registered actions** |
| TypeScript type safety across steps | Full | **Lost — context.data is `unknown` between steps** |
| Frontend state machine | Hook-managed ad-hoc | **Engine-managed from JSON definition** |
| AI context (JSON) | Documentation only | **Execution plan — always accurate** |
| New flow overhead | 4 files | **3 files — step JSONs, action files, register file** |
| Polyglot support | TypeScript only | **Any language with an RPC adapter** |
| Debugging | Read the orchestrator | **Read the engine trace + registry** |
| Investment to implement | — | **High — engine + RPC layer + per-language adapters** |

---

## Tradeoffs

**Pros:**
- The JSON is genuinely the source of truth — not documentation, not a code-generation input, but the actual execution plan.
- Drift is caught at startup, not in CI. You cannot run a misconfigured flow.
- The only option that supports heterogeneous language flows (a TypeScript step can share a flow with a Python step).
- No hand-written orchestrators — the engine handles sequencing, event emission, fatal/non-fatal logic, and context threading consistently.
- The AI context is accurate by construction because the engine validates it at runtime.
- Writing a new flow is simpler — no orchestrator to write.

**Cons:**
- TypeScript type safety across step boundaries is lost. `context.data` is `unknown` between steps. Catching type errors requires runtime Zod validation per step — the type system cannot help here.
- Cross-language RPC introduces latency overhead compared to a direct function call. For fast operations (validation, simple IO) this is measurable.
- Debugging is harder. Instead of reading a linear orchestrator, you follow the engine through the registry, the RPC calls, and the step JSON. Stack traces cross language boundaries.
- The `useFlowMachine` hook must handle all the edge cases of the current hand-written hooks: non-deterministic transitions (LLM responses), nested SSE streams, optimistic updates, cleanup on unmount. A state machine from JSON cannot model all of these easily.
- Building and maintaining RPC adapters per language is a non-trivial infrastructure investment. gRPC requires protobuf definitions per step interface — the typed-but-runtime-only contract is complex.
- This is the highest-risk, highest-investment option. It is irreversible — migrating away from a runtime engine back to hand-written orchestrators is painful.

---

## When this is the right choice

Option 3 becomes clearly correct if **one of these is true**:

1. Nori itself will expose the flow engine as a product feature — i.e., users define their own flows via a visual builder and the engine executes them
2. Nori projects genuinely mix languages within a single flow (a TypeScript web layer calling a Python ML model calling a Go data processor in sequence)
3. The flow system needs to support long-running, distributed workflows with retries, timeouts, and checkpointing (at which point Temporal or a similar engine should be evaluated instead)

If none of these are true — if flows are per-language and Nori only needs to understand and display them — Option 2 (Generator) achieves the same JSON accuracy without the runtime complexity.

---

## Implementation path

1. Define the `action_id` convention and add it to the universal JSON schema
2. Implement `FlowRegistry` in `@nori/core/flow-engine`
3. Implement `runFlow(stepsDir, input, registry, emitter)` executor
4. Write `register.ts` files for all existing TypeScript flows
5. Validate: server starts, all action_ids resolve, no silent failures
6. Implement `useFlowMachine` for SolidJS (reading JSON state machine definition)
7. Replace ad-hoc hook state machines with `useFlowMachine` incrementally
8. For each additional language: define the RPC transport (start with JSON-RPC over subprocess, upgrade to gRPC if needed)
9. Per new language: implement the action registration pattern (decorator, annotation, etc.)
