---
description: Migrate knowledge vault from old structure to new infrastructure/patterns/domain layout
allowed-tools: Read(*), Write(*), Bash(*), Glob(*), Grep(*), mcp__serena__*(*), AskUserQuestion(*)
argument-hint: [source-vault-path]
---

# Knowledge Port Command - Vault Migration

Migrate knowledge vault from old structure (ai/business/technical) to new standardized structure (infrastructure/patterns/domain).

## Usage

```bash
# Port from another local repo
/knowledge-port ../other-project

# Port from current repo (in-place migration)
/knowledge-port .

# Dry-run (show changes without applying)
/knowledge-port ../other-project --dry-run
```

## Step 1: Analyze Source Vault

### 1.1 Locate Source Vault

```javascript
const sourceVault = `${sourceRepo}/.claude/knowledge/vault`

if (!exists(sourceVault)) {
  error('Source vault not found at: ' + sourceVault)
  exit(1)
}
```

### 1.2 Scan Source Structure

```bash
# Find all directories
find ${sourceVault} -type d > /tmp/source-dirs.txt

# Find all markdown files
find ${sourceVault} -type f -name "*.md" > /tmp/source-files.txt

# Count packages
wc -l /tmp/source-files.txt
```

### 1.3 Load Source knowledge.json

```javascript
const sourceKnowledgeJson = read(`${sourceRepo}/.claude/knowledge/knowledge.json`)
const sourceKnowledge = JSON.parse(sourceKnowledgeJson)

const stats = {
  totalPackages: 0,
  categories: new Set(),
  oldStructure: detectOldStructure(sourceKnowledge)
}

for (const [category, packages] of Object.entries(sourceKnowledge.knowledge)) {
  stats.categories.add(category)
  stats.totalPackages += Object.keys(packages).length
}
```

### 1.4 Detect Old Structure Type

```javascript
function detectOldStructure(knowledge) {
  const categories = Object.keys(knowledge.knowledge)

  // Type 1: ai/business/technical (common old structure)
  const hasAi = categories.some(c => c.startsWith('ai/'))
  const hasBusiness = categories.some(c => c.startsWith('business/'))
  const hasTechnical = categories.some(c => c.startsWith('technical/'))

  if (hasAi && hasBusiness && hasTechnical) {
    return {
      type: 'ai-business-technical',
      version: '1.0',
      categories: { ai: [], business: [], technical: [] }
    }
  }

  // Type 2: core/quality/process (another common structure)
  const hasCore = categories.some(c => c.startsWith('core/'))
  const hasQuality = categories.some(c => c.startsWith('quality/'))
  const hasProcess = categories.some(c => c.startsWith('process/'))

  if (hasCore && hasQuality && hasProcess) {
    return {
      type: 'core-quality-process',
      version: '1.0',
      categories: { core: [], quality: [], process: [] }
    }
  }

  // Type 3: Flat (no hierarchy)
  const hasHierarchy = categories.some(c => c.includes('/'))

  if (!hasHierarchy) {
    return {
      type: 'flat',
      version: '1.0',
      categories: {}
    }
  }

  // Type 4: Already new structure
  const hasInfrastructure = categories.some(c => c.startsWith('infrastructure/'))
  const hasPatterns = categories.some(c => c.startsWith('patterns/'))
  const hasDomain = categories.some(c => c.startsWith('domain/'))

  if (hasInfrastructure || hasPatterns || hasDomain) {
    return {
      type: 'new-structure',
      version: '2.0',
      categories: {}
    }
  }

  // Type 5: Unknown/custom
  return {
    type: 'custom',
    version: '0.0',
    categories: {}
  }
}
```

## Step 2: Present Analysis

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Source Vault Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Source: ../other-project/.claude/knowledge/vault
Structure type: ai-business-technical (v1.0)

📊 Statistics:
  Total packages: 45
  Categories: 8
  Files: 45

📁 Category breakdown:
  ai/knowledge        → 5 packages
  ai/hooks            → 1 package
  ai/mcp/serena       → 1 package
  business/risk       → 3 packages
  business/trading    → 4 packages
  technical/react     → 12 packages
  technical/testing   → 10 packages
  technical/nx        → 9 packages

