# Knowledge Loading Guide

**Version**: 5.0 (2025-12-05)
**For**: All agents
**When**: Always at agent start

---

## When to Load

**ALWAYS load knowledge at agent start.**

Agents:
- `plan-agent` - Creating requirements.md, research.md, tech-design.md, plan.md
- `implementation-agent` - Writing code

---

## How to Load (3 Steps)

### Step 1: Discover Available Tags

Run the discovery command to see ALL available tags:

```bash
node .ai/knowledge/scripts/knowledge-search.mjs --list-tags
```

This returns the complete list of tags from knowledge.json. Use this output to select relevant tags.

### Step 2: Select 2-4 Relevant Tags

From the list, choose 2-4 tags that match what you're working on:
- Be specific (e.g., `routing,permissions` not just `routing`)
- Include integration points (e.g., routes + permissions)
- Limit to 2-4 tags (more = noise, less precision)

**Selection criteria**: Choose tags based on WHAT you're working with, not HOW.

### Step 3: Load Knowledge

Run the load command with your selected tags:

```bash
agent_id="[command-name]-[ticket-id]-$(date +%s)"

node .ai/knowledge/scripts/knowledge-search.mjs \
  --command-profile [profile-name] \
  --tags [tag1,tag2,tag3] \
  --agent-name [command-name] \
  --agent-id "$agent_id" \
  --prompt "[user-task-description]"
```

**Example**:
```bash
agent_id="plan-feco-1234-$(date +%s)"

node .ai/knowledge/scripts/knowledge-search.mjs \
  --command-profile plan \
  --tags routing,permissions,monorepo \
  --agent-name plan-command \
  --agent-id "$agent_id" \
  --prompt "Add permissions check to routing module"
```

The command returns JSON with matching packages. Read the top 3-5 most relevant packages.

**Tracking**: The `--prompt` parameter is optional but recommended - it helps track what knowledge was used for which tasks.

---

## How Command Profiles Work

Command profiles automatically load core knowledge + optional tag search:

1. **`always_load`**: Core packages loaded every time
   - `plan`: `nx-commands`, `typescript-types`, `react-components`, `testing-core`, `code-conventions`
   - `implementation`: `typescript-types`, `react-components`, `react-patterns`, `testing-core`, `code-conventions`

2. **`--tags` parameter** (optional): Add tag-based search to always_load packages

Result: Command loads core packages + searches with your tags (if provided).

---

## If Search Returns 0 Results

1. **Use fewer tags**: Try 1-2 tags instead of 4-5
2. **Broaden tags**: Use more general tags
3. **Remove --text filter**: Text is AND-ed with tags (very restrictive)
4. **Check available tags**: Re-run `--list-tags`

---

## Discovery Commands

```bash
# List all available tags (use this!)
node .ai/knowledge/scripts/knowledge-search.mjs --list-tags

# List all categories
node .ai/knowledge/scripts/knowledge-search.mjs --list-categories

# Show help
node .ai/knowledge/scripts/knowledge-search.mjs --help
```

---

## Notes

- **Tracking**: All loads logged to `.ai/knowledge/tracker/tracker.jsonl` and `.ai/knowledge/tracker/metrics.jsonl`
- **Metrics**: Tracks packages loaded, categories, token count, and user prompts
- **Dependencies**: Loaded automatically (1-level depth)
- **Token efficiency**: Loading 3-5 packages typically uses 2-5k tokens
- **Always use API**: Discover tags with `--list-tags`, don't guess

---

**That's it. Discover → Select → Load.**
