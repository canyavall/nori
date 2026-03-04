# Nori Flow — Universal JSON Schema

**Date**: 2026-03-03
**Status**: Foundation — required by all three implementation options
**Role**: The language-agnostic artifact that every option produces and Nori reads

---

## Why a universal schema

Nori targets projects written in TypeScript, Python, Go, Java, Rust, and frontend frameworks (SolidJS, React, Vue, Angular). It cannot parse all of these languages. It cannot import their type systems.

What it *can* do is read a well-defined JSON file.

The Nori Flow JSON schema is the universal artifact: every language writes it (by hand, by generator, or by runtime registration), and Nori reads it regardless of which language produced it. The schema is versioned. It evolves with a compatibility guarantee.

This is the same model as REST:
- REST defines constraints (statelessness, resource orientation, uniform interface)
- Each language implements HTTP its own way
- The universal artifact is HTTP + JSON

The Nori Flow schema defines constraints on what a flow must look like. Each language implements those constraints its own way. The universal artifact is the flow JSON.

---

## Two flow types

All flows are one of two types, regardless of language or framework.

### Type 1 — Pipeline

A sequential set of steps. One forward path. Each step is a function that takes input, returns output or an error. The orchestrator calls steps in order.

```
step 1 → step 2 → step 3 → ... → done
              ↓ (on fatal error)
           abort
```

**Use for**: backend operations, server-side processing, CLI commands, data pipelines, build steps.

### Type 2 — State Machine

A named set of states with explicit transitions between them. The current state determines what renders or what runs. Transitions are triggered by external events.

```
state-A --[event]--> state-B --[event]--> state-C
                         ↑                    |
                         └──────[event]───────┘
```

**Use for**: UI components with complex interaction states, interactive CLI sessions, multi-step dialogs.

---

## Pipeline schema

```json
{
  "$schema": "https://nori.dev/schemas/flow/v1",
  "nori_version": "1",
  "type": "pipeline",

  "name": "knowledge-create",
  "domain": "knowledge",
  "language": "typescript",
  "framework": null,

  "decisions": [
    {
      "date": "2026-02-20",
      "reason": "Audit is non-fatal",
      "rationale": "A quality warning should not block knowledge creation"
    }
  ],

  "steps": [
    {
      "id": "01-validate-frontmatter",
      "what": "Validate title, category, tags, description against schema rules",
      "why": "Fail fast before file IO — validation is cheap, disk writes are not",
      "fatal": true,
      "stub": null,
      "errors": [
        {
          "code": "INVALID_FRONTMATTER",
          "scenario": "Required fields missing or malformed",
          "severity": "error",
          "recoverable": true
        }
      ],
      "decisions": []
    },
    {
      "id": "02-validate-content",
      "what": "Check content is non-empty and meets minimum length",
      "why": "Prevent writing empty or trivially short knowledge entries",
      "fatal": true,
      "stub": null,
      "errors": [],
      "decisions": []
    },
    {
      "id": "03-write-markdown-file",
      "what": "Write the markdown file to the vault directory",
      "why": "Persist the knowledge entry — files are the source of truth",
      "fatal": true,
      "stub": null,
      "errors": [
        {
          "code": "FILE_ALREADY_EXISTS",
          "scenario": "Slug collision with an existing entry",
          "severity": "error",
          "recoverable": true
        },
        {
          "code": "PERMISSION_DENIED",
          "scenario": "Vault directory not writable",
          "severity": "fatal",
          "recoverable": false
        }
      ],
      "decisions": [
        {
          "date": "2026-02-20",
          "reason": "Slug derived from title",
          "rationale": "Predictable, human-readable filenames without a UUID"
        }
      ]
    },
    {
      "id": "04-audit-knowledge",
      "what": "Run quality audit on the written entry",
      "why": "Surface frontmatter and content quality issues immediately after creation",
      "fatal": false,
      "stub": {
        "reason": "Requires flow_call to knowledge-audit — not yet wired",
        "planned_for": "v2"
      },
      "errors": [],
      "decisions": []
    },
    {
      "id": "05-regenerate-index",
      "what": "Insert new entry into the search index",
      "why": "Make the entry immediately searchable without a full index rebuild",
      "fatal": false,
      "stub": null,
      "errors": [],
      "decisions": []
    }
  ]
}
```

### Pipeline field reference

| Field | Type | Required | Description |
|---|---|---|---|
| `$schema` | string | yes | Schema URI for validation |
| `nori_version` | string | yes | Schema version — currently `"1"` |
| `type` | `"pipeline"` | yes | Identifies flow type |
| `name` | string | yes | Flow name, kebab-case |
| `domain` | string | yes | Feature domain (knowledge, vault, session, project…) |
| `language` | string | yes | Source language: typescript, python, go, java, rust |
| `framework` | string \| null | yes | Source framework, or null for non-UI |
| `decisions` | array | yes | Flow-level architectural decisions |
| `steps` | array | yes | Ordered list of step definitions |

**Step fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Step identifier, `NN-kebab-case` |
| `what` | string | yes | What this step does |
| `why` | string | yes | Why this step exists in the flow |
| `fatal` | boolean | yes | If true, failure aborts the flow. If false, emits warning and continues. |
| `stub` | object \| null | yes | If non-null, marks step as unimplemented. Has `reason` and `planned_for`. |
| `errors` | array | yes | Named error scenarios. Each has `code`, `scenario`, `severity`, `recoverable`. |
| `decisions` | array | yes | Step-level decisions. Each has `date`, `reason`, `rationale`. |

