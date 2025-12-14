# Claude Code CLI Architecture: Technical Implementation Guide

This document provides a comprehensive technical overview of the Claude Code architecture, covering all major components, their triggering mechanisms, lifecycle, and integration patterns. This information can be used to understand or replicate the Claude Code CLI architecture.

---

## Table of Contents

1. [Core Architecture Overview](#core-architecture-overview)
2. [The Master Agent Loop](#the-master-agent-loop)
3. [Hooks System](#hooks-system)
4. [Skills System](#skills-system)
5. [Commands (Slash Commands)](#commands-slash-commands)
6. [Agents and Sub-Agents](#agents-and-sub-agents)
7. [Tools Architecture](#tools-architecture)
8. [Configuration System](#configuration-system)
9. [Context Management](#context-management)
10. [Plugin System](#plugin-system)
11. [Implementation Patterns](#implementation-patterns)

---

## Core Architecture Overview

### Layered Design

Claude Code follows a simple, layered architecture prioritizing debuggability and transparency:

```
┌─────────────────────────────────────┐
│   User Interaction Layer            │
│   (CLI, VS Code, Web UI)            │
├─────────────────────────────────────┤
│   Agent Core Scheduling Layer       │
│   ┌──────────┐    ┌──────────┐    │
│   │ nO Loop  │    │ h2A Queue│    │
│   │ (Master) │◄──►│ (Async)  │    │
│   └──────────┘    └──────────┘    │
├─────────────────────────────────────┤
│   Operational Execution             │
│   ┌──────────┬──────────┬─────────┐│
│   │ToolEngine│StreamGen │Compressor││
│   │          │          │  (wU2)   ││
│   └──────────┴──────────┴─────────┘│
└─────────────────────────────────────┘
```

### Design Philosophy

The architecture follows these principles:

1. **Simplicity Through Constraint**: Single-threaded execution with one flat message history
2. **Do the Simple Thing First**: Regex over embeddings, Markdown over databases
3. **Transparency**: Every decision is visible and debuggable
4. **Composability**: Unix philosophy - tools that can be piped and scripted

---

## The Master Agent Loop

### Core Execution Pattern

The fundamental agent loop (codenamed **nO**) follows an elegantly simple pattern:

```javascript
while (tool_call_present) {
  // 1. Claude generates a message
  const message = await claude.generate(context);

  // 2. Check for tool calls
  if (message.contains_tool_calls) {
    // 3. Execute tools
    const results = await execute_tools(message.tool_calls);

    // 4. Feed results back to Claude
    context.append(results);
  } else {
    // 5. No tool calls - stop and wait for user
    break;
  }
}
```

### Key Characteristics

- **Single-threaded**: No parallel agent personas or complex threading
- **Flat message history**: Simple append-only conversation log
- **Natural termination**: Loop ends when Claude produces plain text without tool calls
- **User-interruptible**: Can pause mid-execution for constraint injection

### Real-Time Steering (h2A Queue)

An asynchronous dual-buffer queue enables:

- **Pause/Resume Support**: Sessions can be interrupted and continued
- **Mid-Task Injection**: Users can add constraints during execution without restart
- **Seamless Adjustments**: Claude adapts its plan on the fly

```
User Input → h2A Queue → nO Loop → Tool Execution → Results → h2A Queue
     ↑                                                            ↓
     └────────────────── Context Update ←────────────────────────┘
```

### Execution Modes

**Interactive REPL Mode**:
```bash
claude  # Start interactive session
```

**Print Mode (Single-shot)**:
```bash
claude -p "your query" --allowedTools "Bash,Read" --permission-mode acceptEdits
```

**Session Continuation**:
```bash
claude --continue  # Resume in current directory
claude --resume <session-id>  # Resume specific session
```

**Headless/Programmatic**:
```bash
claude -p "query" --output-mode stream-json | process-output.sh
```

---

## Hooks System

### Overview

Hooks are automated shell commands that execute at specific lifecycle events, providing **deterministic control** over Claude Code's behavior.

### Hook Events and Triggering

Claude Code fires hooks at ten distinct lifecycle points:

| Event | Trigger Timing | Use Cases |
|-------|---------------|-----------|
| **SessionStart** | Session initiation or resume | Load context, set env vars, initialize tools |
| **SessionEnd** | Session termination | Cleanup, save state, notifications |
| **UserPromptSubmit** | Before Claude processes user input | Validation, context injection |
| **PreToolUse** | After tool parameters created, before execution | Approve/deny/modify tool calls |
| **PostToolUse** | After successful tool completion | Feedback, logging, formatting |
| **PermissionRequest** | When permission dialog appears | Auto-approve/deny specific actions |
| **Notification** | When Claude sends alerts | Custom notification handling |
| **PreCompact** | Before context window compaction | Save state before summarization |
| **Stop** | When Claude finishes responding | Task completion actions |
| **SubagentStop** | When subagent completes | Aggregate results, cleanup |

### Configuration Structure

Hooks are configured in `settings.json` with hierarchical organization:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",  // Tool name regex
        "hooks": [
          {
            "type": "command",
            "command": "/path/to/script.sh",
            "timeout": 30
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/setup-env.sh"
          }
        ]
      }
    ]
  }
}
```

### Matcher Patterns

- **Exact match**: `"Write"` - matches only Write tool
- **Regex**: `"Edit|Write"` - matches either tool
- **Wildcard**: `"*"` or `""` - matches all tools
- **MCP tools**: `"mcp__server__tool"` - matches MCP server tools

Events without tool context (SessionStart, Stop, UserPromptSubmit) omit the matcher field.

### Hook Types

#### Command Hooks

Execute bash scripts with special environment variables:

```bash
#!/bin/bash
# Available variables:
# $CLAUDE_PROJECT_DIR - Project root path
# $CLAUDE_CODE_REMOTE - "true" if web, unset if CLI
# $CLAUDE_ENV_FILE - SessionStart only, for persisting env vars

# Example: SessionStart hook
if [ -n "$CLAUDE_ENV_FILE" ]; then
  echo 'export NODE_ENV=production' >> "$CLAUDE_ENV_FILE"
  source ~/.nvm/nvm.sh && nvm use 20
fi

exit 0  # Success
```

**Exit Code Behavior**:

- **0**: Success; stdout shown in verbose mode (or added as context for UserPromptSubmit/SessionStart)
- **2**: Blocking error; stderr fed to Claude, tool call/permission denied
- **Other**: Non-blocking error; shown in verbose mode only

#### Prompt-Based Hooks

Uses Claude Haiku to evaluate decisions intelligently:

```json
{
  "type": "prompt",
  "prompt": "Review this tool call: $ARGUMENTS\n\nShould it be allowed?",
  "model": "claude-3-5-haiku-20241022"
}
```

The LLM returns structured JSON:

```json
{
  "decision": "approve",  // or "block"
  "reason": "File path is safe and within project",
  "continue": false,
  "stopReason": "User-facing message",
  "systemMessage": "Warning text"
}
```

### Input Format (stdin)

All hooks receive JSON via stdin:

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/project/path",
  "permission_mode": "default",
  "hook_event_name": "PreToolUse",
  "tool_name": "Write",
  "tool_input": {
    "path": "/path/to/file.js",
    "content": "console.log('hello');"
  }
}
```

### Output Format (stdout)

Hooks can return JSON (exit code 0 only) to control execution:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",  // "allow", "deny", "ask"
    "permissionDecisionReason": "Safe operation",
    "updatedInput": {
      "path": "/validated/path/file.js",
      "content": "// Formatted\nconsole.log('hello');\n"
    }
  },
  "continue": true,
  "stopReason": "Optional message if continue=false",
  "systemMessage": "Optional warning to display"
}
```

**Decision Controls by Event**:

- **PreToolUse**: `permissionDecision` + `updatedInput` (can modify parameters)
- **PostToolUse**: `decision` ("block" or undefined) + `additionalContext`
- **UserPromptSubmit**: `decision` ("block") or plain text with `additionalContext`
- **Stop/SubagentStop**: `decision` ("block") + `reason`
- **PermissionRequest**: `decision.behavior` ("allow"/"deny") + `message`

### Plugin Hooks

Plugins define hooks in `hooks/hooks.json`:

```json
{
  "PreToolUse": [
    {
      "matcher": "Bash",
      "hooks": [
        {
          "type": "command",
          "command": "${CLAUDE_PLUGIN_ROOT}/scripts/validate-bash.sh"
        }
      ]
    }
  ]
}
```

Use `${CLAUDE_PLUGIN_ROOT}` for plugin-relative paths.

### Execution Details

- **Timeout**: 60 seconds default, configurable per hook
- **Parallelization**: Multiple matching hooks run simultaneously
- **Deduplication**: Identical commands automatically deduplicated
- **Environment Inheritance**: Hooks inherit Claude Code's environment

### Example: File Protection Hook

```bash
#!/bin/bash
# .claude/hooks/protect-files.sh

# Read hook input
INPUT=$(cat)

# Extract tool and path
TOOL=$(echo "$INPUT" | jq -r '.tool_name')
PATH=$(echo "$INPUT" | jq -r '.tool_input.path // empty')

# Block writes to sensitive files
if [[ "$TOOL" =~ ^(Write|Edit)$ ]]; then
  if [[ "$PATH" =~ (.env|package-lock.json|.git/) ]]; then
    echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Protected file"}}' >&1
    exit 0
  fi
fi

# Allow by default
echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow"}}' >&1
exit 0
```

Configuration:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/protect-files.sh",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

---

## Skills System

### Overview

Skills are **model-invoked** capabilities that Claude autonomously activates based on task context. Unlike slash commands (user-invoked), skills are discovered and triggered by Claude itself.

### Invocation Mechanism

**Automatic Discovery**:
- Claude analyzes user requests
- Compares against skill descriptions
- Activates relevant skills without explicit user command

**Discovery Locations**:
- Personal: `~/.claude/skills/`
- Project: `.claude/skills/`
- Plugins: `<plugin>/skills/`

### File Structure

Each skill requires a directory with a `SKILL.md` file:

```
.claude/skills/
└── pdf-extractor/
    ├── SKILL.md          # Required: Skill definition
    ├── reference.md       # Optional: Additional context
    ├── examples.md        # Optional: Example usage
    └── scripts/
        └── extract.py     # Optional: Supporting scripts
```

### SKILL.md Format

```markdown
---
name: pdf-extractor
description: "Extract text content from PDF files. Use this when the user asks to read, analyze, or extract information from PDF documents."
allowed-tools: Bash, Read, Write
---

# PDF Text Extraction Skill

## Purpose
Extract text content from PDF documents using pdftotext utility.

## When to Use
- User provides a PDF file path
- User asks to analyze PDF content
- User wants to extract text from a PDF

## Instructions

1. Verify the PDF file exists using Read tool
2. Use Bash to run: `pdftotext input.pdf output.txt`
3. Read the extracted text file
4. Present findings to the user

## Requirements
- pdftotext must be installed (poppler-utils)
- Input file must be a valid PDF

## Example Usage
User: "Extract the text from report.pdf"
Response: [Follow instructions above]
```

### YAML Frontmatter Fields

| Field | Required | Description | Constraints |
|-------|----------|-------------|-------------|
| `name` | Yes | Skill identifier | Lowercase, numbers, hyphens only; max 64 chars |
| `description` | Yes | Purpose and trigger phrases | Max 1024 chars; include "when to use" |
| `allowed-tools` | No | Comma-separated tool list | Restricts Claude to specified tools |

### Tool Access Control

Restrict Claude's capabilities for security or focus:

```yaml
---
name: read-only-analyzer
description: "Analyze codebase without making changes"
allowed-tools: Read, Grep, Glob, Bash(ls:*, cat:*, grep:*)
---
```

### Lifecycle

1. **Discovery**: Claude Code scans skill directories at startup
2. **Context Addition**: Skill descriptions added to Claude's context
3. **Evaluation**: For each user request, Claude evaluates which skills apply
4. **Activation**: Claude autonomously uses skill instructions
5. **Execution**: Claude follows skill's step-by-step guidance

### Best Practices

1. **Focused Scope**: One skill = one capability
2. **Specific Descriptions**: Include concrete trigger terms
3. **Clear Instructions**: Step-by-step guidance with examples
4. **Tool Restrictions**: Limit tools to necessary functions
5. **Supporting Files**: Organize reference materials and scripts

### Example: Code Review Skill

```markdown
---
name: code-reviewer
description: "Perform comprehensive code review of staged Git changes. PROACTIVELY use this skill when the user asks to review code, check changes, or prepare for a commit."
allowed-tools: Bash, Read, Grep
---

# Code Review Skill

## Instructions

1. Get staged changes:
   ```bash
   git diff --cached
   ```

2. Analyze each file for:
   - Code quality issues
   - Potential bugs
   - Style inconsistencies
   - Security concerns
   - Performance issues

3. Check for:
   - Missing tests
   - Outdated comments
   - Console.log statements
   - TODO/FIXME markers

4. Provide structured feedback:
   - Critical issues (must fix)
   - Suggestions (should fix)
   - Questions (needs clarification)

5. Summarize findings with severity levels
```

---

## Commands (Slash Commands)

### Overview

Slash commands are **user-invoked** interactive tools that control Claude's behavior. They can be built-in or custom-defined.

### Built-in Commands (40+)

| Category | Commands | Purpose |
|----------|----------|---------|
| Session | `/clear`, `/exit`, `/rewind`, `/resume` | Conversation state |
| Config | `/config`, `/model`, `/status`, `/settings` | Settings |
| Analysis | `/context`, `/cost`, `/usage` | Statistics |
| Dev Tools | `/review`, `/sandbox`, `/doctor` | Development |
| Integration | `/mcp`, `/ide`, `/plugin` | External tools |
| Agents | `/agents`, `/skills` | Agent management |
| Memory | `/memory`, `/todos` | Context management |

### Custom Command Structure

Custom commands are Markdown files in specific directories:

- Project: `.claude/commands/`
- Personal: `~/.claude/commands/`
- Plugin: `<plugin>/commands/`

### File Format

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

## Example with arguments:
User provided: $ARGUMENTS
First arg: $1
Second arg: $2

## Example with file references:
The user can include @file.txt which will be automatically loaded.

## Example with bash execution:
!git status
!git log --oneline -10
```

### Frontmatter Fields

| Field | Purpose | Notes |
|-------|---------|-------|
| `description` | Brief summary for `/help` | Required for SlashCommand tool |
| `argument-hint` | Parameter guidance | Shown in autocomplete |
| `allowed-tools` | Available tool restrictions | Inherits from conversation if unset |
| `model` | Override default model | Useful for cheaper/faster tasks |
| `disable-model-invocation` | Prevent programmatic use | Blocks SlashCommand tool |

### Command Features

#### Namespacing

Subdirectories organize commands:

```
.claude/commands/
├── git/
│   ├── commit.md    # /commit (project:git)
│   └── review.md    # /review (project:git)
└── docs/
    └── generate.md  # /generate (project:docs)
```

#### Argument Handling

Three approaches:

```markdown
<!-- 1. All arguments as single string -->
Processing: $ARGUMENTS

<!-- 2. Positional arguments -->
Commit message: $1
Scope: $2

<!-- 3. Argument hints for guidance -->
---
argument-hint: "<commit-message> [scope]"
---
```

#### File References

Use `@` prefix to include file contents:

```bash
/review @src/app.ts @tests/app.test.ts
```

Files are automatically loaded into context.

#### Bash Execution

Prefix lines with `!` to execute commands and include output:

```markdown
---
allowed-tools: Bash(git:*)
---

Current branch:
!git rev-parse --abbrev-ref HEAD

Recent commits:
!git log --oneline -5
```

### SlashCommand Tool

Claude can programmatically invoke custom commands using the `SlashCommand` tool:

**Requirements**:
- Must have `description` in frontmatter
- Only works with custom commands (not built-in)
- Respects `disable-model-invocation: true`

**Permission Patterns**:
```json
{
  "permissions": {
    "allow": [
      "SlashCommand:/commit",           // Exact match
      "SlashCommand:/review-pr:*"       // Prefix match
    ],
    "deny": [
      "SlashCommand:/deploy-prod:*"     // Block dangerous commands
    ]
  }
}
```

### Example: Git Commit Command

```markdown
---
description: "Create a git commit with conventional commit format"
argument-hint: "[type] [scope] [message]"
allowed-tools: Bash(git:*)
model: claude-3-5-haiku-20241022
---

# Git Commit Command

## Instructions

1. Get staged changes:
!git diff --cached --stat

2. If no changes staged, inform user and exit

3. Parse arguments:
   - Type: $1 (feat, fix, docs, style, refactor, test, chore)
   - Scope: $2 (optional component/area)
   - Message: remaining arguments or prompt user

4. Create conventional commit:
   format: `type(scope): message`
   example: `feat(auth): add JWT token validation`

5. Show commit and ask for confirmation

6. Execute: `git commit -m "formatted message"`

7. Show commit hash and summary
```

### Command vs. Skill Comparison

| Aspect | Commands | Skills |
|--------|----------|--------|
| **Invocation** | Explicit user command (`/name`) | Automatic by Claude |
| **Use Case** | Quick prompts, templates | Complex workflows |
| **Complexity** | Single file | Multiple files + scripts |
| **Discovery** | Slash prefix | Description matching |
| **Scope** | Project or personal | Project or personal |

---

## Agents and Sub-Agents

### Overview

Agents are specialized AI assistants with distinct purposes, isolated context windows, and configurable tool access. They enable parallelization and context management.

### Agent Types

#### Built-in Agents

| Agent | Model | Tools | Purpose |
|-------|-------|-------|---------|
| **General-Purpose** | Sonnet | All tools | Complex multi-step tasks, code modifications |
| **Explore** | Haiku | Read-only (Glob, Grep, Read, Bash) | Fast codebase analysis |
| **Plan** | Sonnet | Research tools | Planning mode research |

#### Custom Agents

Define specialized agents for specific domains:

- Code reviewers
- Security auditors
- Documentation writers
- Test generators
- Deployment assistants

### Agent Configuration

Agents are defined in Markdown files with YAML frontmatter:

**Locations**:
- Project: `.claude/agents/`
- Personal: `~/.claude/agents/`
- Plugin: `<plugin>/agents/`

**Priority**: Project > User > Built-in

### Agent Definition Format

```markdown
---
name: security-auditor
description: "Security specialist that reviews code for vulnerabilities, authentication issues, and security best practices. PROACTIVELY use when code involves authentication, authorization, data validation, or external APIs."
tools: Read, Grep, Glob, Bash(grep:*, find:*)
model: claude-sonnet-4-5-20250929
permissionMode: default
skills: security-scanner, vulnerability-checker
---

# Security Auditor Agent

You are a security specialist focused on identifying vulnerabilities and security issues in code.

## Your Responsibilities

1. **Authentication & Authorization**
   - Verify proper authentication mechanisms
   - Check authorization logic for privilege escalation
   - Review session management

2. **Input Validation**
   - Identify missing or inadequate input validation
   - Check for SQL injection vulnerabilities
   - Look for XSS attack vectors

3. **Data Protection**
   - Verify encryption of sensitive data
   - Check for exposed secrets or credentials
   - Review data access controls

4. **API Security**
   - Validate API authentication
   - Check rate limiting
   - Review CORS configurations

## Process

1. Analyze the code for security patterns
2. Identify vulnerabilities with severity levels
3. Provide specific remediation guidance
4. Reference security standards (OWASP, CWE)

## Output Format

### Critical Issues (Fix Immediately)
- Issue description
- Location (file:line)
- Risk explanation
- Fix recommendation

### High Priority (Fix Soon)
[Same format]

### Recommendations (Consider)
[Same format]
```

### YAML Frontmatter Fields

| Field | Required | Description | Default |
|-------|----------|-------------|---------|
| `name` | Yes | Unique identifier (lowercase, hyphens) | - |
| `description` | Yes | Purpose and trigger phrases | - |
| `tools` | No | Comma-separated tool list | Inherit all |
| `model` | No | Model to use | Inherit |
| `permissionMode` | No | Permission mode | default |
| `skills` | No | Auto-loaded skill names | None |

### Permission Modes

- **default**: Normal permission prompts
- **acceptEdits**: Auto-accept file edits
- **bypassPermissions**: Execute without prompts (dangerous!)
- **plan**: Planning mode restrictions
- **ignore**: Use parent's permission mode

### Agent Lifecycle

1. **Discovery**: Claude Code scans agent directories at startup
2. **Evaluation**: Claude considers agents based on description matching
3. **Invocation**:
   - Automatic: Claude identifies matching task
   - Explicit: User requests specific agent
4. **Spawning**: New isolated context with configured tools
5. **Execution**: Agent works independently
6. **Return**: Results returned to main conversation
7. **Continuation**: Can resume via `agentId` for multi-turn work

### Invocation Patterns

#### Automatic Delegation

Claude activates agents when descriptions match the task:

```markdown
---
description: "MUST BE USED for all pull request reviews. Analyzes diffs, checks code quality, and provides structured feedback."
---
```

Keywords like "PROACTIVELY", "MUST BE USED", "ALWAYS" increase activation likelihood.

#### Explicit Invocation

```
User: "Use the security-auditor agent to review auth.ts"
```

#### Resumable Execution

```javascript
// First invocation
const result1 = await agent.run({
  agentId: "unique-id-123",
  task: "Analyze phase 1"
});

// Continue later
const result2 = await agent.run({
  agentId: "unique-id-123",  // Same ID continues context
  task: "Analyze phase 2"
});
```

Transcripts stored as `agent-{agentId}.jsonl` for persistence.

### Sub-Agent Constraints

**Key Limitation**: Sub-agents **cannot spawn other sub-agents**. This prevents:
- Infinite recursion
- Uncontrolled agent proliferation
- Context explosion

**Architecture**:
```
Main Agent (nO)
├── Sub-Agent A (dispatch_agent)
│   └── ❌ Cannot spawn more agents
└── Sub-Agent B (dispatch_agent)
    └── ❌ Cannot spawn more agents
```

### Context Management

Each sub-agent:
- **Isolated context**: Separate from main conversation
- **Clean slate**: Starts without history (unless resuming)
- **Focused output**: Returns only relevant information
- **Preserved main context**: Main conversation stays focused

**Benefits**:
- Longer effective sessions (context distributed across agents)
- Parallel exploration (multiple agents work simultaneously)
- Focused conversations (main thread not polluted with details)

**Trade-offs**:
- Latency (agents gather context from scratch)
- No shared knowledge (must explicitly pass information)

### Agent Management

Use `/agents` command for interactive management:

- View all available agents
- Create new agents (guided setup)
- Edit existing configurations
- Manage tool permissions
- Delete custom agents

### Example: Test Generator Agent

```markdown
---
name: test-generator
description: "Generate comprehensive test suites for code. Use when user asks to create tests, improve test coverage, or needs test examples."
tools: Read, Write, Bash(npm test:*, pytest:*)
model: claude-sonnet-4-5-20250929
permissionMode: acceptEdits
skills: test-patterns
---

# Test Generator Agent

Generate comprehensive, maintainable test suites following best practices.

## Process

1. **Analyze Code**
   - Read the file to be tested
   - Identify functions, classes, methods
   - Determine dependencies and edge cases

2. **Determine Test Framework**
   - Check package.json or requirements.txt
   - Use project's existing test framework
   - Common: Jest, Mocha, pytest, JUnit

3. **Generate Tests**
   - Unit tests for individual functions
   - Integration tests for component interactions
   - Edge cases and error conditions
   - Mock external dependencies

4. **Structure**
   ```
   describe('ComponentName', () => {
     describe('methodName', () => {
       it('should handle normal case', () => {});
       it('should handle edge case', () => {});
       it('should throw error for invalid input', () => {});
     });
   });
   ```

5. **Verify**
   - Run test suite
   - Ensure all tests pass
   - Check coverage if available

## Test Patterns

- **AAA**: Arrange, Act, Assert
- **Given-When-Then**: BDD style
- **One assertion per test**: Clear failure messages
- **Descriptive names**: Explain what's being tested
- **Mock external calls**: Isolate unit under test
```

---

## Tools Architecture

### Tool Categories

Claude Code provides tools across four main categories:

#### 1. Discovery/Reading Tools

| Tool | Purpose | Behavior |
|------|---------|----------|
| **Read** | Read file contents | ~2000 lines, supports offset/limit |
| **Grep** | Regex content search | Fast, uses ripgrep |
| **Glob** | Wildcard file search | Pattern matching (e.g., `**/*.ts`) |
| **Bash** | Execute commands | Risk-classified, sandboxed |

#### 2. Code Modification Tools

| Tool | Purpose | Behavior |
|------|---------|----------|
| **Edit** | Surgical file edits | Diff-based changes |
| **Write** | Create/replace files | Whole-file operations |
| **NotebookEdit** | Modify Jupyter notebooks | JSON-aware editing |

#### 3. Execution Tools

| Tool | Purpose | Behavior |
|------|---------|----------|
| **Bash** | Run shell commands | Filtered for safety |
| **BashOutput** | Retrieve background task output | Async execution support |

#### 4. Specialized Tools

| Tool | Purpose | Behavior |
|------|---------|----------|
| **WebFetch** | Retrieve web content | URL restrictions |
| **TodoWrite** | Create/update task lists | JSON task structure |
| **SlashCommand** | Invoke custom commands | Programmatic command execution |
| **BatchTool** | Group operations | Efficiency optimization |

### Tool Interface Pattern

All tools follow a consistent pattern:

```typescript
interface Tool {
  name: string;
  description: string;
  input_schema: JSONSchema;
  execute: (input: object) => Promise<string>;
}
```

**Flow**:
```
Claude generates JSON → Tool executor validates →
Sandboxed execution → Plain text result →
Fed back to Claude → Loop continues
```

### Permission System

Tools are controlled through a permission system with three states:

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Grep",
      "Glob",
      "Bash(git:*, npm:*, ls:*, cat:*)"
    ],
    "ask": [
      "Write",
      "Edit"
    ],
    "deny": [
      "Bash(rm:*, sudo:*)",
      "Read(./.env)",
      "Write(./package-lock.json)"
    ]
  }
}
```

**Rule Evaluation**:
1. Check deny rules first (highest priority)
2. Check allow rules second
3. Default to ask if no match

**Bash Rule Patterns**:
- Prefix matching: `"Bash(rm:*)"` blocks all rm commands
- Multiple patterns: `"Bash(git add:*, git commit:*)"`
- Wildcards: `"Bash(*)"` affects all bash commands

### Tool Risk Classification

Bash commands are classified by risk level:

- **Low**: `ls`, `cat`, `echo`, `pwd`
- **Medium**: `git`, `npm`, `grep`
- **High**: `rm`, `mv`, `chmod`, `curl`
- **Critical**: `sudo`, `dd`, `mkfs`

Higher risk commands trigger additional safety checks.

### Safety Mechanisms

1. **Command Injection Filtering**: Bash inputs are screened for injection patterns
2. **Path Validation**: File paths checked for traversal (`../`)
3. **Haiku Security Layer**: Claude Haiku extracts file paths from bash commands for validation
4. **Diff-First Workflow**: File changes shown as diffs before execution
5. **Audit Trail**: Complete command logging

### Tool Implementation Pattern

```python
class ReadTool:
    name = "Read"
    description = """Read file contents with optional line range.

    Examples:
    - Read entire file: {"path": "/path/to/file.py"}
    - Read lines 10-20: {"path": "/path/to/file.py", "offset": 10, "limit": 10}
    """

    input_schema = {
        "type": "object",
        "properties": {
            "path": {"type": "string", "description": "File path"},
            "offset": {"type": "integer", "description": "Starting line"},
            "limit": {"type": "integer", "description": "Number of lines"}
        },
        "required": ["path"]
    }

    async def execute(self, input_data):
        # 1. Validate input
        path = validate_path(input_data["path"])

        # 2. Check permissions
        if not check_permission("Read", path):
            raise PermissionError(f"Read access denied: {path}")

        # 3. Execute safely
        content = read_file(path, input_data.get("offset"), input_data.get("limit"))

        # 4. Return plain text
        return format_with_line_numbers(content)
```

### Batch Tool Pattern

Group operations for efficiency:

```json
{
  "tool": "BatchTool",
  "input": {
    "operations": [
      {"tool": "Read", "input": {"path": "file1.ts"}},
      {"tool": "Read", "input": {"path": "file2.ts"}},
      {"tool": "Grep", "input": {"pattern": "TODO", "path": "."}}
    ]
  }
}
```

Results aggregated and returned together.

---

## Configuration System

### File Hierarchy

Configuration files are organized in a clear precedence order:

```
1. Enterprise Managed Policies (highest)
   Platform-specific directories

2. Command-line Arguments
   --allowedTools, --model, etc.

3. Local Project Settings
   .claude/settings.local.json

4. Project Settings (version controlled)
   .claude/settings.json

5. User Settings
   ~/.claude/settings.json

6. Legacy Configuration
   ~/.claude.json

(lowest priority)
```

### settings.json Structure

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",

  "model": "sonnet",
  "alwaysThinkingEnabled": false,

  "permissions": {
    "allow": ["Read", "Grep", "Glob"],
    "ask": ["Write", "Edit"],
    "deny": ["Bash(rm:*)", "Read(./.env)"]
  },

  "env": {
    "NODE_ENV": "development",
    "DEBUG": "app:*"
  },

  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {"type": "command", "command": "~/.claude/hooks/init.sh"}
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {"type": "command", "command": ".claude/hooks/validate.sh"}
        ]
      }
    ]
  },

  "statusLine": {
    "template": "{{model}} | {{git_branch}} | {{cwd}}"
  },

  "enabledPlugins": {
    "formatter@company-marketplace": true,
    "security-scanner@company-marketplace": true
  },

  "companyAnnouncements": [
    "Use /security-review before all PRs"
  ]
}
```

### Key Configuration Options

#### Model Selection

```json
{
  "model": "sonnet",  // or "opus", "haiku", custom model ID
  "modelConfig": {
    "temperature": 1.0,
    "maxTokens": 4096
  }
}
```

#### Sandbox Configuration

```json
{
  "sandbox": {
    "enabled": true,
    "type": "docker",  // or "firejail"
    "restrictions": {
      "network": "allow",
      "filesystem": "isolated"
    }
  }
}
```

#### Memory Configuration

```json
{
  "memory": {
    "locations": [
      {"path": "CLAUDE.md", "required": true},
      {"path": "docs/ARCHITECTURE.md", "required": false}
    ]
  }
}
```

#### MCP Server Configuration

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_URL": "${DATABASE_URL}"
      }
    }
  }
}
```

Alternatively, in `.mcp.json`:

```json
{
  "mcpServers": {
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": {
        "SLACK_BOT_TOKEN": "${SLACK_BOT_TOKEN}",
        "SLACK_TEAM_ID": "${SLACK_TEAM_ID}"
      }
    }
  }
}
```

### Environment Variables

Over 50 environment variables control behavior:

| Category | Variables | Purpose |
|----------|-----------|---------|
| Auth | `ANTHROPIC_API_KEY` | API authentication |
| Model | `CLAUDE_MODEL`, `CLAUDE_MODEL_BACKEND` | Model selection |
| Execution | `CLAUDE_BASH_TIMEOUT`, `CLAUDE_TOOL_TIMEOUT` | Timeouts |
| Network | `HTTP_PROXY`, `HTTPS_PROXY` | Proxy configuration |
| Features | `CLAUDE_ALWAYS_THINKING`, `CLAUDE_CHECKPOINT_ENABLED` | Feature flags |

Can be set in `settings.json`:

```json
{
  "env": {
    "CLAUDE_BASH_TIMEOUT": "300",
    "CLAUDE_ALWAYS_THINKING": "true"
  }
}
```

### Project Context Files

**CLAUDE.md** - Automatically loaded project memory:

```markdown
# Project Context

