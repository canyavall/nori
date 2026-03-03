# Vault Delete Flow

Deletes a vault from Nori. For local vaults, also removes the directory from the filesystem. For git vaults, only the database records are deleted (the git repo is untouched).

## Steps

1. **Validate vault** — Verify target vault is registered → [steps/01-validate-vault.json](steps/01-validate-vault.json)
2. **Delete knowledge entries** — Remove all knowledge_entries rows for this vault → [steps/02-delete-knowledge-entries.json](steps/02-delete-knowledge-entries.json)
3. **Delete vault links** — Remove all vault_links rows for this vault → [steps/03-delete-vault-links.json](steps/03-delete-vault-links.json)
4. **Delete vault record** — Read vault data, then remove the vaults row → [steps/04-delete-vault-record.json](steps/04-delete-vault-record.json)
5. **Delete local files** — If vault_type === 'local', recursively delete local_path → [steps/05-delete-local-files.json](steps/05-delete-local-files.json)

## Behavior by vault type

| vault_type | DB rows deleted | Files deleted |
|-----------|----------------|---------------|
| `local`   | ✓              | ✓             |
| `git`     | ✓              | ✗             |
