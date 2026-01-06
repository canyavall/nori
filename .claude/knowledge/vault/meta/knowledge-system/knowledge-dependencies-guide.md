---
tags:
  - knowledge-system
  - dependencies
  - required-knowledge
  - validation
  - best-practices
description: >-
  Complete guide for setting required_knowledge dependencies when creating or
  splitting knowledge packages
category: meta/knowledge-system
required_knowledge:
  - create-knowledge
---
# Knowledge Dependencies Guide

Critical guide for setting `required_knowledge` when creating or splitting knowledge packages.

## When to Set Dependencies

### Rule: Ask "Would This Make Sense Without Reading X First?"

If the answer is NO, add X to `required_knowledge`.

**Examples:**

✅ **Needs dependency**:
- "sygnum-query-mutations" uses `useSygnumMutation` hook → requires "sygnum-query-setup"
- "react-router-loaders" explains loader patterns → requires "react-router-basics"
- "yoda-form-validation" shows validation hooks → requires "yoda-form-basics"

❌ **No dependency needed**:
- "typescript-types" and "react-patterns" → independent topics
- "testing-async" and "testing-mocks" → different test aspects
- "sygnum-table-basics" and "sygnum-charts-basics" → different libraries

## How to Determine Dependencies

### 1. Content Analysis Method

Read the file and ask:

**Does this file:**
- Use hooks/functions defined in another package? → Requires that package
- Build upon patterns from another package? → Requires that package
- Assume knowledge from another package? → Requires that package

**Example: Analyzing sygnum-query-optimization**

```md
# Content snippet:
useSygnumQuery({
  queryKey: ['data'],
  retry: (failureCount, error) => { ... }
})
```

**Analysis**: Uses `useSygnumQuery` → Requires "sygnum-query-setup" ✓

### 2. Prerequisites Check

List what reader needs to know BEFORE reading this file:

**sygnum-query-advanced** prerequisites:
- How to use `useSygnumQuery` (from setup)
- How mutations work (from mutations)
- Basic query patterns (from setup)

**Dependencies**: `["sygnum-query-setup", "sygnum-query-mutations"]` ✓

### 3. Hands-On Test

Try explaining the file to someone:
- If you find yourself saying "as we learned in X..." → X is a dependency
- If you need to explain concepts from X first → X is a dependency

## Dependency Patterns

### Foundation Pattern

One package is the foundation, others build on it:

```json
{
  "sygnum-query-setup": {
    "required_knowledge": []
  },
  "sygnum-query-mutations": {
    "required_knowledge": ["sygnum-query-setup"]
  },
  "sygnum-query-optimization": {
    "required_knowledge": ["sygnum-query-setup"]
  }
}
```

**When to use**: Library/tool with core concepts + advanced topics

### Chain Pattern

Sequential progression of concepts:

```json
{
  "react-basics": {
    "required_knowledge": []
  },
  "react-hooks": {
    "required_knowledge": ["react-basics"]
  },
  "react-custom-hooks": {
    "required_knowledge": ["react-hooks"]
  }
}
```

**When to use**: Learning progression, each builds on previous

### Multi-Foundation Pattern

Package needs multiple independent prerequisites:

```json
{
  "react-query-with-auth": {
    "required_knowledge": ["react-query-basics", "auth-patterns"]
  }
}
```

**When to use**: Integration topics combining multiple domains

## Common Mistakes

### ❌ Mistake 1: Missing Foundation Dependencies

**Wrong**:
```json
{
  "sygnum-query-websocket": {
    "required_knowledge": []
  }
}
```

**Why wrong**: Uses `useSygnumQuery` hooks from setup

**Correct**:
```json
{
  "sygnum-query-websocket": {
    "required_knowledge": ["sygnum-query-setup"]
  }
}
```

### ❌ Mistake 2: Wrong Dependency Chain

**Wrong**:
```json
{
  "sygnum-query-optimization": {
    "required_knowledge": ["sygnum-query-api-architecture"]
  }
}
```

**Why wrong**: Optimization applies to queries (needs setup), not file organization (architecture)

**Correct**:
```json
{
  "sygnum-query-optimization": {
    "required_knowledge": ["sygnum-query-setup"]
  }
}
```

### ❌ Mistake 3: Circular Dependencies

**Wrong**:
```json
{
  "package-a": {
    "required_knowledge": ["package-b"]
  },
  "package-b": {
    "required_knowledge": ["package-a"]
  }
}
```

**Fix**: Restructure - create common foundation or split into 3 packages

### ❌ Mistake 4: Over-specifying Dependencies

**Wrong**:
```json
{
  "advanced-topic": {
    "required_knowledge": ["basics", "intermediate", "setup", "config"]
  }
}
```

**Why wrong**: If "intermediate" requires "basics", don't list both

**Correct**:
```json
{
  "advanced-topic": {
    "required_knowledge": ["intermediate", "config"]
  }
}
```

**Rule**: Only list **direct** dependencies, not transitive ones

## Validation Checklist

Before finalizing dependencies, verify:

- [ ] Each dependency is actually used/referenced in the content
- [ ] No circular dependencies exist
- [ ] Foundation packages have no dependencies
- [ ] Advanced packages properly chain from basics
- [ ] No over-specification (transitive deps listed directly)
- [ ] File would NOT make sense without reading dependencies first

## When Splitting Files

**CRITICAL**: When splitting a file, reassess ALL dependencies

**Process:**
1. Read each new file's actual content
2. List what hooks/patterns it uses
3. Trace those back to source packages
4. Set dependencies based on actual usage

**Example: Split sygnum-query-patterns into 3 files**

Original dependencies: May not apply to split files!

New files analysis:
- **api-architecture**: Shows file organization using `useSygnumQuery` → needs "setup"
- **optimization**: Error handling for queries → needs "setup"
- **advanced**: Optimistic updates → needs "setup" + "mutations"

**Don't just copy old dependencies** - analyze each new file independently! ✓

## Testing Dependencies

```bash
# Validate no broken references
node .claude/knowledge/scripts/validate-knowledge.mjs

# Search to verify loading order
node .claude/knowledge/scripts/knowledge-search.mjs --tags sygnum-query
```

Check results include dependencies in logical order.

## Best Practices

1. **Start from content**: Read the file, identify what it uses
2. **Be minimal**: Only direct dependencies, not transitive
3. **Think like a reader**: What must they know first?
4. **Validate**: Check for circular deps, broken references
5. **Document why**: Comment in knowledge.json if non-obvious

## Quick Reference

**Foundation package**: `required_knowledge: []`
**Uses foundation**: `required_knowledge: ["foundation"]`
**Builds on intermediate**: `required_knowledge: ["intermediate"]` (not both basic + intermediate)
**Integration topic**: `required_knowledge: ["tool-a", "tool-b"]`

**When splitting files**: Reanalyze EVERY new file's dependencies from scratch!
