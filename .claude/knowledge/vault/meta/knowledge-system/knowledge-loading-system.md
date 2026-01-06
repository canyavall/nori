---
tags:
  - knowledge-system
  - knowledge-loading
  - tags
  - search
  - agents
description: How agents load knowledge using knowledge-search.mjs and task-type tags.
category: meta/knowledge-system
required_knowledge: []
---
# Knowledge Loading System

How agents and workflows load knowledge using knowledge-search.mjs and tags.

## Loading Strategy

**Tag-based discovery**: Load domain knowledge by tags (routing, testing, forms, etc.)

## Usage

**Basic tag search:**
```bash
node .ai/knowledge/scripts/knowledge-search.mjs \
  --tags routing,react-router \
  --agent-name user \
  --agent-id "prompt-123"
```

**With multiple tags:**
```bash
node .ai/knowledge/scripts/knowledge-search.mjs \
  --tags testing,jest,rtl \
  --agent-name user \
  --agent-id "user-123"
```

Returns JSON with packages to read.

## Configuration (knowledge.json)

**Knowledge package:**
```json
"react-router-v7-basics": {
  "tags": ["routing", "react-router"]
}
```

## Loading Workflows

### 1. Tag-Based Discovery (Recommended)

```bash
# Search by tags
node .claude/knowledge/scripts/knowledge-search.mjs \
  --tags testing,jest,rtl \
  --agent-name user \
  --agent-id "user-123"

# Returns JSON with matching packages
# Agent reads files manually
# Session state auto-synced on SessionStart (no manual tracking needed)
```

**Note:** Manual `session-manager.mjs add` is no longer required. Read tracking happens automatically via `knowledge-reads-auto.jsonl` and syncs to `session-state.json` on SessionStart.

### 2. Direct Package Loading (Automated)

```bash
# Load specific packages with automatic session tracking
node .claude/knowledge/scripts/knowledge-load.mjs \
  --packages testing-core,testing-flaky,react-router-basics
```

**Benefits:**
- Filters already-loaded packages (no duplicates)
- Resolves paths from knowledge.json
- Outputs paths for Claude to read
- Automatically tracks loaded packages in session state

**Output:**
```json
{
  "status": "success",
  "loaded": 2,
  "already_loaded": 1,
  "paths": [
    {
      "name": "testing-core",
      "path": "/path/to/testing-core.md",
      "category": "frontend/testing"
    }
  ]
}
```

## Flow

**Tag-based discovery:**
1. Agent calls knowledge-search.mjs with tags
2. Script searches packages by tags
3. Returns matching packages (up to 15 by default)
4. Agent reads each file (auto-tracked in knowledge-reads-auto.jsonl)
5. On next SessionStart: sync-session-state.mjs syncs to session-state.json

**Direct loading:**
1. Agent calls knowledge-load.mjs with package names
2. Script filters already-loaded packages
3. Script resolves paths and outputs JSON
4. Agent reads files from paths
5. Script automatically tracks loaded packages in session-state.json

**Auto-sync (on SessionStart):**
1. sync-session-state.mjs reads knowledge-reads-auto.jsonl
2. Extracts unique package names
3. Calls session-manager.mjs add to update session-state.json
4. Tracking files cleared (session-state.json persists)

## Best Practices

**Be liberal:** Load ALL packages with relevance_score >= 0.3
- Range: 8-15 packages (complex), 4-8 packages (simple)
- Better to load extra knowledge than miss critical context
- Reading is cheap (~2-3k tokens), missing patterns is expensive

## Domain and Language Filtering

### Domain Filtering
- **Wrong domain = score 0** (hard reject)
- Frontend/Backend/Infrastructure: NEVER load cross-domain packages
- Cross-cutting (standards/tooling): Allowed all domains, lower priority (0.7x)

### Language Filtering
- Detects from extension: `.ts`→typescript, `.java`→java, `.py`→python
- Rejects language-specific standards for wrong language
- Generic standards (testing, mocks) apply to all
- Supported: TypeScript, JavaScript, Java, Python, Go, Terraform, Rust, C#

### Example Filtering

**Frontend TS** (`Button.tsx`): Loads frontend/react, standards/testing. Rejects backend, infrastructure.
**Backend Java** (`UserService.java`): Loads backend/spring, standards/java. Rejects frontend, infra.
**No file path**: Prefers standards/tooling (0.8x), allows domain-specific (0.5x), no language filter.
