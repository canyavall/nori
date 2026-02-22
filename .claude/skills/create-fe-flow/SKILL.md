---
name: create-fe-flow
description: Create a new frontend flow in @nori/app with steps/ folder, step JSONs, components, and CLAUDE.md
globs: 'packages/app/**'
alwaysApply: false
---

# Create Frontend Flow

When asked to create a new frontend flow, follow this exact structure.

## Location

`packages/app/src/features/{domain}/{flow-name}/`

## Required files

```
{flow-name}/
  steps/
    01-{step-name}.json
    02-{step-name}.json
    ...
  {FlowName}Wizard.tsx      (orchestrator component, or Panel/Dialog)
  {StepComponent}.tsx        (one per ui_action step)
  validate-{name}.ts         (one per validation step)
  CLAUDE.md                  (flow documentation)
```

## Step JSON types

### ui_action — Renders a SolidJS component

```json
{
  "type": "ui_action",
  "what": "Show vault registration form",
  "why": "Collect git URL, vault name, and branch from user",
  "where": {
    "component": "features/{domain}/{flow-name}/{FlowName}Wizard.tsx",
    "step_component": "features/{domain}/{flow-name}/{StepComponent}.tsx"
  },
  "ui": {
    "renders": "form|display|editor|form+editor|dialog",
    "fields": ["field1", "field2"],
    "validation_schema": "@nori/shared:{schemaName}"
  },
  "transitions": {
    "on_valid": "02-next-step",
    "on_cancel": "close_dialog"
  },
  "error_handling": [],
  "decisions": []
}
```

### validation — Runs a client-side validation function

```json
{
  "type": "validation",
  "what": "Validate git URL format",
  "why": "Reject invalid URLs before calling backend",
  "where": {
    "implementation": "features/{domain}/{flow-name}/validate-{name}.ts"
  },
  "transitions": {
    "on_valid": "03-next-step",
    "on_invalid": "01-previous-step"
  },
  "error_handling": [],
  "decisions": []
}
```

### api_call — Bridge to backend flow (THE CONNECTION POINT)

```json
{
  "type": "api_call",
  "what": "Submit vault registration to backend",
  "why": "Server validates, clones, persists, and indexes",
  "where": {
    "component": "features/{domain}/{flow-name}/{FlowName}Wizard.tsx"
  },
  "contract": {
    "endpoint": "POST /api/{resource}",
    "request_type": "@nori/shared:{RequestType}",
    "response_type": "@nori/shared:{ResponseType}",
    "error_type": "@nori/shared:ApiError",
    "sse_events": [
      "{domain}:{flow}:started",
      "{domain}:{flow}:step-name",
      "{domain}:{flow}:completed",
      "{domain}:{flow}:error"
    ]
  },
  "backend_flow": "core/features/{domain}/{backend-flow-name}",
  "transitions": {
    "on_success": "04-show-result",
    "on_error": "01-show-form"
  },
  "error_handling": [
    {
      "scenario": "Network error",
      "action": "Show error toast, stay on current step",
      "severity": "error"
    }
  ],
  "decisions": []
}
```

## CLAUDE.md format

```markdown
# {Flow Name} Wizard|Panel|Dialog

{One-line description}

**Backend flow**: `core/features/{domain}/{backend-flow-name}`
**Contract**: `@nori/shared/contracts/{domain}.contract.ts`

## Steps

1. **{Step name}** — {Description} -> [steps/01-{step-name}.json](steps/01-{step-name}.json)
```

## Transition target types

Transition values can be:

| Pattern | Example | Meaning |
|---------|---------|---------|
| Step reference | `"02-show-form"` | Go to another step in the same flow |
| Navigation | `"navigate:/knowledge/{entry_id}"` | Client-side route navigation with param interpolation |
| Navigate back | `"navigate_back"` | Go to previous page in browser history |
| Close dialog | `"close_dialog"` | Close the current dialog/wizard |

Always use a **step reference** or **navigate_back** for `on_error` transitions — never use undefined targets.

## Skill workflow order

Use skills in this order when building a new feature:

1. **create-contract** — Define types, schemas, SSE events in `@nori/shared` first
2. **create-be-flow** — Build backend flow in `@nori/core`
3. **create-fe-flow** — Build frontend flow in `@nori/app`
4. **create-step** — Add individual steps to existing flows as needed

## Feature names MUST match across packages

Frontend: `app/features/vault/vault-registration/`
Backend:  `core/features/vault/vault-registration/`
Contract: `shared/contracts/vault.contract.ts`

## Checklist

- [ ] steps/ folder with numbered JSON files
- [ ] Orchestrator component (Wizard/Panel/Dialog)
- [ ] One .tsx per ui_action step
- [ ] One validate-*.ts per validation step
- [ ] CLAUDE.md with backend flow reference and contract reference
- [ ] api_call step references the contract from @nori/shared
- [ ] Feature domain CLAUDE.md updated to list the new flow
