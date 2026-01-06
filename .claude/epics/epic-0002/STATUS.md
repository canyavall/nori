# Epic Status: Multi-Key Authentication System

**Epic ID**: epic-0002
**Created**: 2026-01-02
**Status**: ✅ **READY FOR IMPLEMENTATION**
**Priority**: P0 (Critical - blocks all API usage)

---

## Quick Summary

Epic to implement multi-key authentication system for Nori, enabling:
- Manual API key management (add, delete, switch)
- OAuth authentication for Claude Pro/Max users
- First-time login modal
- Multiple keys per user with easy switching

**Timeline**: 2 weeks (75 hours)
- Week 1: Manual API keys (40h)
- Week 2: OAuth + testing (35h)

---

## Documents

- ✅ **Requirements**: [requirements.md](./requirements.md)
- ✅ **Implementation Plan**: [plan.md](./plan.md)
- ✅ **Knowledge Reference**: `.claude/knowledge/vault/patterns/authentication/anthropic-authentication-methods.md`

---

## Current Phase: Planning Complete

### Completed
- [x] Requirements documentation
- [x] User stories and acceptance criteria
- [x] Technical architecture design
- [x] Database schema design
- [x] UI/UX wireframes
- [x] Security considerations documented
- [x] Implementation tasks broken down (15 tasks)
- [x] Timeline estimated (2 weeks)
- [x] Knowledge package created

### Ready to Start
- [ ] TASK-001: Database Schema & Migration System
- [ ] TASK-002: Backend API Key CRUD Operations
- [ ] TASK-003: Frontend TypeScript Types & Hooks

---

## Progress Tracking

### Phase 1: Manual API Keys (0/9 complete)
- [ ] TASK-001: Database Schema (4h)
- [ ] TASK-002: Backend CRUD (6h)
- [ ] TASK-003: Frontend Hooks (3h)
- [ ] TASK-004: Login Modal (8h)
- [ ] TASK-005: Settings Panel (6h)
- [ ] TASK-006: Header Dropdown (4h)
- [ ] TASK-007: Error Handling (3h)
- [ ] TASK-008: Update get_api_key (2h)
- [ ] TASK-009: Testing & Docs (4h)

**Phase 1 Total**: 0/40 hours (0%)

### Phase 2: OAuth Integration (0/3 complete)
- [ ] TASK-010: OAuth Backend (12h)
- [ ] TASK-011: OAuth Frontend (6h)
- [ ] TASK-012: OAuth Error Handling (4h)

**Phase 2 Total**: 0/22 hours (0%)

### Phase 3: Polish & Testing (0/3 complete)
- [ ] TASK-013: E2E Testing (6h)
- [ ] TASK-014: Performance (3h)
- [ ] TASK-015: Security Audit (4h)

**Phase 3 Total**: 0/13 hours (0%)

---

## Key Decisions

### ✅ Decided

1. **Multi-key storage**: SQLite with migrations
2. **Priority order**: Env var → Active DB key → In-memory (legacy) → Error
3. **OAuth approach**: Reuse Claude Code's client_id (with ToS warning)
4. **Security**: No encryption at rest in MVP (Phase 1), add in Phase 2
5. **UI placement**: Header dropdown + Settings panel + Login modal
6. **Validation**: Client-side format check + Server-side API test

### ⏳ Pending

1. **Encryption**: Which library? (Phase 2 decision)
2. **Key export**: Format and security model (Phase 3)
3. **Team features**: Multi-user key sharing (Future phase)

---

## Risks & Mitigation

| Risk | Mitigation | Status |
|------|------------|--------|
| OAuth breaks (Anthropic blocks) | Fallback to manual keys, clear ToS warning | ✅ Documented |
| API keys leaked in logs | Strict no-logging policy, code review | ✅ In plan |
| SQLite corruption | WAL mode, atomic transactions, backups | ✅ In plan |
| Users confused by multiple keys | Clear UI, active indicator, onboarding | ✅ Designed |

---

## Dependencies

### Internal
- [x] nori-mvp-001 core functionality complete
- [x] SQLite database initialized
- [x] Tauri commands working

### External
- [x] Anthropic API available
- [ ] OAuth endpoints stable (monitor during implementation)

---

## Testing Strategy

1. **Unit Tests**: API key validation, CRUD operations, key priority logic
2. **Integration Tests**: Full flow (add → activate → use in API call)
3. **E2E Tests**: 8 critical scenarios (fresh install, multi-key, env var, etc.)
4. **Security Audit**: Manual review of key handling, logging, storage

---

## Success Metrics

**Quantitative:**
- 95% of users complete auth within 2 minutes
- < 5% support requests about authentication
- 0 API key leaks in logs
- Key switch time < 50ms

**Qualitative:**
- Users find auth "easy" or "very easy"
- No confusion about active key
- Clear understanding of OAuth risks

---

## Next Actions

**Immediate (Today):**
1. Create GitHub/Linear issues for each task
2. Set up branch: `feature/epic-0002-multi-key-auth`
3. Begin TASK-001 (Database Schema)

**This Week:**
- Complete Phase 1 backend (TASK-001, 002, 003, 008)
- Begin Phase 1 frontend (TASK-004)

**Next Week:**
- Complete Phase 1
- Begin Phase 2 (OAuth)

---

## Notes

- Knowledge package created at `.claude/knowledge/vault/patterns/authentication/anthropic-authentication-methods.md`
- OAuth uses Claude Code's client_id: `9d1c250a-e61b-44d9-88ed-5944d1962f5e`
- Clear ToS warning required before OAuth
- Manual API keys are the primary, official method
- OAuth is secondary, experimental, unsupported

---

**Last Updated**: 2026-01-02
**Next Review**: After TASK-003 (end of backend work)