## Architecture
This is a Next.js application with:
- Frontend: React + TypeScript
- Backend: API routes + Prisma
- Database: PostgreSQL

## Commands Available
- `/build` - Run production build
- `/test` - Run test suite
- `/deploy` - Deploy to staging

## Conventions
- Use Prettier for formatting
- Follow Airbnb style guide
- All components in /components
- Tests co-located with code
```

---

## Context Management

### Context Window Strategy

Claude Code employs multiple strategies to manage the context window:

#### 1. Automatic Compaction (wU2 Compressor)

Triggers at ~92% context usage:

1. **Identify**: Determine what can be summarized
2. **Summarize**: Create concise versions of old messages
3. **Migrate**: Move important info to CLAUDE.md
4. **Replace**: Substitute detailed history with summaries

```
Before compaction (92% full):
[Message 1] [Message 2] ... [Message 50] [Active]

After compaction (50% full):
[Summary of 1-40] [Message 41-50] [Active]
```

#### 2. Sub-Agent Distribution

Delegate work to isolated contexts:

```
Main Agent Context (50%):
├── High-level planning
├── User interaction
└── Coordination

Sub-Agent A Context (30%):
└── Detailed analysis task A

Sub-Agent B Context (40%):
└── Detailed implementation task B
```

Each agent has independent context budget.

#### 3. File-Based Memory

Long-term storage in project files:

- **CLAUDE.md**: Primary project memory
- **Additional files**: Via memory configuration
- **Automatic loading**: Loaded at session start

#### 4. Agentic Search

Instead of loading large files into context:

```bash
# Find relevant sections
grep -n "function authenticate" src/**/*.ts

