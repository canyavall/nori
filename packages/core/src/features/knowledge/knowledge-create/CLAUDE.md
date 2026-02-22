# Knowledge Create Flow

Creates a new knowledge entry. Validates frontmatter and content, writes markdown file, audits, and rebuilds index.

## Steps

1. **Validate frontmatter** — Validate fields against schema → [steps/01-validate-frontmatter.json](steps/01-validate-frontmatter.json)
2. **Validate content** — Check markdown content is well-structured → [steps/02-validate-content.json](steps/02-validate-content.json)
3. **Write markdown file** — Write file with frontmatter to vault → [steps/03-write-markdown-file.json](steps/03-write-markdown-file.json)
4. **Audit knowledge** — Run audit on new entry (flow_call) → [steps/04-audit-knowledge.json](steps/04-audit-knowledge.json)
5. **Regenerate index** — Rebuild index (flow_call) → [steps/05-regenerate-index.json](steps/05-regenerate-index.json)
