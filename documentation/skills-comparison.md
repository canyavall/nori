# Skills System: OpenCode vs Claude Code - Complete Comparison

## Executive Summary

**Skills** are reusable capabilities that AI agents can autonomously activate based on task context. Both OpenCode and Claude Code support skills, but through different mechanisms.

**Key Difference**: Claude Code has native built-in skills support, while OpenCode implements skills through the Superpowers plugin using a bootstrap injection pattern.

---

## Architecture Comparison

### OpenCode: Plugin-Based Skills (Superpowers)

**Implementation**: Skills in OpenCode are provided by the Superpowers plugin, not built into core

**Location**: `~/.config/opencode/superpowers/`

**Architecture**:
1. **Bootstrap Injection**: Superpowers plugin injects a "bootstrap" message explaining skills concept to the AI
2. **Custom Tools**: Adds `use_skill` and `find_skills` tools to the agent's toolkit
3. **Persistent Context**: Skills loaded as user messages that persist through conversation
4. **Session Compaction**: Re-injects skills after context window compaction

**How It Works**:
```
1. Session starts
   ↓
2. Superpowers hook: "chat.message" fires
   ↓
3. Inject bootstrap explanation into messages
   ↓
4. AI learns about skills and how to use them
   ↓
5. AI can call find_skills to discover available skills
   ↓
6. AI can call use_skill to load skill instructions
   ↓
7. Skill content added as persistent user message
   ↓
8. AI follows skill instructions for the task
```

**Bootstrap Message** (injected by Superpowers):
```markdown
# Superpowers: Extended Capabilities

You have access to a skill system that provides specialized instructions for complex tasks.

## Available Tools

### find_skills
Discovers available skills across all configured locations.

Returns: JSON array of skill metadata
[
  {
    "name": "skill-name",
    "description": "What the skill does",
    "path": "/path/to/skill",
    "priority": "project|user|bundled"
  }
]

### use_skill
Loads a skill's instructions into the conversation.

Input: skill name
Effect: Skill content added as a persistent user message

Once loaded, follow the skill's instructions carefully.

## Skill Discovery Locations
1. Project: .opencode/skills/ (highest priority)
2. User: ~/.config/opencode/skills/
3. Bundled: Superpowers includes common skills

## When to Use Skills
- User explicitly requests a skill
- Task matches a skill's description
- Complex workflow that a skill handles

## Important Notes
- Skills persist through conversation
- Loading a skill doesn't execute it - you must follow its instructions
- Skills can reference other skills
- After context compaction, skills are automatically reloaded
```

**Skill File Structure**:
```
.opencode/skills/
└── code-reviewer/
    └── skill.md
```

**skill.md Format**:
```markdown
---
name: code-reviewer
description: Comprehensive code review with security analysis, best practices, and actionable feedback
keywords: review, code quality, security, refactor
---

# Code Review Skill

## Purpose
Perform thorough code reviews checking for:
- Code quality and maintainability
- Security vulnerabilities
- Performance issues
- Best practices adherence

## Instructions

### 1. Get Changes
Use the `bash` tool to get diff:
\`\`\`bash
git diff --cached
\`\`\`

### 2. Analysis Checklist
For each changed file:
- [ ] Variable naming clarity
- [ ] Function complexity
- [ ] Error handling
- [ ] Security concerns (input validation, auth, secrets)
- [ ] Performance bottlenecks
- [ ] Test coverage

### 3. Output Format
Provide structured feedback:

**Critical Issues** (must fix before merge)
- Issue description
- Location: file:line
- Fix recommendation

**Suggestions** (should consider)
- Improvement opportunities
- Location: file:line
- Rationale

**Positive Feedback**
- Good patterns observed
- Strengths

### 4. Example

\`\`\`
CRITICAL: Hardcoded API key
Location: src/config.ts:12
Fix: Move to environment variable

SUGGESTION: Extract duplicate logic
Location: src/handlers.ts:45-67, 89-111
Rationale: DRY principle, easier maintenance
\`\`\`

## Dependencies
- Git repository
- Bash access
- Read tool for file inspection
```

### Claude Code: Native Skills Support

**Implementation**: Skills are a first-class feature built into Claude Code

**Location**: `.claude/skills/` (project) or `~/.claude/skills/` (user)

**Architecture**:
1. **Discovery**: Claude Code scans skill directories at startup
2. **Context Injection**: Skill descriptions added to Claude's context
3. **Automatic Activation**: Claude autonomously detects when skills apply
4. **Tool Execution**: Skills use standard tools (no custom skill tools needed)

**How It Works**:
```
1. Session starts
   ↓
2. Claude Code scans .claude/skills/ and ~/.claude/skills/
   ↓
3. Skill metadata added to system context
   ↓
4. User makes request
   ↓
5. Claude evaluates if any skill matches
   ↓
6. If match: Claude automatically loads and follows skill instructions
   ↓
7. Skills use normal tools (Read, Write, Bash, etc.)
```

