# Vault Sync Panel

Frontend flow for vault synchronization UI. Shows status, triggers pull, displays results, resolves conflicts.

**Backend flow**: `core/features/vault/vault-pull`
**Contract**: `@nori/shared/contracts/vault.contract.ts`

## Steps

1. **Show sync status** — Display last pull time, pending changes → [steps/01-show-sync-status.json](steps/01-show-sync-status.json)
2. **Trigger pull** — POST /api/vault/:id/pull with SSE progress → [steps/02-trigger-pull.json](steps/02-trigger-pull.json)
3. **Show pull results** — Display files changed, conflicts → [steps/03-show-pull-results.json](steps/03-show-pull-results.json)
4. **Show conflict resolver** — File diff editor for conflict resolution → [steps/04-show-conflict-resolver.json](steps/04-show-conflict-resolver.json)
