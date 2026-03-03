# Vault Settings (Frontend)

Frontend flow for vault settings and deletion. Opens from the "Vault Settings" button in VaultDetailSection.

**Backend flow**: `core/features/vault/vault-delete`
**Contract**: `@nori/shared/contracts/vault.contract.ts` (`VAULT_DELETE_API`, `VaultDeleteEvents`)

## Steps

0. **Settings view** — Display vault info + danger zone → [VaultSettingsDialog/steps/00-settings.json](VaultSettingsDialog/steps/00-settings.json)
1. **Enter vault name** — User types exact vault name to confirm → [VaultSettingsDialog/steps/01-enter-vault-name.json](VaultSettingsDialog/steps/01-enter-vault-name.json)
2. **Confirm delete** — Final "are you sure?" confirmation → [VaultSettingsDialog/steps/02-confirm-delete.json](VaultSettingsDialog/steps/02-confirm-delete.json)
3. **Delete API call** — DELETE /api/vault/:id with SSE progress → [VaultSettingsDialog/steps/03-delete-api-call.json](VaultSettingsDialog/steps/03-delete-api-call.json)

## Components

- `VaultSettingsDialog/VaultSettingsDialog.tsx` — Orchestrator with Switch/Match on steps
- `VaultSettingsDialog/VaultSettingsDialog.hook.ts` — State + SSE + navigation
- `VaultSettingsDialog/VaultSettingsDialog.type.ts` — Props + SettingsStep type
- `VaultSettingsDialog/VaultSettingsView.tsx` — Settings step with danger zone
- `VaultSettingsDialog/EnterVaultNameStep.tsx` — Name confirmation input
- `VaultSettingsDialog/ConfirmDeleteStep.tsx` — Final yes/no confirmation

## Flow on success

`removeVault(vault.id)` → `navigate('/vaults')`
