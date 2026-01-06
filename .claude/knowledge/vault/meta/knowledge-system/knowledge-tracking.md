---
tags:
  - ai-infrastructure
  - knowledge-system
  - tracking
  - metrics
description: JSONL files tracking knowledge loads and search performance.
category: meta/knowledge-system
required_knowledge: []
---
# Tracker & Metrics Format

JSONL files tracking knowledge loads and search performance.

## Tracking Files

`.claude/knowledge/tracker/knowledge-tracking.jsonl` - Per-prompt tracking (search + lifecycle + usage)
`.claude/knowledge/tracker/knowledge-session-state.jsonl` - Session state (first/subsequent prompts)
`.claude/knowledge/tracker/knowledge-hook-metrics.jsonl` - Hook metrics and token savings
`.claude/knowledge/tracker/knowledge-reads-auto.jsonl` - Auto-tracked Read tool calls for knowledge files
`.claude/knowledge/tracker/session-state.json` - Persistent session state (loaded_packages)
`.claude/knowledge/tracker/session-id.txt` - Session ID

**Lifecycle**:
- `.jsonl` files cleared by `session-start-cleanup.mjs` on SessionStart
- `session-state.json` persists across sessions (synced from knowledge-reads-auto.jsonl before cleanup)

## knowledge-tracking.jsonl Format

One entry per prompt/agent invocation tracking search → selection → usage:

```json
{
  "timestamp": "2025-12-09T16:31:19.116Z",
  "agent_id": "prompt-1765297879",
  "agent_name": "user",
  "tags": ["testing", "flaky-tests"],
  "knowledge": {
    "considered": ["testing-flaky", "testing-core", "testing-async"],
    "read": ["testing-flaky", "testing-core"]
  },
  "usage": {
    "used": ["testing-flaky", "testing-core"],
    "precision": 1.0
  }
}
```

**Key fields**: `agent_id` (primary key), `tags`, `knowledge.{considered,read}`, `usage.{used,precision}`

**Lifecycle**: Search creates → Selection updates → Usage analyzes

## Analysis Queries

```bash
# View recent entries
tail -10 .claude/knowledge/tracker/knowledge-tracking.jsonl | jq .

# Find by agent_id
jq 'select(.agent_id == "prompt-123")' .claude/knowledge/tracker/knowledge-tracking.jsonl

# Calculate average precision
jq -r '.usage.precision // 0' .claude/knowledge/tracker/knowledge-tracking.jsonl | \
  awk '{ total += $1; count++ } END { print "Avg:", total/count }'

# Most loaded packages
jq -r '.knowledge.read[]?' .claude/knowledge/tracker/knowledge-tracking.jsonl | sort | uniq -c | sort -rn | head -20
```

## knowledge-session-state.jsonl Format

Tracks first vs subsequent prompts (90% token savings):

```json
{"categoriesShown": true, "timestamp": "2025-12-09T16:31:07.808Z", "loadedPackages": ["testing-flaky"]}
```

**How it works**: Empty file → full categories. Has entry → abbreviated reminder. Read last line for state.

## knowledge-hook-metrics.jsonl Format

Tracks hook execution, token savings, and errors:

**Event types**:
- `hook_execution`: Hook ran (isFirstPrompt, outputType, estimatedTokens, executionTimeMs)
- `session`: Session lifecycle (session_start, session_reset)
- `token_savings`: Savings calc (actualTokens, savedTokens, savingsPercent)
- `error`: Hook errors (errorType, errorMessage, stack)

Use for debugging hook behavior and analyzing token savings.

## session-id.txt Format

Plain text session ID (`session-{16-char-hex}`) created on SessionStart, used to link events across files.

## Auto-Sync Script

**File:** `.claude/knowledge/scripts/sync-session-state.mjs`

Bridges the gap between `knowledge-reads-auto.jsonl` (automatic Read tracking) and `session-state.json` (persistent session state).

**Usage:**
```bash
# Sync all auto-tracked reads to session state
node .claude/knowledge/scripts/sync-session-state.mjs

# Dry run (see what would be synced)
node .claude/knowledge/scripts/sync-session-state.mjs --dry-run
```

**Automatic integration:** Called by `session-start-cleanup.mjs` on SessionStart to preserve knowledge across sessions.

**Manual use cases:**
- Sync mid-session if needed
- Verify what packages were auto-tracked
- Troubleshoot session state issues