---

## State machine schema

```json
{
  "$schema": "https://nori.dev/schemas/flow/v1",
  "nori_version": "1",
  "type": "state-machine",

  "name": "knowledge-detail",
  "domain": "knowledge",
  "language": "typescript",
  "framework": "solidjs",

  "decisions": [
    {
      "date": "2026-03-01",
      "reason": "SSE drives state transitions after save and delete",
      "rationale": "Write + audit + index rebuild can take 5-15s. SSE gives per-step feedback without polling."
    }
  ],

  "states": {
    "loading":          { "what": "Fetching entry and content from API",           "renders": null },
    "view":             { "what": "Entry displayed. Edit and delete available.",    "renders": "KnowledgeDetailView" },
    "editing":          { "what": "Edit form active. Awaiting save or cancel.",     "renders": "KnowledgeEditForm" },
    "saving":           { "what": "SSE connection open. Write in progress.",        "renders": "ProgressView" },
    "audit":            { "what": "Write completed. Audit findings displayed.",     "renders": "AuditResults" },
    "confirm-delete":   { "what": "Delete confirmation dialog visible.",            "renders": "DeleteConfirmation" },
    "deleting":         { "what": "SSE connection open. Delete in progress.",       "renders": "ProgressView" },
    "deleted":          { "what": "Entry removed. Navigating to list.",             "renders": null },
    "error":            { "what": "Load failed. Error message displayed.",          "renders": "ErrorView" }
  },

  "transitions": [
    { "from": "loading",        "to": "view",             "on": "api:success"   },
    { "from": "loading",        "to": "error",            "on": "api:failure"   },
    { "from": "view",           "to": "editing",          "on": "user:edit"     },
    { "from": "editing",        "to": "saving",           "on": "user:submit"   },
    { "from": "saving",         "to": "audit",            "on": "sse:success"   },
    { "from": "saving",         "to": "editing",          "on": "sse:error"     },
    { "from": "view",           "to": "confirm-delete",   "on": "user:delete"   },
    { "from": "confirm-delete", "to": "deleting",         "on": "user:confirm"  },
    { "from": "confirm-delete", "to": "view",             "on": "user:cancel"   },
    { "from": "deleting",       "to": "deleted",          "on": "sse:success"   },
    { "from": "deleting",       "to": "confirm-delete",   "on": "sse:error"     }
  ]
}
```

### State machine field reference

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `"state-machine"` | yes | Identifies flow type |
| `framework` | string | yes | The UI framework: solidjs, react, vue, angular |
| `states` | object | yes | Map of state name → `{ what, renders }` |
| `transitions` | array | yes | List of `{ from, to, on }` — the complete transition graph |

**State fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `what` | string | yes | What this state represents |
| `renders` | string \| null | yes | Component rendered in this state, or null for transient states |

**Transition fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `from` | string | yes | Source state name |
| `to` | string | yes | Target state name |
| `on` | string | yes | Event that triggers this transition. Convention: `user:action`, `api:result`, `sse:event`, `timer:tick` |

---

## Event naming convention

Pipeline events follow: `{domain}:{flow-name}:{step-id-without-number}`

```
knowledge:create:validating-frontmatter
knowledge:create:writing-file
knowledge:create:auditing
knowledge:create:completed
```

State machine events follow: `{source}:{action}`

```
user:edit
user:submit
user:cancel
user:confirm
api:success
api:failure
sse:success
sse:error
timer:tick
```

---

## Stub policy

Stubs are first-class citizens in the schema. A step with `"stub": { ... }` is intentionally incomplete. All stubs must be declared — undeclared stubs (steps that return hardcoded success without being marked as stubs) are a documentation lie.

Stubs are tracked in a repo-level `stubs.json`:

```json
{
  "stubs": [
    {
      "flow": "knowledge/knowledge-create",
      "step": "04-audit-knowledge",
      "planned_for": "v2",
      "reason": "Requires knowledge-audit flow_call to be wired"
    }
  ]
}
```

Any step with a non-null `stub` field in the JSON must have a corresponding entry in `stubs.json`. Any step in `stubs.json` that no longer has a stub in its JSON is removed.

---

## Schema location and versioning

The schema is hosted at `nori.dev/schemas/flow/v1` (URL to be determined — see open questions in `nori-flow-methodology.md`). Until hosted externally, it can be embedded in `@nori/shared` as a JSON Schema file.

The `nori_version` field enables Nori to handle multiple schema versions in linked projects. Version `1` is the current version. Breaking changes require a new version. Additive changes (new optional fields) are backwards-compatible within a version.

---

## What Nori does with this JSON

1. **Flow Explorer** — reads `steps/*.json` (pipeline) or `*.flow.json` (state machine), renders visual graphs
2. **Stub tracker** — surfaces all steps where `stub !== null`, grouped by `planned_for` version
3. **Validator** — checks JSON against the schema, verifies all states in transitions are declared, verifies stubs are registered
4. **AI skills** — `create-be-flow`, `create-fe-flow`, `create-step` produce JSON conforming to this schema as part of flow creation
5. **Language adaptation** — `language` and `framework` fields tell skills which idioms to use when generating implementation files
