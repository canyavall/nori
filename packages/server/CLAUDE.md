# @nori/server

Hono REST API + SSE event streaming. Imports `@nori/core` for all business logic.

## What this package does

Maps HTTP routes to core flows. Wires SSE events so the frontend can track flow progress. Contains no business logic — it's a thin adapter.

## Structure

```
src/
  index.ts              Hono app entry point
  routes/
    app.routes.ts       GET /api/health, POST /api/app/integrity-check
    vault.routes.ts     POST /api/vault, POST /api/vault/:id/pull, etc.
    knowledge.routes.ts POST /api/knowledge, GET /api/knowledge/search, etc.
    session.routes.ts   POST /api/session, POST /api/session/:id/resume
    chat.routes.ts      POST /api/chat/message, SSE streaming
    flow.routes.ts      GET /api/flows — serves flow definitions to visual builder
  sse/
    emitter.ts          SSE event broadcasting utility
  middleware/
    error-handler.ts    Global error handling
```

## Route → Flow mapping pattern

```typescript
app.post('/api/vault', async (c) => {
  const input = vaultRegistrationSchema.parse(await c.req.json())
  const sse = getSSEEmitter(c)

  const result = await runVaultRegistration(input, {
    emit: (event, data) => sse.send(event, data)
  })

  return c.json(result)
})
```

Every route: parse input with Zod schema from `@nori/shared` → call core flow with SSE emitter → return result.

## Dependencies

- hono
- @nori/core
- @nori/shared (schemas, types)
