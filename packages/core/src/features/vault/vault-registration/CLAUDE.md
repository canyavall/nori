# Vault Registration Flow

Registers a new vault from a git repository. Validates, tests access, clones, persists config, and builds initial index.

## Steps

1. **Validate URL** — Validate git URL format and accessibility → [steps/01-validate-url.json](steps/01-validate-url.json)
2. **Test git access** — Test credentials via ls-remote (~2s vs 30s+ clone) → [steps/02-test-git-access.json](steps/02-test-git-access.json)
3. **Clone repo** — Clone vault repository to local storage → [steps/03-clone-repo.json](steps/03-clone-repo.json)
4. **Write config** — Persist vault configuration to database → [steps/04-write-config.json](steps/04-write-config.json)
5. **Build index** — Build knowledge index for the new vault → [steps/05-build-index.json](steps/05-build-index.json)