# Read specific lines
sed -n '45,67p' src/auth/login.ts
```

Agent dynamically loads only what's needed.

### Checkpointing System

Automatic state tracking for recovery:

**Checkpoint Creation**:
- Every user prompt creates a checkpoint
- File states captured before modifications
- Persists across sessions (30 days)

**Recovery Options**:
1. **Conversation + Code**: Rewind both to checkpoint
2. **Code Only**: Keep conversation, revert files
3. **Conversation Only**: Keep code, rewind dialogue

**Usage**:
```
Press Esc+Esc → Select checkpoint → Choose recovery mode
```

**Storage**:
```
~/.claude/checkpoints/
└── session-abc123/
    ├── checkpoint-001.json
    ├── checkpoint-002.json
    └── files/
        ├── file1.ts.001
        └── file1.ts.002
```

### TODO-Driven Planning

TodoWrite tool creates structured task lists:

```json
{
  "todos": [
    {
      "id": "1",
      "title": "Analyze authentication flow",
      "status": "done",
      "subtasks": []
    },
    {
      "id": "2",
      "title": "Implement JWT validation",
      "status": "in_progress",
      "subtasks": [
        {"id": "2.1", "title": "Install jsonwebtoken", "status": "done"},
        {"id": "2.2", "title": "Create validation middleware", "status": "in_progress"}
      ]
    },
    {
      "id": "3",
      "title": "Write tests",
      "status": "pending"
    }
  ]
}
```

**System Reminders**: Injected into context to maintain focus:

```
System Reminder: Your TODO list shows 3 pending tasks.
Current focus: Implement JWT validation (in_progress).
```

### Session Persistence

**Session Storage** (`~/.claude.json`):

```json
{
  "sessions": {
    "abc123": {
      "id": "abc123",
      "cwd": "/path/to/project",
      "model": "sonnet",
      "transcriptPath": "/path/to/transcript.jsonl",
      "lastActive": "2025-01-15T10:30:00Z"
    }
  },
  "preferences": {
    "defaultModel": "sonnet",
    "permissionMode": "default"
  }
}
```

**Transcript Format** (JSONL):

```jsonl
{"role":"user","content":"Analyze the auth system","timestamp":1705315800000}
{"role":"assistant","content":"I'll analyze...","timestamp":1705315801000}
{"role":"assistant","content":[{"type":"tool_use","name":"Read","input":{"path":"src/auth.ts"}}],"timestamp":1705315802000}
{"role":"user","content":[{"type":"tool_result","tool_use_id":"123","content":"..."}],"timestamp":1705315803000}
```

---

## Plugin System

### Plugin Structure

```
my-plugin/
├── .claude-plugin/
│   ├── plugin.json           # Required: Metadata
│   └── marketplace.json      # Optional: Marketplace listing
├── commands/
│   ├── my-command.md
│   └── subdir/
│       └── nested-command.md
├── agents/
│   ├── specialist-agent.md
│   └── reviewer-agent.md
├── skills/
│   ├── my-skill/
│   │   └── SKILL.md
│   └── another-skill/
│       ├── SKILL.md
│       └── reference.md
├── hooks/
│   ├── hooks.json
│   └── scripts/
│       ├── validate.sh
│       └── format.py
└── .mcp.json                 # Optional: MCP servers
```

### plugin.json Format

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "Enhanced development workflow tools",
  "author": "Your Name",
  "homepage": "https://github.com/user/my-plugin",
  "repository": "https://github.com/user/my-plugin",
  "license": "MIT",
  "keywords": ["development", "workflow", "automation"],

  "commands": ["./custom-commands"],
  "agents": ["./extra-agents"],
  "hooks": ["./custom-hooks/hooks.json"],
  "mcpServers": ["./mcp-config.json"]
}
```

