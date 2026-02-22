# @nori/shared

Shared TypeScript types, Zod schemas, SSE event maps, and contracts. The only coupling between `@nori/core` (backend) and `@nori/app` (frontend).

## What this package does

Defines the API contract between frontend and backend. Both sides import from here — neither imports the other directly.

## Structure

```
src/
  contracts/
    vault.contract.ts       Vault request/response schemas + SSE events
    knowledge.contract.ts   Knowledge request/response schemas + SSE events
    session.contract.ts     Session request/response schemas + SSE events
    app.contract.ts         App lifecycle request/response schemas
  types/
    flow.ts                 FlowDefinition, StepResult, FlowEmitter
    vault.ts                Vault, VaultLink types
    knowledge.ts            KnowledgeEntry, Frontmatter types
    session.ts              Session, Message types
    events.ts               SSE event type map
  schemas/
    vault.schema.ts         Zod schemas for vault validation
    knowledge.schema.ts     Zod schemas for knowledge validation
    flow.schema.ts          Zod schema for step JSON validation
  constants.ts              Shared constants
```

## Contract pattern

Each contract file contains:

```typescript
// 1. Zod request schema (used by FE for form validation, BE for request parsing)
export const vaultRegistrationSchema = z.object({ ... })
export type VaultRegistrationRequest = z.infer<typeof vaultRegistrationSchema>

// 2. Response type (returned by BE, consumed by FE)
export interface VaultRegistrationResponse { ... }

// 3. SSE event map (FE knows what to listen for, BE knows what to emit)
export interface VaultRegistrationEvents {
  'vault:registration:started': { vault_name: string }
  'vault:registration:completed': { vault_id: string }
}

// 4. API route constant (optional — for type-safe route wiring)
export const VAULT_REGISTRATION_API = {
  method: 'POST' as const,
  path: '/api/vault',
} as const
```

## Rules

- No runtime logic — only types, schemas, and constants
- No dependencies on core, server, or app
- Dependencies: only `zod`
