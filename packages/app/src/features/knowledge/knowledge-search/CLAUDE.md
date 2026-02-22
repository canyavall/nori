# Knowledge Search Flow

Frontend flow for searching knowledge entries.

**Backend flow**: `core/features/knowledge/knowledge-search`
**Contract**: `@nori/shared/contracts/knowledge.contract.ts`

## Steps

1. **Show search form** — Query input with category/tag filters → [steps/01-show-search-form.json](steps/01-show-search-form.json)
2. **Call backend** — GET /api/knowledge/search → [steps/02-call-backend.json](steps/02-call-backend.json)
3. **Show results** — Ranked results with relevance scores → [steps/03-show-results.json](steps/03-show-results.json)
