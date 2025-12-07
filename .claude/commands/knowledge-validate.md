---
description: Validate knowledge vault structure and quality
allowed-tools: Read(*), Bash(*), Glob(*), Grep(*), mcp__serena__*(*)
---

# Knowledge Validate Command - Quality Assurance

Validate knowledge vault structure, file quality, and metadata consistency.

## Usage

```bash
# Validate everything
/knowledge-validate

# Validate specific category
/knowledge-validate patterns/frontend

# Validate specific package
/knowledge-validate patterns/frontend/react-patterns

# Check tag quality only
/knowledge-validate --tags-only

# Check structure only
/knowledge-validate --structure-only

# Auto-fix issues (where possible)
/knowledge-validate --fix
```

## Validation Checks

### 1. Structure Validation
- [ ] Vault directory exists
- [ ] knowledge.json exists and is valid JSON
- [ ] All categories in knowledge.json have corresponding folders
- [ ] All knowledge files referenced in knowledge.json exist
- [ ] No orphaned files (files not in knowledge.json)

### 2. File Validation
- [ ] Filename matches package name
- [ ] File is within line limits (70-100 for patterns, 200-300 for domain)
- [ ] File has content (not empty)
- [ ] No YAML frontmatter (plain markdown only)
- [ ] Valid markdown structure

### 3. Metadata Validation
- [ ] All required fields present (tags, description, category)
- [ ] Tags are domain-specific (not generic)
- [ ] Description is concise (≤2 sentences, ≤200 chars)
- [ ] Category matches directory structure
- [ ] knowledge_path matches actual file location

### 4. Tag Quality Validation
- [ ] No generic tags (documentation, testing, implementation, etc.)
- [ ] No duplicate tags across packages (warn if same tags on 10+ packages)
- [ ] Tags follow naming convention (lowercase, kebab-case)
- [ ] Tags are discoverable (match common search terms)

### 5. Relationship Validation
- [ ] required_knowledge references exist
- [ ] optional_knowledge references exist
- [ ] No circular dependencies
- [ ] Related packages have reciprocal links (optional)

### 6. Content Quality Validation
- [ ] Has code examples (for technical patterns)
- [ ] Has decision criteria ("when to use" section)
- [ ] No project-specific details (repo names, dates, people)
- [ ] Proper code block formatting
- [ ] Links to other knowledge are valid

## Step 1: Load All Data

### 1.1 Load knowledge.json

```javascript
const knowledge = JSON.parse(read('.claude/knowledge/knowledge.json'))
const allPackages = []

for (const [category, packages] of Object.entries(knowledge.knowledge)) {
  for (const [name, data] of Object.entries(packages)) {
    allPackages.push({
      category,
      name,
      ...data
    })
  }
}

console.log(`📊 Found ${allPackages.length} packages across ${Object.keys(knowledge.knowledge).length} categories`)
```

### 1.2 Scan File System

```bash
# Find all markdown files in vault
find .claude/knowledge/vault -type f -name "*.md" > /tmp/vault-files.txt

# Find all directories
find .claude/knowledge/vault -type d > /tmp/vault-dirs.txt
```

## Step 2: Structure Validation

### 2.1 Check Vault Directory

```javascript
if (!exists('.claude/knowledge/vault')) {
  errors.push({
    severity: 'error',
    type: 'structure',
    message: 'Vault directory does not exist',
    fix: 'Run /knowledge-init to create vault structure'
  })
}
```

### 2.2 Validate knowledge.json

```javascript
try {
  JSON.parse(read('.claude/knowledge/knowledge.json'))
} catch (error) {
  errors.push({
    severity: 'error',
    type: 'structure',
    message: 'knowledge.json is invalid JSON',
    detail: error.message,
    fix: 'Fix JSON syntax errors'
  })
}
```

### 2.3 Check Category Folders

```javascript
for (const category of Object.keys(knowledge.knowledge)) {
  const categoryPath = `.claude/knowledge/vault/${category}`

  if (!exists(categoryPath)) {
    errors.push({
      severity: 'warning',
      type: 'structure',
      category: category,
      message: `Category folder missing: ${category}`,
      fix: `Create folder: mkdir -p ${categoryPath}`
    })
  }
}
```

### 2.4 Check for Orphaned Files

