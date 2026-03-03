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

## VaultsPage — grid + vault detail page (2026-03-02)
- VaultsPage shows full-width grid of vault cards (no inline tree, no master-detail)
- Clicking a vault card navigates to `/vaults/:id` (VaultDetailPage)
- VaultDetailPage wraps VaultDetailSection: sub-header (back + vault name + Link Projects + Vault Settings) + left knowledge sidebar + main content (KnowledgeDetailPanel)
- KnowledgeDetailPanel: view mode + edit mode; reuses EditForm from knowledge-edit flow
- navigation.store no longer has activeVault/selectVault/clearVaultContext — vault context is now URL-driven
- Default route `/` → ProjectsPage (changed from VaultsPage)
- Tests: VaultsPage.test.tsx mocks `@solidjs/router` with static factory (no async import); checks navigate called with `/vaults/:id`

## Convention audit fixes (2026-02-22)
All 8 convention audit issues resolved on `feat/tauri-monorepo-restructure`:
- Deleted dead `VaultSyncPanel.tsx` + `VaultSyncPanel.hook.ts`
- Fixed `SearchResultItem` import to use `.type.ts` files
- Extracted `ProjectListSection.hook.ts` + subcomponents (`GitBadge`, `ProjectCard`)
- Extracted `VaultCard`, `VaultTypeBadge` into `components/` subfolder; added `handleLinkProject`/`handleSyncToggle` to hook
- Replaced inline `() => setStep('list')` with `handleCancelCreate` in `SessionListSection`
- Replaced all `as` type casts with type guard functions or property narrowing
- Converted all hook declarations from `export function` to `export const`
- Converted all section/page exports to `export const X: Component`
- Created 4 section tests (KnowledgeListSection, KnowledgeDetailSection, SessionListSection, SettingsSection)
- Rebuilt `@nori/shared` to sync `project_count`/`knowledge_count` to dist
- All 147 tests pass, 0 TypeScript errors

## Component folder reorganization (2026-02-22)
All feature flow folders now use one-component-per-folder structure. Each .tsx component has its own named subfolder (e.g., `knowledge-create/KnowledgeCreateDialog/KnowledgeCreateDialog.tsx`). Affected flows: knowledge-create, knowledge-edit, knowledge-delete, knowledge-search, vault-registration, vault-sync-panel, vault-link-project, vault-knowledge-tree, session-browser, components/layout. The `components/layout/` folder now has `ContextualSidebar/` and `TopNav/` subfolders. All imports updated; 0 TS errors.

## Convention migration (2026-02-22)
Completed full convention migration on `feat/tauri-monorepo-restructure`:
- Phase 1: TypeScript safety (no `!`, no `as any`, `??` over `||` for display fallbacks)
  - Exception: `entry.category || 'Uncategorized'` stays `||` — empty string is also falsy/invalid
- Phase 2: Component structure (33 `.type.ts`, 9 `.hook.ts`, 1 `.style.ts` sibling files)
  - `ContextualSidebar.hook.ts` — extracted all reactive logic
  - `ThemeSwitcher.style.ts` — dynamic button class logic
  - `KnowledgeCreateDialog.hook.ts`, `KnowledgeEditDialog.hook.ts`, `VaultSyncPanel.hook.ts` — extracted SSE/step logic
- Phase 3: Section pattern (6 pages → thin wrappers; logic in `features/` sections)
  - `KnowledgePage → knowledge-list/KnowledgeListSection`
  - `KnowledgeDetailPage → knowledge-detail/KnowledgeDetailSection`
  - `ProjectsPage → project-list/ProjectListSection`
  - `VaultsPage → vault-list/VaultListSection`
  - `SessionsPage → session-list/SessionListSection`
  - `SettingsPage → settings-main/SettingsSection`
- isomorphic-git `(git as any)` replaced with named imports (`statusMatrix`, `add`, `remove`, `commit`, `gitPush`, `isoFetch`, `fastForward`, `gitMerge`)
- SolidJS `keyed` pattern used for Show+non-null (e.g., `<Show when={vault()} keyed>{(v) => ...}</Show>`)
- `Match` component does NOT support `keyed` — use `<Match when={...}><Show when={...} keyed>{...}</Show></Match>` pattern instead

## vault-knowledge-tree / VaultDetailSection (2026-03-02)
- Location: `packages/app/src/features/vault/vault-knowledge-tree/`
- Main component: `VaultDetailSection/VaultDetailSection.tsx` — full-page layout
- `CategoryTree.tsx` unchanged — used in sidebar; `onEditEntry` callback sets selectedEntryId
- `KnowledgeDetailPanel` in `knowledge-detail/KnowledgeDetailPanel/` — inline view+edit panel (not dialog)
- `KnowledgeCreateDialog` closes via `knowledge.store.setCreateOpen(false)` — use `setCreateOpen(true)` to open it
- ContextualSidebar: project context only (no vault context); always shows Linked Vaults, Sessions, Skills, Rules, Hooks, MCPs

## Frontend vault-registration flow (updated 2026-02-21)
Steps: `00-choose-type` → `01-show-form` → `02-validate-input` → `03-call-backend` → `04-show-result`
Components:
- `VaultTypePicker.tsx` — step 00: card-style git vs local selector
- `VaultRegistrationForm.tsx` — step 01: conditional fields based on vaultType prop
- `VaultRegistrationDialog.tsx` — orchestrator with Pick→Form→Progress→Result wizard
- `VaultRegistrationResult.tsx` — shows vault_type, local_path for local vaults
