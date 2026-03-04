# Option 2 — The Generator Path

**Date**: 2026-03-03
**Status**: Proposal
**Prerequisite**: Read `00-current-state.md` and `01-universal-schema.md`

---

## Philosophy

> Code is the source of truth. JSON is derived.

The fundamental problem with the current system is that the JSON is written by hand and the code is written by hand — two independent artifacts that are supposed to describe the same thing. The solution is to have **one source of truth and derive the other**.

Since the code must exist for the flow to run, the code becomes the source. The JSON is generated from it. You never maintain both.

This is the same relationship that Zod has with JSON Schema: you write the Zod schema, you get JSON Schema for free. You never maintain both.

The JSON is not deleted — it is generated on build and committed alongside the code. The AI reads the same JSON it always has. The difference is that it can never be wrong.

---

## How it works (TypeScript — existing language)

### A. A typed builder replaces the hand-written step JSON

```typescript
// packages/core/src/features/knowledge/knowledge-create/knowledge-create.flow.ts
import { defineFlow, defineStep } from '@nori/core/flow-engine';
import { validateFrontmatter } from './actions/validate-frontmatter.js';
import { validateContent } from './actions/validate-content.js';
import { writeMarkdownFile } from './actions/write-markdown-file.js';
import { auditKnowledge } from './actions/audit-knowledge.js';
import { regenerateIndex } from './actions/regenerate-index.js';

export const knowledgeCreateFlow = defineFlow({
  name: 'knowledge-create',
  domain: 'knowledge',
  language: 'typescript',
  decisions: [
    { date: '2026-02-20', reason: 'Audit is non-fatal', rationale: 'Quality warning must not block creation' }
  ],
  steps: [
    defineStep({
      id: '01-validate-frontmatter',
      what: 'Validate title, category, tags, description against schema rules',
      why: 'Fail fast before file IO — validation is cheap, disk writes are not',
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
      why: 'Persist the knowledge entry — files are the source of truth',
      action: writeMarkdownFile,
      fatal: true,
      errors: [
        { code: 'FILE_ALREADY_EXISTS', scenario: 'Slug collision', severity: 'error', recoverable: true },
        { code: 'PERMISSION_DENIED', scenario: 'Vault directory not writable', severity: 'fatal', recoverable: false },
      ],
      decisions: [
        { date: '2026-02-20', reason: 'Slug derived from title', rationale: 'Predictable, human-readable filenames' }
      ],
    }),
    defineStep({
      id: '04-audit-knowledge',
      what: 'Run quality audit on the written entry',
      why: 'Surface quality issues immediately after creation',
      action: auditKnowledge,
      fatal: false,
      stub: { reason: 'Requires knowledge-audit flow_call — not yet wired', plannedFor: 'v2' },
    }),
    defineStep({
      id: '05-regenerate-index',
      what: 'Insert new entry into the search index',
      why: 'Make the entry immediately searchable without a full rebuild',
      action: regenerateIndex,
      fatal: false,
    }),
  ],
});
```

`defineStep` enforces at compile time:
- `action` must be a function with the standard signature: `(ctx: Ctx) => Promise<StepResult<Ctx>>`
- `stub` makes the type system mark the step as intentionally incomplete
- `errors` codes are typed against a shared error code registry in `@nori/shared`

### B. A build script generates the step JSONs

```
bun run flow:generate
```

Walks all `*.flow.ts` files, calls `.toJSON()` on each flow definition, writes step JSON files to `steps/`. The JSON is always accurate. It can never drift.

### C. The orchestrator is generated from the flow definition

A generic `runFlow(flow, input, emitter)` executor calls each step's `action` in sequence, checks `fatal`, emits events using the step `id` as the event segment, and handles errors according to step policy. The hand-written orchestrator disappears.

```typescript
// Before (hand-written — every flow does this manually)
emit.emit('knowledge:create:validating-frontmatter', { title });
const result = await validateFrontmatter(input);
if (!result.success) return result;

// After (the executor does this automatically for every step)
// The developer only writes the action function and the flow definition
```

### D. Frontend flows use a typed state machine builder

