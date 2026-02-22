# Session Resume Flow

Resumes an existing session by validating it exists and updating its status to active.

## Steps

1. **Validate session exists** — Verify session exists in database → [steps/01-validate-session-exists.json](steps/01-validate-session-exists.json)
2. **Restore context** — Update session status to active → [steps/02-restore-context.json](steps/02-restore-context.json)
