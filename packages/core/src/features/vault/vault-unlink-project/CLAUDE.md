# Vault Unlink Project Flow

Removes a vault-to-project link from the database, severing the knowledge injection connection.

## Steps

1. **Validate vault exists** — Verify target vault is registered → [steps/01-validate-vault-exists.json](steps/01-validate-vault-exists.json)
2. **Validate link exists** — Verify the link exists and belongs to this vault → [steps/02-validate-link-exists.json](steps/02-validate-link-exists.json)
3. **Delete link** — Remove the vault_links row from database → [steps/03-delete-link.json](steps/03-delete-link.json)