**Key Points**:
- Only `name` is required
- Custom paths **supplement** default directories, don't replace them
- Use `./` prefix for all relative paths
- `${CLAUDE_PLUGIN_ROOT}` available in scripts and configs

### Plugin Components

#### Commands

```
commands/
├── deploy.md          # /deploy (plugin:my-plugin)
└── testing/
    └── e2e.md         # /e2e (plugin:my-plugin:testing)
```

Accessed via `/plugin-name:command` or auto-completed.

#### Agents

```markdown
---
name: plugin-reviewer
description: "Code reviewer specialized in plugin development"
---
# Plugin Reviewer Agent
[Agent instructions...]
```

#### Skills

```
skills/
└── plugin-validator/
    ├── SKILL.md
    └── validation-script.py
```

#### Hooks

```json
{
  "PreToolUse": [
    {
      "matcher": "Write",
      "hooks": [
        {
          "type": "command",
          "command": "${CLAUDE_PLUGIN_ROOT}/scripts/validate.sh",
          "timeout": 10
        }
      ]
    }
  ]
}
```

#### MCP Servers

```json
{
  "mcpServers": {
    "custom-service": {
      "command": "${CLAUDE_PLUGIN_ROOT}/mcp-server/start.sh",
      "env": {
        "API_KEY": "${CUSTOM_SERVICE_KEY}"
      }
    }
  }
}
```

