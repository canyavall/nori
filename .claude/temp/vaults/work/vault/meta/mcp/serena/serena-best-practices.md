# Serena MCP Best Practices

Token-efficient code exploration patterns with Serena MCP server.

## Core Principle

**Read only what you need, when you need it.** Serena saves 70-95% tokens by using semantic indexing instead of reading entire files.

## Setup Requirements

**One-time setup per project:**
1. Install: `claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant --project $(pwd)`
2. Run onboarding: Ask Claude to "start Serena onboarding"
3. Index project: `uvx --from git+https://github.com/oraios/serena serena project index`

**Onboarding creates:** `.serena/memories/*.md` files, `.serena/cache/*.pkl` index, `.serena/project.yml` config

## Memory File Management

**Memory files** (`.serena/memories/`) help Serena understand project context.

**Review accuracy:** Onboarding may create incomplete/inaccurate memories. Review and fix:
- `codebase_structure.md` - Architecture overview
- `project_overview.md` - Tech stack, patterns
- `development_guidelines.md` - Conventions

**Re-index after major changes:** `uvx --from git+https://github.com/oraios/serena serena project index`

## Tool Usage Hierarchy

**Use Serena for code exploration in `/apps/` and `/libs/`:**
1. `get_symbols_overview` - File overview (300-500 tokens vs 2-5k full read)
2. `find_symbol` - Specific symbol (100-200 tokens vs full file)
3. `search_for_pattern` - Find code patterns
4. `find_referencing_symbols` - Track usage

**Token savings:**
- Overview: 90% reduction (500 vs 5,000 tokens)
- Symbol read: 95% reduction (200 vs 5,000 tokens)

## When NOT to Use Serena

**Use Read tool instead for:**
- Non-code files (.md, .json, .txt, configs)
- Files you're about to Edit/Write
- Small files (<100 lines)

## Monitoring

Serena dashboard (auto-opens in browser) tracks:
- Token usage savings
- Tool call patterns
- Index health

## Best Practice Workflow

```typescript
// ❌ WRONG - Read entire file
Read: apps/trading/src/components/OrderForm.tsx

// ✅ CORRECT - Get overview first
mcp__serena__get_symbols_overview({ relative_path: "apps/trading/src/components/OrderForm.tsx" })

// Then read only needed symbols
mcp__serena__find_symbol({
  name_path: "OrderForm/handleSubmit",
  relative_path: "apps/trading/src/components/OrderForm.tsx",
  include_body: true
})
```
