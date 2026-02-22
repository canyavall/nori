---
name: create-contract
description: Create or update a contract in @nori/shared that connects frontend and backend flows
globs: 'packages/shared/**'
alwaysApply: false
---

# Create Contract

When asked to create or update a contract between frontend and backend flows, follow this pattern.

## Location

`packages/shared/src/contracts/{domain}.contract.ts`

One contract file per domain (vault, knowledge, session, app). Each file contains all request/response types and SSE event maps for that domain's flows.

## Contract structure

```typescript
import { z } from 'zod'

// ============================================================
// {FlowName}
// ============================================================

// --- Request schema (used by FE for form validation + BE for request parsing) ---

export const {flowName}Schema = z.object({
  field_name: z.string().min(1).max(100),
  // ... more fields
})

export type {FlowName}Request = z.infer<typeof {flowName}Schema>

// --- Response type (returned by BE, consumed by FE) ---

export interface {FlowName}Response {
  id: string
  status: 'created' | 'updated' | 'deleted'
  // ... more fields
}

// --- SSE event map (FE knows what to listen for, BE knows what to emit) ---

export interface {FlowName}Events {
  '{domain}:{flow}:started': { /* payload */ }
  '{domain}:{flow}:{step-name}': { /* payload */ }
  '{domain}:{flow}:completed': { /* payload */ }
  '{domain}:{flow}:error': { step: string, error: string, recoverable: boolean }
}

// --- API route definition (optional but recommended) ---

export const {FLOW_NAME}_API = {
  method: 'POST' as const,
  path: '/api/{resource}',
  request: {flowName}Schema,
  response: {} as {FlowName}Response,
} as const
```

## SSE event naming convention

`{domain}:{flow}:{step-or-status}` using colons. Examples:
- `vault:registration:started`
- `vault:registration:testing-access`
- `vault:registration:completed`
- `vault:registration:error`

## Shared error type

Every contract file should import the shared ApiError:

```typescript
export interface ApiError {
  code: string
  message: string
  step?: string
  recoverable: boolean
}
```

Define this once in `packages/shared/src/types/errors.ts` and re-export from contracts.

## Event naming relationship

| Layer | Format | Example |
|-------|--------|---------|
| BE step JSON `action` field | `{domain}_{flow}_{step}` (underscores) | `vault_registration_test_git_access` |
| SSE contract events | `{domain}:{flow}:{step}` (colons) | `vault:registration:testing-access` |

The server translates between the two formats. Contracts define SSE events with **colons**.

## Skill workflow order

Use skills in this order when building a new feature:

1. **create-contract** — Define types, schemas, SSE events in `@nori/shared` first
2. **create-be-flow** — Build backend flow in `@nori/core`
3. **create-fe-flow** — Build frontend flow in `@nori/app`
4. **create-step** — Add individual steps to existing flows as needed

## Rules

- One file per domain — do NOT create one file per flow
- Zod schemas are the source of truth for request validation
- SSE events must match what the backend flow emitter sends (colon format)
- Response types are interfaces (not Zod schemas) — they're never validated at runtime on the FE
- No runtime logic — only types, schemas, and constants

## Checklist

- [ ] Contract file exists at `contracts/{domain}.contract.ts`
- [ ] Zod request schema defined and exported
- [ ] Request type derived from schema (`z.infer`)
- [ ] Response interface exported
- [ ] SSE event map interface exported
- [ ] API route constant exported
- [ ] FE api_call step JSON references this contract
- [ ] BE route uses the schema for request parsing
