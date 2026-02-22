# Knowledge Edit Flow

Frontend flow for editing an existing knowledge entry.

**Backend flow**: `core/features/knowledge/knowledge-edit`
**Contract**: `@nori/shared/contracts/knowledge.contract.ts`

## Steps

1. **Load entry** — GET /api/knowledge/:id → [steps/01-load-entry.json](steps/01-load-entry.json)
2. **Show edit form** — Pre-filled frontmatter + content editor → [steps/02-show-edit-form.json](steps/02-show-edit-form.json)
3. **Call backend** — PUT /api/knowledge/:id → [steps/03-call-backend.json](steps/03-call-backend.json)
4. **Show audit results** — Display audit findings → [steps/04-show-audit-results.json](steps/04-show-audit-results.json)
