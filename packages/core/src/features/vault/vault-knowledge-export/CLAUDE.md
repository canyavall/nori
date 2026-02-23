# Vault Knowledge Export Flow

Exports all knowledge entries from a vault as Markdown files to a user-chosen destination directory, preserving category folder structure.

## Steps

1. **Validate vault** — Check vault exists → [steps/01-validate-vault.json](steps/01-validate-vault.json)
2. **Load entries** — Query all knowledge entries from the vault DB → [steps/02-load-entries.json](steps/02-load-entries.json)
3. **Export files** — Copy each .md file to destination/{category}/{file}.md → [steps/03-export-files.json](steps/03-export-files.json)
