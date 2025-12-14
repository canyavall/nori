---
description: Create new knowledge package with AI-guided categorization
allowed-tools: Read(*), Write(*), Bash(*), Glob(*), Grep(*), mcp__serena__*(*), AskUserQuestion(*)
argument-hint: [description or --from-content <file>]
---

# Knowledge Create Command - AI-Guided Knowledge Creation

Create a new knowledge package with AI inference for category, name, and tags.

## Usage Modes

**Mode 1: From description**
```
/knowledge-create "React form patterns with Formik validation"
```

**Mode 2: From existing content**
```
/knowledge-create --from-content docs/architecture/api-patterns.md
```

**Mode 3: Interactive (no args)**
```
/knowledge-create
```

## Step 1: Parse Arguments

Determine which mode based on input:

- If starts with `--from-content`: Mode 2 (extract from file)
- If has description text: Mode 1 (from description)
- If no args: Mode 3 (interactive)

## Mode 1: From Description

### 1.1 Analyze Description

**Given description**, analyze:
1. **Type**: Is this technical pattern or business workflow?
2. **Domain**: Frontend, backend, testing, infra, security, or business domain?
3. **Technology**: Specific frameworks/tools mentioned
4. **Scope**: Single pattern or multiple related patterns?

**Example analysis:**
```
Input: "React form patterns with Formik validation"

Analysis:
- Type: Technical pattern
- Domain: Frontend
- Technology: React, Formik
- Scope: Forms + validation (2 related patterns)
```

### 1.2 Load Existing Vault Structure

Read `.claude/knowledge/vault/VAULT-STRUCTURE.md` (if exists) to see available categories.

If not exists, scan directories:

```bash
find .claude/knowledge/vault -type d -maxdepth 2
```

Available categories might be:
- `infrastructure/knowledge-system`
- `infrastructure/hooks`
- `infrastructure/mcp`
- `patterns/frontend`
- `patterns/backend`
- `patterns/testing`
- `domain/workflows`
- etc.

### 1.3 Infer Category

**Decision tree:**

```
Is it about the AI system itself (hooks, MCP, knowledge system)?
├─ YES → infrastructure/[subsystem]
└─ NO ↓

Is it a technical pattern (reusable across projects)?
├─ YES → patterns/[domain]
└─ NO ↓

Is it business logic (specific workflows, rules)?
└─ YES → domain/[area]
```

**Example:**
```
Description: "React form patterns with Formik validation"
→ Technical pattern
→ Frontend domain
→ Category: patterns/frontend
```

### 1.4 Infer Package Name

Rules:
1. Lowercase kebab-case
2. Technology + concept (e.g., `react-form-patterns`)
3. Specific, not generic (not just "forms")
4. Match description essence

**Examples:**
- "React form patterns" → `react-form-patterns`
- "API error handling with retry logic" → `api-error-handling`
- "Jest async testing patterns" → `jest-async-testing`
- "Risk calculation workflow" → `risk-calculation-workflow`

### 1.5 Infer Tags

**Tag generation rules:**

1. **Domain tags** (1-2 tags):
   - From technology: `react`, `formik`, `jest`, `express`, etc.
   - From domain: `frontend`, `backend`, `testing`, `api`, `database`

2. **Concept tags** (2-3 tags):
   - From functionality: `forms`, `validation`, `error-handling`, `caching`
   - From patterns: `hooks`, `components`, `middleware`, `testing-patterns`

3. **Context tags** (1-2 tags):
   - From use case: `async`, `performance`, `security`, `accessibility`
   - From architecture: `patterns`, `best-practices`, `anti-patterns`

**NEVER use generic tags**: `documentation`, `knowledge`, `coding`, `development`

**Example:**
```
Description: "React form patterns with Formik validation"

Tags:
- react (technology)
- formik (library)
- forms (concept)
- validation (concept)
- components (context)
- patterns (context)
```

### 1.6 Generate Description