```javascript
const filesInJson = new Set(allPackages.map(p => p.knowledge_path))
const filesOnDisk = readFileList('/tmp/vault-files.txt')

for (const file of filesOnDisk) {
  if (!filesInJson.has(file) && !file.includes('_TODO.md') && !file.includes('VAULT-STRUCTURE.md')) {
    warnings.push({
      severity: 'warning',
      type: 'orphaned',
      file: file,
      message: `File exists but not in knowledge.json: ${file}`,
      fix: 'Add to knowledge.json or delete file'
    })
  }
}
```

## Step 3: File Validation

For each package:

### 3.1 Check File Exists

```javascript
if (!exists(package.knowledge_path)) {
  errors.push({
    severity: 'error',
    type: 'file',
    package: package.name,
    message: `File missing: ${package.knowledge_path}`,
    fix: 'Create file or remove from knowledge.json'
  })
  continue // Skip other checks for missing file
}
```

### 3.2 Check Filename Matches Package Name

```javascript
const filename = path.basename(package.knowledge_path, '.md')
if (filename !== package.name) {
  errors.push({
    severity: 'error',
    type: 'file',
    package: package.name,
    message: `Filename mismatch: expected ${package.name}.md, got ${filename}.md`,
    fix: `Rename file to ${package.name}.md`
  })
}
```

### 3.3 Check Line Count

```javascript
const content = read(package.knowledge_path)
const lines = content.split('\n').length

const limits = {
  'infrastructure/*': 100,
  'patterns/*': 100,
  'domain/*': 300
}

const limit = getLimit(package.category, limits)

if (lines > limit) {
  warnings.push({
    severity: 'warning',
    type: 'file-size',
    package: package.name,
    message: `File too large: ${lines} lines (limit: ${limit})`,
    fix: 'Consider splitting into multiple packages'
  })
} else if (lines < 10) {
  warnings.push({
    severity: 'warning',
    type: 'file-size',
    package: package.name,
    message: `File suspiciously small: ${lines} lines`,
    fix: 'Add more content or remove package'
  })
}
```

### 3.4 Check for YAML Frontmatter

```javascript
if (content.startsWith('---\n')) {
  errors.push({
    severity: 'error',
    type: 'format',
    package: package.name,
    message: 'File has YAML frontmatter (not allowed)',
    fix: 'Remove YAML frontmatter, use plain markdown only'
  })
}
```

### 3.5 Check Content Quality

```javascript
// Check for code blocks (for technical patterns)
const hasCodeBlocks = /```[\s\S]+?```/.test(content)
const isTechnicalPattern = package.category.startsWith('patterns/')

if (isTechnicalPattern && !hasCodeBlocks) {
  warnings.push({
    severity: 'warning',
    type: 'content',
    package: package.name,
    message: 'Technical pattern has no code examples',
    fix: 'Add code examples to illustrate patterns'
  })
}

// Check for decision criteria
const hasDecisionSection = /(when to use|when not to use)/i.test(content)
if (!hasDecisionSection) {
  warnings.push({
    severity: 'info',
    type: 'content',
    package: package.name,
    message: 'Missing "When to Use" section',
    fix: 'Add decision criteria section'
  })
}

// Check for project-specific details
const hasProjectDetails = /(our repo|our team|implemented on \d{4})/i.test(content)
if (hasProjectDetails) {
  warnings.push({
    severity: 'warning',
    type: 'content',
    package: package.name,
    message: 'Contains project-specific details',
    fix: 'Generalize content to be reusable'
  })
}
```

## Step 4: Metadata Validation

### 4.1 Check Required Fields

```javascript
const requiredFields = ['tags', 'description', 'category', 'knowledge_path']

for (const field of requiredFields) {
  if (!package[field]) {
    errors.push({
      severity: 'error',
      type: 'metadata',
      package: package.name,
      message: `Missing required field: ${field}`,
      fix: `Add ${field} to knowledge.json`
    })
  }
}
```

### 4.2 Validate Tags

```javascript
if (!package.tags || package.tags.length === 0) {
  errors.push({
    severity: 'error',
    type: 'tags',
    package: package.name,
    message: 'Package has no tags',
    fix: 'Add domain-specific tags'
  })
}

// Check for too many tags
if (package.tags && package.tags.length > 10) {
  warnings.push({
    severity: 'warning',
    type: 'tags',
    package: package.name,
    message: `Too many tags: ${package.tags.length} (recommend ≤8)`,
    fix: 'Use more focused tags'
  })
}
```

