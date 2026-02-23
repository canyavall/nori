# Vault Knowledge Export (Frontend)

Frontend flow for exporting all vault knowledge entries as Markdown files to a user-chosen folder.

**Backend flow**: `core/features/vault/vault-knowledge-export`
**Contract**: `@nori/shared/contracts/vault.contract.ts`

## Steps

1. **Pick destination** — User selects destination folder via Tauri folder dialog → [steps/01-pick-destination.json](steps/01-pick-destination.json)
2. **Call backend** — POST /api/vault/:id/knowledge/export with SSE progress → [steps/02-call-backend.json](steps/02-call-backend.json)
