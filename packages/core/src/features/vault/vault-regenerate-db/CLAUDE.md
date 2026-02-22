# Regenerate DB Flow

Scans vault markdown files, parses frontmatter, validates entries, and rebuilds the SQLite knowledge database.

## Steps

1. **Scan vault files** — Find all markdown files → [steps/01-scan-vault-files.json](steps/01-scan-vault-files.json)
2. **Parse frontmatter** — Extract YAML frontmatter from each file → [steps/02-parse-frontmatter.json](steps/02-parse-frontmatter.json)
3. **Validate entries** — Validate frontmatter against schema → [steps/03-validate-entries.json](steps/03-validate-entries.json)
4. **Build index** — Build searchable index → [steps/04-build-index.json](steps/04-build-index.json)
5. **Write database** — Write index to SQLite → [steps/05-write-database.json](steps/05-write-database.json)
6. **Report metrics** — Log rebuild metrics → [steps/06-report-metrics.json](steps/06-report-metrics.json)
