---
description: Extract knowledge from existing documentation or conversations
allowed-tools: Read(*), Write(*), Bash(*), Glob(*), Grep(*), mcp__serena__*(*), AskUserQuestion(*)
argument-hint: <source-file-or-url>
---

# Knowledge Extract Command - Extract Reusable Knowledge

Extract knowledge patterns from existing documentation, code, or conversation history.

## Usage

```bash
# From local file
/knowledge-extract docs/architecture/api-patterns.md

# From multiple files
/knowledge-extract docs/architecture/*.md

# From conversation (last N messages)
/knowledge-extract --from-conversation --messages 50

# From URL (Confluence, Notion, etc.)
/knowledge-extract https://confluence.company.com/display/ARCH/API+Patterns
```

## Step 1: Parse Arguments and Identify Source

Determine source type:

```javascript
if (arg === '--from-conversation') {
  sourceType = 'conversation'
  messageCount = args.messages || 20
} else if (arg.startsWith('http://') || arg.startsWith('https://')) {
  sourceType = 'url'
  sourceUrl = arg
} else if (arg.includes('*')) {
  sourceType = 'glob'
  globPattern = arg
} else {
  sourceType = 'file'
  sourceFile = arg
}
```

## Step 2: Read Source Content

### 2.1 File Source

```javascript
const content = read(sourceFile)
const lines = content.split('\n').length

console.log(`📄 Reading file: ${sourceFile} (${lines} lines)`)
```

### 2.2 Glob Pattern

```bash
# Find matching files
matches=$(find . -path "${globPattern}" -type f)

# Read all matches
for file in $matches; do
  content+=$(cat "$file")
  content+="\n\n---\n\n"
done
```

### 2.3 URL Source

```bash
# Use curl to fetch
curl -s "${sourceUrl}" > /tmp/extracted-content.html

# Convert HTML to markdown (if needed)
# Or use WebFetch tool
```

### 2.4 Conversation Source

```
⚠️  Conversation extraction reads your last ${messageCount} messages in this session.

This will extract:
- Code patterns we discussed
- Solutions we implemented
- Decisions we made

Exclude:
- Debugging attempts
- Failed approaches
- Off-topic discussion

Continue? (y/n)
```

If yes, read conversation history from session.

## Step 3: Analyze Content

### 3.1 Detect Content Type

Analyze first 100 lines to determine:

```javascript
const contentAnalysis = {
  hasCodeBlocks: content.includes('```'),
  hasMarkdown: /^#{1,6}\s/.test(content),
  hasBulletPoints: /^[\*\-]\s/.test(content),
  hasTechTerms: detectTechnologies(content),
  hasWorkflowKeywords: /workflow|process|approval|step|stage/.test(content),
  hasPatternKeywords: /pattern|best practice|guideline|standard/.test(content)
}
```

### 3.2 Identify Technologies

Scan for technology mentions:

```javascript
const technologies = []
const techPatterns = {
  react: /\breact\b/i,
  vue: /\bvue(\.js)?\b/i,
  angular: /\bangular\b/i,
  typescript: /\btypescript\b/i,
  express: /\bexpress(\.js)?\b/i,
  nestjs: /\bnestjs\b/i,
  jest: /\bjest\b/i,
  docker: /\bdocker\b/i,
  kubernetes: /\bk8s|kubernetes\b/i,
  // ... more patterns
}

