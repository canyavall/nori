# Session Browser Flow

Frontend flow for browsing, creating, and resuming sessions.

**Backend flows**: `core/features/session/session-create`, `core/features/session/session-resume`
**Contract**: `@nori/shared/contracts/session.contract.ts`

## Steps

1. **Show session list** — List all sessions with dates and status → [steps/01-show-session-list.json](steps/01-show-session-list.json)
2. **Show session detail** — Session messages, loaded knowledge, timeline → [steps/02-show-session-detail.json](steps/02-show-session-detail.json)
3. **Call create session** — POST /api/session → [steps/03-call-create-session.json](steps/03-call-create-session.json)
4. **Call resume session** — POST /api/session/:id/resume → [steps/04-call-resume-session.json](steps/04-call-resume-session.json)
