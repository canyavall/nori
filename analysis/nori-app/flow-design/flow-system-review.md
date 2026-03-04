# Flow System Review — Step JSONs, Orchestrators, and Actions

**Date**: 2026-03-03
**Status**: Analysis / Open questions
**Scope**: Does the three-layer flow system (step JSONs + orchestrators + actions) add value, and how can it be improved?

---

## What the system is

The flow system consists of three layers that live together in a flow folder:

```
knowledge-create/
  steps/              ← JSON files: what, why, where, error_handling, decisions
  actions/            ← TypeScript: implementation of each step
  knowledge-create.ts ← Orchestrator: calls actions in sequence, emits events
```

The step JSONs don't run. They don't drive the orchestrator. There is no runtime relationship between a `.json` file and the TypeScript that implements it. The system is **structured documentation** with the appearance of a code system.

This is not a flaw in itself — but it determines precisely when the system adds value and when it adds overhead.

---

## Where the system genuinely helps

### 1. AI-assisted development (the primary value)

The step JSONs are context-injection for LLMs. When a skill like `create-be-flow` or `create-step` is used, the JSON structure gives an AI assistant an exact blueprint: what number the step is, what fields are required, what `where.implementation` should look like, what `error_handling` scenarios to anticipate. This compresses the context engineering needed to generate correct, consistent code.

For a product like Nori — which is explicitly about AI-assisted development — this is a legitimate, non-trivial investment. The return is faster, more consistent AI code generation.

### 2. Backend orchestrators are readable

`knowledge-create.ts` is ~80 lines and tells the complete business logic in sequence without reading a single action file. The emit → call → check pattern is clean. A new developer, or Claude, understands the flow in under a minute.

### 3. `decisions` captures rationale that would otherwise be lost

The `decisions` array with dated entries is the only place in the codebase where you can read *why* a choice was made and *when*. This information would otherwise live in git history and be practically inaccessible.

### 4. Error handling is documented at the step level

The `error_handling` field forces the author to name the failure scenarios before writing the code. Even if not enforced, this is a useful design prompt.

---

## Where the system does not help — or creates problems

### 1. Frontend step JSONs have no runtime relationship to the code

Look at `knowledge-create/steps/01-show-frontmatter-form.json`. It says `"type": "ui_action"` and describes a component render. The actual flow is driven by a `step` signal in `KnowledgeCreateDialog.hook.ts` — `createSignal<Step>('prompt')`. The JSON documents a state. The hook implements a different state machine entirely and independently.

The real frontend state machines are complex. `useKnowledgeDetailSection` has 8 states (`loading | view | editing | saving | audit | confirm-delete | deleting | deleted | error`) with transitions driven by SSE events, API results, and user actions. None of this appears in any step JSON.

**The frontend step JSONs are decorative documentation with zero enforcement.** They describe an idealized version of the flow, not the actual one.

### 2. The stub problem proves the enforcement gap

`knowledge-create/steps/04-audit-knowledge.json` says auditing happens at `knowledge-create/actions/audit-knowledge.ts`. That action always returns `{ audit_passed: true, findings_count: 0 }`. The JSON gave the system the *appearance* of correctness without the substance.

This is the critical risk of documentation-as-code without a validator: **you can have complete, well-written step JSONs for a flow that doesn't work as documented.** The JSON creates false confidence.

### 3. The `calls` field is redundant and can drift

Every step JSON has `"calls": ["features/.../actions/write-markdown-file"]`. The same information is in the orchestrator's import statements. No tooling reads `calls` to verify imports exist. It's maintained manually. It will drift.

### 4. Creation overhead is high for simple operations

Adding one backend step currently requires four file changes: step JSON, action file, orchestrator update, CLAUDE.md update. For a complex step with real decisions and multiple error scenarios, this cost is justified. For a 3-line utility step, it's pure ceremony.

### 5. The system penalizes refactoring

If you merge two steps into one, you need to renumber the remaining JSONs (which cascades through folder names), update the orchestrator, update CLAUDE.md, and update any references. This friction discourages improvement. It is likely one reason `regenerateIndex` has 11 positional arguments — changing the signature would touch many coordinated files.

---

## Honest verdict

| Context | Does the system add value? |
|---|---|
| Backend flows with AI-assisted development | **Yes** — provides scaffolding for generation |
| Backend flows with human-only development | **Marginal** — orchestrators are readable; JSONs add overhead |
| Frontend flows | **No** — JSONs are decorative; real logic is in hooks |
| Enforcing correctness | **No** — nothing reads the JSONs at runtime |
| Capturing decisions and rationale | **Yes** — the `decisions` field is genuinely useful |
| Simple 1-2 step operations | **No** — ceremony exceeds value |

---

## What to investigate

The following are open questions to explore before committing to changes. Each has a hypothesis and a way to test it.

---

### Investigation 1: Can the step JSONs drive the orchestrator at runtime?

**Hypothesis:** If the orchestrator loaded the step JSONs and used them to build an execution plan, the JSON would become the source of truth instead of documentation. Divergence would become impossible.

