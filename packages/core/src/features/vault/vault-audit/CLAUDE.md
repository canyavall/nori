# Audit Vault Flow

Full vault audit: validates frontmatter, checks content quality, verifies database consistency.

## Steps

1. **Load all entries** — Load all knowledge entries → [steps/01-load-all-entries.json](steps/01-load-all-entries.json)
2. **Validate frontmatter** — Validate all frontmatter against schema → [steps/02-validate-frontmatter.json](steps/02-validate-frontmatter.json)
3. **Validate content** — Check content quality → [steps/03-validate-content.json](steps/03-validate-content.json)
4. **Check DB consistency** — Compare vault files against database → [steps/04-check-db-consistency.json](steps/04-check-db-consistency.json)
5. **Generate audit report** — Build comprehensive report → [steps/05-generate-audit-report.json](steps/05-generate-audit-report.json)
