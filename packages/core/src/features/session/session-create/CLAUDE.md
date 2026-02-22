# Session Create Flow

Creates a new session with unique ID, archiving any previous active session.

## Steps

1. **Check active session** — Check if active session exists, archive it if so → [steps/01-check-active-session.json](steps/01-check-active-session.json)
2. **Create state** — Generate session ID and insert into database → [steps/02-create-state.json](steps/02-create-state.json)
