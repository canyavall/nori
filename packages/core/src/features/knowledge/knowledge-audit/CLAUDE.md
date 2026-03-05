# Knowledge Audit Flow

Audits a single knowledge entry for quality: schema validation, content quality, AI originality check, and optional deep LLM analysis.

## Steps

1. **Load entry** — Load the target knowledge entry → [steps/01-load-entry.json](steps/01-load-entry.json)
2. **Validate frontmatter schema** — Validate against Zod schema → [steps/02-validate-frontmatter-schema.json](steps/02-validate-frontmatter-schema.json)
3. **Validate content quality** — Check structure, length, headings → [steps/03-validate-content-quality.json](steps/03-validate-content-quality.json)
4. **Check AI originality** — Verify content is not generic AI boilerplate → [steps/04-check-ai-originality.json](steps/04-check-ai-originality.json)
5. **Load vault entries** _(optional)_ — Load sibling entries for LLM comparison → [steps/05-load-vault-entries.json](steps/05-load-vault-entries.json)
6. **Call LLM audit** _(optional)_ — Deep semantic analysis via Claude → [steps/06-call-llm-audit.json](steps/06-call-llm-audit.json)
7. **Generate audit result** — Merge structural + LLM findings into final report → [steps/07-generate-audit-result.json](steps/07-generate-audit-result.json)

Steps 5–6 only run when `vault_id` + `db` are passed (standalone audit route). Internal audit (called from create/edit) skips them, proceeding directly from step 4 to step 7.