**Skill File Structure**:
```
.claude/skills/
└── code-reviewer/
    ├── SKILL.md          # Required
    ├── reference.md      # Optional
    ├── examples.md       # Optional
    └── scripts/          # Optional
        └── analyze.py
```

**SKILL.md Format**:
```markdown
---
name: code-reviewer
description: "Comprehensive code review skill. PROACTIVELY use this when the user asks to review code, check changes, or prepare for a commit."
allowed-tools: Bash, Read, Grep
---

# Code Review Skill

## Purpose
Perform thorough code reviews with security analysis and actionable feedback.

## When to Use
- User says "review my code"
- User asks to check changes before commit
- User requests security analysis
- User mentions code quality

## Instructions

### Step 1: Get Changes
```bash
git diff --cached
```

If no staged changes:
```bash
git diff
```

### Step 2: Analyze
For each file:
1. Read full file for context (use Read tool)
2. Check for:
   - Security issues (SQL injection, XSS, secrets)
   - Code quality (naming, complexity, duplication)
   - Performance (inefficient loops, memory leaks)
   - Best practices (error handling, logging)

### Step 3: Report
Create structured output:

**CRITICAL**
- Issue
- Location: file:line
- Risk
- Fix

**HIGH PRIORITY**
- Issue
- Location: file:line
- Impact
- Fix

**SUGGESTIONS**
- Opportunity
- Location: file:line
- Benefit

**POSITIVE**
- Good patterns

### Example Tools Usage
```
1. Bash tool: git diff --cached
2. Read tool: src/auth.ts (to see full context)
3. Grep tool: pattern "password\s*=" (find hardcoded secrets)
4. Bash tool: git log --oneline -5 (see recent context)
```

## Notes
- Be specific with line numbers
- Explain WHY, not just WHAT
- Provide code examples for fixes
- Consider project context
```

---

## Skill Discovery & Loading

### OpenCode (Superpowers)

**Discovery Mechanism**:
```javascript
// lib/skills-core.js in Superpowers plugin

export async function findSkills() {
  const locations = [
    // Priority 1: Project skills
    join(process.cwd(), '.opencode/skills'),

    // Priority 2: User skills
    join(process.env.HOME, '.config/opencode/skills'),

    // Priority 3: Bundled skills (in Superpowers)
    join(__dirname, '../skills')
  ];

  const skills = [];

  for (const location of locations) {
    try {
      const entries = await readdir(location, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const skillPath = join(location, entry.name, 'skill.md');
        const content = await readFile(skillPath, 'utf-8');

        // Parse frontmatter
        const { attributes, body } = parseFrontmatter(content);

        skills.push({
          name: attributes.name || entry.name,
          description: attributes.description || '',
          keywords: attributes.keywords || [],
          path: skillPath,
          content: body,
          priority: getPriority(location)
        });
      }
    } catch {
      // Location doesn't exist, skip
    }
  }

  // Deduplicate: Higher priority shadows lower
  return deduplicateByName(skills);
}
```

**Loading Mechanism**:
```javascript
// use_skill tool implementation

export async function useSkill(skillName: string, context: Context) {
  const skills = await findSkills();
  const skill = skills.find(s => s.name === skillName);

  if (!skill) {
    throw new Error(`Skill "${skillName}" not found`);
  }

  // Add skill content as persistent user message
  context.messages.push({
    role: 'user',
    content: skill.content,
    // Special flag: this message persists through compaction
    noReply: true,
    metadata: {
      type: 'skill',
      name: skillName,
      loadedAt: Date.now()
    }
  });

  return `Skill "${skillName}" loaded. Follow its instructions.`;
}
```

**Re-injection After Compaction**:
```javascript
// Superpowers hook: session.compacted

"session.compacted": async (ctx) => {
  // Find all loaded skills in session metadata
  const loadedSkills = ctx.session.metadata.loadedSkills || [];

  // Re-inject each skill
  for (const skillName of loadedSkills) {
    await useSkill(skillName, ctx);
  }

  // Re-inject bootstrap
  ctx.messages.unshift({
    role: 'system',
    content: getBootstrapMessage()
  });
}
```

### Claude Code

**Discovery Mechanism**:
```typescript
// Pseudocode based on documentation

async function discoverSkills() {
  const locations = [
    // User global skills
    join(os.homedir(), '.claude/skills'),

    // Project skills
    join(process.cwd(), '.claude/skills'),

    // Plugin skills
    ...getPluginSkillPaths()
  ];

  const skills: Skill[] = [];

  for (const location of locations) {
    try {
      const dirs = await readdir(location, { withFileTypes: true });

      for (const dir of dirs) {
        if (!dir.isDirectory()) continue;

        const skillFile = join(location, dir.name, 'SKILL.md');
        const content = await readFile(skillFile, 'utf-8');

        const { frontmatter, body } = parseMarkdown(content);

        skills.push({
          name: frontmatter.name,
          description: frontmatter.description,
          allowedTools: frontmatter['allowed-tools']?.split(',').map(t => t.trim()),
          content: body,
          path: skillFile
        });
      }
    } catch {
      // Skip if location doesn't exist
    }
  }

  return skills;
}
```

