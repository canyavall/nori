---
tags:
  - kv-knowledge
  - kv-create-knowledge
  - kv-frontmatter
  - kv-knowledge-authoring
  - knowledge-guide
  - knowledge-package
  - vault-authoring
  - write-knowledge
description: >-
  How to create, write, and structure knowledge guides and packages for the KV
  vault system. Covers frontmatter, tags, rules, dependencies, and file layout.
  MUST be loaded when user asks to create, write, or draft any knowledge guide.
required_knowledge: []
---
# Knowledge Creation

Rules for creating knowledge files in the KV system.

## What is Frontmatter?

**Frontmatter** is structured metadata written in YAML format at the very top of a markdown file, enclosed between `---` delimiters.

**Example:**
```markdown
---
tags: ["testing", "jest"]
description: Core testing patterns
required_knowledge: []
rules:
  - "**/*.spec.tsx"
  - "**/*.test.tsx"
---

# Testing Guide

Your content starts here...
```

**How it works:**
1. The frontmatter section starts with `---` on line 1
2. Contains YAML key-value pairs (metadata)
3. Ends with `---` (closes the frontmatter block)
4. Everything after the closing `---` is regular markdown content

**Why we use it:**
- Stores structured metadata about the knowledge package
- Automatically parsed by `knowledge-index-build.mjs` to generate `knowledge.json`
- Enables search, filtering, and automatic loading by tags/rules
- Keeps metadata separate from content (clean separation of concerns)

**Common in:**
- Jekyll blogs
- Hugo static sites
- Gatsby sites
- Our knowledge vault system

## File Location

```
.claude/kv/vault/[category]/[subcategory]/[package-name].md
```

Examples:
- `frontend/testing/testing-msw-setup.md`
- `frontend/state-management/sygnum-query/sygnum-query-mutations.md`
- `meta/knowledge-system/create-knowledge.md`

## File Structure

Every knowledge file MUST have YAML frontmatter:

```markdown
---
tags:
  - tag1
  - tag2
  - tag3
description: Brief description (1-2 sentences)
required_knowledge: []
rules:
  - "libs/my-library/**"
---

# Title

Content here (≤2500 tokens)
```

## Frontmatter Fields

**Required**:
- `tags`: 3-6 domain-specific tags (see Tag Rules)
- `description`: 1-2 sentence summary
- `required_knowledge`: Packages that MUST be read first (use `[]` if none)
- `rules`: Array of glob patterns for path-based loading (folder paths + file patterns)

**Optional**:
- `optional_knowledge`: Related but not required packages

## Tag Rules

**CRITICAL**: Tags must be domain-specific, NEVER generic.

❌ **Blocked**: `documentation`, `setup`, `implementation`, `testing`, `create`, `update`

✅ **Correct**:
- `component-documentation`, `api-documentation`
- `async-testing`, `integration-testing`
- `api-implementation`, `routing-implementation`

**Rule**: Always qualify with domain. Ask "Testing WHAT?" "Documentation of WHAT?"

## Dependencies

**Rule**: Ask "Would this file make sense without reading X first?"
- If NO → add X to `required_knowledge`
- If YES → don't add dependency

## Rules (Path-Based Loading)

**Purpose**: Rules provide mandatory loading based on file paths using glob patterns.

### When to Use Rules

Use `rules` when knowledge is **location-specific**:

✅ **Use rules for:**
- Directory-specific knowledge: `["**/auth/**/*.ts"]`
- Filename patterns: `["**/*formConfig.tsx"]`
- Global patterns with exclusions: `["**/*.tsx | !**/*.test.tsx"]`

❌ **Don't use rules for:**
- Simple file types (use file pattern tags instead)
- General domain knowledge (use discovery tags only)

### Rules vs Tags Decision

**Question 1**: Is knowledge directory-specific?
- **YES** → Use rules: `["**/auth/**/*.ts", "**/authentication/**/*.ts"]`
- **NO** → Continue to Question 2

**Question 2**: Is knowledge for specific filename patterns?
- **YES** → Use rules: `["**/*formConfig.tsx", "**/Table*.tsx"]`
- **NO** → Continue to Question 3

**Question 3**: Is knowledge for file types only?
- **YES** → Use file pattern tags: `["test", "spec", "tsx"]`
- **NO** → Use discovery tags only

### Examples

**Library folder + pattern (Authentication):**
```yaml
---
tags: ["idp", "authentication", "session-management"]
description: Authentication patterns for Airlock IAM
required_knowledge: []
rules:
  - "libs/sygnum-idp-*/**"
  - "**/auth/**/*.ts"
  - "**/authentication/**/*.ts"
---
```

**Library folder + filename pattern (Forms):**
```yaml
---
tags: ["forms", "yoda-form", "validation", "form", "tsx"]
description: Yoda Form configuration patterns
required_knowledge: []
rules:
  - "libs/sygnum-stepper/**"
  - "**/*formConfig.tsx"
  - "**/forms/**/*.tsx"
---
```

**Global with exclusions (React conventions):**
```yaml
---
tags: ["conventions", "accessibility", "tsx", "jsx"]
description: React component conventions and best practices
rules:
  - "**/*.tsx | !**/*.test.tsx | !**/*.spec.tsx | !**/*.story.tsx"
---
```

**File types only (Testing - NO rules needed):**
```yaml
---
tags: ["testing", "jest", "test", "spec", "tsx", "ts"]
description: Core testing patterns with Jest
rules: []
---
```

### Glob Pattern Syntax

- `*` = Any characters except `/`
- `**` = Any characters including `/` (recursive)
- `!` = Exclusion (use pipe: `pattern | !exclude`)

**Common patterns:**
```yaml
rules:
  - "**/auth/**/*.ts"              # Auth directories
  - "**/*formConfig.tsx"           # Files ending with formConfig.tsx
  - "**/Table*.tsx"                # Files starting with Table
  - "**/*.tsx | !**/*.test.tsx"    # All TSX except tests
```

### Complete Example

```markdown
---
tags:
  - i18n
  - internationalization
  - validation
  - react-i18next
description: Internationalized validation messages in Yoda Form
required_knowledge: []
rules:
  - "**/i18n/**/*.ts"
  - "**/i18n/**/*.tsx"
---

# i18n Validation Patterns

[Content here...]
```

### See Also

For comprehensive guidance on rules vs tags, see:
- `docs/flows/06-rule-based-loading.md` - Technical details
- `docs/flows/07-tags-and-rules-use-cases.md` - Complete decision framework with real-world examples

## Size Limit

≤2500 tokens. If larger, split into multiple files:
- `[topic]-basics.md` - Foundation
- `[topic]-advanced.md` - Advanced patterns
- `[topic]-troubleshooting.md` - Common issues

## knowledge.json

**Auto-generated** from frontmatter. DO NOT edit manually.

Build command:
```bash
node .claude/kv/features/knowledge/knowledge-index-build/knowledge-index-build.mjs
```

## Verification

```bash
# Rebuild index
node .claude/kv/features/knowledge/knowledge-index-build/knowledge-index-build.mjs

# Search finds it
node .claude/kv/triggers/api/search-knowledge.mjs --tags [tag]
```