### Plugin Lifecycle

1. **Installation**:
   ```
   /plugin install my-plugin@company-marketplace
   ```

2. **Discovery**: Plugin directories scanned

3. **Registration**: Components merged with user/project configs

4. **Activation**: Commands/agents/skills become available

5. **Execution**: Hooks run in parallel with user hooks

6. **Updates**: `/plugin update my-plugin@company-marketplace`

### Plugin Management

**Enable/Disable**:
```json
{
  "enabledPlugins": {
    "formatter@company-marketplace": true,
    "deprecated-plugin@company-marketplace": false
  }
}
```

**List Installed**:
```
/plugin list
```

**Browse Available**:
```
/plugin  # Interactive browser
```

### Marketplace Structure

**marketplace.json**:

```json
{
  "name": "company-marketplace",
  "description": "Internal company plugins",
  "plugins": [
    {
      "name": "security-scanner",
      "description": "Automated security scanning",
      "version": "2.1.0",
      "source": "git@github.com:company/security-scanner.git",
      "author": "Security Team"
    },
    {
      "name": "deployment-tools",
      "description": "Deployment automation",
      "version": "1.5.3",
      "source": "https://github.com/company/deployment-tools.git",
      "author": "DevOps Team"
    }
  ]
}
```

**Installation**:
```json
{
  "enabledMarketplaces": {
    "company-marketplace": {
      "url": "https://marketplace.company.com/plugins.json",
      "autoUpdate": true
    }
  }
}
```

