# Tracker & Metrics Format

JSONL files tracking knowledge loads and search performance.

## Location

- `.ai/knowledge/tracker/tracker.jsonl` - Individual knowledge loads
- `.ai/knowledge/tracker/metrics.jsonl` - Search metrics

## tracker.jsonl Format

**One line per knowledge package loaded**:

```json
{
  "category": "core",
  "file": "react-components.md",
  "agent_name": "implementation-agent",
  "agent_id": "impl-feco-1234-1733234567890",
  "timestamp": "12-03 09:39:39"
}
```

**Fields**:
- `category`: Knowledge category (core, quality, libraries, etc.)
- `file`: Knowledge filename only (no path)
- `agent_name`: Agent or user who loaded (e.g., "user", "implementation-agent")
- `agent_id`: Unique invocation ID (format: `{name}-{project}-{timestamp}`)
- `timestamp`: Date/time as MM-DD HH:mm:ss (no year, no milliseconds)

**Use cases**:
- Track most-used knowledge packages
- Debug: "Which knowledge did agent load?"
- Analyze: "What knowledge is used for test_fixing?"

**Linking**: Use `agent_id` to link tracker entries to their metrics entry

## metrics.jsonl Format

**One line per search**:

```json
{
  "timestamp": "12-03 09:39:39",
  "pack_returned": 18,
  "pack_tracked": 18,
  "tokens": 3933,
  "search_mode": "command-profile",
  "command_profile": "implementation",
  "tags": null,
  "categories": ["testing", "react"],
  "agent_name": "user",
  "agent_id": "prompt-1764754779000",
  "user_prompt": "Fix flaky tests"
}
```

**Fields**:
- `timestamp`: Date/time as MM-DD HH:mm:ss
- `pack_returned`: Number of packages in results (without dependencies)
- `pack_tracked`: Number of tracker.jsonl entries (includes dependencies)
- `tokens`: Estimated token count for all packages
- `search_mode`: "command-profile" or "manual"
- `command_profile`: Command profile name if used, null otherwise
- `tags`: Array of tags searched, null if none
- `categories`: Array of unique categories from loaded packages (e.g., ["ai/knowledge", "technical/react"])
- `agent_name`: Agent name for tracking
- `agent_id`: **LINKING KEY** - matches tracker.jsonl entries
- `user_prompt`: User task description, null if not provided

**Use cases**:
- Token usage monitoring: track token consumption per search
- Pattern analysis: which modes and categories most used
- Task correlation: link user prompts to knowledge loaded
- **Link to tracker**: Join with tracker.jsonl via agent_id

## Linking Metrics and Tracker

**Key**: Both files share `agent_id` as the linking key

**Relationship**:
- One metrics.jsonl entry → Multiple tracker.jsonl entries (one per package)
- `pack_tracked` field shows expected number of tracker entries

**Example linkage**:

metrics.jsonl:
```json
{"agent_id": "prompt-123", "pack_tracked": 3, "categories": ["testing", "react"], "user_prompt": "Fix flaky tests"}
```

tracker.jsonl (3 entries with same agent_id):
```json
{"agent_id": "prompt-123", "category": "testing", "file": "testing-core.md"}
{"agent_id": "prompt-123", "category": "testing", "file": "testing-flaky.md"}
{"agent_id": "prompt-123", "category": "react", "file": "react-hooks.md"}
```

## Analysis Queries

**Find all knowledge loaded for a specific search**:
```bash
AGENT_ID="prompt-123"
jq -r "select(.agent_id == \"$AGENT_ID\") | \"\(.category)/\(.file)\"" \
  .ai/knowledge/tracker/tracker.jsonl
```

**Get search context for specific knowledge loads**:
```bash
AGENT_ID="prompt-123"
jq "select(.agent_id == \"$AGENT_ID\")" .ai/knowledge/tracker/metrics.jsonl
```

**View what knowledge was loaded for test_fixing tasks**:
```bash
# 1. Get agent_ids for test_fixing
jq -r 'select(.task_type == "test_fixing") | .agent_id' \
  .ai/knowledge/tracker/metrics.jsonl > /tmp/test_fixing_ids.txt

# 2. Get tracker entries for those agent_ids
while read id; do
  jq -r "select(.agent_id == \"$id\") | \"\(.category)/\(.file)\"" \
    .ai/knowledge/tracker/tracker.jsonl
done < /tmp/test_fixing_ids.txt | sort | uniq -c | sort -rn
```

**Verify linking integrity** (packages_tracked should match tracker entries):
```bash
jq -r '.agent_id + " " + (.packages_tracked|tostring)' \
  .ai/knowledge/tracker/metrics.jsonl | \
while read id count; do
  actual=$(jq -r "select(.agent_id == \"$id\")" \
    .ai/knowledge/tracker/tracker.jsonl | wc -l)
  if [ "$actual" -ne "$count" ]; then
    echo "Mismatch: $id expects $count but has $actual"
  fi
done
```

**View recent loads**:
```bash
tail -10 .ai/knowledge/tracker/tracker.jsonl | jq -r '"\(.category)/\(.file)"'
```

**View by category**:
```bash
jq -r '.category' .ai/knowledge/tracker/tracker.jsonl | sort | uniq -c
```

**Analyze metrics**:
```bash
node .ai/knowledge/scripts/analyze-metrics.mjs
```

**Note on user_prompt**: Prompt is null when called manually, but populated when called by hooks (which pass `--prompt` parameter).