**What to explore:**
- What would a `runFlow(steps, context)` generic executor look like?
- Can the `where.implementation` path be used to dynamically import and call actions?
- Can `error_handling` scenarios be checked against a standard error code registry?
- What is the runtime cost of JSON loading in a Bun/Node context?

**Hypothesis to test:** A flow runner that reads `steps/*.json`, resolves `where.implementation` to an action function, and calls them in sequence — with the JSON `error_handling` as a policy table — would eliminate drift between docs and code.

**Risk:** Dynamic imports from path strings lose TypeScript type safety. The action signature would need to be standardized (`(input: unknown, context: FlowContext) => StepResult<unknown>`).

---

### Investigation 2: Can the frontend step JSONs generate the hook state machine?

**Hypothesis:** If the frontend step JSONs defined the state machine explicitly (states, transitions, guards), a code generator could produce the skeleton of the hook's step signal and transition functions.

**What to explore:**
- Map out the real state machine of `useKnowledgeDetailSection` as a graph (states + transitions + triggers)
- Compare it to what `steps/01-view-entry.json` currently captures
- Design a richer JSON format that can represent: current state, valid transitions, what triggers each transition
- Explore whether SolidJS's reactive model fits a state machine library like XState or a lightweight alternative

**Hypothesis to test:** A frontend step JSON with a `states` and `transitions` section could be compiled into a typed state machine that the hook uses. The step JSON becomes the source of truth for flow behavior, not just documentation.

**Risk:** State machines with SSE events as inputs are complex. The LLM conversation in `useRepoExtractDialog` has non-deterministic transitions (the LLM can ask questions or return proposals). A rigid state machine may not fit.

---

### Investigation 3: What is the minimum viable step JSON?

**Hypothesis:** Not all flows need the same level of documentation. A tiered JSON format — minimal for simple steps, full for complex ones — would reduce creation overhead without losing value on important flows.

**What to explore:**
- Classify all existing steps by actual complexity (lines of action code, error scenarios handled, decisions made)
- Measure how many steps are under 20 lines of action code with no real decisions
- Design a "lightweight step" format with only the fields that provide value for simple cases

**Example tiered approach:**

```json
// Lightweight (for simple utility steps)
{
  "type": "action",
  "what": "Delete the markdown file from the vault directory"
}

// Full (for steps with decisions, multiple error paths, business rules)
{
  "type": "action",
  "what": "...",
  "why": "...",
  "where": { ... },
  "error_handling": [ ... ],
  "decisions": [ ... ],
  "calls": [ ... ]
}
```

**Hypothesis to test:** 40–50% of existing steps are simple enough that a lightweight format loses nothing. Reducing creation friction for these cases increases the chance the JSONs stay maintained.

---

### Investigation 4: Is there a validator that can close the enforcement gap?

**Hypothesis:** A CI script that parses all step JSONs and verifies the `where.implementation` path exists (as a file), the `calls` array resolves to real imports in the orchestrator, and the orchestrator emits events that match the step name pattern — would catch drift without requiring runtime changes.

**What to explore:**
- Write a prototype validator that: (a) reads all `steps/*.json`, (b) checks `where.implementation` file exists, (c) reads the orchestrator and verifies a `emit(...)` call exists for each step's domain/flow/step name
- Measure false positive rate — how many legitimate patterns would it flag incorrectly?
- Decide if this belongs in CI or as a pre-commit hook

**Hypothesis to test:** A 100-line script catches most meaningful drift. The validator becomes the enforcement mechanism that makes the documentation-as-code promise real.

---

### Investigation 5: Should frontend flows use a different system entirely?

**Hypothesis:** The backend flow system works because actions are pure functions that run sequentially with clear inputs and outputs. The frontend is a reactive state machine driven by user events, SSE streams, and async API calls. These are fundamentally different models and may not benefit from the same documentation approach.

**What to explore:**
- Survey how other SolidJS/React projects document complex component state machines (XState diagrams, sequence diagrams, ADRs)
- Evaluate whether documenting the hook's step signal types and transitions in a `.type.ts` file (with JSDoc explaining each state) provides more value than step JSONs
- Ask: what is the actual artifact that Claude (or a human) reads to understand `useKnowledgeDetailSection`? Is it the step JSON, the hook file itself, or the CLAUDE.md?

**Hypothesis to test:** For frontend flows, the documentation value of step JSONs is best replaced by: (a) a well-typed step union in the `.type.ts` file with JSDoc per state, and (b) a state transition comment block at the top of the hook. This captures the same information with zero maintenance overhead.

---

## Summary: What to change now vs. what to investigate

| Item | Action |
|---|---|
| Backend step JSONs for complex flows | Keep — they work |
| `decisions` field | Keep — uniquely valuable |
| `calls` field | Remove — duplicates import statements, no tooling validates it |
| Frontend step JSONs | Investigate before changing — see Investigation 5 |
| Stub audit action | Fix now — documented in code-quality-plan.md |
| Runtime enforcement | Investigate — see Investigations 1 and 4 |
| Creation overhead for simple steps | Investigate — see Investigation 3 |
| State machine generation from JSON | Investigate — see Investigation 2 |
