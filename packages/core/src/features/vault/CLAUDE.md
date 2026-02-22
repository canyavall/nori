# Vault Feature

Manages knowledge vaults: registration, project linking, git synchronization, reconciliation, database regeneration, vector embeddings, and auditing.

## Flows

### [vault-registration/](vault-registration/)
Registers a new vault from a git repository. Validates URL, tests git access, clones repo, persists config, and builds initial index.

### [vault-link-project/](vault-link-project/)
Links a registered vault to a project directory, enabling knowledge injection for that project.

### [vault-pull/](vault-pull/)
Pulls latest changes from vault git remote. Fetches, detects conflicts via 3-way merge, applies changes, rebuilds index.

### [vault-push/](vault-push/)
Pushes local vault changes to git remote. Stages, commits, and pushes modified knowledge files.

### [vault-reconciliation/](vault-reconciliation/)
Compares local, remote, and cached vault states using 3-way merge detection. Generates conflict report for user resolution.

### [vault-regenerate-db/](vault-regenerate-db/)
Scans all vault markdown files, parses frontmatter, validates entries, and rebuilds the SQLite knowledge database.

### [vault-vector-embedding/](vault-vector-embedding/)
Generates vector embeddings for all knowledge entries using LLM and stores them in the vector search index.

### [vault-audit/](vault-audit/)
Full vault audit: validates all frontmatter, checks content quality, verifies database consistency, and generates a comprehensive report.

## Triggers

- `onAppStart` → vault-reconciliation AND vault-regenerate-db AND vault-vector-embedding (parallel)
- `vaultSyncButton.onClick` → vault-pull
- `auditButton.onClick` → vault-audit
