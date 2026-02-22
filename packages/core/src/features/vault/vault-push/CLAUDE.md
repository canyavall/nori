# Vault Push Flow

Pushes local vault changes to git remote.

## Steps

1. **Validate config** — Read vault config and validate git remote → [steps/01-validate-config.json](steps/01-validate-config.json)
2. **Check changes** — Detect local changes to push → [steps/02-check-changes.json](steps/02-check-changes.json)
3. **Stage changes** — Stage modified knowledge files → [steps/03-stage-changes.json](steps/03-stage-changes.json)
4. **Commit** — Create git commit with descriptive message → [steps/04-commit.json](steps/04-commit.json)
5. **Push** — Push commit to remote → [steps/05-push.json](steps/05-push.json)