for (const [tech, pattern] of Object.entries(techPatterns)) {
  if (pattern.test(content)) {
    technologies.push(tech)
  }
}
```

### 3.3 Extract Key Sections

Identify reusable knowledge sections:

```javascript
// Look for pattern descriptions
const patternSections = content.match(/##\s+Pattern:\s+(.+?)(?=##|$)/gs)

// Look for code examples
const codeBlocks = content.match(/```[\s\S]+?```/g)

// Look for decision criteria
const decisionSections = content.match(/##\s+When to (use|apply)(.+?)(?=##|$)/gs)

// Look for workflow steps
const workflowSections = content.match(/##\s+Step \d+:(.+?)(?=##|$)/gs)
```

### 3.4 Categorize Content

Determine if this is:

```javascript
const contentCategory = {
  isTechnicalPattern: hasPatternKeywords && hasCodeBlocks && technologies.length > 0,
  isBusinessWorkflow: hasWorkflowKeywords && !hasCodeBlocks,
  isArchitectureDoc: /architecture|design|decision/.test(content),
  isInfrastructure: technologies.some(t => ['docker', 'kubernetes', 'terraform'].includes(t)),
  isMultiplePatterns: (patternSections?.length || 0) > 1
}
```

## Step 4: Decide Extraction Strategy

### Strategy 1: Single Pattern (if one clear pattern)

```
Content analysis:
- Type: Technical pattern
- Technologies: React, TypeScript
- Patterns found: 1 (Component composition)
- Code examples: 3

Extraction strategy: Single knowledge package
```

### Strategy 2: Multiple Patterns (if multiple distinct patterns)

```
Content analysis:
- Type: Technical pattern
- Technologies: Express, Node.js, Redis
- Patterns found: 3 (Error handling, Retry logic, Circuit breaker)
- Code examples: 8

Extraction strategy: Split into 3 knowledge packages:
1. api-error-handling
2. api-retry-logic
3. api-circuit-breaker
```

### Strategy 3: Workflow (if business workflow)

```
Content analysis:
- Type: Business workflow
- Keywords: approval, risk, calculation, steps
- Workflow steps: 5
- Code examples: 0

Extraction strategy: Single workflow documentation
```

## Step 5: Present Extraction Plan

Show user what will be extracted:

```
📊 Extraction Plan

Source: docs/architecture/api-patterns.md (482 lines)
Detected: Technical patterns (Express, Node.js, TypeScript)

Proposed knowledge packages: 3

1. api-error-handling
   Category: patterns/backend
   Tags: api, error-handling, express, backend, http
   Content: 85 lines (patterns + code examples)
   Description: Standardized API error handling with typed error responses.

2. api-retry-logic
   Category: patterns/backend
   Tags: api, retry, resilience, backend, axios
   Content: 62 lines (retry patterns + backoff strategies)
   Description: Retry logic for API calls with exponential backoff and circuit breaker.

3. api-rate-limiting
   Category: patterns/backend
   Tags: api, rate-limiting, express, middleware, backend
   Content: 48 lines (rate limiting middleware + Redis integration)
   Description: Rate limiting middleware using Redis for distributed systems.

Total extracted: 195 lines from 482 line source (40% is reusable patterns)

Preview package 1: api-error-handling
[Show first 30 lines]

Options:
1. Create all 3 packages
2. Select specific packages
3. Adjust categories/tags
4. Cancel

Choose: (1/2/3/4)
```

## Step 6: Extract and Condense Content

For each package:

### 6.1 Extract Relevant Sections

```javascript
// For api-error-handling package
const relevantSections = [
  extractSection(content, 'Error Handling'),
  extractCodeBlocks(content, 'error', 'ErrorResponse'),
  extractSection(content, 'Error Types'),
  extractSection(content, 'Best Practices')
]
```

### 6.2 Remove Project-Specific Details

```javascript
// Remove mentions of specific services/repos
content = content.replace(/in our \w+ service/g, 'in your service')
content = content.replace(/repo: \S+/g, '')

// Remove implementation dates
content = content.replace(/implemented on \d{4}-\d{2}-\d{2}/g, '')

// Remove meeting notes
content = content.replace(/## Meeting Notes[\s\S]*?(?=##|$)/g, '')

// Remove TODOs
content = content.replace(/- \[ \] TODO:.*/g, '')
```

### 6.3 Format as Knowledge

Structure as knowledge file:

```markdown
# ${title}

${description}

## Overview

${overview}

## Pattern: ${patternName}

${explanation}

\`\`\`typescript
${codeExample}
\`\`\`

## When to Use

${useCases}

## Implementation

${implementationSteps}

## Common Pitfalls

${antipatterns}

## Related Patterns

${relatedKnowledge}
```

### 6.4 Validate Line Count

Check if within limits:

```javascript
const lines = content.split('\n').length
const categoryLimits = {
  'patterns/*': 100,
  'domain/*': 300,
  'infrastructure/*': 100
}

if (lines > limit) {
  console.warn(`⚠️  Package ${packageName} is ${lines} lines (limit: ${limit})`)
  console.warn(`Consider splitting into smaller packages or condensing content.`)
}
```

## Step 7: Infer Metadata (Same as /knowledge-create)

For each package:

1. **Category**: Infer from content type and technologies
2. **Name**: Derive from main pattern/topic
3. **Tags**: Extract from technologies + concepts
4. **Description**: Summarize key value

Ask user to confirm each package's metadata.

## Step 8: Create Knowledge Files

For each approved package:

### 8.1 Create File

```javascript
const filePath = `.claude/knowledge/vault/${category}/${packageName}.md`
write(filePath, extractedContent)
```

### 8.2 Update knowledge.json

Same as /knowledge-create:

```javascript
knowledge.knowledge[category][packageName] = {
  tags: tags,
  description: description,
  required_knowledge: [],
  optional_knowledge: suggestRelated(), // Auto-suggest based on content
  knowledge_path: filePath,
  category: category,
  source: sourceFile, // Track origin
  extracted_date: new Date().toISOString()
}
```

### 8.3 Link Related Packages

If multiple packages created from same source, link them:

```javascript
// api-error-handling
optional_knowledge: ['api-retry-logic', 'api-rate-limiting']

// api-retry-logic
required_knowledge: ['api-error-handling']
optional_knowledge: ['api-circuit-breaker']
```

## Step 9: Create Source Link

Add comment at top of each extracted file:

```markdown
<!--
Extracted from: docs/architecture/api-patterns.md
Extraction date: 2024-12-07
Original size: 482 lines
Extracted: 85 lines (patterns only)
-->

# API Error Handling

...
```

## Step 10: Validate

Run validation:

```bash
node .claude/knowledge/scripts/validate-knowledge.mjs
```

## Step 11: Report Success

```
✅ Knowledge extraction complete!

Created 3 packages from: docs/architecture/api-patterns.md

Packages created:
  1. patterns/backend/api-error-handling.md (85 lines)
     Tags: api, error-handling, express, backend, http

  2. patterns/backend/api-retry-logic.md (62 lines)
     Tags: api, retry, resilience, backend, axios

  3. patterns/backend/api-rate-limiting.md (48 lines)
     Tags: api, rate-limiting, express, middleware, backend

Total: 195 lines of reusable patterns extracted (40% of source)

knowledge.json updated:
  ✅ 3 packages added
  ✅ 8 new tags
  ✅ Related packages linked

Next steps:
  1. Review extracted files for accuracy
  2. Test discoverability: node .claude/knowledge/scripts/knowledge-search.mjs --tags api,error-handling
  3. Consider adding to command profiles: knowledge.json → command_profiles.implementation.always_load
```

## Special Cases

### Conversation Extraction

When extracting from conversation:

1. **Identify pattern discussions** (not debugging)
2. **Extract final solutions** (not failed attempts)
3. **Generalize examples** (remove session-specific details)
4. **Attribute authorship** (if user provided pattern vs AI suggested)

Example:

```markdown
<!--
Extracted from: conversation session-abc123
Date: 2024-12-07
Pattern emerged during: React form refactoring discussion
-->

# React Controlled Form Pattern

During implementation of user registration, we established this pattern...

[Pattern continues]
```

### Multi-file Extraction

When extracting from glob pattern:

1. **Group by topic** (combine related files)
2. **Deduplicate** (merge similar sections)
3. **Preserve best examples** (keep highest quality code)

### URL Extraction

When extracting from URL:

1. **Fetch content** (curl or WebFetch)
2. **Convert to markdown** (if HTML)
3. **Clean formatting** (remove navigation, ads)
4. **Extract core content** (main article only)
5. **Cite source** (add URL in comment)

## Error Handling

### Source Not Found
```
❌ Error: File not found: docs/nonexistent.md

Check:
- File path is correct
- File exists in repository
- You have read permissions
```

### No Patterns Found
```
⚠️  No extractable patterns found in source

The file contains:
- Project-specific implementation details
- Meeting notes
- TODO lists

But no reusable patterns or knowledge.

Consider:
- Refining the source file
- Using a different source
- Creating knowledge manually with /knowledge-create
```

### Content Too Large
```
⚠️  Source file is very large: 2,450 lines

This will take significant time to process.

Options:
1. Continue anyway
2. Specify specific sections to extract
3. Use glob pattern to process in chunks

Choose: (1/2/3)
```

## Notes

- Extraction preserves attribution (source file/URL in comment)
- Multiple packages can be created from one source
- Related packages are automatically linked
- Always removes project-specific details
- User confirms before creating files
- Line limits are validated (warn if exceeded)
