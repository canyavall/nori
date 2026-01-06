---
tags:
  - knowledge-system
  - frontmatter
  - yaml
  - automation
  - caching
description: Frontmatter-based knowledge metadata system with automatic knowledge.json generation and mtime-based caching.
category: meta/knowledge-system
required_knowledge: []
---

# Knowledge Frontmatter System

Auto-generated knowledge.json from YAML frontmatter with mtime-based caching for portability and performance.

## Architecture

```
.md files (YAML frontmatter)  →  build-knowledge-index.mjs  →  knowledge.json (cache)
         ↓                                  ↓
   Source of truth              mtime+size fingerprinting
```

## Frontmatter Format

**Required fields**:
- `tags`: Array of 3-12 tags
- `description`: Brief description (1-2 sentences)
- `category`: Category path (e.g., "frontend/routing")

**Optional fields**:
- `required_knowledge`: Array of package names
- `optional_knowledge`: Array of package names

**Example**:
```yaml
---
tags:
  - routing
  - react-router
  - navigation
description: React Router v7 basics and routing patterns
category: frontend/routing
required_knowledge: []
---

# Content here...
```

## Build System

**Script**: `.claude/knowledge/scripts/build-knowledge-index.mjs`

**Features**:
- Scans all `.claude/knowledge/vault/**/*.md` files
- Parses YAML frontmatter using custom zero-dependency parser
- Uses mtime+size fingerprinting for cache validation
- Skips files without frontmatter OR incomplete frontmatter (missing required fields)
- Stores relative paths for submodule portability
- Generates knowledge.json matching current structure

**Performance** (339 files, as of 2025-12-30):
- Cold build: ~3200ms
- Warm build (100% cached): ~3000ms (dominated by stat calls, not parsing)
- Cache hit rate: 99%+ typical
- Note: Performance is I/O-bound (339 stat calls), not CPU-bound

**CLI flags**:
- `--force-rebuild`: Clear cache and rebuild all files

## Frontmatter Parser

**Implementation**: `.claude/knowledge/scripts/lib/frontmatter.mjs`

**Zero dependencies**: Custom YAML parser (no external libraries)
- Submodule-portable (works across repos without npm install)
- Handles patterns used in knowledge vault:
  - Dash arrays: `tags:\n  - item`
  - Folded strings: `description: >-\n  text`
  - Bracket arrays: `required_knowledge: []`
  - Simple values: `category: apps`

**Limitations**:
- Only supports subset of YAML needed for frontmatter
- No nested objects, no advanced YAML features
- Sufficient for knowledge vault requirements

## Caching

**Cache file**: `.claude/knowledge/.cache/parsed-metadata.json`

**Fingerprinting**:
```javascript
fingerprint = `${stat.mtimeMs}-${stat.size}`
```

**Invalidation**:
- File modified → Fingerprint changes → Rebuild
- File deleted → Next build skips it
- Manual: `--force-rebuild` flag

**Cache hit rate**: 99%+ for typical workflows

## SessionStart Integration

**Hook**: `.claude/knowledge/hooks/session-start-cleanup.mjs`

**What happens**:
1. Session starts
2. Hook syncs session state (preserves loaded packages across sessions)
3. Hook clears tracking files (knowledge-reads-auto.jsonl)
4. Hook runs `build-knowledge-index.mjs`
5. knowledge.json auto-generated (~3s typical)
6. Session ready

**Total overhead**: ~3-4s (I/O-bound, acceptable for SessionStart)
**Error handling**: Build errors logged but don't fail session start

## Migration

**One-time migration** from centralized knowledge.json:

```bash
# Backup original
cp .claude/knowledge/knowledge.json .claude/knowledge/knowledge.json.backup

# Migrate to frontmatter
node .claude/knowledge/scripts/migrate-to-frontmatter.mjs

# Build from frontmatter
node .claude/knowledge/scripts/build-knowledge-index.mjs

# Compare generated vs original
jq '.knowledge' knowledge.json.backup > /tmp/original.json
jq '.knowledge' knowledge.json > /tmp/generated.json
diff /tmp/original.json /tmp/generated.json
```

## Validation

**Script**: `.claude/knowledge/scripts/validate-frontmatter.mjs`

**Checks**:
- Required fields present (tags, description, category)
- Tags array has 3-12 items
- Description non-empty string
- Dependencies valid arrays

**Usage**:
```bash
node .claude/knowledge/scripts/validate-frontmatter.mjs
```

## Creating New Knowledge

**Template**:
```yaml
---
tags: [domain, feature, tool]
description: "Brief description here"
category: frontend/your-category
required_knowledge: []
---

# Your Package Name

Content here...
```

**Steps**:
1. Create .md file in appropriate category
2. Add YAML frontmatter
3. Write content
4. Run validation (optional)
5. SessionStart auto-generates knowledge.json

**No manual knowledge.json editing required!**

## Benefits

**Portability**:
- Copy .md files between repos
- No JSON synchronization needed
- Metadata travels with content

**Maintainability**:
- Single source of truth per file
- Git blame shows metadata changes
- Easier to review in PRs

**Performance**:
- mtime caching = 95%+ hit rate
- Sub-50ms builds typical
- No session start impact

**Developer Experience**:
- Auto-generated knowledge.json
- No manual JSON editing
- Validation catches errors early

## Troubleshooting

**Build fails on SessionStart**:
```bash
# Run manually to see errors
node .claude/knowledge/scripts/build-knowledge-index.mjs
```

**Slow build**:
```bash
# Check cache hit rate (should be >90%)
# Slowest files shown in output
node .claude/knowledge/scripts/build-knowledge-index.mjs
```

**Cache corruption**:
```bash
# Force rebuild clears cache
node .claude/knowledge/scripts/build-knowledge-index.mjs --force-rebuild
```

**Invalid frontmatter**:
```bash
# Validate all files
node .claude/knowledge/scripts/validate-frontmatter.mjs
```

## Files

**Scripts**:
- `build-knowledge-index.mjs` - Build knowledge.json from frontmatter
- `migrate-to-frontmatter.mjs` - One-time migration tool
- `validate-frontmatter.mjs` - Frontmatter validation

**Generated**:
- `knowledge.json` - Auto-generated (gitignored)
- `.cache/parsed-metadata.json` - Build cache (gitignored)

**Source**:
- `vault/**/*.md` - Knowledge files with frontmatter

## Performance Monitoring

**Build output shows**:
- Total files scanned
- Indexed count (rebuilt + cached)
- Skipped count (no frontmatter)
- Total build time
- Average parse time per file
- Top 5 slowest files
- Performance status (✅ <1s, ⚠️ 1-20s, ❌ >20s)

**Example**:
```
📊 Knowledge Index Build Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total files:     338
Indexed:         337 (0 rebuilt, 337 cached)
Skipped:         1 (no frontmatter)
Total time:      16ms
Avg parse time:  0ms per file

✅ Performance: Acceptable (<1s)
```

## Migration History

**Before** (centralized):
- knowledge.json: Single source of truth
- Manual JSON editing
- Hard to share between repos

**After** (distributed):
- Frontmatter: Source of truth
- Auto-generated knowledge.json
- Easy portability

**Migrated**: 2025-12-29 (337 packages in 287ms)
