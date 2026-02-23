# Vault Knowledge Tree (Frontend)

Frontend panel that shows a selected vault's knowledge entries organized as a collapsible category tree.
Displayed in the main content area of VaultsPage when a vault is selected.

**Backend flow**: none — uses existing `GET /api/knowledge?vault_id=` endpoint directly
**Contract**: `@nori/shared/contracts/knowledge.contract.ts` (`KNOWLEDGE_LIST_API`)

## Steps

1. **Load knowledge** — GET /api/knowledge?vault_id={id} → [steps/01-load-knowledge.json](steps/01-load-knowledge.json)
2. **Show tree** — Collapsible category/entry tree → [steps/02-show-tree.json](steps/02-show-tree.json)
3. **Edit entry** — Opens KnowledgeEditDialog on click → [steps/03-edit-entry.json](steps/03-edit-entry.json)

## Components

- `VaultKnowledgeTree.tsx` — orchestrator: loads data, manages state, renders tree + edit dialog
- `CategoryTree.tsx` — pure display: collapsible category sections with entry rows

## Layout integration

`VaultsPage` renders this component in the right column of a master-detail layout.
When no vault is selected → full-width vault grid.
When a vault is selected → left column (vault list) + right column (VaultKnowledgeTree).
