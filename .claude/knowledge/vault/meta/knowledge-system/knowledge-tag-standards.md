---
tags:
  - ai-infrastructure
  - knowledge-system
  - tags
  - metadata
  - standards
description: >-
  Standards for tagging knowledge packages to ensure precision and
  discoverability.
category: meta/knowledge-system
required_knowledge: []
---
# Knowledge Tag Standards

Rules for tagging knowledge packages to ensure precision, discoverability, and minimal token usage.

## Core Principle: Specificity Over Generality

Tags must be domain-specific, never generic single words.

❌ **Bad**: Generic tags
```json
["export", "ui", "components", "patterns", "api", "forms"]
```

✅ **Good**: Specific contextual tags
```json
["csv", "export", "sygnum-csv", "data-processing"]
```

## Tag Format: Domain + Feature + Type

**Pattern**: `{domain}-{feature}-{type}`

**Examples**:
- `sygnum-csv` (library)
- `react-router` (library)
- `testing` + `jest` (domain + tool)
- `routing` + `navigation` (domain + feature)
- `forms` + `validation` + `yoda-form` (domain + feature + library)

## Tag Categories

### 1. Library Tags
Library name is the primary tag:
```
sygnum-csv, sygnum-query, sygnum-table, yoda-form, chakra-ui
```

### 2. Domain Tags
Technical domain:
```
routing, testing, forms, api, state-management, authentication
```

### 3. Feature Tags
Specific feature within domain:
```
validation, caching, error-handling, navigation, pagination
```

### 4. Tool/Technology Tags
Specific tools:
```
jest, msw, react-router, valtio, d3, react-query
```

## Tag Quality Rules

1. **3-6 tags per package** (not 8+)
2. **No single-use tags** unless critical search term
3. **No package-name duplication** (filename already identifies it)
4. **Lowercase kebab-case** only
5. **No generic action words**: `documentation`, `implementation`, `setup` (standalone)

## Tag Checklist

Before adding a tag:
- [ ] **Context**: Does it include domain/library context?
- [ ] **Reusability**: Would other packages use this tag?
- [ ] **Specificity**: Would it match <10 packages?
- [ ] **Searchability**: Would users search for this?

## Examples

**Package**: `sygnum-csv-basics`
```json
{
  "tags": ["sygnum-csv", "csv", "export", "data-processing"]
}
```

**Package**: `testing-async-debugging`
```json
{
  "tags": ["testing", "jest", "async", "debugging", "race-conditions"]
}
```

**Package**: `react-router-loaders`
```json
{
  "tags": ["routing", "react-router", "data-loading", "loaders"]
}
```
