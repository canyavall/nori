# Vault Registration Wizard

Frontend flow for registering a new vault. Supports two vault types: git-backed (clone from remote) and local (created in ~/.nori/vaults/).

**Backend flows**:
- Git: `core/features/vault/vault-registration`
- Local: `core/features/vault/vault-local-registration`

**Contract**: `@nori/shared/contracts/vault.contract.ts`

## Steps

0. **Choose type** — Select between git repo or local vault → [steps/00-choose-type.json](steps/00-choose-type.json)
1. **Show form** — Collect fields for chosen type (git: name+url+branch, local: name only) → [steps/01-show-form.json](steps/01-show-form.json)
2. **Validate input** — Client-side validation using the matching Zod schema → [steps/02-validate-input.json](steps/02-validate-input.json)
3. **Call backend** — POST /api/vault with vault_type + SSE progress tracking → [steps/03-call-backend.json](steps/03-call-backend.json)
4. **Show result** — Display registration success → [steps/04-show-result.json](steps/04-show-result.json)

## Components

- `VaultRegistrationDialog.tsx` — Orchestrator; manages wizard state (type, step, progress)
- `VaultTypePicker.tsx` — Step 00: radio-style type selection card
- `VaultRegistrationForm.tsx` — Step 01: fields adapt to vault_type (git shows url+branch, local hides them)
- `VaultRegistrationResult.tsx` — Step 04: success screen (shows local_path for local vaults)
- `validate-input.ts` — Step 02: validates against vaultRegistrationSchema or vaultLocalRegistrationSchema
