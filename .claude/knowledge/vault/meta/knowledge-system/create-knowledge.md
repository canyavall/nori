---
tags:
  - ai-infrastructure
  - knowledge-system
  - meta
  - knowledge-creation
description: Rules for creating knowledge files in the AI infrastructure system.
category: meta/knowledge-system
required_knowledge: []
---
# Knowledge Creation

Rules for creating knowledge files in the AI infrastructure system.

## Critical Rule: Filename MUST Match Package Name

**The filename MUST exactly match the knowledge package name from knowledge.json**

```json
// In knowledge.json
"quality": {
  "mocks": { ... }  // ← Package name
}

// Filename MUST be:
.ai/knowledge/quality/mocks/mocks.md
                            ^^^^^
                            Package name repeated
```

## Location Pattern

```
.ai/knowledge/[category]/[knowledge-name]/[knowledge-name].md
```

Examples:
- Package: `typescript-types` → File: `.ai/knowledge/core/typescript/typescript-types.md`
- Package: `testing-msw-setup` → File: `.ai/knowledge/quality/testing/testing-msw-setup.md`
- Package: `research` → File: `.ai/knowledge/process/research/research.md`

## Wrong Patterns

❌ `SKILL.md` (generic name)
❌ `KNOWLEDGE.md` (generic name)
❌ `index.md` (generic name)
❌ `patterns.md` (doesn't match package name)

## File Rules

- **NO YAML frontmatter** (plain markdown only)
- **≤1500 tokens (~6000 characters)** (split if larger)
- **Lowercase kebab-case** names matching package
- **Code-first** approach with examples
- **Quality over tokens**: Prefer completeness for cohesive domains

## Creation Steps

1. Choose knowledge package name (e.g., `api-caching`)
2. Create file: `.ai/knowledge/[category]/[name]/[name].md`
3. Write content (≤1500 tokens, NO frontmatter)
4. Update knowledge.json with entry
5. Verify: `node .ai/knowledge/scripts/knowledge-search.mjs --tags [tag]`

## knowledge.json Entry

```json
"api-caching": {
  "tags": ["api", "caching", "performance"],
  "description": "API caching patterns...",
  "required_knowledge": [],
  "optional_knowledge": [],
  "knowledge_path": ".ai/knowledge/core/api/api-caching.md",
  "category": "core/api"
}
```

### Required Fields

- **tags**: 3-6 domain-specific tags (see Tag Rules below)
- **description**: 1-2 sentence summary of content
- **required_knowledge**: Packages that MUST be read first (see Dependencies Guide)
- **optional_knowledge**: Helpful but not required packages
- **knowledge_path**: Relative path to .md file
- **category**: Category matching directory structure

### Setting Dependencies (CRITICAL)

**Rule**: Ask "Would this file make sense without reading X first?"
- If NO → add X to `required_knowledge`
- If YES → don't add dependency

**See knowledge-dependencies-guide.md for complete guide on setting dependencies correctly.**

**Common cases:**
- Uses hooks from another package → requires that package
- Builds on patterns from another package → requires that package
- Foundation package (setup, basics) → `required_knowledge: []`

**Example:**
```json
"sygnum-query-mutations": {
  "required_knowledge": ["sygnum-query-setup"],  // Uses hooks from setup
  ...
}
```

## Tag Rules: NO Generic Tags

**CRITICAL**: Tags must be domain-specific, NEVER generic action words.

**❌ BLOCKED Generic Tags**:
- `documentation`, `cleanup`, `maintenance`, `update`, `modify`, `fix`, `create`, `implement`
- `setup`, `learn`, `use`, `understand`, `reference` (standalone)
- `test`, `debug`, `refactor`, `change` (standalone)

**Why blocked**: Too generic, match everything, useless for search.

**✅ Correct Patterns**:
- ❌ `documentation` → ✅ `component-documentation`, `storybook-documentation`, `api-documentation`
- ❌ `cleanup` → ✅ `state-cleanup`, `mock-cleanup`
- ❌ `implementation` → ✅ `api-implementation`, `routing-implementation`
- ❌ `testing` → ✅ `async-testing`, `integration-testing`, `flaky-tests`

**Rule**: Always qualify with domain/context. Ask "Documentation of WHAT?" "Testing WHAT aspect?"

**File-to-Domain Mapping**:
- Working on `knowledge.json` → tags: `knowledge-system`, `ai-infrastructure`, `meta`
- Working on routing → tags: `routing`, `react-router`, `navigation`
- Working on forms → tags: `forms`, `validation`, `yoda-form`
- Working on tests → tags: `testing`, `jest`, `msw`, `flaky-tests`

## Verification

```bash
# Search finds it
node .ai/knowledge/scripts/knowledge-search.mjs --tags api

# File exists at correct path
ls .ai/knowledge/[category]/[name]/[name].md
```
