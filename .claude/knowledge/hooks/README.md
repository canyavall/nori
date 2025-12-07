# Claude Code Hooks

This directory contains hooks that automate knowledge loading and session management.

## Active Hooks

### 🧹 Session Start Cleanup Hook

**File**: `session-start-cleanup.mjs`
**Hook**: `SessionStart`
**Purpose**: Cleans up log files at the start of each Claude Code session

Automatically clears:
- `.ai/knowledge/tracker/tracker.jsonl` - Knowledge file tracking
- `.ai/knowledge/tracker/metrics.jsonl` - Knowledge loading metrics

**Benefit**: Fresh logs for each session, making it easier to debug and analyze session-specific behavior.

---

### 📚 Knowledge Prompt Hook

**File**: `knowledge-prompt.mjs`
**Hook**: `UserPromptSubmit`
**Purpose**: Ensures Claude analyzes prompts and loads relevant knowledge before implementation

## How It Works

1. **User types prompt**: Any request
2. **Hook intercepts**: Before prompt reaches Claude
3. **Hook adds instructions**: Tells Claude to:
   - Read knowledge-loading-guide.md
   - Analyze the prompt
   - Determine if knowledge loading is needed
   - Load relevant knowledge if needed
4. **Claude decides**: Uses instructions to determine what to load (if anything)
5. **Claude executes**: Loads knowledge → Implements using correct patterns

## Design Philosophy

**Agent-based decision making** instead of hardcoded logic:
- ✅ No regex brittleness
- ✅ Context-aware decisions
- ✅ All intelligence in instructions file (`.ai/knowledge/instructions/knowledge-loading-guide.md`)
- ✅ Easy to update guidance without changing hook code

## Hook Configuration

Located in `.claude/settings.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "node .ai/knowledge/hooks/knowledge-prompt.mjs",
        "statusMessage": "Preparing knowledge context..."
      }]
    }]
  }
}
```

## What It Does

The hook adds this instruction to every prompt:

```
CRITICAL: Before responding to the request below, you MUST follow these steps:

STEP 1 - READ INSTRUCTIONS (MANDATORY):
Read the file: .ai/knowledge/instructions/knowledge-loading-guide.md

STEP 2 - ANALYZE & LOAD KNOWLEDGE:
Based on the instructions you just read:
1. Analyze the user's request
2. Determine if knowledge loading is needed
3. If needed, use knowledge-search.mjs following the instructions exactly
4. Load the top 2-4 knowledge packages from results

STEP 3 - EXECUTE REQUEST:
Now execute the user's request using the loaded knowledge.
```

## Intelligence Location

**All decision-making logic is in**:
`.ai/knowledge/instructions/knowledge-loading-guide.md`

This file contains:
- When to load knowledge (default: load for most tasks)
- What to load (task-type detection)
- How to use knowledge-search.mjs
- Examples for different scenarios

**To modify behavior**: Edit the instructions file, not the hook.

## Benefits

✅ **Simple hook code** - No complex logic, just adds instructions
✅ **Claude makes decisions** - Context-aware, intelligent choices
✅ **Easy to update** - Change instructions file, not code
✅ **Consistent behavior** - Claude follows documented guidelines
✅ **Prevents pattern drift** - Always uses documented patterns
✅ **Knowledge tracking** - All loads logged to tracker.jsonl

## Performance

**Default behavior**: Load knowledge for most tasks (err on side of loading)

**Skips loading only for**:
- Trivial factual questions ("What is X?")
- Pure file search ("List all .tsx files")
- Conversational messages ("Hi", "Thanks")
- Git history queries

**Token cost**: Varies by task (1,500-4,000 tokens for knowledge loading)

**Value**: Prevents pattern re-discovery + ensures consistency + better implementation quality

## Monitoring & Debugging

### Knowledge Tracker

**Location**: `.ai/knowledge/tracker/tracker.jsonl`

```bash
# View all knowledge loads in current session
cat .ai/knowledge/tracker/tracker.jsonl | jq

# Watch in real-time
tail -f .ai/knowledge/tracker/tracker.jsonl
```

Shows (JSONL format):
- Which knowledge files were loaded
- When they were loaded
- Agent name and ID
- Search parameters used

### Test Hook Manually

The hook expects JSON input via stdin:

```bash
# Test the hook
echo '{"prompt": "check if OrderDetailsDrawer.spec has flaky tests"}' | node .ai/knowledge/hooks/knowledge-prompt.mjs

# Should output the transformed prompt with instructions
```

## Files in This Directory

- ✅ `knowledge-prompt.mjs` - Active UserPromptSubmit hook
- ✅ `session-start-cleanup.mjs` - Active SessionStart hook
- ✅ `README.md` - This file

---

## Related Documentation

- **Instructions file**: `.ai/knowledge/instructions/knowledge-loading-guide.md`
- **Knowledge system**: `.ai/knowledge/ai/knowledge-loading/knowledge-loading-system.md`
- **Hook tracking**: `.ai/knowledge/ai/tracking/tracker-metrics-format.md`
