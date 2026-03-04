# Nori Flow Methodology

**Date**: 2026-03-03
**Status**: Foundational — supersedes flow-system-options.md for the long-term direction
**Key insight**: Nori targets TypeScript, Python, Go, Java, Rust, React, Vue, Angular and more.
The flow system cannot be a library. It must be a methodology.

---

## The analogy that frames everything

REST is not a library. It is a set of architectural constraints (statelessness, resource orientation, uniform interface) that you implement in any language using any HTTP framework. The constraints are universal. The implementation is language-specific. The universal artifact is HTTP + JSON.

Nori's flow system is the same model:

- The **constraints** (invariants) are universal — what a flow must be, what a step must be, what error handling must look like
- The **implementation** is language-specific — Go structs, Python dataclasses, TypeScript classes, Java interfaces
- The **universal artifact** is the Nori Flow JSON schema — every language writes it, Nori reads it

What Nori owns: the schema, the validator, the Flow Explorer UI, and the AI skills.
What teams own: the runner implementation in their language, co-located with their code.

---

## The two flow types

All flows are one of two types, regardless of language or framework.

### Type 1 — Pipeline (backend / server-side / CLI)

A sequential set of steps. One path forward. Each step is a pure function that takes input, returns output or an error. The orchestrator calls steps in order and emits events between them.

```
step 1 → step 2 → step 3 → ... → done
              ↓ (on fatal error)
           abort
```

**Invariants — must hold in any language:**
1. Each step has a name, a description (`what`), a reason (`why`), and an error policy (`fatal: true/false`)
2. Each step is implemented by exactly one function/method with a standard signature
3. The return type is always: `success + data` OR `failure + error code + message + severity`
4. Fatal steps abort the entire flow on failure. Non-fatal steps emit a warning and continue.
5. The orchestrator emits a named event before each step runs
6. Events follow the naming convention: `domain:flow:step-name`
7. The flow accepts an optional emitter — if none is provided, events are silently dropped

### Type 2 — State Machine (frontend / UI / interactive)

A named set of states with explicit transitions between them. The current state determines what renders. Transitions are triggered by external events: user actions, API results, SSE streams, timers. Effects run when entering a state and are cleaned up when leaving.

```
state-A --[event]--> state-B --[event]--> state-C
                         ↑                    |
                         └──────[event]───────┘
```

**Invariants — must hold in any language/framework:**
1. States are named, finite, and declared upfront
2. Each state has exactly one rendering responsibility
3. Transitions between states are triggered by named events — not by ad-hoc flag setting
4. Effects (API calls, SSE connections, timers) are attached to state entry and cleaned up on state exit
5. Context (shared data) is carried through the machine and updated on transitions
6. Invalid transitions (not declared) are rejected

---

## The Nori Flow JSON Schema

The JSON is the universal artifact. Every language generates it. Nori reads it regardless of source language.

### Backend flow schema

```json
{
  "$schema": "https://nori.dev/schemas/flow/v1",
  "nori_version": "1",
  "type": "pipeline",
  "name": "knowledge-create",
  "domain": "knowledge",
  "language": "typescript",
  "decisions": [
    { "date": "2026-02-20", "reason": "...", "rationale": "..." }
  ],
  "steps": [
    {
      "id": "01-validate-frontmatter",
      "what": "Validate title, category, tags against schema rules",
      "why": "Fail fast before file IO — validation is cheap",
      "fatal": true,
      "stub": null,
      "errors": [
        { "code": "INVALID_FRONTMATTER", "severity": "error", "recoverable": true }
      ],
      "decisions": []
    },
    {
      "id": "04-audit-knowledge",
      "what": "Run quality audit on the written entry",
      "why": "Surface quality issues immediately after creation",
      "fatal": false,
      "stub": { "reason": "Requires flow_call to knowledge-audit", "planned_for": "v2" },
      "errors": [],
      "decisions": []
    }
  ]
}
```

### Frontend / state machine schema

