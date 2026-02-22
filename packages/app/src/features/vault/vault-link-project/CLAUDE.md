# Vault Link Project Wizard

Frontend flow for linking a vault to a project directory.

**Backend flow**: `core/features/vault/vault-link-project`
**Contract**: `@nori/shared/contracts/vault.contract.ts`

## Steps

1. **Show vault picker** — Select from registered vaults → [steps/01-show-vault-picker.json](steps/01-show-vault-picker.json)
2. **Show project picker** — Select project directory → [steps/02-show-project-picker.json](steps/02-show-project-picker.json)
3. **Call backend** — POST /api/vault/:id/link → [steps/03-call-backend.json](steps/03-call-backend.json)
4. **Show confirmation** — Display link created → [steps/04-show-confirmation.json](steps/04-show-confirmation.json)
