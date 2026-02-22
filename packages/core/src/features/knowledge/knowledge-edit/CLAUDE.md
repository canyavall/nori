# Knowledge Edit Flow

Edits an existing knowledge entry. Loads, validates changes, writes (atomic), audits, and rebuilds index.

## Steps

1. **Load existing** — Read current markdown and parse frontmatter → [steps/01-load-existing.json](steps/01-load-existing.json)
2. **Validate changes** — Validate modified frontmatter and content → [steps/02-validate-changes.json](steps/02-validate-changes.json)
3. **Write changes** — Write updated file (atomic: temp + rename) → [steps/03-write-changes.json](steps/03-write-changes.json)
4. **Audit knowledge** — Audit edited entry (flow_call) → [steps/04-audit-knowledge.json](steps/04-audit-knowledge.json)
5. **Regenerate index** — Rebuild index (flow_call) → [steps/05-regenerate-index.json](steps/05-regenerate-index.json)
