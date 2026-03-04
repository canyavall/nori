# Flow Explorer — UI Design for Option 2

**Date**: 2026-03-03
**Status**: Design proposal
**Prerequisite**: Read `flow-system-options.md` → Option 2 (Generator Path)

---

## The core idea

Nori already inspects Claude Code project artifacts as pages: Skills, Rules, Hooks, MCPs. A **Flow Explorer** is the same pattern — it reads the generated step JSONs from a linked project and renders them as a visual pipeline. It is a first-class Nori feature, not a separate tool.

The data flow for Option 2:

```
defineFlow() in TypeScript        ← developer writes this (or Claude does)
        ↓
bun run flow:generate              ← build step, runs in CI or on save
        ↓
steps/*.json                       ← generated, always accurate
        ↓
Nori reads from linked project     ← same pattern as reading .claude/skills/
        ↓
Flow Explorer UI                   ← visual inspection, no drift possible
```

The UI is a viewer. The source of truth is TypeScript. The JSONs are generated. Because JSONs are generated, the UI is always accurate — it cannot show something that doesn't match the code.

---

## Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│  ◀ nori  /  Flows                                            [Generate] │
├──────────────────┬─────────────────────────────────────────────────────┤
│                  │                                                      │
│  knowledge  (6)  │  knowledge / knowledge-create            5 steps    │
│                  │                                                      │
│  ▶ create    ✓   │  ──●────────●────────●────────◐────────●──          │
│  ▶ edit      ✓   │   01       02       03       04       05            │
│  ▶ delete    ✓   │  valid.   valid.   write    audit    index          │
│  ▶ search    ✓   │  front.   cont.    file     ⚠stub                   │
│  ▶ index     ✓   │                                                      │
│  ▶ repo-ext  ✓   │  ─────────────────────────────────────────────────  │
│                  │                                                      │
│  vault      (8)  │  Step 03 — write-markdown-file                      │
│                  │                                                      │
│  ▶ register  ✓   │  What     Write the markdown file to the vault      │
│  ▶ pull      ✓   │           directory under the entry's category      │
│  ▶ push      ✓   │                                                      │
│  ▶ reconcile ✓   │  Why      Files are the source of truth, not the    │
│  ▶ regen-db  ✓   │           DB. The DB is an index over files.        │
│  ▶ audit     ✓   │                                                      │
│  ▶ link      ✓   │  Fatal    yes — write failure aborts the flow       │
│  ▶ delete    ✓   │                                                      │
│                  │  Action   knowledge-create:write-markdown-file  [↗] │
│  session    (3)  │                                                      │
│  project    (7)  │  Errors                                              │
│  app        (3)  │    FILE_ALREADY_EXISTS    error · recoverable        │
│                  │    PERMISSION_DENIED      fatal · not recoverable    │
│                  │    WRITE_FAILED           fatal · not recoverable    │
│                  │                                                      │
│                  │  Decisions                                           │
│                  │    2026-02-20  Use slug from title for filename      │
│                  │               Human-readable, predictable, no UUIDs  │
│                  │                                                      │
│                  │                             [View JSON]  [View TS]  │
└──────────────────┴─────────────────────────────────────────────────────┘
```

**Legend for pipeline dots:**
```
●  complete action   (action registered, not a stub)
◐  stub action       (stub declared in defineFlow)
○  planned step      (JSON exists, action not yet registered)
◆  flow_call         (delegates to another flow)
```

---

## The pipeline component

Steps are rendered as a horizontal sequence of cards connected by a line. Each card is small by default — just the number, short name, and status icon. Clicking a card expands the detail panel below.

```
  ──●────────●────────●────────◐────────●──
   01       02       03       04       05
  valid.   valid.   write    audit    index
  front.   cont.    file     ⚠stub
```

For long flows (7+ steps), the pipeline wraps into a second row with a visual continuation indicator. Steps on the same row are at the same "level"; wrapping is purely visual.

For flows with branching (non-fatal steps that emit warnings and continue), the step node gets a dashed border instead of solid:

```
  ──●────────●────────●── ─ ─◐─ ─ ──●──
                           non-fatal
