# Autoupdate Flow

Checks for new versions and applies updates via Tauri updater. Runs on every app start.

## Steps

1. **Check current version** — Read app version from package metadata → [steps/01-check-current-version.json](steps/01-check-current-version.json)
2. **Fetch latest version** — Query update server for latest available → [steps/02-fetch-latest-version.json](steps/02-fetch-latest-version.json)
3. **Compare versions** — Determine if update is needed → [steps/03-compare-versions.json](steps/03-compare-versions.json)
4. **Apply update** — Download and install via Tauri updater → [steps/04-apply-update.json](steps/04-apply-update.json)
