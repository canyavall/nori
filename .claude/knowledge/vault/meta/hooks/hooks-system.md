---
tags:
  - ai-infrastructure
  - hooks
  - automation
  - knowledge-loading
  - meta
  - claude-code
description: Claude Code hooks that automate knowledge loading and session management.
category: meta/hooks
required_knowledge: []
---
# Claude Code Hooks System

**Category:** meta/hooks
**Tags:** ai-infrastructure, hooks, automation, knowledge-loading, meta, claude-code

Claude Code hooks automate knowledge loading and session management.

## Active Hooks

### Session Start Cleanup Hook
**File:** `session-start-cleanup.mjs`
**Hook:** `SessionStart`

Automatically manages session state and tracking files at the start of each Claude Code session:

**Flow:**
1. Syncs `knowledge-reads-auto.jsonl` → `session-state.json` (preserves knowledge across sessions)
2. Cleans up tracking files from previous session:
   - `.claude/knowledge/tracker/knowledge-reads-auto.jsonl` - Auto-tracked knowledge reads
3. Builds knowledge.json from vault frontmatter (~3s, cached)

**Note:** `session-state.json` is NOT cleaned - it persists across sessions to avoid re-loading knowledge.

**Error handling:** Build errors are logged but don't fail session start (graceful degradation).

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
- `knowledge-reads-auto.jsonl` - Auto-tracked knowledge reads per session (cleaned on SessionStart)
- `session-state.json` - Current session loaded packages (persists across sessions)
- `hook-errors.jsonl` - Hook execution errors and diagnostics

**Lifecycle:** Only `knowledge-reads-auto.jsonl` is cleaned on SessionStart. `session-state.json` persists.