```

---

## The stub panel

When the flow has stubs, a banner appears below the pipeline before the step detail:

```
  ┌────────────────────────────────────────────────────────┐
  │  ⚠  1 stub in this flow                               │
  │                                                        │
  │  04-audit-knowledge                planned for v2      │
  │  Reason: Requires knowledge-audit flow_call to be wired│
  └────────────────────────────────────────────────────────┘
```

---

## The code panels (View JSON / View TS)

Two toggleable panels at the bottom of the detail area, accessible per step or per flow.

**View JSON** — shows the generated step JSON for the selected step:

```json
{
  "type": "action",
  "action_id": "knowledge-create:write-markdown-file",
  "fatal": true,
  "what": "Write the markdown file to the vault directory",
  "why": "Files are the source of truth, not the DB",
  "domain": "knowledge",
  "flow": "create",
  "event_name": "writing-file",
  "error_handling": [
    { "code": "FILE_ALREADY_EXISTS", "severity": "error", "recoverable": true },
    { "code": "PERMISSION_DENIED", "severity": "fatal", "recoverable": false }
  ],
  "decisions": [
    { "date": "2026-02-20", "reason": "Use slug from title", "rationale": "Human-readable filenames" }
  ]
}
```

**View TS** — shows the `defineStep()` builder call for the selected step:

```typescript
defineStep({
  id: '03-write-markdown-file',
  what: 'Write the markdown file to the vault directory',
  why: 'Files are the source of truth, not the DB',
  action: writeMarkdownFile,
  fatal: true,
  errors: [
    { code: 'FILE_ALREADY_EXISTS', severity: 'error', recoverable: true },
    { code: 'PERMISSION_DENIED', severity: 'fatal', recoverable: false },
  ],
  decisions: [
    { date: '2026-02-20', reason: 'Use slug from title', rationale: 'Human-readable filenames' },
  ],
}),
```

---

## The Generate button

`[Generate]` in the top right calls the backend to run `bun run flow:generate` in the linked project directory. This re-reads all `*.flow.ts` files and overwrites the step JSONs. The UI refreshes after the run.

This is the same pattern as "Sync" in vault management — a deliberate trigger, not automatic.

A small output panel shows the result:

```
┌──────────────────────────────────────────────┐
│  Generating flows...                         │
│                                              │
│  ✓  knowledge-create         5 steps        │
│  ✓  knowledge-edit           5 steps        │
│  ✓  knowledge-search         7 steps        │
│  ⚠  knowledge-create/04-audit-knowledge     │
│     Stub declared — skipped validation       │
│                                              │
│  Generated 47 step JSONs in 340ms            │
└──────────────────────────────────────────────┘
```

---

## The frontend flow view

Frontend flows (in `packages/app/src/features/`) are shown alongside backend flows. Since Option 2 uses a `defineFrontendFlow()` builder that declares states and transitions, the UI renders these differently — as a state machine diagram rather than a linear pipeline:

```
  knowledge-detail  (frontend)

  ┌─────────┐  fetch ok   ┌──────┐  edit     ┌─────────┐
  │ loading │────────────▶│ view │──────────▶│ editing │
  └─────────┘             └──────┘           └─────────┘
       │                     │                    │
   fetch err             delete req           submit
       │                     │                    │
       ▼                     ▼                    ▼
  ┌───────┐          ┌─────────────┐        ┌────────┐
  │ error │          │confirm-del. │        │ saving │──SSE ok──▶ audit
  └───────┘          └─────────────┘        └────────┘
                            │                    │
                        confirm               SSE err
                            │                    │
                            ▼                    ▼
                      ┌──────────┐          ┌─────────┐
                      │ deleting │          │ editing │
                      └──────────┘          └─────────┘
                            │
                         SSE ok
                            │
                            ▼
                      ┌─────────┐
                      │ deleted │
                      └─────────┘