### 4.3 Validate Description

```javascript
if (!package.description) {
  errors.push({
    severity: 'error',
    type: 'metadata',
    package: package.name,
    message: 'Missing description',
    fix: 'Add concise description (1-2 sentences)'
  })
} else if (package.description.length > 200) {
  warnings.push({
    severity: 'warning',
    type: 'metadata',
    package: package.name,
    message: `Description too long: ${package.description.length} chars (recommend ≤200)`,
    fix: 'Shorten description to key points only'
  })
} else if (package.description.length < 20) {
  warnings.push({
    severity: 'warning',
    type: 'metadata',
    package: package.name,
    message: 'Description too vague/short',
    fix: 'Add more specific description'
  })
}
```

### 4.4 Check Category Consistency

```javascript
const pathCategory = package.knowledge_path.split('/')[3] // .claude/knowledge/vault/[category]/...
const jsonCategory = package.category

if (pathCategory !== jsonCategory.replace('/', '-')) {
  errors.push({
    severity: 'error',
    type: 'metadata',
    package: package.name,
    message: `Category mismatch: path has ${pathCategory}, json has ${jsonCategory}`,
    fix: 'Update knowledge_path or category to match'
  })
}
```

## Step 5: Tag Quality Validation

### 5.1 Check for Generic Tags

```javascript
const genericTags = [
  'documentation', 'cleanup', 'maintenance', 'update', 'modify', 'fix',
  'create', 'implement', 'setup', 'learn', 'use', 'understand',
  'reference', 'test', 'debug', 'refactor', 'change'
]

for (const tag of package.tags) {
  if (genericTags.includes(tag)) {
    errors.push({
      severity: 'error',
      type: 'tags',
      package: package.name,
      message: `Generic tag not allowed: "${tag}"`,
      detail: 'Tags must be domain-specific',
      fix: `Replace with specific tag (e.g., "api-documentation", "integration-testing")`
    })
  }
}
```

### 5.2 Check Tag Naming Convention

