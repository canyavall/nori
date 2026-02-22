# Knowledge Create Wizard

Frontend flow for creating a new knowledge entry.

**Backend flow**: `core/features/knowledge/knowledge-create`
**Contract**: `@nori/shared/contracts/knowledge.contract.ts`

## Steps

1. **Show frontmatter form** — Collect tags, description, category, auto_load → [steps/01-show-frontmatter-form.json](steps/01-show-frontmatter-form.json)
2. **Show content editor** — Markdown editor for content → [steps/02-show-content-editor.json](steps/02-show-content-editor.json)
3. **Preview knowledge** — Rendered preview with frontmatter summary → [steps/03-preview-knowledge.json](steps/03-preview-knowledge.json)
4. **Call backend** — POST /api/knowledge with SSE progress → [steps/04-call-backend.json](steps/04-call-backend.json)
5. **Show audit results** — Display audit findings → [steps/05-show-audit-results.json](steps/05-show-audit-results.json)