```json
{
  "$schema": "https://nori.dev/schemas/flow/v1",
  "nori_version": "1",
  "type": "state-machine",
  "name": "knowledge-detail",
  "domain": "knowledge",
  "language": "typescript",
  "framework": "solidjs",
  "states": {
    "loading":          { "what": "Fetching entry from API" },
    "view":             { "what": "Entry displayed. Edit and delete available.", "renders": "KnowledgeDetailView" },
    "editing":          { "what": "Edit form active", "renders": "KnowledgeEditForm" },
    "saving":           { "what": "SSE write in progress", "renders": "ProgressView" },
    "audit":            { "what": "Audit results shown", "renders": "AuditResults" },
    "confirm-delete":   { "what": "Delete confirmation dialog", "renders": "DeleteConfirmation" },
    "deleting":         { "what": "SSE delete in progress", "renders": "ProgressView" },
    "deleted":          { "what": "Entry removed, navigating away" },
    "error":            { "what": "Load failed", "renders": "ErrorView" }
  },
  "transitions": [
    { "from": "loading",        "to": "view",           "on": "api:success"    },
    { "from": "loading",        "to": "error",          "on": "api:failure"    },
    { "from": "view",           "to": "editing",        "on": "user:edit"      },
    { "from": "editing",        "to": "saving",         "on": "user:submit"    },
    { "from": "saving",         "to": "audit",          "on": "sse:success"    },
    { "from": "saving",         "to": "editing",        "on": "sse:error"      },
    { "from": "view",           "to": "confirm-delete", "on": "user:delete"   },
    { "from": "confirm-delete", "to": "deleting",       "on": "user:confirm"  },
    { "from": "confirm-delete", "to": "view",           "on": "user:cancel"   },
    { "from": "deleting",       "to": "deleted",        "on": "sse:success"   },
    { "from": "deleting",       "to": "confirm-delete", "on": "sse:error"     }
  ]
}
```

The schema is identical whether the project is TypeScript, Python, Go, or Java. The `language` and `framework` fields tell Nori which reference implementation to use for code generation hints, nothing more.

---

## What Nori provides

### 1. The JSON schema (universal)
A versioned JSON Schema definition at `nori.dev/schemas/flow/v1`. Teams validate their generated JSON against this. Nori validates it during import. It evolves with a compatibility guarantee.

### 2. The Flow Explorer (universal)
Reads flow JSONs from any linked project, regardless of language. Shows pipelines visually. Shows state machine graphs. Shows stubs, decisions, error policies. The View Code panel shows the language-specific implementation file. Language is just metadata.

### 3. The validator (universal)
A Nori-side check that runs when a project is linked or synced: reads all `**/steps/*.json` or `**/*.flow.json`, validates against the schema, checks for undeclared stubs, checks event naming consistency.

### 4. The AI skills (parameterized by language)
The `create-be-flow` skill exists today for TypeScript. The same skill, parameterized by language, works for Python, Go, and Java. The skill's job is to generate: the JSON flow definition, and the language-specific implementation files that follow the invariants. The JSON is the same. The code is different.

```
# TypeScript version
skill: create-be-flow
language: typescript
→ generates: knowledge-create.ts (orchestrator), actions/*.ts, steps/*.json

# Python version
skill: create-be-flow
language: python
→ generates: knowledge_create.py (orchestrator), actions/*.py, steps/*.json

# Go version
skill: create-be-flow
language: go
→ generates: knowledge_create.go (orchestrator), actions/*.go, steps/*.json
```

### 5. Language reference implementations (owned by the project, not Nori)
For each language, Nori provides a reference implementation of the runner (pipeline) and machine (state machine) — typically 50–150 lines. Teams copy this into their project and own it. It is not a dependency. It is a starting point.

---

## Language reference implementations

The invariants define what the implementation must do. The syntax is idiomatic per language.

### TypeScript — Pipeline runner

