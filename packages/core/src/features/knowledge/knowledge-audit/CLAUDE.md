# Knowledge Audit Flow

Audits a single knowledge entry for quality: schema validation, content quality, and AI originality check.

## Steps

1. **Load entry** — Load the target knowledge entry → [steps/01-load-entry.json](steps/01-load-entry.json)
2. **Validate frontmatter schema** — Validate against Zod schema → [steps/02-validate-frontmatter-schema.json](steps/02-validate-frontmatter-schema.json)
3. **Validate content quality** — Check structure, length, headings → [steps/03-validate-content-quality.json](steps/03-validate-content-quality.json)
4. **Check AI originality** — Verify content is not generic AI boilerplate → [steps/04-check-ai-originality.json](steps/04-check-ai-originality.json)
5. **Generate audit result** — Compile findings → [steps/05-generate-audit-result.json](steps/05-generate-audit-result.json)
