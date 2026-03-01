# Vault Knowledge Import Flow

Imports text knowledge files from the user's filesystem into a vault. Accepts .md, .txt, .rst, .mdx, and .markdown files. Uses the LLM to generate missing metadata (title, category, tags, description) for files that lack standard frontmatter.

## Steps

1. **Validate vault** — Check vault exists and get its local_path → [steps/01-validate-vault.json](steps/01-validate-vault.json)
2. **Scan sources** — Expand file/folder paths to a list of text files (.md/.txt/.rst/.mdx/.markdown) → [steps/02-scan-sources.json](steps/02-scan-sources.json)
3. **Parse files** — Read each file and extract frontmatter + content (lenient, no required fields) → [steps/03-parse-files.json](steps/03-parse-files.json)
4. **Enrich metadata** — LLM fills missing title/category/tags/description; falls back to filename+folder if unavailable → [steps/04-enrich-metadata.json](steps/04-enrich-metadata.json)
5. **Import entries** — Copy files into vault directory with full frontmatter and register in DB → [steps/05-import-entries.json](steps/05-import-entries.json)
6. **Rebuild index** — Rebuild knowledge index after import (non-fatal) → [steps/06-rebuild-index.json](steps/06-rebuild-index.json)