```typescript
// packages/app/src/features/knowledge/knowledge-detail/knowledge-detail.flow.ts
import { defineStateMachine } from '@nori/app/flow-engine';

export const knowledgeDetailFlow = defineStateMachine({
  name: 'knowledge-detail',
  domain: 'knowledge',
  language: 'typescript',
  framework: 'solidjs',
  decisions: [
    { date: '2026-03-01', reason: 'SSE drives transitions', rationale: 'Write + audit can take 5-15s; SSE gives per-step feedback' }
  ],
  states: {
    loading:          { what: 'Fetching entry and content from API' },
    view:             { what: 'Entry displayed. Edit and delete available.', renders: 'KnowledgeDetailView' },
    editing:          { what: 'Edit form active. Awaiting save or cancel.', renders: 'KnowledgeEditForm' },
    saving:           { what: 'SSE connection open. Write in progress.', renders: 'ProgressView' },
    audit:            { what: 'Write completed. Audit findings shown.', renders: 'AuditResults' },
    'confirm-delete': { what: 'Delete confirmation dialog visible.', renders: 'DeleteConfirmation' },
    deleting:         { what: 'SSE connection open. Delete in progress.', renders: 'ProgressView' },
    deleted:          { what: 'Entry removed. Navigation pending.' },
    error:            { what: 'Load failed.', renders: 'ErrorView' },
  },
  transitions: [
    { from: 'loading',        to: 'view',             on: 'api:success'   },
    { from: 'loading',        to: 'error',            on: 'api:failure'   },
    { from: 'view',           to: 'editing',          on: 'user:edit'     },
    { from: 'editing',        to: 'saving',           on: 'user:submit'   },
    { from: 'saving',         to: 'audit',            on: 'sse:success'   },
    { from: 'saving',         to: 'editing',          on: 'sse:error'     },
    { from: 'view',           to: 'confirm-delete',   on: 'user:delete'   },
    { from: 'confirm-delete', to: 'deleting',         on: 'user:confirm'  },
    { from: 'confirm-delete', to: 'view',             on: 'user:cancel'   },
    { from: 'deleting',       to: 'deleted',          on: 'sse:success'   },
    { from: 'deleting',       to: 'confirm-delete',   on: 'sse:error'     },
  ],
});
```

The builder infers the state union type from the `states` keys. The hook's `createSignal<Step>` is typed from `typeof knowledgeDetailFlow.StateType`. TypeScript errors if the hook uses a state not declared in the flow definition.

---

## How this extends to all languages

The generator pattern is the most natural fit for polyglot support. Each language has its own idiom for defining structured metadata alongside code. The output is always the same JSON schema.

### Python — decorator-based generator

```python
# knowledge/knowledge_create/knowledge_create_flow.py
from nori import flow, step, FlowError

@flow(name="knowledge-create", domain="knowledge")
class KnowledgeCreateFlow:
    decisions = [
        {"date": "2026-02-20", "reason": "Audit is non-fatal", "rationale": "Quality warning must not block creation"}
    ]

    @step(id="01-validate-frontmatter", what="Validate frontmatter fields", why="Fail fast before IO", fatal=True,
          errors=[{"code": "INVALID_FRONTMATTER", "scenario": "Required fields missing", "severity": "error", "recoverable": True}])
    async def validate_frontmatter(self, ctx):
        ...

    @step(id="02-validate-content", what="Check content length", why="Prevent empty entries", fatal=True)
    async def validate_content(self, ctx):
        ...

    @step(id="03-write-file", what="Write markdown file", why="Persist the entry", fatal=True,
          errors=[{"code": "FILE_EXISTS", "scenario": "Slug collision", "severity": "error", "recoverable": True}])
    async def write_file(self, ctx):
        ...

    @step(id="04-audit", what="Audit quality", why="Surface issues immediately", fatal=False,
          stub={"reason": "Not yet implemented", "planned_for": "v2"})
    async def audit(self, ctx):
        return {"audit_passed": True}  # stub
```

Generator command: `python -m nori.generate --flow knowledge_create_flow.py`
Output: `steps/*.json` conforming to the universal schema.

### Go — struct-based generator

```go
// knowledge/knowledge_create/knowledge_create_flow.go
package knowledgecreate

import "github.com/nori/flow"

var Flow = flow.Define(flow.Config{
    Name:   "knowledge-create",
    Domain: "knowledge",
    Decisions: []flow.Decision{
        {Date: "2026-02-20", Reason: "Audit is non-fatal", Rationale: "Quality warning must not block creation"},
    },
    Steps: []flow.Step{
        {
            ID:    "01-validate-frontmatter",
            What:  "Validate frontmatter fields",
            Why:   "Fail fast before IO",
            Fatal: true,
            Run:   ValidateFrontmatter,
            Errors: []flow.StepError{
                {Code: "INVALID_FRONTMATTER", Scenario: "Required fields missing", Severity: "error", Recoverable: true},
            },
        },
        {
            ID:    "04-audit",
            What:  "Audit quality",
            Why:   "Surface issues immediately",
            Fatal: false,
            Run:   AuditKnowledge,
            Stub:  &flow.Stub{Reason: "Not yet implemented", PlannedFor: "v2"},
        },
    },
})
```

Generator command: `go run ./cmd/nori-generate ./knowledge/knowledge_create/`
Output: `steps/*.json` conforming to the universal schema.

### Java — annotation-based generator

```java
// knowledge/KnowledgeCreateFlow.java

@NoriFlow(name = "knowledge-create", domain = "knowledge")
@FlowDecision(date = "2026-02-20", reason = "Audit is non-fatal",
              rationale = "Quality warning must not block creation")
public class KnowledgeCreateFlow {

    @NoriStep(id = "01-validate-frontmatter",
              what = "Validate frontmatter fields",
              why = "Fail fast before IO",
              fatal = true)
    @StepError(code = "INVALID_FRONTMATTER", scenario = "Required fields missing",
               severity = "error", recoverable = true)
    public StepResult<ValidatedFrontmatter> validateFrontmatter(FlowContext ctx) { ... }

    @NoriStep(id = "04-audit", what = "Audit quality", why = "Surface issues", fatal = false)
    @Stub(reason = "Not yet implemented", plannedFor = "v2")
    public StepResult<AuditResult> audit(FlowContext ctx) {
        return StepResult.ok(new AuditResult(true, 0));
    }
}
```

