# @nori/core

Pure TypeScript engine. Zero native dependencies. Runs on Node >= 20, Bun, Deno.

## What this package does

Contains all backend flows: sessions, hooks, vault operations, knowledge management, LLM abstraction, tool execution, and database operations. This is the library that `npm install @nori/core` installs.

## Structure

```
src/
  features/
    app/              App lifecycle (integrity, auth, app-autoupdate)
    vault/            Vault operations (registration, pull, push, sync, audit)
    knowledge/        Knowledge CRUD, indexing, search, audit, embeddings
    session/          Session lifecycle (create, resume, archive)
    shared/utils/     Shared utilities (event logger, path resolver, flow emitter)
  types/              TypeScript type definitions
  index.ts            Public API exports
```

## Flow conventions

Every flow follows the same structure:

```
features/{domain}/{flow-name}/
  steps/                 Step documentation (JSON files)
    01-step-name.json
    02-step-name.json
  actions/               Step implementations (TypeScript)
    step-name.ts
  {flow-name}.ts         Orchestrator (runs steps in sequence)
```

- Step JSONs describe what/why/where/errors/decisions — they are the source of truth
- Actions are pure TypeScript functions — one per step
- The orchestrator imports actions and runs them in order, accepting a `FlowEmitter` for SSE events
- `type: "flow_call"` steps delegate to another flow's orchestrator

## Orchestrator pattern

```typescript
export async function runFlowName(input: Input, emitter?: FlowEmitter) {
  emitter?.emit('flow:started', { flow: 'flow-name' })

  // Step 01
  emitter?.emit('step:started', { step: '01-step-name' })
  const result = await stepAction(input)
  emitter?.emit('step:completed', { step: '01-step-name', result })

  // ... more steps

  emitter?.emit('flow:completed', { flow: 'flow-name' })
  return result
}
```

## Dependencies (all pure JS/TS — no native)

- sql.js (WASM SQLite)
- isomorphic-git
- vectra (vector search)
- Vercel AI SDK
- gray-matter + unified/remark
- Zod
- @nori/shared (types, schemas)

## Event naming conventions

Two naming conventions are used — one for step action IDs, one for SSE wire events:

| Context | Format | Example |
|---------|--------|---------|
| Step JSON `action` field | `{domain}_{flow}_{step}` (underscores) | `vault_registration_test_git_access` |
| SSE events (contract/wire) | `{domain}:{flow}:{step}` (colons) | `vault:registration:testing-access` |

The server translates between the two formats. Backend step JSONs use underscores; the server emits colons to the client.
