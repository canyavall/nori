# Claude Code Hooks System

**Category:** meta/hooks
**Tags:** ai-infrastructure, hooks, automation, knowledge-loading, meta, claude-code

Claude Code hooks automate knowledge loading and session management.

## Active Hooks

### Session Start Cleanup Hook
**File:** `session-start-cleanup.mjs`
**Hook:** `SessionStart`

Automatically cleans up log files at the start of each Claude Code session:
- `.claude/knowledge/tracker/tracker.jsonl` - Knowledge file tracking
- `.claude/knowledge/tracker/metrics.jsonl` - Knowledge loading metrics

### Knowledge Prompt Hook
**File:** `knowledge-prompt.mjs`
**Hook:** `UserPromptSubmit`

Ensures Claude analyzes prompts and loads relevant knowledge before implementation.

**How it works:**
1. User types prompt
2. Hook intercepts before prompt reaches Claude
3. **First prompt**: Hook injects full category-tag map (~2k tokens)
4. **Subsequent prompts**: Hook injects abbreviated reminder (~100 tokens)
5. Claude analyzes prompt and loads relevant knowledge using knowledge-search.mjs
6. Claude executes request using loaded patterns

**Session tracking:** Uses `.claude/knowledge/tracker/knowledge-session-state.jsonl` to detect first vs subsequent prompts (90% token savings)

## Hook Configuration

Located in `.claude/settings.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "node .claude/knowledge/hooks/knowledge-prompt.mjs",
        "statusMessage": "Preparing knowledge context..."
      }]
    }]
  }
}
```

## Design Philosophy

**Session-aware knowledge loading:**
- First prompt shows full categories (comprehensive discovery)
- Subsequent prompts show brief reminder (token efficiency)
- Session state tracked in JSONL file
- Massive token savings (85-93% over session lifetime)

## Knowledge Loading Behavior

**Default:** Load knowledge for most tasks

**Skips loading only for:**
- Trivial factual questions
- Pure file search
- Conversational messages
- Git history queries

## Files

**Hooks:** `.claude/knowledge/hooks/`
- `knowledge-prompt.mjs` - UserPromptSubmit hook
- `session-start-cleanup.mjs` - SessionStart hook

**Tracking:** `.claude/knowledge/tracker/`
- `knowledge-tracking.jsonl` - Knowledge loading tracking (considered/skipped/read packages)
- `knowledge-session-state.jsonl` - Session state for token optimization
