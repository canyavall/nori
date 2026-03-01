# Vault Knowledge Import (Frontend)

Frontend flow for importing Markdown files from the user's filesystem into a vault.

**Backend flow**: `core/features/vault/vault-knowledge-import`
**Contract**: `@nori/shared/contracts/vault.contract.ts`

## Steps

1. **Pick files** — User selects text files (.md, .txt, .rst, .mdx, .markdown) or a folder via Tauri file dialog → [steps/01-pick-files.json](steps/01-pick-files.json)
2. **Call backend** — POST /api/vault/:id/knowledge/import with SSE progress (includes enriching/enriching-file events) → [steps/02-call-backend.json](steps/02-call-backend.json)
