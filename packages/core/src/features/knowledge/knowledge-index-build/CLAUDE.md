# Knowledge Index Build Flow

Builds searchable knowledge index from vault markdown files. Includes fast-path mtime check.

## Steps

0. **Fast-path check** — Compare vault mtime against index mtime (~10ms skip) → [steps/00-fast-path-check.json](steps/00-fast-path-check.json)
1. **Scan vault** — Find all .md files in vault directories → [steps/01-scan-vault.json](steps/01-scan-vault.json)
2. **Parse frontmatter** — Extract YAML frontmatter → [steps/02-parse-frontmatter.json](steps/02-parse-frontmatter.json)
3. **Validate metadata** — Validate parsed metadata → [steps/03-validate-metadata.json](steps/03-validate-metadata.json)
4. **Build index** — Build hierarchical index → [steps/04-build-index.json](steps/04-build-index.json)
5. **Write index** — Write to knowledge.json → [steps/05-write-index.json](steps/05-write-index.json)
6. **Report metrics** — Log build metrics → [steps/06-report-metrics.json](steps/06-report-metrics.json)