```typescript
// ~80 lines. Copy into your project. Own it.
export type StepFn<Ctx> = (ctx: Ctx) => Promise<StepResult<Ctx>>;

export interface PipelineStep<Ctx> {
  id: string;
  fatal: boolean;
  run: StepFn<Ctx>;
}

export async function runPipeline<Ctx>(
  steps: PipelineStep<Ctx>[],
  initial: Ctx,
  emit: (event: string, data: unknown) => void = () => {}
): Promise<{ success: true; data: Ctx } | { success: false; error: FlowError }> {
  let ctx = initial;
  for (const step of steps) {
    emit(`step:${step.id}:started`, ctx);
    const result = await step.run(ctx);
    if (!result.success) {
      if (step.fatal) return result;
      emit(`step:${step.id}:warning`, result.error);
      continue;
    }
    ctx = result.data;
    emit(`step:${step.id}:completed`, ctx);
  }
  return { success: true, data: ctx };
}
```

### Python — Pipeline runner

```python
# ~60 lines. Copy into your project. Own it.
from dataclasses import dataclass
from typing import TypeVar, Generic, Callable, Awaitable
import asyncio

Ctx = TypeVar('Ctx')

@dataclass
class StepResult(Generic[Ctx]):
    success: bool
    data: Ctx | None = None
    error: dict | None = None

@dataclass
class PipelineStep(Generic[Ctx]):
    id: str
    fatal: bool
    run: Callable[[Ctx], Awaitable[StepResult[Ctx]]]

async def run_pipeline(steps, initial_ctx, emit=None):
    emit = emit or (lambda event, data: None)
    ctx = initial_ctx
    for step in steps:
        emit(f"step:{step.id}:started", ctx)
        result = await step.run(ctx)
        if not result.success:
            if step.fatal:
                return result
            emit(f"step:{step.id}:warning", result.error)
            continue
        ctx = result.data
        emit(f"step:{step.id}:completed", ctx)
    return StepResult(success=True, data=ctx)
```

### Go — Pipeline runner

```go
// ~70 lines. Copy into your project. Own it.
type StepResult[T any] struct {
    Success bool
    Data    T
    Error   *FlowError
}

type PipelineStep[T any] struct {
    ID    string
    Fatal bool
    Run   func(ctx context.Context, data T) StepResult[T]
}

type EmitFn func(event string, data any)

func RunPipeline[T any](
    ctx context.Context,
    steps []PipelineStep[T],
    initial T,
    emit EmitFn,
) StepResult[T] {
    if emit == nil {
        emit = func(string, any) {}
    }
    data := initial
    for _, step := range steps {
        emit("step:"+step.ID+":started", data)
        result := step.Run(ctx, data)
        if !result.Success {
            if step.Fatal {
                return result
            }
            emit("step:"+step.ID+":warning", result.Error)
            continue
        }
        data = result.Data
        emit("step:"+step.ID+":completed", data)
    }
    return StepResult[T]{Success: true, Data: data}
}
```

### Java — Pipeline runner

```java
// ~90 lines. Copy into your project. Own it.
public class FlowRunner<T> {
    @FunctionalInterface
    public interface Step<T> {
        StepResult<T> run(T context);
    }

    public record PipelineStep<T>(String id, boolean fatal, Step<T> run) {}

    public record StepResult<T>(boolean success, T data, FlowError error) {
        public static <T> StepResult<T> ok(T data) { return new StepResult<>(true, data, null); }
        public static <T> StepResult<T> fail(FlowError error) { return new StepResult<>(false, null, error); }
    }

    public StepResult<T> runPipeline(List<PipelineStep<T>> steps, T initial, BiConsumer<String, Object> emit) {
        if (emit == null) emit = (e, d) -> {};
        T ctx = initial;
        for (var step : steps) {
            emit.accept("step:" + step.id() + ":started", ctx);
            var result = step.run().run(ctx);
            if (!result.success()) {
                if (step.fatal()) return result;
                emit.accept("step:" + step.id() + ":warning", result.error());
                continue;
            }
            ctx = result.data();
            emit.accept("step:" + step.id() + ":completed", ctx);
        }
        return StepResult.ok(ctx);
    }
}
```

