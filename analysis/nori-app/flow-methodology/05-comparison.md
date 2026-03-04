# Flow System Options — Comparison and Decision Guide

**Date**: 2026-03-03
**Status**: Reference
**Prerequisite**: Read `03-option-2-generator.md` and `04-option-3-runtime.md`

---

## The two options

Option 3 (Runtime) was evaluated and rejected. It solves cross-language *execution* within a single flow — a problem Nori does not have. Its internal flows are TypeScript. The polyglot concern is about reading and understanding other projects, not running them. Option 3 also loses TypeScript type safety across step boundaries with no compensating gain. It is documented in `04-option-3-runtime.md` as a record of what was considered.

The two viable options are:

| | **Option 2 — Generator** | **Option 3 — Runtime** _(rejected)_ |
|---|---|---|
| **Source of truth** | Language-native code (builder/annotation) | JSON (drives execution) |
| **JSON maintenance** | Generated on build — never written by hand | Hand-written; validated at startup |
| **Drift prevention** | Impossible — JSON is a build output | Impossible — startup fails if drift |
| **TypeScript safety** | Full — action signatures checked at compile | Lost across step boundaries (unknown) |
| **Frontend state machines** | Typed — states inferred from builder | Engine-managed from JSON definition |
| **Cross-language single flow** | No | Yes — RPC routing |
| **Hand-written orchestrators** | No — generic executor | No — engine handles sequencing |
| **Stubs** | Typed property on `defineStep` | `stub` field in JSON + skipped at runtime |
| **Readable flow logic** | Yes — read the flow definition | No — follow engine + registry |
| **Debugging** | Moderate | Hard — crosses language/registry boundaries |
| **Creation overhead** | 2 files (definition + actions) | 3 files (JSONs + actions + register) |
| **Investment to implement** | **Medium** | **High** |
| **Risk** | **Medium** | **High** |
| **Reversibility** | Medium — revert to hand-written JSONs | Low — engine is load-bearing infrastructure |

---

## Side-by-side: Generator vs. current system

| | **Current** | **Option 2 — Generator** |
|---|---|---|
| Source of truth | JSON (hand-written) | Language-native code (builder/annotation/decorator) |
| JSON files | Hand-written by humans/Claude | Generated on build — always accurate |
| TypeScript type safety on flow | None | Full — action signatures checked at compile time |
| Hand-written orchestrator | Yes | No — generic executor |
| Frontend state machine typed | No | Yes — states typed from builder |
| AI context (JSON) | Manual, can drift | Generated, structurally impossible to drift |
| Stubs | Invisible | First-class on `defineStep` — surfaced in generated JSON |
| Creation overhead | 4 files | 2 files |
| Polyglot support | TypeScript only | Any language with a generator |

---

## Polyglot coverage (Option 2)

Each language uses its own metaprogramming idiom to define a flow. All outputs conform to the universal schema in `01-universal-schema.md`.

| Language | Idiom | Generator command |
|---|---|---|
| TypeScript | `defineFlow()` + `defineStep()` builder | `bun run flow:generate` |
| Python | `@flow` + `@step` decorators + Pydantic | `python -m nori.generate` |
| Go | `FlowDef{}` struct + `go generate` | `go run ./cmd/nori-generate` |
| Java | `@NoriFlow` + `@NoriStep` annotation processor | `mvn nori:generate` |
| Rust | `#[flow]` + `#[step]` proc macros | Runs at compile time |
| React | `defineStateMachine()` (same builder) | `bun run flow:generate` |
| Vue | `defineStateMachine()` (same builder) | `bun run flow:generate` |
| Angular | `defineStateMachine()` (same builder) | `bun run flow:generate` |

---

## Decision

**Option 2 is the path.**

The generator pattern eliminates drift by construction, preserves TypeScript type safety, reduces creation overhead, and extends naturally to every language Nori needs to support. Each language's generator is a small, independent piece of infrastructure — owned by the project, not Nori — that outputs the same universal JSON the Flow Explorer already reads.

---

## Implementation sequence

```
Phase 1 — TypeScript foundation
  Design and implement defineFlow() / defineStep() builder
  Implement defineStateMachine() for SolidJS
  Implement generic runFlow() executor
  Implement useFlowMachine() hook for SolidJS
  Write bun run flow:generate script
  Migrate knowledge-create (BE) + knowledge-detail (FE) as proof of concept
  Update create-be-flow and create-fe-flow skills

Phase 2 — First non-TypeScript language
  When the first Python or Go project is linked in Nori:
  Design that language's builder idiom
  Implement the generator script
  Write the reference runner (~60–80 lines)
  AI skill create-be-flow gains --lang flag

Phase 3 — Additional languages
  Per new language added: repeat Phase 2
  The universal schema and Flow Explorer need no changes
```

## What all options share

Regardless of option, these are constant:

1. **The universal JSON schema** (`01-universal-schema.md`) is what Nori reads. Every option produces it.
2. **Split architecture** — BE flows in `@nori/core`, FE flows in `@nori/app`, contracts in `@nori/shared`.
3. **The contract is the only coupling** — FE and BE communicate via HTTP + SSE. Neither imports the other's flows.
4. **Stubs are explicit** — undeclared stubs are not tolerated. Every stub has a reason and a planned version.
5. **`decisions` are preserved** — dated rationale belongs in the flow definition, not in git history.
6. **AI skills generate flows** — `create-be-flow`, `create-fe-flow`, and `create-step` produce JSON conforming to the universal schema.