Generator command: `mvn nori:generate` (annotation processor runs at compile time)
Output: `steps/*.json` conforming to the universal schema.

### Rust — procedural macros

```rust
// src/features/knowledge/knowledge_create/mod.rs
use nori_flow::{flow, step, FlowContext, StepResult};

#[flow(name = "knowledge-create", domain = "knowledge")]
struct KnowledgeCreateFlow;

impl KnowledgeCreateFlow {
    #[step(id = "01-validate-frontmatter",
           what = "Validate frontmatter fields",
           why = "Fail fast before IO",
           fatal = true)]
    async fn validate_frontmatter(&self, ctx: &FlowContext) -> StepResult {
        ...
    }

    #[step(id = "04-audit", what = "Audit quality", why = "Surface issues",
           fatal = false, stub = "Not yet implemented | v2")]
    async fn audit(&self, ctx: &FlowContext) -> StepResult {
        StepResult::ok(json!({"audit_passed": true})) // stub
    }
}
```

Generator command: Rust proc macros generate `steps/*.json` at compile time.

### Frontend — React (TypeScript, same builder as SolidJS)

```typescript
// src/features/knowledge/knowledge-detail/knowledge-detail.flow.ts
import { defineStateMachine } from '@nori/app/flow-engine';

export const knowledgeDetailFlow = defineStateMachine({
  // ... same builder, different framework field
  framework: 'react',
  // The generated JSON is identical
  // The reference implementation (useFlowMachine hook) differs per framework
});
```

---

## What changes vs. the current system

| | Current | Option 2 |
|---|---|---|
| Source of truth | JSON (manual) | **Language-native code (builder/annotation/decorator)** |
| JSON files | Hand-written | **Generated — always accurate** |
| TypeScript type safety on flow definition | None | **Full — action signatures checked at compile time** |
| Hand-written orchestrator | Yes | **No — generic executor for TypeScript; idiomatic runner for other languages** |
| Frontend state machine typed | No | **Yes — states typed from builder** |
| AI context (JSON) | Manual, can drift | **Generated, structurally impossible to drift** |
| Stubs | Invisible | **First-class property on step definition — surfaced in generated JSON** |
| Creation overhead | 4 files (TS) | **2 files — flow definition + action files** |
| Polyglot support | TypeScript only | **Any language with a generator** |
| Investment to implement | — | **Medium — builder API + executor + generators per language** |

---

## Tradeoffs

**Pros:**
- Drift is eliminated by construction. The JSON is a build output — it cannot be wrong.
- TypeScript end-to-end type safety (action signatures, error codes, state unions).
- The AI gets accurate JSON — the context it reads is always consistent with the code.
- Stubs are visible in the type system — you cannot accidentally stub without declaring it.
- Refactoring is safe — rename a step in the builder, regenerate, the JSON updates.
- Less boilerplate for TypeScript — no hand-written orchestrator.
- Polyglot-native — each language uses its own metaprogramming idiom.

**Cons:**
- The builder API must be designed well. Variadic generics for threading types across steps are non-trivial in TypeScript. Poor builder design is worse than what it replaces.
- The generated executor (TypeScript generic runner) is less readable than a hand-written orchestrator. You cannot "read the flow" by reading one file — you read the flow definition + the executor logic.
- The `decisions` field becomes a property on `defineFlow` rather than a prominent section. It may feel less natural to record rationale in code than in JSON.
- Each new language requires building and maintaining a generator. The generator for Go is different from the generator for Python. These are small but non-zero investments.
- Cross-language type safety ends at the language border. A Go step outputs `map[string]interface{}` that a Python step receives as a dict — there is no compile-time guarantee across the boundary.
- Significant upfront investment before the first flow can be migrated.

---

## Implementation path

1. Design and implement `defineFlow` / `defineStep` types in `@nori/core/flow-engine` (TypeScript)
2. Implement `defineStateMachine` in `@nori/app/flow-engine` (TypeScript, SolidJS)
3. Implement the generic `runFlow` executor for TypeScript pipelines
4. Implement `useFlowMachine` hook for SolidJS state machines
5. Write `bun run flow:generate` — walk `*.flow.ts`, write `steps/*.json`
6. Migrate one flow end-to-end (knowledge-create BE + knowledge-detail FE) as proof of concept
7. Verify generated JSON matches universal schema
8. Update `create-be-flow` and `create-fe-flow` skills to generate `.flow.ts` instead of hand-written step JSONs
9. Per new language added: design the builder idiom, implement the generator, add reference runner