### React — State machine (frontend)

```typescript
// ~100 lines. Copy into your project. Own it.
// No XState. No library. A hook that reads the invariants.
function useFlowMachine<S extends string, Ctx>(config: {
  initial: S;
  states: Record<S, { what: string }>;
  transitions: Array<{ from: S; to: S; on: string }>;
  context: Ctx;
  effects?: Partial<Record<S, (send: SendFn, ctx: Ctx) => (() => void) | void>>;
}) {
  const [state, setState] = useState<S>(config.initial);
  const [context, setContext] = useState<Ctx>(config.context);
  // ... machine logic, effect lifecycle, send validation
  return { state, context, send };
}
```

### SolidJS — State machine (frontend)

```typescript
// Same shape, SolidJS signals instead of useState
function useFlowMachine<S extends string, Ctx>(config: { ... }) {
  const [state, setState] = createSignal<S>(config.initial);
  const [context, setContext] = createStore<Ctx>(config.context);
  // ... machine logic, effect lifecycle, send validation
  return { state, context, send };
}
```

The two framework versions are ~100 lines each. They are the same logic. They differ only in their reactive primitive (`useState` vs `createSignal`).

---

## The code generation path (Option 2 applied universally)

Source of truth → Language-specific definition → Generate JSON → Nori reads JSON

```
TypeScript:  defineFlow({ ... })    → bun run flow:generate  → steps/*.json
Python:      @flow(...)             → python flow_generate.py → steps/*.json
Go:          FlowDef{...}           → go run flow_generate.go → steps/*.json
Java:        @Flow(...)             → mvn nori:generate        → steps/*.json
```

Each language has its own generator script — owned by the project, not Nori. The output schema is always the same. Nori's Flow Explorer reads the JSON regardless of which generator produced it.

The AI skill `create-be-flow` generates both the language-specific definition AND the steps/*.json in one pass. No separate generation step needed when Claude creates a flow — the JSON is created at the same time as the code.

---

## What this changes about how Nori works

### Currently
Nori is a TypeScript tool that understands TypeScript flows. The skills assume TypeScript. The step JSONs are hand-written TypeScript-specific paths. The flow system only works in `@nori/core`.

### With this methodology
Nori reads flow JSONs from any linked project, regardless of language. When you link a Python project that has Nori flows, Nori's Flow Explorer shows its pipelines the same way it shows TypeScript ones. The AI skills adapt to the project's language. The validator runs on the JSON, not the source code.

Nori becomes a tool that understands your project's flows — not because it can parse Python or Go, but because every Nori-compatible project speaks the same JSON schema.

---

## What Nori does NOT do

- Nori does not provide a runtime library as a dependency. Teams own their runner.
- Nori does not dictate the internal structure of each step. Only the interface (input/output shape) is constrained.
- Nori does not version-lock the methodology. The JSON schema is versioned. Teams upgrade on their own schedule.
- Nori does not replace test frameworks, CI systems, or package managers. It adds a layer of structured understanding on top of whatever a team already uses.

---

## Open questions

1. **JSON schema hosting** — where does `nori.dev/schemas/flow/v1` live? Does it require a Nori account, or is it open/embedded?

2. **Generator portability** — the generator script for each language is currently written manually per project. Should Nori provide generators as CLI commands (`nori generate --lang go`) that teams can invoke?

3. **The state machine schema for frameworks** — SolidJS and React have fine-grained reactivity. Vue's Composition API differs from Angular's RxJS approach. Does the state machine JSON schema need a `rendering_model` field to capture how the framework maps states to templates/components?

4. **Flow discovery** — how does Nori know where to look for flow JSONs in a linked project? Convention (`**/steps/*.json`) or a config file (`nori.config.json` with `flows.pattern`)?

5. **The methodology for non-UI non-server code** — what does a Nori flow look like for a data pipeline (Python), a build system (Go), a CLI tool (Rust)? The pipeline type covers this, but the event naming convention and step types need to be verified against these use cases.
