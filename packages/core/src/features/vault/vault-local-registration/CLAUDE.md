# Vault Local Registration Flow

Registers a new **local** vault (no git remote). Creates a directory in the Nori data folder and saves metadata to the database.

## Steps

1. **Validate name** — Validate vault name format (no spaces, no special chars) → [steps/01-validate-name.json](steps/01-validate-name.json)
2. **Create directory** — Create `~/.nori/vaults/{name}/` on disk → [steps/02-create-directory.json](steps/02-create-directory.json)
3. **Write config** — Persist vault to DB with `vault_type='local'`, `git_url=NULL` → [steps/03-write-config.json](steps/03-write-config.json)
4. **Build index** — Build initial knowledge index (non-fatal for empty vaults) → [steps/04-build-index.json](steps/04-build-index.json)

## Differences from vault-registration (git)

| | Git vault | Local vault |
|---|---|---|
| git_url | required | NULL |
| branch | required | NULL |
| vault_type | 'git' | 'local' |
| Steps | validate-url, test-access, clone, write-config, build-index | validate-name, create-dir, write-config, build-index |

## Data location

- **Mac/Linux**: `~/.nori/vaults/{vault_name}/`
- **Windows**: `C:\Users\{user}\.nori\vaults\{vault_name}\`
