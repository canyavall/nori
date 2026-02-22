# Authentication Check Flow

Verifies Claude Code CLI access and git credentials. Guides user through setup if missing. Runs on every app start.

## Steps

1. **Check Claude Code access** — Verify CLI is installed and accessible → [steps/01-check-claude-code-access.json](steps/01-check-claude-code-access.json)
2. **Check git credentials** — Verify git authentication (SSH keys or token) → [steps/02-check-git-credentials.json](steps/02-check-git-credentials.json)
3. **Self-heal** — Attempt to fix authentication issues automatically → [steps/03-self-heal.json](steps/03-self-heal.json)
