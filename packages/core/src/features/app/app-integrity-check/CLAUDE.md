# Integrity Check Flow

Validates monorepo structure and self-heals missing components. Runs on every app start.

## Steps

1. **Validate folders** — Check all required package directories exist → [steps/01-validate-folders.json](steps/01-validate-folders.json)
2. **Validate files** — Check required config files exist and are parseable → [steps/02-validate-files.json](steps/02-validate-files.json)
3. **Self-heal** — Repair missing or corrupt structure components → [steps/03-self-heal.json](steps/03-self-heal.json)
