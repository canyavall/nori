# Vault Knowledge Import Flow

Imports Markdown knowledge files from the user's filesystem into a vault. Scans sources, parses frontmatter, and writes entries to both the vault directory and the knowledge database.

## Steps

1. **Validate vault** — Check vault exists and get its local_path → [steps/01-validate-vault.json](steps/01-validate-vault.json)
2. **Scan sources** — Expand file/folder paths to a list of .md files → [steps/02-scan-sources.json](steps/02-scan-sources.json)
3. **Parse files** — Read each file and extract frontmatter + content → [steps/03-parse-files.json](steps/03-parse-files.json)
4. **Import entries** — Copy files into vault directory and register in DB → [steps/04-import-entries.json](steps/04-import-entries.json)
5. **Rebuild index** — Rebuild knowledge index after import (non-fatal) → [steps/05-rebuild-index.json](steps/05-rebuild-index.json)
