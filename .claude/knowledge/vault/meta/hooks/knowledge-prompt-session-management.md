---
tags:
  - hooks
  - knowledge-loading
  - token-optimization
  - session-management
  - claude-code
description: Session-aware knowledge loading with token savings (85-93% reduction).
category: meta/hooks
required_knowledge: []
---
# Knowledge Prompt Session Management

How the knowledge-prompt hook tracks sessions for token optimization.

## How It Works

**First prompt in session:**
- Hook shows full category-tag map (~2k tokens)
- Creates state file marking categories as shown

**Subsequent prompts:**
- Hook detects existing state
- Shows abbreviated reminder (~100 tokens)
- 90%+ token savings

## Session State

**State file:** `.claude/knowledge/tracker/knowledge-session-state.jsonl`

**Format:**
```json
{"categoriesShown": true, "timestamp": "2025-12-09T16:31:07.808Z"}
```

**Detection:** Empty file = first prompt, has entry = subsequent prompts

## Token Economics

**Comparison (10 prompts):**
- Without: 10 × 2,000 = 20,000 tokens
- With: 2,000 + (9 × 100) = 2,900 tokens
- **Savings: 85%**

## Session Reset

**Auto-reset on SessionStart:**
- `session-start-cleanup.mjs` hook deletes state file
- Next prompt shows full categories

**Manual reset:**
```bash
rm .claude/knowledge/tracker/knowledge-session-state.jsonl
```

**When to reset:**
- New Claude Code session (automatic)
- Want to see full categories mid-session (manual)
- State file corrupted (automatic recovery)

## Troubleshooting

**Always abbreviated, never full:**
- State file persists → Delete manually
- SessionStart hook not configured → Add to settings.json

**Always full, never abbreviated:**
- State file being deleted → Check SessionStart hook
- File permissions issue → Check write access to tracker/

**Hook detects state incorrectly:**
- Corrupted JSON → Hook auto-recovers, deletes file
- Manual fix: Delete state file

## Design Rationale

**Session-aware:** First prompt = full discovery, subsequent = assumed knowledge → 85% token savings

**JSONL format:** Append-only, last line = state, history preserved

**No persistence:** Each session gets fresh start to avoid stale state

## Integration

**Hook order:**
```json
"UserPromptSubmit": [{
  "hooks": [
    {"command": "node .claude/knowledge/hooks/knowledge-prompt.mjs"},
    {"command": "node .claude/knowledge/hooks/personalities/[name].mjs"}
  ]
}]
```

**SessionStart cleanup:**
```json
"SessionStart": [{
  "hooks": [
    {"command": "node .claude/knowledge/hooks/session-start-cleanup.mjs"}
  ]
}]
```

## Monitoring

```bash
# Check current state
cat .claude/knowledge/tracker/knowledge-session-state.jsonl

# View token savings
jq 'select(.event == "token_savings")' .claude/knowledge/tracker/knowledge-hook-metrics.jsonl

# Monitor session events
tail -f .claude/knowledge/tracker/session-events.jsonl
```