```

Each state node shows what renders. Clicking a state shows the `states.X.what` description and which component handles it. Transition arrows show the trigger label.

---

## What needs to be built

### 1. The `defineFlow()` builder (packages/core)

```typescript
// packages/core/src/flow-builder/index.ts
export function defineFlow(config: FlowConfig): FlowDefinition
export function defineStep(config: StepConfig): StepDefinition
export function defineFrontendFlow(config: FrontendFlowConfig): FrontendFlowDefinition
```

The builder produces a data structure that:
- Can be called as `runFlow(definition, input, emitter)` by the executor
- Can be serialized to JSON via `.toJSON()` for the generator script

### 2. The `flow:generate` script

```typescript
// scripts/flow-generate.ts
// Walks packages/core/src/features/**/*.flow.ts
// Calls definition.toJSON() on each flow
// Writes output to the flow's steps/ folder
// Reports stubs and validates action_ids are registered
```

### 3. The backend core feature: `project-flow-list`

```typescript
// packages/core/src/features/project/project-flow-list/
// Scans a project directory for **/steps/*.json
// Reads and parses them
// Returns organized FlowMap: Record<domain, Record<flowName, StepDefinition[]>>
```

This is the same pattern as `runListClaudeSkills` which already exists.

### 4. The server route: `GET /api/project/flows`

```typescript
// packages/server/src/routes/project.routes.ts (add to existing)
projectRoutes.get('/flows', async (c) => {
  const projectId = c.req.query('project_id');
  const flows = await runProjectFlowList({ project_id: projectId, db: c.var.db });
  return c.json({ data: flows });
});
```

### 5. The frontend feature: `project-flows`

```
packages/app/src/features/project/project-flows/
  steps/
    01-load-flows.json
  FlowsSection/
    FlowsSection.tsx
    FlowsSection.hook.ts
    FlowsSection.type.ts
  FlowList/
    FlowList.tsx           ← domain tree on the left
    FlowList.type.ts
  FlowPipeline/
    FlowPipeline.tsx       ← step cards in sequence
    FlowPipeline.type.ts
  FlowStateGraph/
    FlowStateGraph.tsx     ← state machine diagram for FE flows
    FlowStateGraph.type.ts
  StepDetail/
    StepDetail.tsx         ← properties panel
    StepDetail.type.ts
  CodePanel/
    CodePanel.tsx          ← JSON / TS view toggle
    CodePanel.type.ts
```

### 6. The new page

```typescript
// packages/app/src/pages/FlowsPage.tsx
export const FlowsPage: Component = () => <FlowsSection />;
```

Added to the router alongside SkillsPage, RulesPage, HooksPage, McpsPage.

---

## What you get

| Feature | Value |
|---|---|
| Visual pipeline per flow | Human sees the full backend flow at a glance without reading TypeScript |
| State machine diagram for FE flows | Human sees the hook state machine without reading 285 lines of hook code |
| Stub banner | Instantly visible which flows are incomplete |
| View JSON / View TS | Confirms the generated artifact matches what you expect |
| Decisions timeline | Rationale for each step, searchable |
| Generate button | One-click refresh after editing the flow TypeScript |
| Status indicators | ✓ / ⚠ / ○ per step and per flow |

---

## What you don't need to build (intentionally excluded)

**In-UI flow editor** — the source of truth is TypeScript. Editing flows happens in the editor (with Claude Code). The UI is read-only. This keeps the data flow simple and avoids building a code editor inside a desktop app.

**Live file watching** — the UI refreshes on demand via `[Generate]`. Watching `*.flow.ts` for changes and auto-generating is a nice-to-have for later.

**Execution traces** — showing which steps ran in the last invocation, with timing. Valuable, but a separate concern from the explorer. Could be added as a "Run History" tab later.

---

## Build order

| Phase | What | Notes |
|---|---|---|
| 1 | `defineFlow()` builder + `.toJSON()` | Core infrastructure — needed for everything else |
| 2 | `flow:generate` script | Validates the builder, writes JSONs |
| 3 | `project-flow-list` core feature | Same pattern as `project-claude-skills` — fast to build |
| 4 | Server route | Thin adapter, 10 lines |
| 5 | `FlowsSection` + `FlowList` + `StepDetail` | Core UI — linear pipeline, properties panel |
| 6 | `FlowPipeline` visual component | The step cards with status icons |
| 7 | `FlowStateGraph` for frontend flows | State machine diagram — most complex UI piece |
| 8 | `CodePanel` JSON/TS toggle | Quality of life, low complexity |
| 9 | `Generate` button + output panel | Triggers the script from inside the app |
