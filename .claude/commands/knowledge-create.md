---
description: Create new knowledge package with AI-guided categorization
allowed-tools: Read(*), Write(*), Bash(*), Glob(*), Grep(*), mcp__serena__*(*), AskUserQuestion(*)
argument-hint: [description or --from-content <file>]
---

# Knowledge Create - Quality-First

Create concise, project-specific knowledge (≤120 lines).

## Quality Standards (MANDATORY)

1. **Project-specific only**: No generic advice
2. **Actionable**: Concrete examples, not theory
3. **≤120 lines**: Absolute hard limit
4. **No duplication**: Check existing first

**Content rules:**
- Codebase-specific patterns/conventions only
- Actual code examples from project
- Reference specific files/locations
- No generic best practices

## Usage

```bash
/knowledge-create "React form patterns with Formik"
/knowledge-create --from-content docs/api-patterns.md
/knowledge-create  # Interactive
```

## Workflow

### 1. Parse Input

- `--from-content <file>`: Extract from file
- Text: Create from description
- No args: Interactive

### 2. Infer Structure

**Type:**
- Infrastructure → `meta/{subsystem}`
- Technical pattern → `frontend/`, `backend/`, `testing/`
- Business → `business/{domain}`

**Name** (kebab-case):
- `react-form-patterns` (not "forms")
- `api-error-handling` (not "errors")

**Tags** (4-6 specific):
- Tech: `react`, `formik`
- Concept: `forms`, `validation`
- Context: `patterns`, `error-handling`
- **Never**: `documentation`, `knowledge`

### 3. Check Duplicates

```bash
grep -r "topic" .claude/knowledge/vault
```

If exists: Ask to merge (verify ≤120 lines) or differentiate

### 4. Generate Content

**Template:**

```markdown
# {Title}

{1-2 sentence description}

## {Pattern 1}
```{lang}
// Project-specific example
{code}
```

## {Pattern 2}
```{lang}
{code}
```

## Common Pitfalls
- {Specific mistake from project}

## Examples
```{lang}
// Good
{example}

// Bad
{anti-pattern}
```
```

**Max 3-4 sections** with concrete examples.

### 5. Write & Register

```bash
# 1. Write
cat > .claude/knowledge/vault/{category}/{name}.md << 'EOF'
{content}
EOF

# 2. Check lines
wc -l .claude/knowledge/vault/{category}/{name}.md
# If >120: STOP, simplify first

# 3. Register in knowledge.json
# Add entry to appropriate category

# 4. Validate
node .claude/knowledge/scripts/validate-knowledge.mjs
```

## Quality Checklist

- [ ] ≤120 lines (`wc -l {file}`)
- [ ] Project-specific (no generic advice)
- [ ] Concrete examples (from codebase)
- [ ] Actionable (what to do)
- [ ] No duplication
- [ ] Clear category/tags
- [ ] Passes validation

## Good vs Bad

**GOOD:**
```markdown
# React Router Loaders
Always return JSON:
```tsx
// Good - prevents hydration issues
export const loader = () => Response.json({ data })

// Bad
export const loader = () => ({ data })
```
```

**BAD:**
```markdown
# React Hooks
Hooks are functions that let you use state...
```
(Generic React docs - already known)