**Context Injection**:
```typescript
// Skills added to system context at session start

async function buildSystemContext() {
  const skills = await discoverSkills();

  const skillSummaries = skills.map(skill =>
    `Skill: ${skill.name}\nDescription: ${skill.description}\n`
  ).join('\n');

  return {
    role: 'system',
    content: `
You have access to the following skills:

${skillSummaries}

When a user's request matches a skill's description, automatically activate that skill by following its instructions. Skills contain detailed step-by-step guidance for complex tasks.

IMPORTANT: Skills with keywords like "PROACTIVELY", "MUST BE USED", or "ALWAYS" should be activated without user explicitly asking.
`
  };
}
```

**Activation**:
```typescript
// Claude decides when to activate skills based on context

// Example: User says "review my code"
// Claude's internal reasoning:
// 1. Scan skill descriptions
// 2. Find "code-reviewer" skill with matching description
// 3. Load skill content into context
// 4. Follow skill instructions step-by-step

// No explicit tool call needed - just automatic activation
```

---

## Configuration

### OpenCode (Superpowers Plugin)

**Installation**:
```bash
# Install Superpowers plugin
cd ~/.config/opencode
git clone https://github.com/obra/superpowers.git

# Or use plugin manager (if available)
opencode plugin install superpowers
```

**Configuration** (`opencode.json`):
```json
{
  "plugins": {
    "superpowers": {
      "enabled": true,
      "config": {
        "skillLocations": [
          ".opencode/skills",
          "~/.config/opencode/skills"
        ],
        "autoLoadCommonSkills": false,
        "skillCacheTTL": 3600
      }
    }
  }
}
```

**Skill Priority**:
- Project skills shadow user skills
- User skills shadow bundled skills
- No configuration needed - automatic priority

### Claude Code

**No Special Configuration Required**

Skills are discovered automatically. Optional configuration:

**settings.json**:
```json
{
  "skills": {
    "autoActivate": true,
    "locations": [
      ".claude/skills",
      "~/.claude/skills"
    ]
  }
}
```

**Per-Agent Skill Loading**:
```markdown
---
name: security-auditor
skills: security-scanner, vulnerability-checker
---
```

This automatically loads specified skills when agent activates.

---

## Tool Access Control

### OpenCode (Superpowers)

**No Built-in Tool Restrictions for Skills**

Skills have access to all tools that the agent has access to. Tool restrictions are global or per-agent:

```json
{
  "tools": {
    "bash": "ask",
    "write": true,
    "read": true
  },
  "agent": {
    "security": {
      "tools": {
        "bash": false,
        "write": false
      }
    }
  }
}
```

**Workaround**: Skills can include guidelines about which tools to use:
```markdown
---
name: read-only-analyzer
---

# Read-Only Analysis Skill

**IMPORTANT: Only use Read, Grep, and Glob tools. Do NOT use Write, Edit, or Bash.**

...
```

### Claude Code

**Built-in Tool Restrictions Per Skill**

Skills can specify which tools they're allowed to use:

**SKILL.md**:
```markdown
---
name: read-only-analyzer
description: "Analyze code without making changes"
allowed-tools: Read, Grep, Glob, Bash(ls:*, cat:*, grep:*)
---
```

**How It Works**:
1. When skill activates, Claude Code restricts available tools
2. Only specified tools can be used while skill is active
3. Tool restrictions are enforced by the runtime
4. After skill completes, normal tool access restored

**Syntax**:
- `Read, Write, Bash` - Allow specific tools
- `Bash(git:*, npm:*)` - Allow only specific bash commands
- `Bash(ls:*, cat:*, grep:*)` - Granular command restrictions

---

## Skill Examples

### OpenCode Skill: Memory Management

**Location**: `~/.config/opencode/superpowers/skills/memory/skill.md`

```markdown
---
name: memory
description: Store and retrieve information across conversations
keywords: remember, recall, memory, save, note
---

# Memory Skill

## Purpose
Persist important information across sessions using the filesystem.

## When to Use
- User asks to remember something
- User asks to recall previous information
- Taking notes during a conversation
- Building up context over multiple sessions

## Instructions

### Store Memory
```javascript
// Use write tool
{
  tool: "write",
  path: ".opencode/memory/" + topic + ".md",
  content: informationToRemember
}
```

### Retrieve Memory
```javascript
// Use read tool
{
  tool: "read",
  path: ".opencode/memory/" + topic + ".md"
}
```

### List Memories
```javascript
// Use bash tool
{
  tool: "bash",
  command: "ls -1 .opencode/memory/"
}
```

## Memory Organization
- Use descriptive filenames: `auth-implementation.md`, `api-endpoints.md`
- Store related info together
- Update existing memories rather than creating duplicates
- Use markdown formatting for readability

## Example Interaction

User: "Remember that we're using JWT for authentication"