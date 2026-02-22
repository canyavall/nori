# Nori Project Memory

## Architecture
Monorepo: `packages/core` (engine), `packages/server` (Hono API), `packages/app` (Tauri+SolidJS), `packages/shared` (types/schemas).

## Key conventions
- Backend flows: `packages/core/src/features/{domain}/{flow-name}/` with `steps/` + `actions/` + `{flow-name}.ts` orchestrator
- Frontend flows: `packages/app/src/features/{domain}/{flow-name}/` with `steps/` + component files
- Contracts: `packages/shared/src/contracts/` — only coupling between FE and BE
- Step JSONs numbered `01-name.json`, `02-name.json` etc.

## Nori data directory
- Mac/Linux: `~/.nori/` (via `os.homedir()`)
- Windows: `C:\Users\{user}\.nori\`
- Constants: `NORI_DATA_DIR_NAME = '.nori'`, `NORI_VAULTS_DIR = 'vaults'`
- Path resolver: `packages/core/src/features/shared/utils/path-resolver.ts`
- Local vaults stored at: `~/.nori/vaults/{vault_name}/`

## Vault types
Two vault types implemented:
1. **git** — clones from remote repo; `vault_type='git'`, has `git_url` + `branch`
2. **local** — directory in `~/.nori/vaults/`; `vault_type='local'`, no git fields

Both dispatched via `POST /api/vault` — server reads `vault_type` field to route to correct flow.

## Shared package exports — important
When adding new schemas/types to `packages/shared/src/schemas/`, must also export from `packages/shared/src/index.ts`.
After editing `index.ts`, run `bun run --filter @nori/shared build` before running server tests (vitest resolves from dist).

## Test setup
- Core: vitest in `packages/core` (runs `vitest run`)
- Server: vitest added to `packages/server` (2026-02-21) — test file: `src/routes/vault.routes.test.ts`
- App: no test setup yet
- Run core tests: `bun run --filter @nori/core test`
- Run server tests: `bun run --filter @nori/server test`

## Frontend vault-registration flow (updated 2026-02-21)
Steps: `00-choose-type` → `01-show-form` → `02-validate-input` → `03-call-backend` → `04-show-result`
Components:
- `VaultTypePicker.tsx` — step 00: card-style git vs local selector
- `VaultRegistrationForm.tsx` — step 01: conditional fields based on vaultType prop
- `VaultRegistrationDialog.tsx` — orchestrator with Pick→Form→Progress→Result wizard
- `VaultRegistrationResult.tsx` — shows vault_type, local_path for local vaults