### Team Plugin Deployment

**Repository Setup**:

```json
// .claude/settings.json (committed to repo)
{
  "enabledMarketplaces": {
    "company-marketplace": {
      "url": "https://internal.company.com/claude-plugins.json"
    }
  },
  "enabledPlugins": {
    "code-standards@company-marketplace": true,
    "security-scanner@company-marketplace": true,
    "deployment@company-marketplace": true
  }
}
```

When team members trust the folder, plugins auto-install.

---

## Implementation Patterns

### Pattern 1: Feedback Loop

The core agent pattern:

```
┌──────────────────────────────────────────┐
│  1. Gather Context                       │
│     - Read files                         │
│     - Search codebase                    │
│     - Query user                         │
└────────────┬─────────────────────────────┘
             │
┌────────────▼─────────────────────────────┐
│  2. Take Action                          │
│     - Modify code                        │
│     - Execute commands                   │
│     - Generate artifacts                 │
└────────────┬─────────────────────────────┘
             │
┌────────────▼─────────────────────────────┐
│  3. Verify Work                          │
│     - Run tests                          │
│     - Check output                       │
│     - Validate changes                   │
└────────────┬─────────────────────────────┘
             │
             ├─── Success ────► Continue
             └─── Issues ─────► Loop to Step 1
```

