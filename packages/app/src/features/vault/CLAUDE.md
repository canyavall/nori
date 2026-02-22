# Vault Feature (Frontend)

UI flows for vault management. Connects to backend vault flows via contracts in @nori/shared.

## Flows

### [vault-registration/](vault-registration/)
Wizard for registering a new vault. Step 0 lets the user choose between a **git-backed vault** (clone from remote) or a **local vault** (created in ~/.nori/vaults/). Each type shows a different form. Both call POST /api/vault with a vault_type field to dispatch to the correct backend flow.

### [vault-link-project/](vault-link-project/)
Wizard for linking a vault to a project. Vault picker → project picker → backend call → confirmation.

### [vault-sync-panel/](vault-sync-panel/)
Panel showing vault sync status. Triggers pull, shows results, handles conflict resolution.
