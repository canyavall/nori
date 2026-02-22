# Knowledge Delete Flow

Frontend flow for deleting a knowledge entry.

**Backend flow**: `core/features/knowledge/knowledge-delete`
**Contract**: `@nori/shared/contracts/knowledge.contract.ts`

## Steps

1. **Show confirmation** — Delete confirmation with dependency warnings → [steps/01-show-confirmation.json](steps/01-show-confirmation.json)
2. **Call backend** — DELETE /api/knowledge/:id → [steps/02-call-backend.json](steps/02-call-backend.json)
3. **Show result** — Deletion confirmed → [steps/03-show-result.json](steps/03-show-result.json)