⚠️  Migration needed: Old structure detected
    This vault uses the deprecated ai/business/technical structure.
    Will migrate to: infrastructure/patterns/domain
```

## Step 3: Classify Packages

### 3.1 Classification Rules

For each package, determine target category:

```javascript
function classifyPackage(category, packageName, packageData) {
  // Rule 1: AI infrastructure stays infrastructure
  if (category.startsWith('ai/')) {
    if (category.includes('/knowledge')) return 'infrastructure/knowledge-system'
    if (category.includes('/hooks')) return 'infrastructure/hooks'
    if (category.includes('/mcp')) return 'infrastructure/mcp'
    if (category.includes('/agents')) return 'infrastructure/agents'
    return 'infrastructure/misc'
  }

  // Rule 2: Technical → patterns (categorize by tech domain)
  if (category.startsWith('technical/')) {
    const tech = category.split('/')[1]

    // Frontend frameworks
    if (['react', 'vue', 'angular', 'svelte', 'nextjs'].includes(tech)) {
      return 'patterns/frontend'
    }

    // Backend frameworks
    if (['express', 'nestjs', 'fastapi', 'django'].includes(tech)) {
      return 'patterns/backend'
    }

    // Testing
    if (['testing', 'jest', 'vitest', 'playwright', 'cypress'].includes(tech)) {
      return 'patterns/testing'
    }

    // Infrastructure
    if (['docker', 'kubernetes', 'terraform', 'cicd'].includes(tech)) {
      return 'patterns/infrastructure'
    }

    // Security
    if (['auth', 'security', 'permissions', 'rbac'].includes(tech)) {
      return 'patterns/security'
    }

    // Build tools
    if (['nx', 'vite', 'webpack', 'turbo'].includes(tech)) {
      return 'patterns/build'
    }

    // Monorepo/shared libraries → keep sub-categorization
    if (tech.startsWith('shared-') || tech.startsWith('sygnum-')) {
      return `patterns/frontend/${tech}`
    }

    // Default: patterns/misc
    return 'patterns/misc'
  }

  // Rule 3: Business → domain
  if (category.startsWith('business/')) {
    const domain = category.split('/')[1]

    // Check if it's a workflow or business rule by analyzing tags/content
    const isWorkflow = packageData.tags?.some(t => t.includes('workflow') || t.includes('process'))
    const isRule = packageData.tags?.some(t => t.includes('rule') || t.includes('validation'))
    const isIntegration = packageData.tags?.some(t => t.includes('integration') || t.includes('api'))

    if (isWorkflow) return `domain/${domain}/workflows`
    if (isRule) return `domain/${domain}/rules`
    if (isIntegration) return `domain/${domain}/integrations`

    return `domain/${domain}`
  }

  // Rule 4: Core/quality/process → patterns
  if (category.startsWith('core/')) {
    return 'patterns/core'
  }
  if (category.startsWith('quality/')) {
    return 'patterns/testing'
  }
  if (category.startsWith('process/')) {
    return 'infrastructure/process'
  }

  // Rule 5: Unknown → ask user
  return 'NEEDS_CLASSIFICATION'
}
```

### 3.2 Build Migration Plan

```javascript
const migrationPlan = []

for (const [category, packages] of Object.entries(sourceKnowledge.knowledge)) {
  for (const [packageName, packageData] of Object.entries(packages)) {
    const targetCategory = classifyPackage(category, packageName, packageData)

    if (targetCategory === 'NEEDS_CLASSIFICATION') {
      migrationPlan.push({
        package: packageName,
        source: category,
        target: null,
        needsInput: true,
        data: packageData
      })
    } else {
      migrationPlan.push({
        package: packageName,
        source: category,
        target: targetCategory,
        needsInput: false,
        data: packageData
      })
    }
  }
}
```

## Step 4: Ask User for Ambiguous Classifications

For packages marked `NEEDS_CLASSIFICATION`:

```javascript
const ambiguousPackages = migrationPlan.filter(p => p.needsInput)