Implementation:

```python
async def agent_loop(task):
    while not task.complete:
        # 1. Gather context
        context = await gather_context(task)

        # 2. Take action
        result = await claude.execute(context)

        # 3. Verify work
        verification = await verify(result)

        if verification.passed:
            task.mark_complete()
        else:
            task.update_with_feedback(verification.issues)
```

### Pattern 2: Orchestrator-Workers

Delegate to specialized sub-agents:

```
           ┌─────────────────┐
           │  Main Agent     │
           │  (Orchestrator) │
           └────────┬────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
   ┌────▼────┐ ┌───▼────┐ ┌───▼────┐
   │ Worker  │ │ Worker │ │ Worker │
   │ Agent A │ │ Agent B│ │ Agent C│
   │(Analyze)│ │(Refact)│ │(Test)  │
   └────┬────┘ └───┬────┘ └───┬────┘
        │          │          │
        └──────────┴──────────┘
                   │
           ┌───────▼────────┐
           │  Aggregate     │
           │  Results       │
           └────────────────┘
```

Implementation:

```python
async def orchestrator(task):
    # 1. Break down task
    subtasks = await plan_subtasks(task)

    # 2. Assign to workers
    workers = [
        spawn_agent("analyzer", subtasks[0]),
        spawn_agent("refactorer", subtasks[1]),
        spawn_agent("tester", subtasks[2])
    ]

    # 3. Execute in parallel
    results = await asyncio.gather(*workers)

    # 4. Aggregate and synthesize
    final_result = await synthesize(results)

    return final_result
```

### Pattern 3: Test-Driven Development

Verification-first approach:

```python
async def tdd_agent(feature_request):
    # 1. Generate tests first
    tests = await claude.execute(f"""
    Create comprehensive tests for: {feature_request}
    Do NOT implement yet, just tests.
    """)

    # 2. Verify tests fail (no implementation)
    result = await run_tests()
    assert result.failed, "Tests should fail initially"

    # 3. Implement feature
    implementation = await claude.execute(f"""
    Implement the feature to pass these tests:
    {tests}
    """)

    # 4. Verify tests pass
    result = await run_tests()

    # 5. Iterate until success
    while result.failed:
        implementation = await claude.execute(f"""
        Tests are failing:
        {result.failures}

        Fix the implementation.
        """)
        result = await run_tests()

    return implementation
```

### Pattern 4: Prompt Chaining

Sequential specialized prompts:

```python
async def prompt_chain(initial_request):
    # Step 1: Analysis
    analysis = await claude.execute(
        prompt="Analyze the requirements",
        tools=["Read", "Grep", "Glob"]
    )

    # Step 2: Design
    design = await claude.execute(
        prompt=f"Design solution for: {analysis}",
        tools=["Read"]
    )

    # Step 3: Implementation
    code = await claude.execute(
        prompt=f"Implement this design: {design}",
        tools=["Write", "Edit", "Bash"]
    )

    # Step 4: Testing
    tests = await claude.execute(
        prompt=f"Create tests for: {code}",
        tools=["Write", "Bash"]
    )

    # Step 5: Validation
    result = await claude.execute(
        prompt=f"Validate: {tests}",
        tools=["Bash"]
    )

    return result
```

### Pattern 5: Rules-Based Feedback

Explicit validation rules:

```python
async def validate_with_rules(output):
    rules = [
        {"name": "no_console_logs", "pattern": r"console\.log"},
        {"name": "has_tests", "check": lambda: test_files_exist()},
        {"name": "passes_linter", "command": "npm run lint"},
        {"name": "type_safe", "command": "tsc --noEmit"}
    ]

    violations = []

    for rule in rules:
        if not rule.passes(output):
            violations.append(rule.name)

    if violations:
        # Feed violations back to Claude
        fixed = await claude.execute(f"""
        Your output violates these rules:
        {violations}

        Fix the issues.
        """)

        return await validate_with_rules(fixed)

    return output
```

### Pattern 6: System Reminders

Periodic reinforcement for long sessions:

```python
class AgentWithReminders:
    def __init__(self):
        self.message_count = 0
        self.todos = load_todos()

    async def execute(self, user_input):
        self.message_count += 1

        # Inject reminders periodically
        if self.message_count % 5 == 0:
            reminder = self.generate_reminder()
            messages.append({"role": "system", "content": reminder})

        result = await claude.execute(messages + [user_input])

        return result

    def generate_reminder(self):
        pending = [t for t in self.todos if t.status == "pending"]

        return f"""
        Reminder: You have {len(pending)} pending tasks.
        Current focus: {self.todos.current_task()}
        Remember to update the TODO list with your progress.
        """
```

### Pattern 7: Semantic Search (Secondary)

Vector-based context retrieval:

```python
async def semantic_context_search(query):
    # 1. Embed query
    query_vector = await embed(query)

    # 2. Search vector store
    results = vector_store.search(
        query_vector,
        limit=10,
        threshold=0.7
    )

    # 3. Load relevant chunks
    context = []
    for result in results:
        content = await load_chunk(result.id)
        context.append(content)

    # 4. Provide to Claude
    return await claude.execute(
        prompt=f"Context:\n{context}\n\nQuery: {query}",
        tools=relevant_tools
    )
```

However, Claude Code primarily uses **agentic search** (grep/bash) over semantic search for transparency.

---

## Complete Example: Building a Code Review System

Let's implement a complete code review system using all components:

### 1. Configuration

**.claude/settings.json**:

```json
{
  "model": "sonnet",
  "permissions": {
    "allow": ["Read", "Grep", "Glob", "Bash(git:*)"],
    "ask": ["Write"],
    "deny": ["Bash(rm:*, sudo:*)"]
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/validate-review.sh",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

### 2. Hook Implementation

**.claude/hooks/validate-review.sh**:

```bash
#!/bin/bash

INPUT=$(cat)
PATH=$(echo "$INPUT" | jq -r '.tool_input.path')

# Only allow writes to review output directory
if [[ ! "$PATH" =~ ^\.reviews/ ]]; then
  echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Reviews must be written to .reviews/ directory"}}' >&1
  exit 0
fi

# Allow the write
echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow"}}' >&1
exit 0
```

### 3. Custom Agent

**.claude/agents/code-reviewer.md**:

```markdown
---
name: code-reviewer
description: "Comprehensive code reviewer that analyzes git diffs, checks code quality, security, and best practices. MUST BE USED for all code review requests."
tools: Read, Grep, Glob, Bash(git:*)
model: claude-sonnet-4-5-20250929
permissionMode: default
skills: security-checker, style-analyzer
---

# Code Reviewer Agent

You are an expert code reviewer focused on quality, security, and best practices.

## Review Process

