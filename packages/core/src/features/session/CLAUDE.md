# Session Feature

Manages session lifecycle: creation, resumption, and archiving.

## Flows

### [session-create/](session-create/)
Creates a new session. Checks for active sessions, archives previous, generates unique ID, creates state file, and logs the start event.

### [session-resume/](session-resume/)
Resumes an existing session. Validates the session exists, loads state, restores context (loaded packages, prompt count), and logs the resume event.

### [session-archive/](session-archive/)
Archives a session. Creates timestamped archive directory, copies state and events files, removes originals, and cleans up old archives (keeps 99 most recent).