if (ambiguousPackages.length > 0) {
  console.log(`\n⚠️  ${ambiguousPackages.length} packages need manual classification:\n`)

  for (const pkg of ambiguousPackages) {
    // Use AskUserQuestion for each
    const answer = askUserQuestion({
      header: "Category",
      question: `Where should "${pkg.package}" (currently in ${pkg.source}) be migrated?`,
      options: [
        {
          label: "infrastructure/*",
          description: "AI system meta-knowledge (hooks, MCP, knowledge system)"
        },
        {
          label: "patterns/frontend",
          description: "Frontend patterns (React, Vue, etc.)"
        },
        {
          label: "patterns/backend",
          description: "Backend patterns (APIs, databases, etc.)"
        },
        {
          label: "patterns/testing",
          description: "Testing patterns"
        },
        {
          label: "patterns/infrastructure",
          description: "Infrastructure patterns (Docker, K8s, etc.)"
        },
        {
          label: "domain/*",
          description: "Business workflows, rules, integrations"
        },
        {
          label: "Skip",
          description: "Don't migrate this package"
        }
      ]
    })

    if (answer === 'Skip') {
      pkg.skip = true
    } else {
      pkg.target = answer
    }
  }
}
```

## Step 5: Show Migration Plan

Present full migration plan:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Migration Plan
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Infrastructure (7 packages):
  ✓ ai/knowledge/create-knowledge
      → infrastructure/knowledge-system/create-knowledge.md

  ✓ ai/hooks/hooks-system
      → infrastructure/hooks/hooks-system.md

  ✓ ai/mcp/serena/serena-best-practices
      → infrastructure/mcp/serena-best-practices.md

Patterns/Frontend (12 packages):
  ✓ technical/react/react-components
      → patterns/frontend/react-components.md

  ✓ technical/react/react-patterns
      → patterns/frontend/react-patterns.md

  [... more ...]

Patterns/Testing (10 packages):
  ✓ technical/testing/jest-patterns
      → patterns/testing/jest-patterns.md

  [... more ...]

Domain (8 packages):
  ✓ business/risk/risk-calculation
      → domain/risk/workflows/risk-calculation.md

  ✓ business/trading/trading-workflows
      → domain/trading/workflows/trading-workflows.md

  [... more ...]

Skipped (2 packages):
  ⊗ old-deprecated-package
  ⊗ experimental-feature

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total to migrate: 37 packages
Files to create: 37
Folders to create: 8

Proceed with migration? (y/n/edit)
```

## Step 6: Execute Migration

### 6.1 Create Target Directories

```bash
for targetCategory in ${uniqueTargetCategories[@]}; do
  mkdir -p ".claude/knowledge/vault/${targetCategory}"
done
```

### 6.2 Copy and Update Files

For each package in migration plan:

```javascript
for (const item of migrationPlan) {
  if (item.skip) continue

  // Read source file
  const sourceFile = `${sourceVault}/${item.source}/${item.package}.md`
  let content = read(sourceFile)

  // Add migration comment at top
  const migrationComment = `<!--
Migrated from: ${item.source}/${item.package}.md
Migration date: ${new Date().toISOString().split('T')[0]}
Original category: ${item.source}
New category: ${item.target}
-->

`

  content = migrationComment + content

  // Write to target
  const targetFile = `.claude/knowledge/vault/${item.target}/${item.package}.md`
  write(targetFile, content)

  console.log(`  ✓ Migrated: ${item.package}`)
}
```

### 6.3 Build New knowledge.json

```javascript
const newKnowledge = {
  knowledge: {},
  command_profiles: sourceKnowledge.command_profiles || {},
  metadata: {
    generated: new Date().toISOString(),
    version: '2.0.0',
    migrated_from: sourceKnowledge.metadata?.version || '1.0.0',
    categories: [],
    tags: []
  }
}

// Group packages by new category
for (const item of migrationPlan) {
  if (item.skip) continue

  const category = item.target

  if (!newKnowledge.knowledge[category]) {
    newKnowledge.knowledge[category] = {}
  }

  // Update package data
  const packageData = {
    ...item.data,
    category: category,
    knowledge_path: `.claude/knowledge/vault/${category}/${item.package}.md`,
    _migrated_from: item.source, // Track origin
    _migration_date: new Date().toISOString().split('T')[0]
  }

  newKnowledge.knowledge[category][item.package] = packageData

  // Collect metadata
  if (!newKnowledge.metadata.categories.includes(category)) {
    newKnowledge.metadata.categories.push(category)
  }

  for (const tag of item.data.tags || []) {
    if (!newKnowledge.metadata.tags.includes(tag)) {
      newKnowledge.metadata.tags.push(tag)
    }
  }
}

// Sort metadata
newKnowledge.metadata.categories.sort()
newKnowledge.metadata.tags.sort()

// Write new knowledge.json
write('.claude/knowledge/knowledge.json', JSON.stringify(newKnowledge, null, 2))
```

