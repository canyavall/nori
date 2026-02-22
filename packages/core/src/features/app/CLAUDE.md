# App Feature

App lifecycle management: integrity checks, authentication validation, and auto-updates. All flows trigger on app start.

## Flows

### [app-integrity-check/](app-integrity-check/)
Validates monorepo structure (directories + config files) and self-heals missing components. Runs on every app start.

### [app-authentication-check/](app-authentication-check/)
Verifies Claude Code CLI access and git credentials. Guides user through setup if missing. Runs on every app start.

### [app-autoupdate/](app-autoupdate/)
Checks for new versions, compares against current, and applies updates via Tauri updater. Runs on every app start.

## Triggers

- `onAppStart` → app-integrity-check AND app-authentication-check AND app-autoupdate (parallel)
