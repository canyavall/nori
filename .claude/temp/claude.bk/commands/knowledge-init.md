---
description: Initialize knowledge vault structure with tech stack detection
allowed-tools: Read(*), Write(*), Bash(*), Glob(*), Grep(*), mcp__serena__*(*), AskUserQuestion(*)
---

# Knowledge Init Command - Vault Initialization

Initialize the knowledge vault structure for this repository with automatic tech stack detection and guided setup.

## Step 1: Detect Tech Stack

**CRITICAL**: Thoroughly analyze the repository to detect:
- Programming languages
- Frontend frameworks
- Backend frameworks
- Testing frameworks
- Infrastructure tools
- Build tools

### 1.1 Detect Languages

Check for language-specific files:

```bash
# TypeScript/JavaScript
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | head -20

# Python
find . -name "*.py" | head -20

# Java
find . -name "*.java" | head -20

# Go
find . -name "*.go" | head -20

# Rust
find . -name "*.rs" | head -20
```

### 1.2 Detect Frameworks & Tools

**If package.json exists**, read it:

```javascript
const packageJson = JSON.parse(read('package.json'))

// Frontend frameworks
const frontend = {
  react: packageJson.dependencies?.react,
  vue: packageJson.dependencies?.vue,
  angular: packageJson.dependencies?.['@angular/core'],
  nextjs: packageJson.dependencies?.next,
  remix: packageJson.dependencies?.['@remix-run/react'],
  svelte: packageJson.dependencies?.svelte,
}

// Backend frameworks
const backend = {
  express: packageJson.dependencies?.express,
  nestjs: packageJson.dependencies?.['@nestjs/core'],
  fastify: packageJson.dependencies?.fastify,
  koa: packageJson.dependencies?.koa,
}

// Testing frameworks
const testing = {
  jest: packageJson.devDependencies?.jest,
  vitest: packageJson.devDependencies?.vitest,
  playwright: packageJson.devDependencies?.playwright,
  cypress: packageJson.devDependencies?.cypress,
  testingLibrary: packageJson.devDependencies?.['@testing-library/react'],
}

// State management
const state = {
  redux: packageJson.dependencies?.redux || packageJson.dependencies?.['@reduxjs/toolkit'],
  zustand: packageJson.dependencies?.zustand,
  jotai: packageJson.dependencies?.jotai,
  recoil: packageJson.dependencies?.recoil,
}

// Build tools
const build = {
  vite: packageJson.devDependencies?.vite,
  webpack: packageJson.devDependencies?.webpack,
  turbo: packageJson.devDependencies?.turbo,
  nx: packageJson.devDependencies?.nx,
}
```

**If Python detected**, check for requirements.txt or pyproject.toml:

```bash
# Python frameworks
grep -E "(django|flask|fastapi|pytest)" requirements.txt pyproject.toml 2>/dev/null
```

**If Java detected**, check for pom.xml or build.gradle:

```bash
# Java frameworks
grep -E "(spring-boot|quarkus|junit)" pom.xml build.gradle 2>/dev/null
```

### 1.3 Detect Infrastructure

Check for infrastructure files:

```bash
# Docker
test -f "Dockerfile" && echo "Docker detected"
test -f "docker-compose.yml" && echo "Docker Compose detected"

# Kubernetes
find . -name "*.yaml" -o -name "*.yml" | xargs grep -l "apiVersion: apps" | head -5

# Terraform
find . -name "*.tf" | head -10

# CI/CD
test -d ".github/workflows" && echo "GitHub Actions detected"
test -f ".gitlab-ci.yml" && echo "GitLab CI detected"
test -f "Jenkinsfile" && echo "Jenkins detected"

# Cloud providers
grep -r "aws-sdk" package.json 2>/dev/null && echo "AWS detected"
grep -r "@google-cloud" package.json 2>/dev/null && echo "GCP detected"
grep -r "@azure" package.json 2>/dev/null && echo "Azure detected"
```

### 1.4 Detect Monorepo Structure

```bash
# Check for monorepo patterns
test -f "pnpm-workspace.yaml" && echo "PNPM workspace detected"
test -f "lerna.json" && echo "Lerna detected"
test -f "nx.json" && echo "Nx monorepo detected"
test -f "turbo.json" && echo "Turbo detected"

# Count packages
find . -name "package.json" | wc -l
```

## Step 2: Analyze and Present Findings

Present detected tech stack to user:

