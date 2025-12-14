# Knowledge Search Basics

Core usage of knowledge-search.mjs for manual knowledge discovery and loading.

## Basic Usage

**Search by tags:**
```bash
node .claude/knowledge/scripts/knowledge-search.mjs --tags routing,react-router
```
Returns all packages matching ANY tags (OR logic).

**Search by category:**
```bash
node .claude/knowledge/scripts/knowledge-search.mjs \
  --tags testing,jest \
  --category frontend/testing/jest-rtl
```

**With tracking:**
```bash
node .claude/knowledge/scripts/knowledge-search.mjs \
  --tags auth,rbac \
  --agent-name user \
  --agent-id "prompt-$(date +%s)"
```

## Discovery Commands

**List all categories:**
```bash
node .claude/knowledge/scripts/knowledge-search.mjs --list-categories
```

**List all tags:**
```bash
node .claude/knowledge/scripts/knowledge-search.mjs --list-tags
```

**List tags by category:**
```bash
node .claude/knowledge/scripts/knowledge-search.mjs --list-categories | grep "frontend/testing"
```

## Command-Line Flags

**Required (pick one):**
- `--tags <tag1,tag2>` - Search by tags (OR logic)
- `--list-categories` - List categories with tags
- `--list-tags` - List available tags

**Optional:**
- `--category <category>` - Filter by category
- `--file-path <path>` - Auto-detect domain/language
- `--agent-name <name>` - Agent name for tracking
- `--agent-id <id>` - Unique ID for tracking
- `--limit <number>` - Max packages (default: 15)

**Tracking requires both:**
```bash
--agent-name user --agent-id "prompt-$(date +%s)"
```

## Output Format

```json
{
  "query": {"tags": ["routing"], "category": null, "filePath": null},
  "count": 7,
  "token_estimate": 12500,
  "detected_domain": "frontend",
  "detected_language": "typescript",
  "results": [{
    "name": "react-router-basics",
    "category": "frontend/routing",
    "relevance_score": 1.0,
    "tags": ["routing", "react-router"],
    "description": "React Router v7 basics",
    "knowledge_path": ".claude/knowledge/vault/frontend/routing/react-router-basics.md"
  }]
}
```
