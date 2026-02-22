# Vault Link Project Flow

Links a registered vault to a project directory, enabling knowledge injection for that project.

## Steps

1. **Validate vault exists** — Verify target vault is registered → [steps/01-validate-vault-exists.json](steps/01-validate-vault-exists.json)
2. **Validate project path** — Verify target project directory exists → [steps/02-validate-project-path.json](steps/02-validate-project-path.json)
3. **Write link** — Persist vault-to-project link in database → [steps/03-write-link.json](steps/03-write-link.json)