```
🔍 Tech Stack Detection Complete

Languages:
✅ TypeScript
✅ JavaScript

Frontend:
✅ React
✅ Next.js

Backend:
❌ None detected

Testing:
✅ Jest
✅ Playwright

Infrastructure:
✅ Docker
❌ Kubernetes
✅ GitHub Actions

Monorepo:
✅ Nx workspace detected (12 packages)
```

## Step 3: Ask Clarifying Questions

Use AskUserQuestion to gather additional context:

**Question 1: Repository Type**
```
header: "Repo Type"
question: "What type of repository is this?"
options:
  - label: "Single application"
    description: "One app with its own codebase (e.g., single React app, single API)"
  - label: "Monorepo (same domain)"
    description: "Multiple packages/apps in one repo, all related to same domain"
  - label: "Monorepo (different domains)"
    description: "Multiple distinct projects, each with different business goals"
  - label: "Multi-repo workspace"
    description: "Multiple separate repos that work together (FE repo + BE repo + infra repos)"
```

**Question 2: Business Complexity**
```
header: "Business"
question: "How business-heavy is this repository?"
options:
  - label: "Not business-heavy"
    description: "General-purpose app, minimal domain logic (e.g., todo app, blog)"
  - label: "Moderate business logic"
    description: "Some domain-specific workflows and rules"
  - label: "Heavily business-driven"
    description: "Complex workflows, approval processes, domain rules (e.g., fintech, healthcare)"
```

**Question 3: Knowledge Scope** (only if monorepo)
```
header: "Knowledge"
question: "Should knowledge be shared across all packages or per-package?"
options:
  - label: "Shared knowledge"
    description: "All packages use same patterns (e.g., shared component library, API standards)"
  - label: "Per-package knowledge"
    description: "Each package has unique patterns (e.g., different frameworks, different domains)"
  - label: "Mixed"
    description: "Some shared patterns, some package-specific"
```

## Step 4: Determine Vault Structure

Based on detection and user answers, determine which folders to create:

### Structure Decision Logic

**Base structure (always created):**
```
vault/
├── infrastructure/
│   ├── knowledge-system/
│   ├── hooks/
│   └── mcp/
```

**Patterns structure (based on detected tech):**
```
vault/patterns/
├── frontend/          # If React/Vue/Angular detected
├── backend/           # If Express/NestJS/FastAPI detected
├── fullstack/         # If both frontend AND backend detected
├── testing/           # If Jest/Vitest/Playwright detected
├── infrastructure/    # If Docker/K8s/Terraform detected
└── security/          # If auth libraries or security tools detected
```

**Domain structure (based on business complexity):**

- **Not business-heavy**: Create `.gitkeep` only
- **Moderate**: Create `domain/workflows/` and `domain/rules/`
- **Heavy**: Create full structure:
  ```
  domain/
  ├── workflows/
  ├── rules/
  └── integrations/
  ```

**Monorepo adjustments:**

If monorepo + "per-package knowledge":
```
vault/patterns/
├── package-a/
│   ├── frontend/
│   └── testing/
├── package-b/
│   ├── backend/
│   └── testing/
└── shared/
    └── common patterns
```

## Step 5: Create Vault Structure

Create directories and placeholder files:

```bash
# Create base structure
mkdir -p .claude/knowledge/vault/infrastructure/knowledge-system
mkdir -p .claude/knowledge/vault/infrastructure/hooks
mkdir -p .claude/knowledge/vault/infrastructure/mcp

# Copy existing infrastructure knowledge
cp .claude/knowledge/vault/ai/knowledge/*.md .claude/knowledge/vault/infrastructure/knowledge-system/
cp .claude/knowledge/vault/ai/hooks/*.md .claude/knowledge/vault/infrastructure/hooks/
cp .claude/knowledge/vault/ai/mcp/**/*.md .claude/knowledge/vault/infrastructure/mcp/

# Create patterns folders based on detection
[create only detected tech folders]

# Create domain folders based on business complexity
[create based on user selection]
```

## Step 6: Generate knowledge.json

Create or update knowledge.json with:

