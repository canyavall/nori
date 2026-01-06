---
tags:
  - knowledge-system
  - file-patterns
  - tags
  - extensions
  - suffixes
description: >-
  File pattern tags system: how extension and suffix tags enable file-type-aware
  knowledge loading
category: meta/knowledge-system
required_knowledge:
  - knowledge-tag-standards
---
# Knowledge File Pattern Tags

**Purpose**: File pattern tags improve knowledge loading accuracy from ~60% to ~80%.

File pattern tags are added to packages to indicate which file types they apply to.

## Tag Types

**Extensions**: `tsx`, `ts`, `jsx`, `js`, `mjs`, `cjs`
**Suffixes**: `spec`, `test`, `hook`, `hooks`, `stories`, `story`, `form`, `mock`, `mocks`, `style`, `styles`, `route`, `routes`, `context`, `provider`, `dto`, `types`, `enum`

**Example**:
```json
{
  "testing-core": {
    "tags": ["testing", "jest", "test", "spec", "tsx", "ts"]
  }
}
```

When creating `Button.test.tsx`, LLM searches `--tags testing,test,spec,tsx` and loads testing + component knowledge automatically.

## Implementation

**Tags in knowledge.json** are the single source of truth. Code in `knowledge-lib.mjs` builds file_patterns dynamically from tags.

**Code locations**:
- Constants: `knowledge-lib.mjs` lines 144-146 (EXTENSIONS, SUFFIXES)
- Build: `buildFilePatternsFromTags()` in `knowledge-lib.mjs`
- Match: `matchFilePatterns()` in `knowledge-lib.mjs`
- Validation: `validate-knowledge.mjs` (max 12 tags)

## Guidelines

### When to Add File Pattern Tags

✅ **Do add** file pattern tags to:
- File-type-specific packages
- Testing packages (`test`, `spec`, `tsx`, `ts`)
- Hook packages (`hook`, `ts`)
- Component packages (`tsx`, `jsx`)
- Form packages (`form`, `tsx`)
- Storybook packages (`stories`, `tsx`)

❌ **Don't add** file pattern tags to:
- Generic packages (code-conventions, import-export-patterns)
- Packages that apply to all file types
- Business/domain knowledge packages

### How Many File Pattern Tags?

**Recommended**: 2-4 file pattern tags per package

**Examples**:
```json
{
  "testing-core": {
    "tags": ["testing", "jest", "test", "spec", "tsx", "ts"]
    //                          ^^^^^^^^^^^^^^^^^^^^^^^^^^
    //                          4 file pattern tags
  },
  "yoda-form-basics": {
    "tags": ["forms", "yoda-form", "form", "tsx"]
    //                              ^^^^^^^^^^^
    //                              2 file pattern tags
  },
  "code-conventions": {
    "tags": ["conventions", "standards", "code-quality"]
    //      No file pattern tags - applies to all files
  }
}
```

### Tag Format

- **No dots**: Use `tsx` not `.tsx`
- **Lowercase**: Use `test` not `Test`
- **Simple**: Use `hook` or `hooks`, both work

---

## Usage

### For LLM

When creating files, include file pattern tags in search:

```bash
# Creating Button.test.tsx
node .claude/knowledge/scripts/knowledge-search.mjs \
  --tags testing,test,spec,tsx

# Creating useDebounce.hook.ts
node .claude/knowledge/scripts/knowledge-search.mjs \
  --tags react-hooks,hook,ts

# Creating Button.stories.tsx
node .claude/knowledge/scripts/knowledge-search.mjs \
  --tags storybook,stories,tsx
```

### Automatic via --file-path

```bash
# Automatically loads packages based on .test.tsx pattern
node .claude/knowledge/scripts/knowledge-search.mjs \
  --file-path "Button.test.tsx"
```

---

## Adding New File Patterns

To add a new file pattern (e.g., `.config`):

### Step 1: Add to Constants

Edit `.claude/knowledge/scripts/knowledge-lib.mjs`:

```javascript
export const SUFFIXES = [
  'spec', 'test', 'hook', 'hooks', 'stories', 'story',
  'form', 'mock', 'mocks', 'style', 'styles', 'route',
  'routes', 'context', 'provider', 'dto', 'types', 'enum',
  'config' // NEW
];
```

### Step 2: Add to Validation

Edit `.claude/knowledge/scripts/validate-knowledge.mjs`:

```javascript
const VALID_FILE_TAGS = new Set([
  // Extensions
  'tsx', 'ts', 'jsx', 'js', 'mjs', 'cjs',
  // Suffixes
  'spec', 'test', 'hook', 'hooks', 'stories', 'story', 'form',
  'mock', 'mocks', 'style', 'styles', 'route', 'routes',
  'context', 'provider', 'dto', 'types', 'enum',
  'config' // NEW
]);
```

### Step 3: Add Tag to Packages

Add `config` tag to relevant packages in `knowledge.json`:

```json
{
  "nx-project-conventions": {
    "tags": ["nx", "monorepo", "config"]
  }
}
```

### Step 4: Test

```bash
# Should load nx-project-conventions
node .claude/knowledge/scripts/knowledge-search.mjs \
  --file-path "nx.config.ts"
```

---

## Validation

The validation script checks:

1. **Max tags**: 12 per package (was 6)
2. **Valid file tags**: Must be in VALID_FILE_TAGS set
3. **Typo detection**: Warns if tag looks like file pattern but isn't valid

**Run validation**:
```bash
node .claude/knowledge/scripts/validate-knowledge.mjs
```

**Expected warnings** (if any):
```
⚠️  Tag "txs" looks like file pattern but not in VALID_FILE_TAGS - possible typo?
```

---

## Maintenance

### Single Source of Truth

**Tags in knowledge.json** are the ONLY source of truth for file patterns.

- ❌ No `file_patterns` section in knowledge.json (removed)
- ✅ Tags on packages build patterns dynamically
- ✅ Cannot diverge (one source)

### Adding Tags to Existing Packages

When you discover a package needs file pattern tags:

1. Identify which file types it applies to
2. Add appropriate tags to package in knowledge.json
3. Run validation to confirm
4. Test with knowledge-search

**Example**:
```bash
# Add tsx tag to component-implementation-patterns
jq '.knowledge."frontend/standards"."component-implementation-patterns".tags += ["tsx", "jsx"]' \
  .claude/knowledge/knowledge.json > tmp.json && mv tmp.json .claude/knowledge/knowledge.json
```

---

## Migration History

### Before (file_patterns in knowledge.json)

```json
{
  "file_patterns": {
    "extensions": {
      ".tsx": {
        "packages": ["component-architecture", "typescript-types", "react-patterns"]
      }
    },
    "suffixes": {
      ".test": {
        "packages": ["testing-core"]
      }
    }
  }
}
```

**Problems**:
- Package names didn't match actual packages (many were legacy names)
- Two sources of truth (file_patterns + tags)
- Maintenance burden (keeping them in sync)

### After (tags only)

```json
{
  "knowledge": {
    "frontend/testing": {
      "testing-core": {
        "tags": ["testing", "jest", "test", "spec", "tsx", "ts"]
      }
    }
  }
}
```

**Benefits**:
- Single source of truth (tags)
- Cannot diverge
- Easier to maintain
- More flexible (can add tags anytime)

## Examples

**Tests**: `testing-core` → tags: `["testing", "jest", "test", "spec", "tsx", "ts"]`
**Hooks**: `sidehooks-structure` → tags: `["hooks", "custom-hooks", "hook", "ts"]`
**Forms**: `yoda-form-basics` → tags: `["forms", "yoda-form", "form", "tsx"]`
**Stories**: `storybook-project-conventions` → tags: `["storybook", "stories", "tsx"]`

## Usage

Creating `Button.test.tsx`:
```bash
node .claude/knowledge/scripts/knowledge-search.mjs \
  --tags testing,test,spec,tsx
```

Or use `--file-path` for automatic pattern matching:
```bash
node .claude/knowledge/scripts/knowledge-search.mjs \
  --file-path "Button.test.tsx"
```
