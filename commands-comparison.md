# OpenCode vs Claude Code: Command Systems Comparison

A comprehensive analysis of slash command implementations in OpenCode and Claude Code, including architectural patterns, features, and implementation roadmaps.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Built-in Commands](#built-in-commands)
3. [Custom Commands](#custom-commands)
4. [Command Format](#command-format)
5. [Argument Handling](#argument-handling)
6. [File References](#file-references)
7. [Bash Execution](#bash-execution)
8. [Command Discovery & Loading](#command-discovery--loading)
9. [Namespacing](#namespacing)
10. [Feature Comparison Table](#feature-comparison-table)
11. [Implementation Roadmap](#implementation-roadmap)
12. [Gap Analysis](#gap-analysis)
13. [Code Examples](#code-examples)

---

## 1. Architecture Overview

### OpenCode Command Architecture

OpenCode implements commands as **markdown-based prompt templates** that are processed and sent to the LLM:

```
User Input: /command args
    ↓
Command Parser (session/prompt.ts)
    ↓
Load Command Definition (config/config.ts)
    ↓
Process Template:
    - Replace $ARGUMENTS
    - Execute !`bash commands`
    - Load @file references
    ↓
Resolve to Prompt Parts
    ↓
Create User Message
    ↓
Send to LLM Loop
```

**Key Components:**
- `Config.loadCommand()`: Scans `command/**/*.md` files using glob patterns
- `SessionPrompt.command()`: Processes command invocation with arguments
- `ConfigMarkdown.parse()`: Extracts frontmatter and content
- `SessionPrompt.resolvePromptParts()`: Resolves file references and shell commands

### Claude Code Command Architecture

Claude Code implements commands with similar markdown templates but includes additional features:

```
User Input: /command args
    ↓
Command Handler
    ↓
Load Command Definition
    ↓
Process Template:
    - Replace $ARGUMENTS, $1, $2, etc.
    - Execute !bash commands
    - Load @file references
    ↓
Optional: Invoke via SlashCommand Tool
    ↓
Send to Agent Loop
```

**Key Features:**
- **SlashCommand Tool**: Claude can programmatically invoke custom commands
- **Namespace Support**: Commands organized in subdirectories
- **Model Invocation Control**: `disable-model-invocation` flag
- **Argument Hints**: Better autocomplete support
- **Plugin Integration**: Commands from plugins with `${CLAUDE_PLUGIN_ROOT}`

---

## 2. Built-in Commands

### OpenCode Built-in Commands

OpenCode has **2 hardcoded built-in commands**:

| Command | Description | Implementation |
|---------|-------------|----------------|
| `/init` | Create/update AGENTS.md | `command/index.ts` - Default.INIT |
| `/review` | Review changes (commit/branch/pr) | `command/index.ts` - Default.REVIEW |

Both are defined in `Command.state()` with templates from:
- `src/command/template/initialize.txt`
- `src/command/template/review.txt`

**Code Reference:**
```typescript
// packages/opencode/src/command/index.ts
const result: Record<string, Info> = {
  [Default.INIT]: {
    name: Default.INIT,
    description: "create/update AGENTS.md",
    template: PROMPT_INITIALIZE.replace("${path}", Instance.worktree),
  },
  [Default.REVIEW]: {
    name: Default.REVIEW,
    description: "review changes [commit|branch|pr], defaults to uncommitted",
    template: PROMPT_REVIEW.replace("${path}", Instance.worktree),
    subtask: true,
  },
}
```

### Claude Code Built-in Commands

Claude Code has **40+ built-in commands** organized by category:

| Category | Commands | Purpose |
|----------|----------|---------|
| **Session** | `/clear`, `/exit`, `/rewind`, `/resume` | Conversation state management |
| **Config** | `/config`, `/model`, `/status`, `/settings` | Settings and configuration |
| **Analysis** | `/context`, `/cost`, `/usage` | Statistics and metrics |
| **Dev Tools** | `/review`, `/sandbox`, `/doctor` | Development utilities |
| **Integration** | `/mcp`, `/ide`, `/plugin` | External tool integration |
| **Agents** | `/agents`, `/skills` | Agent management |
| **Memory** | `/memory`, `/todos` | Context and task management |

**Key Difference:** Claude Code has extensive built-in command infrastructure, while OpenCode focuses on custom commands with minimal built-ins.

---

## 3. Custom Commands

### OpenCode Custom Commands

**Directory Structure:**
```
.opencode/command/           # Project-level
~/.config/opencode/command/  # Global user-level
```

**Discovery Pattern:**
```typescript
// From config/config.ts
const COMMAND_GLOB = new Bun.Glob("command/**/*.md")

async function loadCommand(dir: string) {
  const result: Record<string, Command> = {}
  for await (const item of COMMAND_GLOB.scan({
    absolute: true,
    followSymlinks: true,
    dot: true,
    cwd: dir,
  })) {
    const md = await ConfigMarkdown.parse(item)
    if (!md.data) continue

    const name = extractName(item)  // Extracts from path
    const config = {
      name,
      ...md.data,
      template: md.content.trim(),
    }
    const parsed = Command.safeParse(config)
    if (parsed.success) {
      result[config.name] = parsed.data
    }
  }
  return result
}
```

**Example Command:**
```markdown
---
description: "find issue(s) on github"
model: opencode/claude-haiku-4-5
---

Search through existing issues in sst/opencode using the gh cli to find issues matching this query:

$ARGUMENTS

Consider:
1. Similar titles or descriptions
2. Same error messages or symptoms
```

### Claude Code Custom Commands

**Directory Structure:**
```
.claude/commands/            # Project-level
~/.claude/commands/          # User-level
<plugin>/commands/           # Plugin-level
```

**Additional Features:**
1. **Namespace Support:**
```
.claude/commands/
├── git/
│   ├── commit.md          # /commit (project:git)
│   └── review.md          # /review (project:git)
└── docs/
    └── generate.md        # /generate (project:docs)
```

2. **SlashCommand Tool Integration:**
```markdown
---
description: "Create git commit"
disable-model-invocation: false  # Allow programmatic use
---

Create a conventional commit...
```

Claude can invoke this automatically:
```typescript
{
  "tool": "SlashCommand",
  "input": {
    "command": "/commit",
    "arguments": "feat(auth) add JWT validation"
  }
}
```

3. **Argument Hints:**
```markdown
---
description: "Create a git commit"
argument-hint: "[type] [scope] [message]"
---
```

Shows in autocomplete as: `/commit [type] [scope] [message]`

---

## 4. Command Format

Both systems use **Markdown with YAML frontmatter**, but with different field support.

### OpenCode Command Schema

```typescript
// From config/config.ts
export const Command = z.object({
  template: z.string(),              // Required: The prompt content
  description: z.string().optional(),
  agent: z.string().optional(),      // Which agent to use
  model: z.string().optional(),      // Override model
  subtask: z.boolean().optional(),   // Force subagent invocation
})
```

**Example:**
```markdown
---
description: "spellcheck all markdown file changes"
---

Look at all the unstaged changes to markdown (.md, .mdx) files,
pull out the lines that have changed, and check for spelling and grammar errors.
```

### Claude Code Command Schema

```markdown
---
description: "Brief command summary"
argument-hint: "[required-arg] [optional-arg]"
allowed-tools: Bash(git:*), Write, Read
model: claude-3-5-haiku-20241022
disable-model-invocation: false
---

# Command prompt/instructions

Use $ARGUMENTS or $1, $2 for positional arguments.
```

**Extended Fields:**
- `argument-hint`: Shown in autocomplete
- `allowed-tools`: Restrict tool access (security)
- `disable-model-invocation`: Prevent SlashCommand tool usage

---

## 5. Argument Handling

### OpenCode Argument Processing

**Supported Patterns:**
1. `$ARGUMENTS` - All arguments as single string
2. `$1`, `$2`, `$3` - Positional arguments (up to last placeholder)
3. Automatic "swallowing" - Last placeholder gets remaining args

**Implementation:**
```typescript
// From session/prompt.ts
const argsRegex = /(?:[^\s"']+|"[^"]*"|'[^']*')+/g
const placeholderRegex = /\$(\d+)/g
const quoteTrimRegex = /^["']|["']$/g

export async function command(input: CommandInput) {
  const command = await Command.get(input.command)

  // Parse arguments (handles quotes)
  const raw = input.arguments.match(argsRegex) ?? []
  const args = raw.map((arg) => arg.replace(quoteTrimRegex, ""))

  // Find highest placeholder number
  const placeholders = command.template.match(placeholderRegex) ?? []
  let last = 0
  for (const item of placeholders) {
    const value = Number(item.slice(1))
    if (value > last) last = value
  }

  // Replace placeholders (last one swallows remaining args)
  const withArgs = command.template.replaceAll(placeholderRegex, (_, index) => {
    const position = Number(index)
    const argIndex = position - 1
    if (argIndex >= args.length) return ""
    if (position === last) return args.slice(argIndex).join(" ")
    return args[argIndex]
  })

  // Replace $ARGUMENTS
  let template = withArgs.replaceAll("$ARGUMENTS", input.arguments)

  return template
}
```

**Example:**
```markdown
Create a file named $1 in the directory $2 with the following content: $3
```

```bash
/create-file config.json src "{ \"key\": \"value\" }"
```

Becomes:
```
Create a file named config.json in the directory src
with the following content: { "key": "value" }
```

### Claude Code Argument Processing

**Same patterns as OpenCode** plus:
- Argument hints for better UX
- Integrated with autocomplete

---

## 6. File References

Both systems support `@filename` syntax to include file contents.

### OpenCode File Reference Processing

**Regex Pattern:**
```typescript
// From config/markdown.ts
export const FILE_REGEX = /(?<![\w`])@(\.?[^\s`,.]*(?:\.[^\s`,.]+)*)/g

export function files(template: string) {
  return Array.from(template.matchAll(FILE_REGEX))
}
```

**Resolution:**
```typescript
// From session/prompt.ts
export async function resolvePromptParts(template: string): Promise<PromptInput["parts"]> {
  const parts: PromptInput["parts"] = [
    { type: "text", text: template }
  ]

  const files = ConfigMarkdown.files(template)
  const seen = new Set<string>()

  await Promise.all(
    files.map(async (match) => {
      const name = match[1]
      if (seen.has(name)) return
      seen.add(name)

      const filepath = name.startsWith("~/")
        ? path.join(os.homedir(), name.slice(2))
        : path.resolve(Instance.worktree, name)

      const stats = await fs.stat(filepath).catch(() => undefined)
      if (!stats) {
        // Try as agent reference
        const agent = await Agent.get(name)
        if (agent) {
          parts.push({ type: "agent", name: agent.name })
        }
        return
      }

      if (stats.isDirectory()) {
        parts.push({
          type: "file",
          url: `file://${filepath}`,
          filename: name,
          mime: "application/x-directory",
        })
        return
      }

      parts.push({
        type: "file",
        url: `file://${filepath}`,
        filename: name,
        mime: "text/plain",
      })
    })
  )

  return parts
}
```

**Key Features:**
- Supports relative paths from worktree
- Supports `~/` for home directory
- Handles directories (lists contents)
- Falls back to agent references if not a file
- Automatically invokes Read or List tools

**Example:**
```markdown
---
description: "Review component"
---

Review the component in @src/components/Button.tsx.
Check for performance issues and suggest improvements.
```

When invoked, the Read tool is called with `src/components/Button.tsx` and results are included in the prompt.

### Claude Code File References

**Same `@` syntax with similar behavior:**
- Automatically loads file contents
- Supports relative and absolute paths
- Integrated with permission system

---

## 7. Bash Execution

Both systems support inline bash command execution with `!` prefix.

### OpenCode Bash Execution

**Regex Pattern:**
```typescript
// From config/markdown.ts
export const SHELL_REGEX = /!`([^`]+)`/g

export function shell(template: string) {
  return Array.from(template.matchAll(SHELL_REGEX))
}
```

**Execution:**
```typescript
// From session/prompt.ts
const bashRegex = /!`([^`]+)`/g

export async function command(input: CommandInput) {
  // ... template processing ...

  const shell = ConfigMarkdown.shell(template)
  if (shell.length > 0) {
    const results = await Promise.all(
      shell.map(async ([, cmd]) => {
        try {
          return await $`${{ raw: cmd }}`.nothrow().text()
        } catch (error) {
          return `Error executing command: ${error instanceof Error ? error.message : String(error)}`
        }
      })
    )

    let index = 0
    template = template.replace(bashRegex, () => results[index++])
  }

  return template
}
```

**Example:**
```markdown
---
description: "Review recent changes"
---

Recent git commits:
!`git log --oneline -10`

Review these changes and suggest any improvements.
```

Output becomes:
```
Recent git commits:
abc1234 feat: add login feature
def5678 fix: resolve validation bug
...

Review these changes and suggest any improvements.
```

**Key Features:**
- Executes in project root directory
- Captures stdout
- Handles errors gracefully
- Replaces inline with output
- All commands execute before LLM receives prompt

### Claude Code Bash Execution

**Similar syntax:** `!command` (without backticks in some docs)

```markdown
---
allowed-tools: Bash(git:*)
---

Current branch:
!git rev-parse --abbrev-ref HEAD

Recent commits:
!git log --oneline -5
```

**Differences:**
- Respects `allowed-tools` permissions
- May require tool access configuration
- Integrated with hook system for validation

---

## 8. Command Discovery & Loading

### OpenCode Discovery & Loading

**Discovery Directories:**
```typescript
// From config/config.ts
const directories = [
  Global.Path.config,                    // ~/.config/opencode/
  ...(await Array.fromAsync(
    Filesystem.up({
      targets: [".opencode"],
      start: Instance.directory,
      stop: Instance.worktree,
    }),
  )),
]

if (Flag.OPENCODE_CONFIG_DIR) {
  directories.push(Flag.OPENCODE_CONFIG_DIR)
}
```

**Loading Process:**
```typescript
for (const dir of directories) {
  result.command = mergeDeep(result.command ?? {}, await loadCommand(dir))
}
```

**Priority:** Later directories override earlier ones
- Global config loaded first
- Project configs override global
- Custom config dir (if specified) has highest priority

**Glob Pattern:**
```typescript
const COMMAND_GLOB = new Bun.Glob("command/**/*.md")
```

Searches recursively in `command/` subdirectory.

**Name Extraction:**
```typescript
const name = (() => {
  const patterns = ["/.opencode/command/", "/command/"]
  const pattern = patterns.find((p) => item.includes(p))

  if (pattern) {
    const index = item.indexOf(pattern)
    return item.slice(index + pattern.length, -3)  // Remove .md
  }
  return path.basename(item, ".md")
})()
```

**Example Paths:**
- `/.opencode/command/test.md` → command name: `test`
- `/.opencode/command/git/commit.md` → command name: `git/commit`
- `/command/issues.md` → command name: `issues`

### Claude Code Discovery & Loading

**Discovery Locations:**
```
1. Project: .claude/commands/
2. Personal: ~/.claude/commands/
3. Plugins: <plugin>/commands/
```

**Namespace Support:**
Commands in subdirectories create namespaces:
```
.claude/commands/
├── git/
│   ├── commit.md    → /commit (project:git)
│   └── review.md    → /review (project:git)
└── docs/
    └── generate.md  → /generate (project:docs)
```

**Plugin Commands:**
```
my-plugin/commands/
└── deploy.md        → /deploy (plugin:my-plugin)
```

Invoked as: `/plugin-name:command` or auto-completed

---

## 9. Namespacing

### OpenCode Namespacing

**Current Status:** ⚠️ **Partial Support**

OpenCode extracts full paths including subdirectories:
```typescript
// git/commit.md becomes "git/commit"
return item.slice(index + pattern.length, -3)
```

However, there's **no evidence of namespace UI** or special handling in the TUI.

**Implications:**
- Command name can include slashes: `git/commit`
- Must invoke with full path: `/git/commit`
- No namespace grouping in command list
- No special autocomplete for namespaces

**Example Structure:**
```
.opencode/command/
├── commit.md           → /commit
├── hello.md            → /hello
├── issues.md           → /issues
└── spellcheck.md       → /spellcheck
```

### Claude Code Namespacing

**Full Support:** ✅

**Features:**
1. **Subdirectory Organization:**
```
.claude/commands/
├── git/
│   ├── commit.md
│   └── review.md
└── testing/
    └── e2e.md
```

2. **Namespace Display:**
```
/commit (project:git)
/review (project:git)
/e2e (project:testing)
```

3. **Plugin Namespaces:**
```
/deploy (plugin:deployment-tools)
/security-scan (plugin:security)
```

4. **Autocomplete Integration:**
- Type `/` to see all commands
- Type `/git/` to see git namespace
- Shows source (project/user/plugin)

---

## 10. Feature Comparison Table

| Feature | OpenCode | Claude Code | Notes |
|---------|----------|-------------|-------|
| **Markdown Format** | ✅ | ✅ | Both use `.md` files |
| **YAML Frontmatter** | ✅ | ✅ | Both support metadata |
| **$ARGUMENTS** | ✅ | ✅ | Full argument string |
| **Positional Args ($1, $2)** | ✅ | ✅ | Individual arguments |
| **@file References** | ✅ | ✅ | Include file contents |
| **!bash Execution** | ✅ | ✅ | Inline command execution |
| **Custom Commands** | ✅ | ✅ | User-defined commands |
| **Built-in Commands** | 2 | 40+ | `/init`, `/review` vs extensive set |
| **Namespace Support** | ⚠️ Partial | ✅ Full | Paths work, no UI support |
| **Agent Selection** | ✅ | ✅ | `agent: "build"` |
| **Model Override** | ✅ | ✅ | `model: "provider/model"` |
| **Subtask Control** | ✅ | ⚠️ Different | `subtask: boolean` |
| **Description** | ✅ | ✅ | Command description |
| **Argument Hints** | ❌ | ✅ | Autocomplete guidance |
| **Tool Restrictions** | ❌ | ✅ | `allowed-tools` field |
| **Model Invocation Control** | ❌ | ✅ | `disable-model-invocation` |
| **SlashCommand Tool** | ❌ | ✅ | Programmatic invocation |
| **Plugin Commands** | ❌ | ✅ | Commands from plugins |
| **Command Priority** | Merge | Override | How conflicts resolved |
| **Global Commands** | ✅ | ✅ | User-level config |
| **Project Commands** | ✅ | ✅ | Project-level config |
| **Directory Discovery** | Glob pattern | Recursive scan | Both find nested files |
| **Home Directory Support** | ✅ | ✅ | `~/` in file references |
| **Directory References** | ✅ | ✅ | @directory lists contents |
| **Agent Fallback** | ✅ | ❌ | @name tries agent if not file |
| **Error Handling** | Graceful | Graceful | Both handle failures |
| **Quote Parsing** | ✅ | ✅ | Arguments with spaces |
| **Last Arg Swallow** | ✅ | ✅ | $3 gets remaining args |

---

## 11. Implementation Roadmap

### Phase 1: Core Enhancements (Easy Wins)

#### 1.1 Add Argument Hints
**Effort:** Low | **Value:** High

Add `argument-hint` field to command schema:

```typescript
// config/config.ts
export const Command = z.object({
  template: z.string(),
  description: z.string().optional(),
  argumentHint: z.string().optional(),  // NEW
  agent: z.string().optional(),
  model: z.string().optional(),
  subtask: z.boolean().optional(),
})
```

Update TUI to show hints in autocomplete.

#### 1.2 Add Tool Restrictions
**Effort:** Medium | **Value:** High (Security)

```typescript
export const Command = z.object({
  // ... existing fields ...
  tools: z.record(z.string(), z.boolean()).optional(),  // NEW
})
```

Pass to agent execution:
```typescript
const result = await prompt({
  sessionID: input.sessionID,
  model,
  agent: agentName,
  tools: command.tools,  // NEW
  parts,
})
```

#### 1.3 Improve Namespace UI
**Effort:** Medium | **Value:** Medium

Add namespace display in command list dialog:
```typescript
// Show: /commit (git)
// Instead of: git/commit
```

Add namespace filtering in autocomplete.

### Phase 2: SlashCommand Tool (Medium Effort)

#### 2.1 Create SlashCommand Tool
**Effort:** High | **Value:** High

```typescript
// tool/slash-command.ts
export namespace SlashCommandTool {
  export const id = "slash-command"

  export const parameters = z.object({
    command: z.string().describe("Command name to invoke"),
    arguments: z.string().optional().describe("Arguments to pass"),
  })

  export async function execute(
    args: z.infer<typeof parameters>,
    context: Tool.ExecuteContext
  ) {
    const command = await Command.get(args.command)

    // Check if disabled for model invocation
    if (command.disableModelInvocation) {
      return {
        output: `Command ${args.command} cannot be invoked programmatically`,
        title: "Command Disabled",
        metadata: {},
      }
    }

    // Execute command
    const result = await SessionPrompt.command({
      sessionID: context.sessionID,
      command: args.command,
      arguments: args.arguments || "",
      agent: context.agent,
    })

    return {
      output: "Command executed successfully",
      title: `/${args.command}`,
      metadata: { messageID: result.info.id },
    }
  }
}
```

#### 2.2 Add Permission Support
**Effort:** Medium | **Value:** High

```typescript
// Permission patterns for SlashCommand tool
permissions: {
  allow: [
    "SlashCommand:/review:*",
    "SlashCommand:/test:*",
  ],
  deny: [
    "SlashCommand:/deploy:*",
  ]
}
```

#### 2.3 Update Command Schema
**Effort:** Low | **Value:** Medium

```typescript
export const Command = z.object({
  // ... existing fields ...
  disableModelInvocation: z.boolean().optional(),  // NEW
})
```

### Phase 3: Plugin System Integration (High Effort)

#### 3.1 Plugin Command Discovery
**Effort:** High | **Value:** High

```typescript
// Scan plugin directories
const pluginDirs = await Plugin.directories()

for (const plugin of pluginDirs) {
  const commands = await loadCommand(path.join(plugin.path, "command"))

  // Prefix with plugin namespace
  for (const [name, cmd] of Object.entries(commands)) {
    result[`${plugin.name}:${name}`] = cmd
  }
}
```

#### 3.2 Plugin Variable Support
**Effort:** Medium | **Value:** Medium

Support `${PLUGIN_ROOT}` in commands:
```typescript
template = template.replaceAll(
  "${PLUGIN_ROOT}",
  plugin.rootPath
)
```

### Phase 4: Advanced Features (Nice to Have)

#### 4.1 Command Chaining
**Effort:** High | **Value:** Medium

Allow commands to invoke other commands:
```markdown
---
description: "Full test suite"
---

Run unit tests:
/test-unit

Run integration tests:
/test-integration

Generate coverage report:
/coverage
```

#### 4.2 Command Parameters Validation
**Effort:** Medium | **Value:** Medium

```markdown
---
description: "Deploy to environment"
parameters:
  - name: environment
    type: enum
    values: [dev, staging, prod]
    required: true
  - name: version
    type: string
    pattern: "^v\\d+\\.\\d+\\.\\d+$"
---

Deploy version $2 to $1
```

#### 4.3 Command History & Favorites
**Effort:** Medium | **Value:** Low

Track frequently used commands and show in quick access.

---

## 12. Gap Analysis

### What We Know

#### OpenCode Implementation (Well-Documented)

✅ **Complete Understanding:**
- Command file format (Markdown + YAML)
- Glob-based discovery pattern
- Template processing ($ARGUMENTS, !bash, @file)
- Frontmatter schema (Zod validation)
- Integration with agent system
- Subtask invocation control
- Model override mechanism
- Loading priority and merging

✅ **Code Locations:**
- Command definition: `packages/opencode/src/command/index.ts`
- Template processing: `packages/opencode/src/session/prompt.ts`
- Markdown parsing: `packages/opencode/src/config/markdown.ts`
- Config loading: `packages/opencode/src/config/config.ts`

#### Claude Code Features (From Architecture Guide)

✅ **Documented Features:**
- SlashCommand tool for programmatic invocation
- Namespace support with subdirectories
- Plugin command integration
- Tool restriction (`allowed-tools`)
- Model invocation control flag
- Argument hints for autocomplete
- 40+ built-in commands

### What We Don't Know

#### Claude Code Implementation Details

❓ **Unknown Specifics:**

1. **Built-in Command Implementation:**
   - How are 40+ built-in commands implemented?
   - Hardcoded vs. config files?
   - Source code location?
   - Can built-ins be overridden?

2. **SlashCommand Tool Details:**
   - Exact tool schema
   - Permission checking implementation
   - Error handling for disabled commands
   - Return value format
   - Integration with hooks

3. **Namespace Resolution:**
   - How are namespace conflicts resolved?
   - UI implementation for namespace display
   - Autocomplete logic for namespaces
   - Plugin namespace priority

4. **Command Execution Flow:**
   - Exact call stack from user input to execution
   - Caching mechanisms
   - Validation steps
   - Hook integration points

5. **Plugin Command Loading:**
   - Discovery algorithm
   - ${CLAUDE_PLUGIN_ROOT} resolution
   - Plugin command priority
   - Conflict resolution with user commands

6. **Tool Restriction Enforcement:**
   - How `allowed-tools` is enforced
   - Validation timing
   - Error messages
   - Override mechanisms

7. **Argument Processing:**
   - Quote handling specifics
   - Escape sequence support
   - Multi-line argument support
   - Special character handling

#### OpenCode Edge Cases

❓ **Unclear Behavior:**

1. **Namespace UI:**
   - Does TUI show `git/commit` or `/git/commit`?
   - Is there grouping by namespace?
   - How does autocomplete work with slashes?

2. **Command Conflicts:**
   - What happens if global and project define same command?
   - Does last-loaded win?
   - Is there warning/error?

3. **Agent Reference Fallback:**
   - When @name fails as file, tries agent
   - What if agent also doesn't exist?
   - Error handling?

4. **Bash Command Timing:**
   - All !commands execute before LLM call?
   - Sequential or parallel?
   - Timeout handling?

5. **Subtask Behavior:**
   - How does `subtask: true` affect execution?
   - Context isolation?
   - Return value handling?

### Knowledge Confidence Levels

| Area | Confidence | Reason |
|------|------------|--------|
| OpenCode Command Schema | 🟢 High | Full Zod schema in code |
| OpenCode Template Processing | 🟢 High | Complete implementation visible |
| OpenCode Discovery | 🟢 High | Glob pattern + directory list clear |
| Claude Code Features | 🟡 Medium | From architecture doc, not code |
| Claude Code Implementation | 🔴 Low | No code access |
| Built-in Commands | 🔴 Low | Only high-level description |
| SlashCommand Tool | 🟡 Medium | Concept clear, details unknown |
| Namespace UI | 🔴 Low | Not documented |
| Plugin Integration | 🟡 Medium | Pattern described, not implemented |

### Research Needed

To complete gap analysis, we would need:

1. **Claude Code Source Code:**
   - Command handler implementation
   - Built-in commands definition
   - SlashCommand tool code
   - Plugin system integration

2. **OpenCode TUI Testing:**
   - Test namespace display
   - Test command conflicts
   - Test edge cases

3. **Claude Code Documentation:**
   - Full built-in command reference
   - SlashCommand tool API
   - Permission system details

---

## 13. Code Examples

### OpenCode: Complete Command Implementation

#### Example 1: Git Commit Command

**File:** `.opencode/command/git/commit.md`
```markdown
---
description: "git commit and push"
---

commit and push

make sure it includes a prefix like
docs:
tui:
core:
ci:
ignore:
wip:

For anything in the packages/web use the docs: prefix.
For anything in the packages/app use the ignore: prefix.

prefer to explain WHY something was done from an end user perspective instead of
WHAT was done.

do not do generic messages like "improved agent experience" be very specific
about what user facing changes were made

if there are changes do a git pull --rebase
if there are conflicts DO NOT FIX THEM. notify me and I will fix them
```

**Usage:**
```bash
/git/commit
```

#### Example 2: Issue Search with Arguments

**File:** `.opencode/command/issues.md`
```markdown
---
description: "find issue(s) on github"
model: opencode/claude-haiku-4-5
---

Search through existing issues in sst/opencode using the gh cli to find issues matching this query:

$ARGUMENTS

Consider:

1. Similar titles or descriptions
2. Same error messages or symptoms
3. Related functionality or components
4. Similar feature requests

Please list any matching issues with:

- Issue number and title
- Brief explanation of why it matches the query
- Link to the issue

If no clear matches are found, say so.
```

**Usage:**
```bash
/issues login error
```

#### Example 3: File Reference and Bash Command

**File:** `.opencode/command/hello.md`
```markdown
---
description: "hello world with arguments and file reference"
---

hey there $ARGUMENTS

!`ls`

check out @README.md
```

**Usage:**
```bash
/hello Alice Bob
```

**Processing:**
1. Replace `$ARGUMENTS` with "Alice Bob"
2. Execute `ls` command, get output
3. Load README.md contents
4. Send combined prompt to LLM

### OpenCode: Template Processing Code

```typescript
// From packages/opencode/src/session/prompt.ts

export async function command(input: CommandInput) {
  log.info("command", input)
  const command = await Command.get(input.command)
  const agentName = command.agent ?? input.agent ?? "build"

  // Parse arguments (handle quotes)
  const raw = input.arguments.match(argsRegex) ?? []
  const args = raw.map((arg) => arg.replace(quoteTrimRegex, ""))

  // Find highest placeholder
  const placeholders = command.template.match(placeholderRegex) ?? []
  let last = 0
  for (const item of placeholders) {
    const value = Number(item.slice(1))
    if (value > last) last = value
  }

  // Replace positional arguments
  const withArgs = command.template.replaceAll(placeholderRegex, (_, index) => {
    const position = Number(index)
    const argIndex = position - 1
    if (argIndex >= args.length) return ""
    if (position === last) return args.slice(argIndex).join(" ")
    return args[argIndex]
  })

  // Replace $ARGUMENTS
  let template = withArgs.replaceAll("$ARGUMENTS", input.arguments)

  // Execute shell commands
  const shell = ConfigMarkdown.shell(template)
  if (shell.length > 0) {
    const results = await Promise.all(
      shell.map(async ([, cmd]) => {
        try {
          return await $`${{ raw: cmd }}`.nothrow().text()
        } catch (error) {
          return `Error executing command: ${error instanceof Error ? error.message : String(error)}`
        }
      }),
    )
    let index = 0
    template = template.replace(bashRegex, () => results[index++])
  }
  template = template.trim()

  // Resolve model
  const model = await (async () => {
    if (command.model) {
      return Provider.parseModel(command.model)
    }
    if (command.agent) {
      const cmdAgent = await Agent.get(command.agent)
      if (cmdAgent.model) {
        return cmdAgent.model
      }
    }
    if (input.model) return Provider.parseModel(input.model)
    return await lastModel(input.sessionID)
  })()

  const agent = await Agent.get(agentName)

  // Create parts (handle subtask mode)
  const parts =
    (agent.mode === "subagent" && command.subtask !== false) || command.subtask === true
      ? [
          {
            type: "subtask" as const,
            agent: agent.name,
            description: command.description ?? "",
            prompt: await resolvePromptParts(template).then((x) => x.find((y) => y.type === "text")?.text ?? ""),
          },
        ]
      : await resolvePromptParts(template)

  // Execute prompt
  const result = (await prompt({
    sessionID: input.sessionID,
    messageID: input.messageID,
    model,
    agent: agentName,
    parts,
  })) as MessageV2.WithParts

  // Publish event
  Bus.publish(Command.Event.Executed, {
    name: input.command,
    sessionID: input.sessionID,
    arguments: input.arguments,
    messageID: result.info.id,
  })

  return result
}
```

### OpenCode: File Reference Resolution

```typescript
// From packages/opencode/src/session/prompt.ts

export async function resolvePromptParts(template: string): Promise<PromptInput["parts"]> {
  const parts: PromptInput["parts"] = [
    {
      type: "text",
      text: template,
    },
  ]

  const files = ConfigMarkdown.files(template)
  const seen = new Set<string>()

  await Promise.all(
    files.map(async (match) => {
      const name = match[1]
      if (seen.has(name)) return
      seen.add(name)

      // Resolve path (support ~/)
      const filepath = name.startsWith("~/")
        ? path.join(os.homedir(), name.slice(2))
        : path.resolve(Instance.worktree, name)

      const stats = await fs.stat(filepath).catch(() => undefined)
      if (!stats) {
        // Try as agent reference
        const agent = await Agent.get(name)
        if (agent) {
          parts.push({
            type: "agent",
            name: agent.name,
          })
        }
        return
      }

      if (stats.isDirectory()) {
        parts.push({
          type: "file",
          url: `file://${filepath}`,
          filename: name,
          mime: "application/x-directory",
        })
        return
      }

      parts.push({
        type: "file",
        url: `file://${filepath}`,
        filename: name,
        mime: "text/plain",
      })
    }),
  )

  return parts
}
```

### OpenCode: Command Discovery

```typescript
// From packages/opencode/src/config/config.ts

const COMMAND_GLOB = new Bun.Glob("command/**/*.md")

async function loadCommand(dir: string) {
  const result: Record<string, Command> = {}

  for await (const item of COMMAND_GLOB.scan({
    absolute: true,
    followSymlinks: true,
    dot: true,
    cwd: dir,
  })) {
    const md = await ConfigMarkdown.parse(item)
    if (!md.data) continue

    const name = (() => {
      const patterns = ["/.opencode/command/", "/command/"]
      const pattern = patterns.find((p) => item.includes(p))

      if (pattern) {
        const index = item.indexOf(pattern)
        return item.slice(index + pattern.length, -3)
      }
      return path.basename(item, ".md")
    })()

    const config = {
      name,
      ...md.data,
      template: md.content.trim(),
    }

    const parsed = Command.safeParse(config)
    if (parsed.success) {
      result[config.name] = parsed.data
      continue
    }
    throw new InvalidError({ path: item }, { cause: parsed.error })
  }

  return result
}
```

### Proposed: SlashCommand Tool for OpenCode

```typescript
// packages/opencode/src/tool/slash-command.ts

import { z } from "zod"
import { Command } from "../command"
import { SessionPrompt } from "../session/prompt"
import type { Tool } from "./registry"

export namespace SlashCommandTool {
  export const id = "slash-command"
  export const description = `
Programmatically invoke custom slash commands.

Use this tool when you need to execute a predefined command template
with specific arguments. This is useful for:
- Running project-specific workflows
- Executing common development tasks
- Invoking specialized command sequences

Example:
{
  "command": "test",
  "arguments": "unit --coverage"
}
  `.trim()

  export const parameters = z.object({
    command: z.string().describe("The command name to invoke (without / prefix)"),
    arguments: z.string().optional().describe("Arguments to pass to the command"),
  })

  export async function init(): Promise<Tool.Info> {
    return {
      id,
      description,
      parameters,
      execute,
    }
  }

  export async function execute(
    args: z.infer<typeof parameters>,
    context: Tool.ExecuteContext
  ): Promise<Tool.Result> {
    const command = await Command.get(args.command)

    if (!command) {
      return {
        output: `Command '${args.command}' not found`,
        title: "Command Not Found",
        metadata: { error: true },
      }
    }

    // Check if command allows model invocation
    if (command.disableModelInvocation) {
      return {
        output: `Command '${args.command}' cannot be invoked programmatically. Set 'disableModelInvocation: false' in command frontmatter to allow.`,
        title: "Command Disabled",
        metadata: { error: true },
      }
    }

    // Execute the command
    const result = await SessionPrompt.command({
      sessionID: context.sessionID,
      messageID: context.messageID,
      command: args.command,
      arguments: args.arguments || "",
      agent: context.agent,
    })

    return {
      output: `Command /${args.command} executed successfully`,
      title: `/${args.command}`,
      metadata: {
        messageID: result.info.id,
        command: args.command,
        arguments: args.arguments,
      },
    }
  }
}
```

**Schema Extension:**
```typescript
// packages/opencode/src/config/config.ts

export const Command = z.object({
  template: z.string(),
  description: z.string().optional(),
  agent: z.string().optional(),
  model: z.string().optional(),
  subtask: z.boolean().optional(),

  // NEW FIELDS for Claude Code compatibility
  argumentHint: z.string().optional()
    .describe("Hint shown in autocomplete, e.g., '[type] [scope] [message]'"),
  allowedTools: z.array(z.string()).optional()
    .describe("Tools available during command execution, e.g., ['Bash', 'Read']"),
  disableModelInvocation: z.boolean().optional().default(false)
    .describe("If true, prevents SlashCommand tool from invoking this command"),
})
```

---

## Summary

### Key Similarities

Both OpenCode and Claude Code share a robust foundation:
- Markdown files with YAML frontmatter
- Template-based prompt generation
- Argument substitution ($ARGUMENTS, $1, $2, etc.)
- File reference system (@filename)
- Bash command execution (!command)
- Agent and model override support
- Hierarchical configuration (global/project)

### Key Differences

| Aspect | OpenCode | Claude Code |
|--------|----------|-------------|
| **Philosophy** | Minimal built-ins, focus on custom | Extensive built-ins + custom |
| **Built-in Count** | 2 | 40+ |
| **SlashCommand Tool** | ❌ Not implemented | ✅ Full support |
| **Namespace UI** | ⚠️ Paths work, no UI | ✅ Full UI support |
| **Tool Restrictions** | ❌ Not available | ✅ `allowed-tools` field |
| **Argument Hints** | ❌ Not available | ✅ Autocomplete hints |
| **Plugin Commands** | ❌ Not implemented | ✅ Full support |
| **Model Invocation Control** | ❌ Not available | ✅ `disable-model-invocation` |

### Implementation Priority

**High Value, Low Effort:**
1. Add `argumentHint` field (autocomplete UX)
2. Improve namespace display in TUI
3. Add `disableModelInvocation` field

**High Value, Medium Effort:**
4. Implement `allowedTools` restriction
5. Create SlashCommand tool
6. Add permission patterns for SlashCommand

**High Value, High Effort:**
7. Plugin command discovery
8. Plugin variable resolution (${PLUGIN_ROOT})
9. Built-in command expansion

**Future Enhancements:**
10. Command chaining
11. Parameter validation
12. Command history/favorites

---

## References

### OpenCode Source Files
- `packages/opencode/src/command/index.ts` - Command definitions
- `packages/opencode/src/session/prompt.ts` - Template processing
- `packages/opencode/src/config/markdown.ts` - Markdown parsing
- `packages/opencode/src/config/config.ts` - Config loading
- `packages/web/src/content/docs/commands.mdx` - Documentation

### Claude Code Documentation
- Claude Code Architecture Guide (claude-code-architecture-guide.md)
- Commands section (Lines 517-709)
- SlashCommand Tool section (Lines 641-663)

### Example Commands
- `.opencode/command/commit.md`
- `.opencode/command/hello.md`
- `.opencode/command/issues.md`
- `.opencode/command/spellcheck.md`
