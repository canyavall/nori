# Session Management Knowledge TODO

Based on OpenCode session architecture, consider creating:

## Context Management
- [ ] Context compaction triggers (90% threshold pattern)
- [ ] Summary generation (5-section structured format from Anthropic SDK)
- [ ] Token tracking and estimation
- [ ] wU2 compactor algorithm (if discovered through testing)

## Session State
- [ ] Session data structure (messages, context, metadata)
- [ ] Session persistence (JSON with ULID-based IDs)
- [ ] Session export/import patterns
- [ ] Session recovery and restoration

## Message Processing
- [ ] Message pipeline (processor.ts flow)
- [ ] System prompt construction (system.ts patterns)
- [ ] Tool execution within session context
- [ ] Streaming response handling

## CLAUDE.md Integration
- [ ] Active CLAUDE.md updates (planned feature from MASTER-ROADMAP.md)
- [ ] Project-specific guidance injection
- [ ] Context migration strategies

## Checkpoint System
- [ ] Git-based snapshot patterns (OpenCode)
- [ ] Conversation + files retention (Claude Code pattern)
- [ ] 30-day retention strategy
- [ ] Checkpoint restoration

## Performance Optimization
- [ ] Context window optimization
- [ ] Summary quality vs speed trade-offs
- [ ] Lazy loading strategies
- [ ] Memory management

## Reference Files
- `base_repositories/opencode-fork/packages/opencode/src/session/index.ts`
- `base_repositories/opencode-fork/packages/opencode/src/session/processor.ts`
- `base_repositories/opencode-fork/packages/opencode/src/session/compaction.ts`
- `base_repositories/opencode-fork/packages/opencode/src/session/summary.ts`
- `context-management-comparison.md` (40+ pages)

## To create knowledge:
```bash
/knowledge-create patterns/session-management <topic-name>
```

Example:
```bash
/knowledge-create patterns/session-management context-compaction-strategies
```
