# Vault Pull Flow

Pulls latest changes from vault git remote. Fetches, detects conflicts, applies changes, rebuilds index.

## Steps

1. **Validate config** — Read vault config and validate git remote → [steps/01-validate-config.json](steps/01-validate-config.json)
2. **Check local changes** — Detect uncommitted local changes → [steps/02-check-local-changes.json](steps/02-check-local-changes.json)
3. **Git fetch** — Fetch latest from remote → [steps/03-git-fetch.json](steps/03-git-fetch.json)
4. **Detect conflicts** — 3-way merge comparison (local/remote/cache) → [steps/04-detect-conflicts.json](steps/04-detect-conflicts.json)
5. **Merge changes** — Apply remote changes to local → [steps/05-merge-changes.json](steps/05-merge-changes.json)
6. **Update index** — Rebuild knowledge index → [steps/06-update-index.json](steps/06-update-index.json)
7. **Log event** — Log vault pull event with summary → [steps/07-log-event.json](steps/07-log-event.json)