Create concise description (1-2 sentences):

**Template:**
```
[What it is] for [specific use case/technology]. [Key aspects covered].
```

**Example:**
```
Form handling patterns for React using Formik. Covers validation, error handling, and submission workflows.
```

### 1.7 Present Inference to User

Show inferred values and ask for confirmation:

```
📋 Knowledge Package Inference

Based on: "React form patterns with Formik validation"

Category: patterns/frontend
Name: react-form-patterns
Tags: react, formik, forms, validation, components, patterns
Description: Form handling patterns for React using Formik. Covers validation, error handling, and submission workflows.

File will be created at:
.claude/knowledge/vault/patterns/frontend/react-form-patterns.md

Confirm? (y/n/edit)
```

**If user says "edit":**

Use AskUserQuestion to let them adjust:

```
question: "Which field do you want to adjust?"
options:
  - Category
  - Name
  - Tags
  - Description
  - All looks good
```

Then show suggested alternatives for selected field.

## Mode 2: From Existing Content

### 2.1 Read Source File

Read the file specified in `--from-content`:

```javascript
const content = read(sourceFilePath)
```

### 2.2 Analyze Content

Read first 50-100 lines and identify:

1. **Content type** (code examples, workflow description, architectural doc)
2. **Technologies mentioned** (frameworks, libraries, tools)
3. **Patterns described** (what problems does it solve?)
4. **Domain** (frontend, backend, business, etc.)

**Example analysis:**
```
File: docs/architecture/api-error-handling.md

Content preview:
"# API Error Handling

Our APIs use a standardized error handling approach with retry logic..."

Analysis:
- Type: Technical pattern documentation
- Technologies: Express, HTTP, REST
- Patterns: Error handling, retry logic, circuit breaker
- Domain: Backend/API
```

### 2.3 Extract Knowledge

Summarize content into knowledge format:

1. **Keep**: Patterns, code examples, decision criteria
2. **Remove**: Project-specific details, meeting notes, implementation dates
3. **Condense**: If >300 lines, extract key patterns only

**Output**: Condensed version suitable for knowledge file (70-300 lines depending on category)

### 2.4 Infer Metadata

Same as Mode 1:
- Category: Based on content analysis
- Name: Derived from main topic
- Tags: Extracted from technologies + concepts
- Description: Summary of what patterns are covered

### 2.5 Present to User

```
📋 Knowledge Package Extraction

Source: docs/architecture/api-error-handling.md
Extracted: 85 lines of patterns (from 200 line source)

Category: patterns/backend
Name: api-error-handling
Tags: api, error-handling, retry-logic, express, backend
Description: API error handling patterns with retry logic and circuit breaker implementation.

Content preview:
[Show first 20 lines of extracted content]

Create this knowledge package? (y/n/edit)
```

## Mode 3: Interactive

### 3.1 Ask for Description

```
What are you documenting?

Examples:
- "React component composition patterns"
- "Database transaction handling"
- "Risk approval workflow"

Your description:
```

### 3.2 Ask Type

Use AskUserQuestion:

```
header: "Type"
question: "Is this a technical pattern or business workflow?"
options:
  - label: "Technical pattern"
    description: "Reusable coding pattern, framework usage, architectural pattern"
  - label: "Business workflow"
    description: "Domain-specific process, approval flow, business rules"
```

### 3.3 Ask Domain

**If technical pattern:**

```
header: "Domain"
question: "Which technical area?"
options:
  - Frontend
  - Backend
  - Testing
  - Infrastructure
  - Security
  - Full-stack
```

**If business workflow:**

```
header: "Area"
question: "Which business area?"
options:
  - Workflows
  - Business rules
  - Integrations
  - Compliance
```

### 3.4 Continue with Inference

Same as Mode 1: infer name, tags, description based on gathered info.

## Step 2: Validate Category Exists

Check if category folder exists:

```bash
test -d ".claude/knowledge/vault/${category}"
```