```javascript
for (const tag of package.tags) {
  if (!/^[a-z0-9-]+$/.test(tag)) {
    errors.push({
      severity: 'error',
      type: 'tags',
      package: package.name,
      message: `Invalid tag format: "${tag}"`,
      detail: 'Tags must be lowercase kebab-case',
      fix: `Rename to ${tag.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`
    })
  }
}
```

### 5.3 Detect Tag Overuse

```javascript
// Count tag usage across all packages
const tagCounts = {}
for (const pkg of allPackages) {
  for (const tag of pkg.tags || []) {
    tagCounts[tag] = (tagCounts[tag] || 0) + 1
  }
}

// Warn about overused tags
for (const [tag, count] of Object.entries(tagCounts)) {
  if (count > 15) {
    warnings.push({
      severity: 'warning',
      type: 'tags',
      message: `Tag "${tag}" used in ${count} packages (may be too generic)`,
      fix: 'Consider more specific tags for some packages'
    })
  }
}
```

## Step 6: Relationship Validation

### 6.1 Check Dependencies Exist

```javascript
for (const dep of package.required_knowledge || []) {
  const depExists = allPackages.some(p => p.name === dep)

  if (!depExists) {
    errors.push({
      severity: 'error',
      type: 'relationships',
      package: package.name,
      message: `Required dependency not found: ${dep}`,
      fix: 'Remove dependency or create missing package'
    })
  }
}

for (const dep of package.optional_knowledge || []) {
  const depExists = allPackages.some(p => p.name === dep)

  if (!depExists) {
    warnings.push({
      severity: 'warning',
      type: 'relationships',
      package: package.name,
      message: `Optional dependency not found: ${dep}`,
      fix: 'Remove dependency or create missing package'
    })
  }
}
```

### 6.2 Detect Circular Dependencies

```javascript
function hasCircularDep(packageName, visited = new Set()) {
  if (visited.has(packageName)) {
    return true // Circular!
  }

  visited.add(packageName)

  const pkg = allPackages.find(p => p.name === packageName)
  if (!pkg) return false

  for (const dep of pkg.required_knowledge || []) {
    if (hasCircularDep(dep, new Set(visited))) {
      return true
    }
  }

  return false
}

if (hasCircularDep(package.name)) {
  errors.push({
    severity: 'error',
    type: 'relationships',
    package: package.name,
    message: 'Circular dependency detected',
    fix: 'Remove circular required_knowledge references'
  })
}
```

## Step 7: Generate Report

### 7.1 Categorize Issues

```javascript
const report = {
  summary: {
    total_packages: allPackages.length,
    total_errors: errors.length,
    total_warnings: warnings.length,
    total_info: info.length
  },
  by_severity: {
    errors: errors,
    warnings: warnings,
    info: info
  },
  by_type: {
    structure: [...],
    file: [...],
    metadata: [...],
    tags: [...],
    relationships: [...],
    content: [...]
  },
  by_package: groupByPackage(errors, warnings, info)
}
```

### 7.2 Print Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Knowledge Vault Validation Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Summary
  Packages validated: 12
  ❌ Errors: 3
  ⚠️  Warnings: 8
  ℹ️  Info: 2

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ ERRORS (must fix)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[structure] Vault directory structure
  × Category folder missing: patterns/security
  → Fix: mkdir -p .claude/knowledge/vault/patterns/security

[tags] react-form-patterns
  × Generic tag not allowed: "documentation"
  → Fix: Replace with "form-documentation" or "component-documentation"

[file] api-error-handling
  × Filename mismatch: expected api-error-handling.md, got error-handling.md
  → Fix: Rename file to api-error-handling.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  WARNINGS (should fix)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[file-size] domain/workflows/risk-calculation
  ⚠  File too large: 350 lines (limit: 300)
  → Fix: Consider splitting into multiple packages

[tags] Global tag usage
  ⚠  Tag "api" used in 18 packages (may be too generic)
  → Fix: Consider more specific tags for some packages

[content] react-patterns
  ⚠  Technical pattern has no code examples
  → Fix: Add code examples to illustrate patterns

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ PASSED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✓ All knowledge files exist
  ✓ No circular dependencies
  ✓ All required dependencies exist
  ✓ knowledge.json is valid JSON
  ✓ No orphaned files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Step 8: Auto-Fix (if --fix flag)

If `--fix` flag provided, automatically fix issues where possible:

### Fixable Issues:

1. **Missing category folders** → Create them
2. **Invalid tag format** → Rename to kebab-case
3. **Description too long** → Truncate to 200 chars
4. **Missing knowledge_path** → Generate from category + name
5. **Metadata fields ordering** → Reorder to standard format

```javascript
if (args.fix) {
  console.log('\n🔧 Auto-fixing issues...\n')

  for (const error of errors) {
    if (error.fixable) {
      applyFix(error)
      console.log(`  ✓ Fixed: ${error.message}`)
    }
  }

  // Save updated knowledge.json
  write('.claude/knowledge/knowledge.json', JSON.stringify(knowledge, null, 2))

  console.log('\n✅ Auto-fix complete. Re-run validation to verify.')
}
```

## Step 9: Exit Code

```javascript
// Exit with error code if errors found
if (errors.length > 0) {
  process.exit(1)
} else if (warnings.length > 0) {
  process.exit(0) // Warnings don't fail validation
} else {
  console.log('\n✅ All validation checks passed!')
  process.exit(0)
}
```

## Output Formats

### Default: Human-readable

Pretty-printed report as shown above.

### JSON Format (--format=json)

```bash
/knowledge-validate --format=json
```

```json
{
  "summary": {
    "total_packages": 12,
    "total_errors": 3,
    "total_warnings": 8
  },
  "errors": [...],
  "warnings": [...]
}
```

### CI Format (--format=ci)

```bash
/knowledge-validate --format=ci
```

```
::error file=.claude/knowledge/vault/patterns/frontend/react-form-patterns.md::Generic tag not allowed: "documentation"
::warning file=.claude/knowledge/vault/domain/workflows/risk-calculation.md::File too large: 350 lines (limit: 300)
```

## Usage in CI/CD

```yaml
# .github/workflows/validate-knowledge.yml
name: Validate Knowledge

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Validate knowledge vault
        run: node .claude/knowledge/scripts/validate-knowledge.mjs --format=ci
```

## Notes

- Validation is non-destructive (doesn't modify files unless --fix)
- Exit code 1 if errors, 0 if only warnings or success
- Can be integrated into pre-commit hooks
- Supports filtering by category or package
- Auto-fix only handles mechanical issues, not content quality