1. **Migrate existing packages** (update categories from ai/* to infrastructure/*)
2. **Add command profiles** (plan, implementation)
3. **Add metadata** (categories, tags)

```json
{
  "knowledge": {
    "infrastructure/knowledge-system": {
      "create-knowledge": { ... },
      "knowledge-loading-system": { ... },
      ...
    },
    "infrastructure/hooks": {
      "hooks-system": { ... }
    },
    "infrastructure/mcp": {
      "serena-best-practices": { ... }
    }
  },
  "command_profiles": {
    "plan": {
      "always_load": [
        "knowledge-loading-system",
        "create-knowledge"
      ],
      "search_filters": {},
      "exclude_categories": [],
      "description": "/plan command creates planning documents"
    },
    "implementation": {
      "always_load": [
        "knowledge-loading-system"
      ],
      "search_filters": {},
      "exclude_categories": [],
      "description": "/implement command executes implementation plan"
    }
  },
  "metadata": {
    "categories": [
      "infrastructure/knowledge-system",
      "infrastructure/hooks",
      "infrastructure/mcp",
      [... detected categories ...]
    ],
    "tags": [
      "ai-infrastructure",
      "knowledge-system",
      [... extracted from packages ...]
    ]
  },
  "skills_location": ".claude/knowledge/vault"
}
```

## Step 7: Create TODO Files

For each created patterns folder, create `_TODO.md` with suggested knowledge to create:

**Example: patterns/frontend/_TODO.md**
```markdown
# Frontend Knowledge TODO

Based on detected tech stack, consider creating:

## React Patterns (Detected: react@18.2.0)
- [ ] Component patterns (compound components, render props, custom hooks)
- [ ] State management patterns (detected: [zustand/redux/context])
- [ ] Performance optimization patterns

## Next.js Patterns (Detected: next@14.0.0)
- [ ] App router patterns
- [ ] Server components patterns
- [ ] Data fetching patterns

## Forms (Detected: react-hook-form)
- [ ] Form validation patterns
- [ ] Form state management
- [ ] Error handling

## Styling (Detected: tailwindcss)
- [ ] Component styling conventions
- [ ] Theme management
- [ ] Responsive patterns

## To create knowledge:
Run: /knowledge-create patterns/frontend <topic>
```

**Example: domain/_TODO.md**
```markdown
# Domain Knowledge TODO

Document your business-specific workflows and rules:

## Workflows
- [ ] [Your workflow 1]
- [ ] [Your workflow 2]

## Business Rules
- [ ] [Your rule 1]
- [ ] [Your rule 2]

## External Integrations
- [ ] [Integration 1]
- [ ] [Integration 2]

## To create knowledge:
Run: /knowledge-create domain/workflows <workflow-name>
```

## Step 8: Create Summary Report

Create `.claude/knowledge/vault/VAULT-STRUCTURE.md`:

```markdown
# Knowledge Vault Structure

Generated: [timestamp]
Repository: [repo name]
Tech Stack: [summary]

## Structure

```
vault/
├── infrastructure/     # Meta-knowledge about AI system
│   ├── knowledge-system/  # 5 files
│   ├── hooks/             # 1 file
│   └── mcp/               # 1 file
├── patterns/           # Technical patterns
│   ├── frontend/       # React, Next.js patterns
│   └── testing/        # Jest, Playwright patterns
└── domain/             # Business logic
    ├── workflows/
    └── rules/
```

## Categories in knowledge.json

[list all categories]

## Next Steps

1. Review TODO files in each patterns/ folder
2. Create knowledge using: /knowledge-create
3. Update knowledge.json tags for discoverability
4. Test knowledge loading: node .claude/knowledge/scripts/knowledge-search.mjs --tags [tag]

## Migration Complete

✅ Moved from ai/* structure to infrastructure/patterns/domain
✅ Updated all knowledge.json categories
✅ Created [N] placeholder TODO files
```

## Step 9: Validate Structure

Run validation:

```bash
node .claude/knowledge/scripts/validate-knowledge.mjs
```

Fix any issues found.

## Step 10: Report to User

Present summary:

```
✅ Knowledge vault initialized successfully!

Structure created:
  📁 infrastructure/     (7 files migrated)
  📁 patterns/frontend/  (TODO created)
  📁 patterns/testing/   (TODO created)
  📁 domain/workflows/   (placeholder)

Files created:
  ✅ .claude/knowledge/vault/VAULT-STRUCTURE.md
  ✅ .claude/knowledge/knowledge.json (updated)
  ✅ TODO files (3 created)

Next steps:
  1. Review: .claude/knowledge/vault/VAULT-STRUCTURE.md
  2. Check TODOs in patterns/ folders
  3. Create knowledge: /knowledge-create patterns/frontend react-patterns
  4. Validate: node .claude/knowledge/scripts/validate-knowledge.mjs
```

## Notes

- This command is idempotent: safe to run multiple times
- Existing knowledge files are never deleted, only migrated
- User can always manually adjust the structure after initialization
- The structure adapts to the repository, not vice versa