If not exists:

```
⚠️  Category folder doesn't exist: ${category}

Options:
1. Create the folder now
2. Choose a different category

Choose: (1/2)
```

## Step 3: Create Knowledge File

### 3.1 Check for Duplicates

Search knowledge.json for similar names:

```bash
grep "${packageName}" .claude/knowledge/knowledge.json
```

If found:
```
⚠️  Similar package exists: ${existingPackage}
Location: ${existingPath}

Options:
1. Use a different name
2. Merge with existing
3. Continue anyway (will conflict)

Choose: (1/2/3)
```

### 3.2 Create File

**Filename**: `.claude/knowledge/vault/${category}/${packageName}.md`

**Content template (if from description):**

```markdown
# [Title from description]

[Description]

## Pattern 1: [Name]

[Explanation]

\`\`\`typescript
// Example code
\`\`\`

## When to Use

[Decision criteria]

## When NOT to Use

[Anti-patterns or limitations]

## Related Patterns

[Links to related knowledge]
```

**Content (if from file):**

Use extracted/condensed content from source file.

### 3.3 Update knowledge.json

Load existing knowledge.json:

```javascript
const knowledge = JSON.parse(read('.claude/knowledge/knowledge.json'))
```

Add new package:

```javascript
if (!knowledge.knowledge[category]) {
  knowledge.knowledge[category] = {}
}

knowledge.knowledge[category][packageName] = {
  tags: inferredTags,
  description: inferredDescription,
  required_knowledge: [],
  optional_knowledge: [],
  knowledge_path: `.claude/knowledge/vault/${category}/${packageName}.md`,
  category: category
}
```

Update metadata:

```javascript
// Add category if new
if (!knowledge.metadata.categories.includes(category)) {
  knowledge.metadata.categories.push(category)
  knowledge.metadata.categories.sort()
}

// Add new tags
for (const tag of inferredTags) {
  if (!knowledge.metadata.tags.includes(tag)) {
    knowledge.metadata.tags.push(tag)
  }
}
knowledge.metadata.tags.sort()
```

Write back:

```javascript
write('.claude/knowledge/knowledge.json', JSON.stringify(knowledge, null, 2))
```

## Step 4: Validate

Run validation:

```bash
node .claude/knowledge/scripts/validate-knowledge.mjs
```

If errors found, fix them automatically if possible.

## Step 5: Report Success

```
✅ Knowledge package created successfully!

Package: ${packageName}
Category: ${category}
File: .claude/knowledge/vault/${category}/${packageName}.md
Tags: ${tags.join(', ')}

Next steps:
1. Edit the file to add content: .claude/knowledge/vault/${category}/${packageName}.md
2. Test discoverability: node .claude/knowledge/scripts/knowledge-search.mjs --tags ${tags[0]}
3. Add to command profile (optional): Edit knowledge.json → command_profiles.[profile].always_load

[If from description]
File has been created with template structure. Open it to fill in patterns and examples.

[If from content]
File has been created with extracted content. Review and adjust as needed.
```

## Step 6: Open File for Editing

If from description (template), offer to open:

```
Open file for editing now? (y/n)
```

If yes:
```bash
${EDITOR} .claude/knowledge/vault/${category}/${packageName}.md
```

## Error Handling

### Category Doesn't Exist
- Offer to create it
- Suggest running /knowledge-init first

### Duplicate Package Name
- Suggest alternative names
- Offer to merge with existing

### Invalid Tags
- Warn about generic tags
- Suggest more specific alternatives
- Reference knowledge-tag-standards.md

### File Too Large (>400 lines from extraction)
- Warn user
- Suggest splitting into multiple packages
- Offer to create multiple files

## Notes

- AI infers, user confirms - never fully automatic
- Always validate against knowledge-tag-standards
- Prefer specific tags over generic
- Description should be clear and concise (≤2 sentences)
- Filename MUST match package name
