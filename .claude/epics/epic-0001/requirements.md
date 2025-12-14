# Claude Code Feature Testing Suite

## Ticket Quality Assessment

**Domain Detected**: none
**Business Context**: ✅ Complete
**Technical Clarity**: ✅ Clear

**Missing Information**: None

## Scope

### In-Scope

- **Features to Test**:
  - CLAUDE.md file processing and instruction loading
  - Skills system (activation, execution, behavior)
  - Rules system (enforcement, validation)
  - Hooks system (lifecycle events, timing, data format)
  - Context compaction (triggers, behavior, reliability)
  - API interception (request/response comparison, back-and-forth analysis)
  - Knowledge hook integration (our custom hook behavior)

- **Test Types**:
  - Feature behavior tests
  - Reliability/consistency tests
  - Pattern documentation tests
  - API comparison tests (what we write vs what is sent)

- **Location**: Root `.claude/` directory test infrastructure

### Out-of-Scope

- OpenCode fork testing (separate concern)
- End-to-end UI testing
- Performance benchmarking (unless reliability-related)
- Production deployment testing

### Verification Needed

- [ ] Determine best approach for API interception (mitmproxy vs other tools)
- [ ] Confirm we can access Claude Code's internal request/response cycle

## What

Create a comprehensive test suite that validates Claude Code's core features (CLAUDE.md, skills, rules, hooks, compaction) and captures patterns about how they work. The most critical component is comparing what we write in files vs what actually gets sent to the API, and analyzing the request/response back-and-forth to understand feature reliability and behavior patterns.

## Why

We need deep understanding of Claude Code's features to:
1. Validate reliability and consistency of each feature
2. Document actual behavior patterns vs expected behavior
3. Understand how our knowledge hook interacts with Claude Code's systems
4. Build confidence in feature usage for future development
5. Create reference documentation for team understanding

## Acceptance Criteria

- [ ] Tests exist for CLAUDE.md instruction loading and application
- [ ] Tests exist for skills activation and execution patterns
- [ ] Tests exist for rules system enforcement
- [ ] Tests exist for hooks lifecycle (all events, timing, data format)
- [ ] Tests exist for context compaction behavior and triggers
- [ ] API interception setup captures request/response for comparison
- [ ] Test results document patterns and reliability findings
- [ ] Knowledge hook behavior is validated and documented
- [ ] Test suite is executable and repeatable
- [ ] Documentation explains how to run and interpret tests

## Notes

**Critical Constraint**: API interception must not interfere with actual Claude Code operation - we need passive observation, not modification.

**Hook Integration**: Our knowledge hook (`.claude/knowledge/hooks/knowledge-prompt.mjs`) must be considered in testing as it modifies the request before sending.