### 6.4 Update Command Profiles

```javascript
// Update always_load references if needed
for (const [profileName, profile] of Object.entries(newKnowledge.command_profiles)) {
  // Check if always_load packages still exist
  const validPackages = []

  for (const pkg of profile.always_load || []) {
    const exists = Object.values(newKnowledge.knowledge).some(category =>
      Object.keys(category).includes(pkg)
    )

    if (exists) {
      validPackages.push(pkg)
    } else {
      console.warn(`  ⚠️  Removed non-existent package from ${profileName}.always_load: ${pkg}`)
    }
  }

  profile.always_load = validPackages
}
```

## Step 7: Create Migration Report

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Migration Complete ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Source: ../other-project/.claude/knowledge/vault
Target: ./.claude/knowledge/vault

📊 Summary:
  Packages migrated: 37
  Packages skipped: 2
  New categories: 8
  Files created: 37
  Folders created: 8

📁 New structure:
  infrastructure/
    knowledge-system/  (5 packages)
    hooks/            (1 package)
    mcp/              (1 package)

  patterns/
    frontend/         (12 packages)
    testing/          (10 packages)
    build/            (9 packages)

  domain/
    risk/workflows/   (3 packages)
    trading/workflows/(4 packages)

✅ Files:
  ✓ knowledge.json updated
  ✓ All packages migrated
  ✓ Migration comments added to files
  ✓ Metadata updated

⚠️  Action Required:
  1. Review migrated files for accuracy
  2. Update command profiles if needed
  3. Run validation: /knowledge-validate
  4. Test knowledge loading: node .claude/knowledge/scripts/knowledge-search.mjs --tags [tag]
  5. (Optional) Delete old vault: rm -rf ../other-project/.claude/knowledge/vault/ai
```

## Step 8: Validate Migration

Run validation automatically:

```bash
/knowledge-validate
```

Fix any issues found.

## Step 9: Create Backup (Safety)

Before migration, create backup:

```bash
# Create backup of source
tar -czf /tmp/knowledge-vault-backup-$(date +%s).tar.gz ${sourceVault}

echo "Backup created: /tmp/knowledge-vault-backup-*.tar.gz"
```

## Special Cases

### In-place Migration

If source is current repo (`.`):

1. Create `.claude/knowledge/vault-backup/` first
2. Copy all files there
3. Perform migration
4. Keep backup folder for rollback

### Partial Migration

Allow selecting specific categories:

```bash
/knowledge-port ../other-project --categories ai/knowledge,technical/react
```

Only migrate selected categories.

### Conflict Resolution

If target file already exists:

```
⚠️  File already exists: patterns/frontend/react-components.md

Options:
1. Skip (keep existing)
2. Overwrite
3. Merge (rename to react-components-2.md)

Choose: (1/2/3)
```

### Dry-run Mode

If `--dry-run` flag:

- Show migration plan
- Don't create any files
- Don't update knowledge.json
- Exit after plan display

## Error Handling

### Source Not Found
```
❌ Source vault not found at: ../other-project/.claude/knowledge/vault

Check:
- Path is correct
- Source repo exists
- Vault directory exists in source
```

### Invalid Source Structure
```
❌ Source vault has invalid structure

Found issues:
- knowledge.json missing
- No markdown files found
- Invalid JSON syntax

Cannot proceed with migration.
```

### Partial Failure
```
⚠️  Migration partially failed

Succeeded: 35 packages
Failed: 2 packages

Errors:
- technical/unknown/weird-package.md: Could not classify
- business/old/deprecated.md: File not found

Review errors and retry failed packages manually.
```

## Notes

- Migration is additive (doesn't delete source files)
- Always creates backup before in-place migration
- Preserves all metadata (tags, descriptions, dependencies)
- Adds migration comments to track origin
- Updates knowledge.json to v2.0.0 format
- Validates after migration
- Can be run multiple times (idempotent if using --skip-existing)