1. **Get Changes**
   ```bash
   git diff main...HEAD
   ```

2. **Analyze Each File**
   For each changed file:
   - Read full context if needed
   - Identify the purpose of changes
   - Check for issues

3. **Review Checklist**

   **Code Quality**:
   - Clear, descriptive variable names
   - Appropriate function sizes
   - DRY principle followed
   - Comments where needed

   **Security**:
   - Input validation
   - No hardcoded secrets
   - Proper authentication/authorization
   - Safe data handling

   **Performance**:
   - Efficient algorithms
   - No unnecessary loops
   - Appropriate data structures
   - Resource cleanup

   **Testing**:
   - Tests included
   - Edge cases covered
   - Error cases handled

   **Style**:
   - Follows project conventions
   - Consistent formatting
   - Proper imports

4. **Output Format**
   Create structured review in `.reviews/review-{timestamp}.md`:

   ```markdown
   # Code Review - {Date}

   ## Summary
   Brief overview of changes

   ## Critical Issues (Must Fix)
   - Issue description
     - Location: `file:line`
     - Problem: Detailed explanation
     - Fix: Specific recommendation

   ## High Priority (Should Fix)
   [Same format]

   ## Suggestions (Consider)
   [Same format]

   ## Positive Feedback
   - Good practices observed

   ## Overall Assessment
   [APPROVE | REQUEST_CHANGES | NEEDS_DISCUSSION]
   ```

## Guidelines

- Be specific with line numbers
- Provide actionable feedback
- Explain *why* something is an issue
- Suggest concrete improvements
- Acknowledge good practices
- Consider project context
```

### 4. Skill Definition

**.claude/skills/security-checker/SKILL.md**:

```markdown
---
name: security-checker
description: "Automated security vulnerability scanning. Use when reviewing code for security issues, authentication, or data handling."
allowed-tools: Read, Grep, Bash(git:*)
---

# Security Checker Skill

## Security Patterns to Check

### 1. Hardcoded Secrets
```bash
grep -rn "password\s*=\s*['\"]" .
grep -rn "api_key\s*=\s*['\"]" .
grep -rn "secret\s*=\s*['\"]" .
```

### 2. SQL Injection
Search for:
- Direct string concatenation in queries
- Unparameterized queries
- Raw user input in SQL

### 3. XSS Vulnerabilities
- Unsanitized user input in HTML
- `dangerouslySetInnerHTML` in React
- Direct DOM manipulation with user data

### 4. Authentication Issues
- Missing auth checks
- Weak password requirements
- Insecure token storage

### 5. Authorization Issues
- Missing permission checks
- Privilege escalation paths
- Direct object references

## Process

1. Run automated scans
2. Manual code inspection
3. Check dependencies for vulnerabilities
4. Review authentication/authorization flow
5. Report findings with severity levels
```

### 5. Slash Command

**.claude/commands/review.md**:

```markdown
---
description: "Perform comprehensive code review of current branch changes"
allowed-tools: Bash(git:*), SlashCommand:/code-reviewer
model: claude-sonnet-4-5-20250929
---

# Code Review Command

## Process

1. Check git status
!git status

2. Get current branch
!git rev-parse --abbrev-ref HEAD

3. Confirm there are changes to review

4. Invoke the code-reviewer agent to perform detailed analysis

Use SlashCommand tool to invoke: `/code-reviewer`

5. Wait for review completion

6. Present summary to user with path to full review document
```

### 6. Usage Examples

**User invokes review**:
```
User: "/review"
```

**Flow**:
1. Slash command executes
2. Gets git status and branch
3. Invokes code-reviewer agent via SlashCommand tool
4. Agent spawns in isolated context
5. Agent:
   - Gets diff
   - Analyzes files
   - Activates security-checker skill
   - Runs security scans
   - Validates write via hook
   - Writes review to `.reviews/`
6. Agent returns summary
7. Main conversation receives results
8. User sees summary and review path

**Complete Flow Diagram**:

```
User: "/review"
    ↓
Slash Command Handler
    ↓
Execute review.md
    ├─→ Bash: git status
    ├─→ Bash: git rev-parse
    └─→ SlashCommand: code-reviewer
           ↓
    Spawn code-reviewer agent
    (isolated context)
           ↓
    Agent Loop:
    ├─→ Bash: git diff
    ├─→ Read: changed files
    ├─→ Grep: search patterns
    ├─→ Activate: security-checker skill
    │      ├─→ Bash: grep for secrets
    │      ├─→ Grep: SQL injection patterns
    │      └─→ Read: auth code
    └─→ Write: .reviews/review.md
           ↓
    [PreToolUse Hook fires]
           ↓
    validate-review.sh
    ├─→ Check path (.reviews/)
    └─→ Return: allow
           ↓
    Write executes
           ↓
    Agent returns summary
           ↓
Main conversation shows results
           ↓
User: "Show me the critical issues"
    ↓
Read: .reviews/review.md
    ↓
Extract critical section
    ↓
Present to user
```

---

## Key Architectural Principles

### 1. Simplicity Through Constraint

- Single-threaded execution
- Flat message history
- Simple while loop
- No complex orchestration

**Why**: Debuggability, predictability, maintainability

### 2. Do the Simple Thing First

- Regex over embeddings
- Markdown over databases
- Bash over custom tools
- Files over APIs

**Why**: Transparency, reliability, universality

### 3. Transparency Over Magic

- Visible tool calls
- Explicit decisions
- Diff-first workflow
- Complete audit trail

**Why**: Trust, debugging, learning

### 4. Deterministic Where Possible

- Hooks guarantee behavior
- Rules enforce constraints
- Permissions control access
- Validation catches errors

**Why**: Safety, compliance, predictability

### 5. Graceful Degradation

- Sub-agents if needed (not by default)
- Skills if matched (not forced)
- Semantic search if helpful (not primary)
- Complex only when simple fails

**Why**: Efficiency, cost, latency

---

## Summary

The Claude Code architecture demonstrates that **effective agentic systems don't require complexity**. The core components are:

1. **Master Agent Loop (nO)**: Simple while loop with tool execution
2. **Hooks**: Deterministic event-driven automation
3. **Skills**: Model-invoked autonomous capabilities
4. **Commands**: User-invoked templates and workflows
5. **Agents**: Specialized isolated assistants
6. **Tools**: Consistent interface for actions
7. **Configuration**: Hierarchical file-based settings
8. **Context Management**: Multi-strategy window management
9. **Plugins**: Composable extension system

The architecture succeeds through:
- Radical simplicity in core execution
- Strategic complexity only where needed
- Transparency and debuggability throughout
- Composability and extensibility by design

This pattern can be replicated in other agentic systems by:
1. Starting with a simple tool-use loop
2. Adding deterministic hooks for reliability
3. Enabling autonomous skills for flexibility
4. Supporting specialized agents for scale
5. Maintaining transparency and debuggability

The result is a system that is powerful yet understandable, flexible yet predictable, and complex yet maintainable.
