# Session Archive Flow

Archives a session by updating its status to 'archived' in the database.

## Steps

1. **Check active** — Verify session exists and is not already archived → [steps/01-check-active.json](steps/01-check-active.json)
2. **Archive session** — Update session status to 'archived' → [steps/02-archive-session.json](steps/02-archive-session.json)
