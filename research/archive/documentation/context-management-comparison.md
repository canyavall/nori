# Context Management Comparison: OpenCode vs Claude Code

## Executive Summary

This document provides a comprehensive comparison of how OpenCode and Claude Code manage context windows, including automatic compaction strategies, session persistence, checkpoint systems, and memory files. The analysis is based on the OpenCode codebase, Anthropic SDK patterns, and Claude Code architectural documentation.

**Key Findings**:
- **OpenCode** uses automatic pruning and compaction with configurable thresholds
- **Claude Code** employs a multi-layered strategy including wU2 compressor, checkpoints, and CLAUDE.md files
- **Anthropic SDK** provides `CompactionControl` interface for token threshold management
- Both systems use sub-agents to distribute context load across isolated contexts

---

## Table of Contents

1. [Context Window Strategy](#1-context-window-strategy)
2. [Automatic Compaction](#2-automatic-compaction)
3. [Session Persistence](#3-session-persistence)
4. [Checkpoint System](#4-checkpoint-system)
5. [Memory Files](#5-memory-files)
6. [Sub-agent Distribution](#6-sub-agent-distribution)
7. [Implementation Details](#7-implementation-details)
8. [Anthropic SDK Patterns](#8-anthropic-sdk-patterns)
9. [Feature Comparison Table](#9-feature-comparison-table)
10. [Implementation Roadmap](#10-implementation-roadmap)
11. [Gap Analysis](#11-gap-analysis)

---

## 1. Context Window Strategy

### OpenCode Approach

OpenCode employs a **reactive compaction strategy** with two main mechanisms:

1. **Pruning**: Removes old tool outputs when context reaches protection threshold
2. **Compaction**: Summarizes conversation history when context overflows
3. **Sub-agents**: Delegates complex tasks to isolated contexts

**Key Characteristics**:
- Trigger-based (responds to token count)
- Automatic with opt-out flags
- Prunes oldest tool results first
- Creates summary messages replacing history

**Code Location**: `C:\Users\canya\Documents\projects\nori\opencode-fork\packages\opencode\src\session\compaction.ts`

### Claude Code Approach

Claude Code uses a **multi-layered proactive strategy**:

1. **wU2 Compressor**: Automatic compaction at ~92% context usage
2. **Checkpointing**: File-level state tracking for recovery
3. **CLAUDE.md**: Persistent project memory outside context
4. **Agentic Search**: Dynamic loading instead of bulk context inclusion
5. **Sub-agents**: Parallel task execution in isolated contexts

**Key Characteristics**:
- Multi-faceted approach
- Triggers earlier (92% vs 100%)
- Preserves critical information in persistent files
- Supports recovery and rollback

### Comparison

| Aspect | OpenCode | Claude Code |
|--------|----------|-------------|
| **Strategy** | Reactive compaction | Multi-layered proactive |
| **Trigger Point** | 100% overflow | ~92% usage |
| **Primary Mechanism** | Pruning + Summarization | wU2 + Checkpoints + Memory Files |
| **Recovery** | Limited (revert to snapshots) | Full (conversation + code rollback) |
| **Persistent Memory** | AGENTS.md, CLAUDE.md (optional) | CLAUDE.md (primary), additional files |

---

## 2. Automatic Compaction

### OpenCode Implementation

OpenCode has two levels of automatic compaction:

#### Level 1: Pruning

**Purpose**: Remove old tool outputs to free tokens without losing conversation flow

**Algorithm**:
```typescript
export const PRUNE_MINIMUM = 20_000
export const PRUNE_PROTECT = 40_000

export async function prune(input: { sessionID: string }) {
  if (Flag.OPENCODE_DISABLE_PRUNE) return

  const msgs = await Session.messages({ sessionID: input.sessionID })
  let total = 0
  let pruned = 0
  const toPrune = []
  let turns = 0

  // Walk backwards through messages
  loop: for (let msgIndex = msgs.length - 1; msgIndex >= 0; msgIndex--) {
    const msg = msgs[msgIndex]
    if (msg.info.role === "user") turns++
    if (turns < 2) continue  // Protect last 2 user turns
    if (msg.info.role === "assistant" && msg.info.summary) break loop

    for (let partIndex = msg.parts.length - 1; partIndex >= 0; partIndex--) {
      const part = msg.parts[partIndex]
      if (part.type === "tool" && part.state.status === "completed") {
        if (part.state.time.compacted) break loop  // Stop at previous compaction
        const estimate = Token.estimate(part.state.output)
        total += estimate

        // Keep last 40k tokens of tool results
        if (total > PRUNE_PROTECT) {
          pruned += estimate
          toPrune.push(part)
        }
      }
    }
  }

  // Only prune if we can save at least 20k tokens
  if (pruned > PRUNE_MINIMUM) {
    for (const part of toPrune) {
      if (part.state.status === "completed") {
        part.state.time.compacted = Date.now()  // Mark as compacted
        await Session.updatePart(part)
      }
    }
  }
}
```

**Strategy**:
- Protects last 2 user conversation turns
- Keeps most recent 40,000 tokens of tool outputs
- Only prunes if at least 20,000 tokens can be saved
- Marks parts as compacted to prevent re-processing

#### Level 2: Compaction (Summarization)

**Trigger**:
```typescript
export function isOverflow(input: {
  tokens: MessageV2.Assistant["tokens"];
  model: Provider.Model
}) {
  if (Flag.OPENCODE_DISABLE_AUTOCOMPACT) return false
  const context = input.model.limit.context
  if (context === 0) return false

  const count = input.tokens.input + input.tokens.cache.read + input.tokens.output
  const output = Math.min(
    input.model.limit.output,
    SessionPrompt.OUTPUT_TOKEN_MAX
  ) || SessionPrompt.OUTPUT_TOKEN_MAX
  const usable = context - output

  return count > usable
}
```

**Process**:
```typescript
export async function process(input: {
  parentID: string
  messages: MessageV2.WithParts[]
  sessionID: string
  model: { providerID: string; modelID: string }
  agent: string
  abort: AbortSignal
  auto: boolean
}) {
  // Create summary assistant message
  const msg = await Session.updateMessage({
    id: Identifier.ascending("message"),
    role: "assistant",
    parentID: input.parentID,
    sessionID: input.sessionID,
    mode: input.agent,
    summary: true,  // Marks this as a summary message
    // ... other fields
  })

  // Send conversation to model for summarization
  const result = await processor.process({
    messages: [
      ...system.map((x): ModelMessage => ({
        role: "system",
        content: x,
      })),
      ...MessageV2.toModelMessage(
        input.messages.filter((m) => {
          // Exclude error messages unless they have content
          if (m.info.role !== "assistant" || m.info.error === undefined) {
            return true
          }
          if (MessageV2.AbortedError.isInstance(m.info.error) &&
              m.parts.some((part) => part.type !== "step-start" && part.type !== "reasoning")) {
            return true
          }
          return false
        }),
      ),
      {
        role: "user",
        content: [{
          type: "text",
          text: "Summarize our conversation above. This summary will be the only context available when the conversation continues, so preserve critical information including: what was accomplished, current work in progress, files involved, next steps, and any key user requests or constraints. Be concise but detailed enough that work can continue seamlessly.",
        }],
      },
    ],
    // ... other parameters
  })

  Bus.publish(Event.Compacted, { sessionID: input.sessionID })
  return "continue"
}
```

**Key Features**:
- Creates a special "summary" message
- Filters out error messages (except aborted ones with content)
- Uses dedicated system prompt for compaction
- Summary becomes first message in subsequent turns
- Original messages filtered by `MessageV2.filterCompacted()`

### Claude Code Implementation

**wU2 Compressor** triggers at ~92% context usage:

**Process**:
1. **Identify**: Determine what can be summarized (older conversation turns)
2. **Summarize**: Create concise versions using model
3. **Migrate**: Move critical information to CLAUDE.md
4. **Replace**: Substitute detailed history with summary

**Visual**:
```
Before compaction (92% full):
[Message 1] [Message 2] ... [Message 50] [Active]

After compaction (50% full):
[Summary of 1-40] [Message 41-50] [Active]
```

**Advantages over OpenCode**:
- Earlier trigger (92% vs 100%) prevents emergency situations
- Migrates to persistent memory (CLAUDE.md)
- More sophisticated heuristics for what to preserve

### Comparison

| Feature | OpenCode | Claude Code |
|---------|----------|-------------|
| **Trigger Threshold** | 100% (overflow) | ~92% (proactive) |
| **Pruning Strategy** | Remove old tool outputs | Part of overall compaction |
| **Summary Prompt** | Generic summarization | Structured with 5 sections |
| **Persistent Storage** | No (ephemeral summary) | Yes (CLAUDE.md migration) |
| **Manual Control** | `OPENCODE_DISABLE_AUTOCOMPACT` flag | Not documented |
| **Multi-stage** | Yes (prune → compact) | Yes (identify → summarize → migrate → replace) |

---

## 3. Session Persistence

### OpenCode Implementation

**Storage Structure**:
```
{global_data_dir}/
├── session/{projectID}/{sessionID}     - Session metadata
├── message/{sessionID}/{messageID}     - Message data
├── part/{messageID}/{partID}           - Message parts (streaming)
└── session_diff/{sessionID}            - File changes
```

**Session Metadata** (from `C:\Users\canya\Documents\projects\nori\opencode-fork\packages\opencode\src\session\index.ts`):
```typescript
export const Info = z.object({
  id: Identifier.schema("session"),
  title: z.string(),
  parentID: z.string().optional(),  // For child sessions
  projectID: z.string(),
  time: z.object({
    created: z.number(),
    accessed: z.number(),
  }),
  revert: z.object({
    messageID: z.string(),
    patches: z.array(Snapshot.Patch),
  }).optional(),
  auto: z.boolean().optional(),
})
```

**Message Structure**:
```typescript
export const Info = z.discriminatedUnion("role", [User, Assistant])

// User Message
export const User = z.object({
  id: z.string(),
  sessionID: z.string(),
  role: z.literal("user"),
  time: z.object({
    created: z.number(),
  }),
  agent: z.string(),
  model: z.object({
    providerID: z.string(),
    modelID: z.string(),
  }),
  system: z.string().optional(),
  tools: z.record(z.string(), z.boolean()).optional(),
})

// Assistant Message
export const Assistant = z.object({
  id: z.string(),
  sessionID: z.string(),
  role: z.literal("assistant"),
  time: z.object({
    created: z.number(),
    completed: z.number().optional(),
  }),
  error: z.discriminatedUnion("name", [/* error types */]).optional(),
  parentID: z.string(),
  modelID: z.string(),
  providerID: z.string(),
  mode: z.string(),
  path: z.object({
    cwd: z.string(),
    root: z.string(),
  }),
  summary: z.boolean().optional(),  // Indicates compaction summary
  cost: z.number(),
  tokens: z.object({
    input: z.number(),
    output: z.number(),
    reasoning: z.number(),
    cache: z.object({
      read: z.number(),
      write: z.number(),
    }),
  }),
  finish: z.string().optional(),
})
```

**Part Types**:
- `TextPart`: Regular text content
- `ReasoningPart`: Extended thinking blocks
- `ToolPart`: Tool invocations and results
- `FilePart`: File attachments
- `CompactionPart`: Marks compaction events
- `SubtaskPart`: Sub-agent task delegation

**Filtering Compacted Messages**:
```typescript
export async function filterCompacted(stream: AsyncIterable<MessageV2.WithParts>) {
  const result = [] as MessageV2.WithParts[]
  const completed = new Set<string>()

  for await (const msg of stream) {
    result.push(msg)

    // Stop when we hit a compaction point
    if (
      msg.info.role === "user" &&
      completed.has(msg.info.id) &&
      msg.parts.some((part) => part.type === "compaction")
    ) break

    // Track completed summaries
    if (msg.info.role === "assistant" && msg.info.summary && msg.info.finish) {
      completed.add(msg.info.parentID)
    }
  }

  result.reverse()
  return result
}
```

**Key Features**:
- File-based storage (not database)
- Hierarchical key structure
- Parts stored separately for streaming
- Automatic filtering of pre-compaction history
- Snapshot integration for file tracking

### Claude Code Implementation

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

**Key Features**:
- Centralized session registry
- JSONL transcript format (append-only)
- Timestamp tracking
- Model and CWD association
- Preferences stored alongside sessions

### Comparison

| Feature | OpenCode | Claude Code |
|---------|----------|-------------|
| **Storage Format** | Hierarchical file structure | JSON registry + JSONL transcripts |
| **Message Parts** | Separate files per part | Inline in transcript |
| **Session Metadata** | Per-session file | Centralized registry |
| **Compaction Tracking** | `summary` flag + `CompactionPart` | Integrated in transcript |
| **File Changes** | Separate snapshot system | Checkpoint files |
| **Streaming Support** | Native (part-level storage) | Not specified |
| **Recovery** | Snapshot patches | Checkpoint restoration |

---

## 4. Checkpoint System

### OpenCode Snapshot System

**Implementation** (from `C:\Users\canya\Documents\projects\nori\opencode-fork\packages\opencode\src\snapshot\index.ts`):

```typescript
export namespace Snapshot {
  // Creates a git snapshot of current file state
  export async function track() {
    if (Instance.project.vcs !== "git") return
    const cfg = await Config.get()
    if (cfg.snapshot === false) return

    const git = gitdir()
    if (await fs.mkdir(git, { recursive: true })) {
      await $`git init`
        .env({
          GIT_DIR: git,
          GIT_WORK_TREE: Instance.worktree,
        })
        .quiet()
        .nothrow()

      // Configure git to not convert line endings on Windows
      await $`git --git-dir ${git} config core.autocrlf false`.quiet().nothrow()
    }

    await $`git --git-dir ${git} --work-tree ${Instance.worktree} add .`.quiet().nothrow()
    const hash = await $`git --git-dir ${git} write-tree`.quiet().text()

    return hash.trim()
  }

  // Get files changed since snapshot
  export async function patch(hash: string): Promise<Patch> {
    const git = gitdir()
    await $`git --git-dir ${git} add .`.quiet().nothrow()

    const result = await $`git -c core.autocrlf=false diff --no-ext-diff --name-only ${hash}`.quiet().nothrow()

    if (result.exitCode !== 0) {
      return { hash, files: [] }
    }

    const files = result.text()
    return {
      hash,
      files: files
        .trim()
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean)
        .map((x) => path.join(Instance.worktree, x)),
    }
  }

  // Restore to snapshot
  export async function restore(snapshot: string) {
    const git = gitdir()
    const result = await $`git --git-dir ${git} read-tree ${snapshot} && git checkout-index -a -f`
      .quiet()
      .nothrow()
    // ... error handling
  }

  // Revert specific files
  export async function revert(patches: Patch[]) {
    const files = new Set<string>()
    const git = gitdir()

    for (const item of patches) {
      for (const file of item.files) {
        if (files.has(file)) continue

        const result = await $`git checkout ${item.hash} -- ${file}`
          .quiet()
          .nothrow()

        if (result.exitCode !== 0) {
          // Check if file existed in snapshot
          const checkTree = await $`git ls-tree ${item.hash} -- ${relativePath}`
            .quiet()
            .nothrow()

          if (checkTree.exitCode === 0 && checkTree.text().trim()) {
            // File existed but checkout failed, keep current version
          } else {
            // File didn't exist in snapshot, delete it
            await fs.unlink(file).catch(() => {})
          }
        }
        files.add(file)
      }
    }
  }
}
```

**Storage Structure**:
```
{global_data_dir}/snapshot/{projectID}/
├── .git/                    # Git metadata
├── objects/                 # Git objects
└── refs/                    # Git refs
```

**Key Features**:
- Uses git under the hood (separate `.git` directory)
- Tracks file state at each user message
- Creates tree hashes for efficient diffs
- Supports selective file reversion
- Handles file deletions correctly
- Configurable (can be disabled)

**Integration with Sessions**:
```typescript
// In SessionRevert
export async function cleanup(session: Session.Info) {
  if (!session.revert) return

  const patches = session.revert.patches.reverse()
  await Snapshot.revert(patches)

  await Session.update(session.id, (draft) => {
    draft.revert = undefined
  })
}
```

### Claude Code Checkpoint System

**Structure**:
```
~/.claude/checkpoints/
└── session-abc123/
    ├── checkpoint-001.json
    ├── checkpoint-002.json
    └── files/
        ├── file1.ts.001
        └── file1.ts.002
```

**Checkpoint Creation**:
- Every user prompt creates a checkpoint
- File states captured before modifications
- Persists across sessions (30 days retention)

**Recovery Options**:
1. **Conversation + Code**: Rewind both to checkpoint
2. **Code Only**: Keep conversation, revert files
3. **Conversation Only**: Keep code, rewind dialogue

**Usage**:
```
Press Esc+Esc → Select checkpoint → Choose recovery mode
```

**Advantages**:
- Three-way recovery (conversation, code, both)
- UI for checkpoint selection
- Longer retention (30 days)
- Named checkpoints at user prompts

### Comparison

| Feature | OpenCode | Claude Code |
|---------|----------|-------------|
| **Technology** | Git (separate worktree) | Custom checkpoint files |
| **Granularity** | File-level snapshots | File + conversation state |
| **Recovery Scope** | Files only | Files + conversation |
| **Retention** | Indefinite (until cleanup) | 30 days |
| **UI** | Programmatic only | Interactive checkpoint browser |
| **Storage** | Git objects (efficient) | Individual checkpoint files |
| **Creation Trigger** | Before file modifications | Every user prompt |

---

## 5. Memory Files

### OpenCode: AGENTS.md and CLAUDE.md

**System Prompt Loading** (from `C:\Users\canya\Documents\projects\nori\opencode-fork\packages\opencode\src\session\system.ts`):

```typescript
const LOCAL_RULE_FILES = [
  "AGENTS.md",
  "CLAUDE.md",
  "CONTEXT.md", // deprecated
]

const GLOBAL_RULE_FILES = [
  path.join(Global.Path.config, "AGENTS.md"),
  path.join(os.homedir(), ".claude", "CLAUDE.md"),
]

export async function custom() {
  const config = await Config.get()
  const paths = new Set<string>()

  // Find local rule files (searches up directory tree)
  for (const localRuleFile of LOCAL_RULE_FILES) {
    const matches = await Filesystem.findUp(
      localRuleFile,
      Instance.directory,
      Instance.worktree
    )
    if (matches.length > 0) {
      matches.forEach((path) => paths.add(path))
      break  // Only use first found file type
    }
  }

  // Find global rule files
  for (const globalRuleFile of GLOBAL_RULE_FILES) {
    if (await Bun.file(globalRuleFile).exists()) {
      paths.add(globalRuleFile)
      break
    }
  }

  // Add config-specified instruction files
  if (config.instructions) {
    for (let instruction of config.instructions) {
      if (instruction.startsWith("~/")) {
        instruction = path.join(os.homedir(), instruction.slice(2))
      }

      let matches: string[] = []
      if (path.isAbsolute(instruction)) {
        matches = await Array.fromAsync(
          new Bun.Glob(path.basename(instruction)).scan({
            cwd: path.dirname(instruction),
            absolute: true,
            onlyFiles: true,
          }),
        ).catch(() => [])
      } else {
        matches = await Filesystem.globUp(
          instruction,
          Instance.directory,
          Instance.worktree
        ).catch(() => [])
      }
      matches.forEach((path) => paths.add(path))
    }
  }

  // Load all found instruction files
  const found = Array.from(paths).map((p) =>
    Bun.file(p)
      .text()
      .catch(() => "")
      .then((x) => "Instructions from: " + p + "\n" + x),
  )

  return Promise.all(found).then((result) => result.filter(Boolean))
}
```

**Key Features**:
- Searches up directory tree from CWD to worktree root
- Supports both local and global instruction files
- Can specify additional files via `config.instructions`
- Prepends file path to content
- Loaded once at session start

**Example Configuration**:
```json
{
  "instructions": [
    "~/my-global-rules.md",
    ".project/coding-standards.md",
    "docs/architecture/*.md"
  ]
}
```

**Priority**: Local > Global > Config-specified

### Claude Code: CLAUDE.md

**Structure**:
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

**Loading**:
- Automatically loaded at session start
- Part of system prompt context
- Updated during compaction (wU2 migrates important info)

**Additional Memory Files**:
Can configure additional files via `settings.json`:
```json
{
  "memory": {
    "files": [
      {"path": "CLAUDE.md", "required": true},
      {"path": "docs/architecture.md", "required": false}
    ]
  }
}
```

**Advantages**:
- Standardized location and format
- Active migration during compaction
- Structured sections encourage organization
- Can include multiple memory files

### Comparison

| Feature | OpenCode | Claude Code |
|---------|----------|-------------|
| **File Names** | AGENTS.md, CLAUDE.md, custom | CLAUDE.md (primary) + custom |
| **Search Strategy** | Up directory tree | Project root |
| **Loading** | Once at session start | Session start + updates during compaction |
| **Active Updates** | No (manual only) | Yes (wU2 migrates during compaction) |
| **Multiple Files** | Yes (via config) | Yes (via settings) |
| **Global Files** | Yes (`~/.opencode/AGENTS.md`) | Yes (`~/.claude/CLAUDE.md`) |
| **Precedence** | Local > Global | Project > Global |

---

## 6. Sub-agent Distribution

### OpenCode Sub-agent System

**Agent Types** (from `C:\Users\canya\Documents\projects\nori\opencode-fork\packages\opencode\src\agent\agent.ts`):

```typescript
export namespace Agent {
  export const Info = z.object({
    name: z.string(),
    description: z.string().optional(),
    mode: z.enum(["subagent", "primary", "all"]),
    builtIn: z.boolean(),
    // ... configuration fields
  })
}
```

**Built-in Agents**:

1. **general** (subagent):
   ```typescript
   {
     name: "general",
     description: "General-purpose agent for researching complex questions and executing multi-step tasks. Use this agent to execute multiple units of work in parallel.",
     tools: {
       todoread: false,
       todowrite: false,
       ...defaultTools,
     },
     mode: "subagent",
   }
   ```

2. **explore** (subagent):
   ```typescript
   {
     name: "explore",
     description: "Fast agent specialized for exploring codebases. Use this when you need to quickly find files by patterns, search code for keywords, or answer questions about the codebase.",
     tools: {
       todoread: false,
       todowrite: false,
       edit: false,
       write: false,
       ...defaultTools,
     },
     mode: "subagent",
   }
   ```

3. **build** (primary):
   ```typescript
   {
     name: "build",
     tools: { ...defaultTools },
     mode: "primary",
   }
   ```

4. **plan** (primary):
   ```typescript
   {
     name: "plan",
     permission: planPermission,  // Read-only restrictions
     tools: { ...defaultTools },
     mode: "primary",
   }
   ```

**Sub-agent Invocation** (Task Tool):

```typescript
// Subtask part in user message
export const SubtaskPart = z.object({
  type: z.literal("subtask"),
  prompt: z.string(),
  description: z.string(),
  agent: z.string(),
})

// Processing in session loop
if (task?.type === "subtask") {
  const taskTool = await TaskTool.init()

  // Create assistant message for subtask
  const assistantMessage = await Session.updateMessage({
    id: Identifier.ascending("message"),
    role: "assistant",
    parentID: lastUser.id,
    sessionID,
    mode: task.agent,  // Use specified sub-agent
    // ...
  })

  // Execute subtask in isolated context
  const result = await taskTool.execute(
    {
      prompt: task.prompt,
      description: task.description,
      subagent_type: task.agent,
    },
    {
      agent: task.agent,
      messageID: assistantMessage.id,
      sessionID: sessionID,
      abort,
      async metadata(input) {
        await Session.updatePart({ /* update progress */ })
      },
    },
  )

  // Store result as tool output
  await Session.updatePart({
    state: {
      status: "completed",
      input: part.state.input,
      title: result.title,
      metadata: result.metadata,
      output: result.output,
      attachments: result.attachments,
      time: { end: Date.now() },
    },
  })
}
```

**Key Features**:
- Isolated context per sub-agent invocation
- Tool access controlled by agent configuration
- Results returned as tool outputs
- Can be nested (sub-agents can invoke sub-agents)
- Automatic context distribution

### Claude Code Sub-agent System

**Built-in Agents**:

| Agent | Model | Tools | Purpose |
|-------|-------|-------|---------|
| **General-Purpose** | Sonnet | All tools | Complex multi-step tasks, code modifications |
| **Explore** | Haiku | Read-only (Glob, Grep, Read, Bash) | Fast codebase analysis |
| **Plan** | Sonnet | Research tools | Planning mode research |

**Agent Definition** (Markdown with frontmatter):
```markdown
---
model: claude-3-5-sonnet-20241022
tools:
  bash: true
  edit: true
  read: true
  glob: true
permissions:
  edit: ask
  bash:
    "pytest *": allow
    "*": ask
---

You are a testing specialist. Your role is to write comprehensive tests
for code changes. Always follow testing best practices.
```

**Context Distribution**:
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

Each agent has independent context budget and token tracking.

### Comparison

| Feature | OpenCode | Claude Code |
|---------|----------|-------------|
| **Agent Types** | primary, subagent, all | Built-in + custom |
| **Invocation** | SubtaskPart → Task tool | Automatic delegation |
| **Context Isolation** | Full (separate session) | Full (separate context) |
| **Tool Restrictions** | Per-agent configuration | Per-agent configuration |
| **Result Handling** | Tool output | Integrated response |
| **Nesting** | Supported | Not documented |
| **Model Selection** | Per-agent | Per-agent |

---

## 7. Implementation Details

### OpenCode Compaction Flow

```
User Message → Session Loop
    ↓
Check for overflow (isOverflow)
    ↓
[YES] Create CompactionPart
    ↓
Process compaction in next loop iteration
    ↓
SessionCompaction.process():
    1. Create summary assistant message (summary: true)
    2. Build message list (filter errors)
    3. Add summarization prompt
    4. Send to model
    5. Store summary as assistant message
    6. Publish Event.Compacted
    ↓
Next loop iteration:
    ↓
MessageV2.filterCompacted():
    - Walk messages backward
    - Stop at first CompactionPart
    - Return messages after compaction point
    ↓
Continue with summarized context
```

**Code Walkthrough**:

1. **Overflow Detection** (in session loop):
```typescript
// In SessionPrompt.loop()
if (
  lastFinished &&
  lastFinished.summary !== true &&
  SessionCompaction.isOverflow({ tokens: lastFinished.tokens, model })
) {
  await SessionCompaction.create({
    sessionID,
    agent: lastUser.agent,
    model: lastUser.model,
    auto: true,
  })
  continue  // Next iteration will process compaction
}
```

2. **Compaction Creation**:
```typescript
export const create = fn(
  z.object({
    sessionID: Identifier.schema("session"),
    agent: z.string(),
    model: z.object({
      providerID: z.string(),
      modelID: z.string(),
    }),
    auto: z.boolean(),
  }),
  async (input) => {
    const msg = await Session.updateMessage({
      id: Identifier.ascending("message"),
      role: "user",
      model: input.model,
      sessionID: input.sessionID,
      agent: input.agent,
      time: { created: Date.now() },
    })

    await Session.updatePart({
      id: Identifier.ascending("part"),
      messageID: msg.id,
      sessionID: msg.sessionID,
      type: "compaction",
      auto: input.auto,
    })
  },
)
```

3. **Compaction Processing**:
```typescript
export async function process(input: {
  parentID: string
  messages: MessageV2.WithParts[]
  sessionID: string
  model: { providerID: string; modelID: string }
  agent: string
  abort: AbortSignal
  auto: boolean
}) {
  const model = await Provider.getModel(input.model.providerID, input.model.modelID)
  const language = await Provider.getLanguage(model)
  const system = [...SystemPrompt.compaction(model.providerID)]

  const msg = await Session.updateMessage({
    role: "assistant",
    parentID: input.parentID,
    sessionID: input.sessionID,
    summary: true,  // Mark as summary
    // ... other fields
  })

  const processor = SessionProcessor.create({
    assistantMessage: msg,
    sessionID: input.sessionID,
    model: model,
    abort: input.abort,
  })

  await processor.process({
    messages: [
      ...system.map((x): ModelMessage => ({
        role: "system",
        content: x,
      })),
      ...MessageV2.toModelMessage(
        input.messages.filter((m) => {
          // Filter out error messages
          if (m.info.role !== "assistant" || m.info.error === undefined) {
            return true
          }
          // Keep aborted messages with content
          if (MessageV2.AbortedError.isInstance(m.info.error) &&
              m.parts.some((part) => part.type !== "step-start" && part.type !== "reasoning")) {
            return true
          }
          return false
        }),
      ),
      {
        role: "user",
        content: [{
          type: "text",
          text: "Summarize our conversation above. This summary will be the only context available when the conversation continues, so preserve critical information including: what was accomplished, current work in progress, files involved, next steps, and any key user requests or constraints. Be concise but detailed enough that work can continue seamlessly.",
        }],
      },
    ],
    tools: model.capabilities.toolcall ? {} : undefined,
    // ... other parameters
  })

  Bus.publish(Event.Compacted, { sessionID: input.sessionID })
  return "continue"
}
```

4. **Message Filtering**:
```typescript
export async function filterCompacted(stream: AsyncIterable<MessageV2.WithParts>) {
  const result = [] as MessageV2.WithParts[]
  const completed = new Set<string>()

  for await (const msg of stream) {
    result.push(msg)

    // Check if we've hit a compaction point
    if (
      msg.info.role === "user" &&
      completed.has(msg.info.id) &&
      msg.parts.some((part) => part.type === "compaction")
    ) break

    // Track completed summaries
    if (msg.info.role === "assistant" && msg.info.summary && msg.info.finish) {
      completed.add(msg.info.parentID)
    }
  }

  result.reverse()
  return result
}
```

### OpenCode Pruning Flow

```
Session ends → SessionCompaction.prune()
    ↓
Walk messages backward
    ↓
For each tool result:
    - Count tokens
    - Keep last 40k tokens
    - Mark older results for pruning
    ↓
If pruned > 20k tokens:
    Mark parts as compacted (time.compacted = now)
    ↓
Next message generation:
    toModelMessage() checks part.state.time.compacted
    If set, replace output with "[Old tool result content cleared]"
```

**Code**:
```typescript
if (part.state.status === "completed") {
  assistantMessage.parts.push({
    type: ("tool-" + part.tool) as `tool-${string}`,
    state: "output-available",
    toolCallId: part.callID,
    input: part.state.input,
    output: part.state.time.compacted
      ? "[Old tool result content cleared]"
      : part.state.output,
    callProviderMetadata: part.metadata,
  })
}
```

### Token Estimation

OpenCode doesn't use actual token counting from the model. Instead:

```typescript
// From @/util/token
import { Token } from "../util/token"

// Used in pruning
const estimate = Token.estimate(part.state.output)
```

This is likely a character-based approximation (not shown in provided code).

**Actual token counts** come from model responses:
```typescript
export const Assistant = z.object({
  // ...
  tokens: z.object({
    input: z.number(),
    output: z.number(),
    reasoning: z.number(),
    cache: z.object({
      read: z.number(),
      write: z.number(),
    }),
  }),
})
```

These are reported by the Anthropic API and stored with each assistant message.

---

## 8. Anthropic SDK Patterns

### CompactionControl Interface

From `C:\Users\canya\Documents\projects\nori\anthropic-repos\anthropic-sdk-typescript\src\lib\tools\CompactionControl.ts`:

```typescript
export const DEFAULT_TOKEN_THRESHOLD = 100_000;

export const DEFAULT_SUMMARY_PROMPT = `You have been working on the task described above but have not yet completed it. Write a continuation summary that will allow you (or another instance of yourself) to resume work efficiently in a future context window where the conversation history will be replaced with this summary. Your summary should be structured, concise, and actionable. Include:

1. Task Overview
The user's core request and success criteria
Any clarifications or constraints they specified

2. Current State
What has been completed so far
Files created, modified, or analyzed (with paths if relevant)
Key outputs or artifacts produced

3. Important Discoveries
Technical constraints or requirements uncovered
Decisions made and their rationale
Errors encountered and how they were resolved
What approaches were tried that didn't work (and why)

4. Next Steps
Specific actions needed to complete the task
Any blockers or open questions to resolve
Priority order if multiple steps remain

5. Context to Preserve
User preferences or style requirements
Domain-specific details that aren't obvious
Any promises made to the user

Be concise but complete—err on the side of including information that would prevent duplicate work or repeated mistakes. Write in a way that enables immediate resumption of the task.
Wrap your summary in <summary></summary> tags.`;

export interface CompactionControl {
  /**
   * The context token threshold at which to trigger compaction.
   *
   * When the cumulative token count (input + output) across all messages exceeds this threshold,
   * the message history will be automatically summarized and compressed.
   *
   * @default 100000
   */
  contextTokenThreshold?: number;

  /**
   * The model to use for generating the compaction summary.
   * If not specified, defaults to the same model used for the tool runner.
   */
  model?: Model;

  /**
   * The prompt used to instruct the model on how to generate the summary.
   */
  summaryPrompt?: string;

  enabled: boolean;
}
```

**Key Insights**:
- Default threshold: 100,000 tokens
- Structured summary with 5 sections
- Supports custom model for summarization
- Configurable summary prompt
- Can be disabled entirely

**Comparison with OpenCode**:

| Aspect | OpenCode | Anthropic SDK |
|--------|----------|---------------|
| **Default Threshold** | Model context limit - output limit | 100,000 tokens |
| **Summary Sections** | Generic | 5 structured sections |
| **Model for Summary** | Same as conversation | Configurable |
| **Custom Prompt** | Via system prompt files | Direct parameter |
| **Disable Flag** | `OPENCODE_DISABLE_AUTOCOMPACT` | `enabled: false` |

**Recommended Integration**:
OpenCode could adopt the Anthropic SDK's structured summary approach:

```typescript
// Enhanced compaction prompt
const ANTHROPIC_STYLE_SUMMARY = `You have been working on the task described above. Write a continuation summary that will allow you to resume work efficiently. Include:

1. Task Overview: User's core request and constraints
2. Current State: What's completed, files modified
3. Important Discoveries: Technical constraints, decisions made, errors resolved
4. Next Steps: Actions needed, blockers
5. Context to Preserve: User preferences, promises made

Be concise but complete. Wrap in <summary></summary> tags.`;
```

---

## 9. Feature Comparison Table

### Comprehensive Feature Matrix

| Feature | OpenCode | Claude Code | Anthropic SDK |
|---------|----------|-------------|---------------|
| **Context Window Strategy** | | | |
| Automatic compaction | ✅ Yes | ✅ Yes (wU2) | ✅ Yes |
| Trigger threshold | 100% (overflow) | ~92% | 100k tokens (configurable) |
| Multi-stage approach | ✅ Prune + Compact | ✅ Identify + Summarize + Migrate + Replace | ✅ Summarize + Replace |
| Manual control | ✅ Env flags | ❓ Unknown | ✅ enabled flag |
| | | | |
| **Automatic Compaction** | | | |
| Pruning mechanism | ✅ Yes (tool outputs) | Part of compaction | N/A |
| Summary creation | ✅ Yes (model-generated) | ✅ Yes (wU2) | ✅ Yes |
| Structured summary | ❌ No | ✅ Yes | ✅ Yes (5 sections) |
| Custom summary prompt | ✅ Via system prompt | ❓ Unknown | ✅ Direct parameter |
| Persistent migration | ❌ No | ✅ Yes (CLAUDE.md) | N/A |
| | | | |
| **Session Persistence** | | | |
| Storage format | File hierarchy | JSON + JSONL | N/A |
| Message parts | Separate files | Inline | N/A |
| Streaming support | ✅ Native | ❓ Unknown | N/A |
| Centralized registry | ❌ No | ✅ Yes (~/.claude.json) | N/A |
| Compaction tracking | ✅ summary flag | ✅ In transcript | N/A |
| | | | |
| **Checkpoint System** | | | |
| Technology | Git (separate worktree) | Custom checkpoint files | N/A |
| Granularity | File-level | File + conversation | N/A |
| Recovery modes | Files only | Files / Conversation / Both | N/A |
| Retention period | Indefinite | 30 days | N/A |
| Interactive UI | ❌ No | ✅ Yes (Esc+Esc) | N/A |
| Creation trigger | Before modifications | Every user prompt | N/A |
| | | | |
| **Memory Files** | | | |
| Primary file | AGENTS.md, CLAUDE.md | CLAUDE.md | N/A |
| Search strategy | Up directory tree | Project root | N/A |
| Active updates | ❌ Manual only | ✅ During compaction | N/A |
| Multiple files | ✅ Yes | ✅ Yes | N/A |
| Global support | ✅ Yes | ✅ Yes | N/A |
| Precedence | Local > Global | Project > Global | N/A |
| | | | |
| **Sub-agent Distribution** | | | |
| Agent types | primary, subagent, all | Built-in + custom | N/A |
| Context isolation | ✅ Full | ✅ Full | N/A |
| Tool restrictions | ✅ Per-agent | ✅ Per-agent | N/A |
| Nested invocation | ✅ Supported | ❓ Unknown | N/A |
| Result handling | Tool output | Integrated response | N/A |
| Model selection | ✅ Per-agent | ✅ Per-agent | N/A |
| | | | |
| **Implementation** | | | |
| Token counting | Model-reported | Model-reported | Configurable |
| Pruning protection | Last 40k tokens | N/A | N/A |
| Pruning minimum | 20k tokens saved | N/A | N/A |
| Output limit | 32k tokens | ❓ Unknown | Model-dependent |
| Error handling | Filter errors from compaction | ❓ Unknown | ❓ Unknown |

---

## 10. Implementation Roadmap

### Short-term Improvements (1-2 weeks)

#### 1. Adopt Structured Summary Format

**Goal**: Improve summary quality using Anthropic SDK's 5-section approach

**Implementation**:
```typescript
// Update compaction.ts
const STRUCTURED_SUMMARY_PROMPT = `You have been working on the task described above but have not yet completed it. Write a continuation summary that will allow you (or another instance of yourself) to resume work efficiently in a future context window where the conversation history will be replaced with this summary. Your summary should be structured, concise, and actionable. Include:

1. Task Overview
The user's core request and success criteria
Any clarifications or constraints they specified

2. Current State
What has been completed so far
Files created, modified, or analyzed (with paths if relevant)
Key outputs or artifacts produced

3. Important Discoveries
Technical constraints or requirements uncovered
Decisions made and their rationale
Errors encountered and how they were resolved
What approaches were tried that didn't work (and why)

4. Next Steps
Specific actions needed to complete the task
Any blockers or open questions to resolve
Priority order if multiple steps remain

5. Context to Preserve
User preferences or style requirements
Domain-specific details that aren't obvious
Any promises made to the user

Be concise but complete—err on the side of including information that would prevent duplicate work or repeated mistakes. Write in a way that enables immediate resumption of the task.
Wrap your summary in <summary></summary> tags.`;

// In SessionCompaction.process()
{
  role: "user",
  content: [{
    type: "text",
    text: STRUCTURED_SUMMARY_PROMPT,
  }],
}
```

**Benefits**:
- More actionable summaries
- Better task continuity
- Prevents duplicate work
- Aligns with Anthropic best practices

#### 2. Configurable Token Threshold

**Goal**: Allow users to configure compaction threshold

**Implementation**:
```typescript
// In config schema
export const Config = z.object({
  // ... existing fields
  compaction: z.object({
    enabled: z.boolean().default(true),
    tokenThreshold: z.number().default(100_000),
    summaryPrompt: z.string().optional(),
    model: z.string().optional(),  // Use specific model for summaries
  }).optional(),
})

// In compaction.ts
export function isOverflow(input: {
  tokens: MessageV2.Assistant["tokens"];
  model: Provider.Model;
  config: Config.Info;
}) {
  const compactionConfig = input.config.compaction ?? {
    enabled: true,
    tokenThreshold: 100_000
  }

  if (!compactionConfig.enabled) return false
  if (Flag.OPENCODE_DISABLE_AUTOCOMPACT) return false

  const context = input.model.limit.context
  if (context === 0) return false

  const count = input.tokens.input + input.tokens.cache.read + input.tokens.output

  // Use configured threshold or fallback to model limit
  const threshold = compactionConfig.tokenThreshold || context
  const output = Math.min(
    input.model.limit.output,
    SessionPrompt.OUTPUT_TOKEN_MAX
  ) || SessionPrompt.OUTPUT_TOKEN_MAX
  const usable = threshold - output

  return count > usable
}
```

**Benefits**:
- User control over compaction frequency
- Earlier compaction for long sessions
- Testing different strategies

#### 3. Active CLAUDE.md Updates

**Goal**: Automatically migrate important context to CLAUDE.md during compaction

**Implementation**:
```typescript
// New file: src/session/memory-migration.ts
export namespace MemoryMigration {
  export async function migrateToMemory(input: {
    sessionID: string
    summary: string
    messages: MessageV2.WithParts[]
  }) {
    const claudeMdPath = await findClaudeMd()
    if (!claudeMdPath) {
      // Create if doesn't exist
      claudeMdPath = path.join(Instance.worktree, "CLAUDE.md")
      await fs.writeFile(claudeMdPath, "# Project Memory\n\n")
    }

    // Extract key information from summary
    const extracted = await extractKeyInfo(input.summary)

    // Read current CLAUDE.md
    const current = await fs.readFile(claudeMdPath, "utf-8")

    // Merge with extracted info (avoid duplicates)
    const updated = mergeMemory(current, extracted)

    // Write back
    await fs.writeFile(claudeMdPath, updated)

    // Notify user
    Bus.publish(Event.MemoryUpdated, {
      sessionID: input.sessionID,
      path: claudeMdPath,
    })
  }

  async function extractKeyInfo(summary: string) {
    // Parse summary for persistent context
    // - File paths and changes
    // - Architectural decisions
    // - User preferences
    // - Ongoing tasks
    // Return structured data
  }

  function mergeMemory(current: string, extracted: any) {
    // Intelligent merge:
    // - Add new sections if missing
    // - Update existing sections
    // - Avoid duplicates
    // - Preserve manual edits
    return updated
  }
}

// In SessionCompaction.process(), after summary generated:
await MemoryMigration.migrateToMemory({
  sessionID: input.sessionID,
  summary: processor.message.parts.find(p => p.type === "text")?.text,
  messages: input.messages,
})
```

**Benefits**:
- Critical context persists across sessions
- Reduces repetition in summaries
- Builds project knowledge base
- Matches Claude Code behavior

### Medium-term Improvements (1-2 months)

#### 4. Enhanced Checkpoint System

**Goal**: Add conversation-level checkpoints and recovery UI

**Implementation**:
```typescript
// New file: src/session/checkpoint.ts
export namespace Checkpoint {
  export const Info = z.object({
    id: z.string(),
    sessionID: z.string(),
    timestamp: z.number(),
    name: z.string().optional(),

    // Conversation state
    messageID: z.string(),  // Last message at checkpoint

    // File state
    snapshot: z.string(),  // Git snapshot hash

    // Metadata
    tags: z.array(z.string()).optional(),
  })

  export async function create(input: {
    sessionID: string
    name?: string
    tags?: string[]
  }) {
    const session = await Session.get(input.sessionID)
    const msgs = await Session.messages({ sessionID: input.sessionID })
    const lastMessage = msgs[msgs.length - 1]

    const snapshot = await Snapshot.track()

    const checkpoint: Info = {
      id: Identifier.ascending("checkpoint"),
      sessionID: input.sessionID,
      timestamp: Date.now(),
      name: input.name,
      messageID: lastMessage.id,
      snapshot: snapshot,
      tags: input.tags,
    }

    await Storage.write(
      ["checkpoint", input.sessionID, checkpoint.id],
      checkpoint
    )

    return checkpoint
  }

  export async function restore(input: {
    checkpointID: string
    mode: "conversation" | "files" | "both"
  }) {
    const checkpoint = await get(input.checkpointID)

    switch (input.mode) {
      case "conversation":
        // Delete messages after checkpoint.messageID
        await deleteMessagesAfter(checkpoint.sessionID, checkpoint.messageID)
        break

      case "files":
        // Restore file state
        await Snapshot.restore(checkpoint.snapshot)
        break

      case "both":
        // Restore both conversation and files
        await deleteMessagesAfter(checkpoint.sessionID, checkpoint.messageID)
        await Snapshot.restore(checkpoint.snapshot)
        break
    }
  }
}

// Auto-create checkpoints before user messages
// In SessionPrompt.prompt():
await Checkpoint.create({
  sessionID: input.sessionID,
  name: `Before: ${input.parts[0].text.slice(0, 50)}...`,
  tags: ["auto"],
})
```

**Benefits**:
- Recovery from mistakes
- Experimentation with rollback
- Conversation branching support
- Better error recovery

#### 5. Proactive Compaction (92% threshold)

**Goal**: Trigger compaction before overflow, matching Claude Code

**Implementation**:
```typescript
// In compaction.ts
export function shouldCompact(input: {
  tokens: MessageV2.Assistant["tokens"]
  model: Provider.Model
  config: Config.Info
}): { should: boolean; reason: string } {
  const compactionConfig = input.config.compaction ?? {
    enabled: true,
    tokenThreshold: 100_000,
    proactiveThreshold: 0.92,  // 92%
  }

  if (!compactionConfig.enabled) return { should: false, reason: "disabled" }

  const context = input.model.limit.context
  if (context === 0) return { should: false, reason: "no limit" }

  const count = input.tokens.input + input.tokens.cache.read + input.tokens.output
  const output = Math.min(
    input.model.limit.output,
    SessionPrompt.OUTPUT_TOKEN_MAX
  ) || SessionPrompt.OUTPUT_TOKEN_MAX
  const usable = context - output

  // Check proactive threshold
  const proactiveLimit = usable * compactionConfig.proactiveThreshold
  if (count > proactiveLimit) {
    return {
      should: true,
      reason: `proactive (${Math.round(count/usable*100)}% of ${usable})`
    }
  }

  // Check absolute overflow
  if (count > usable) {
    return {
      should: true,
      reason: `overflow (${count} > ${usable})`
    }
  }

  return { should: false, reason: "under threshold" }
}
```

**Benefits**:
- Prevents emergency compactions
- Better user experience
- More time for quality summaries
- Reduces risk of hitting hard limits

#### 6. Improved Token Estimation

**Goal**: Replace character-based estimation with actual tokenization

**Implementation**:
```typescript
// Use @anthropic-ai/tokenizer or similar
import { countTokens } from "@anthropic-ai/tokenizer"

export namespace Token {
  export function estimate(text: string, model?: string): number {
    // Use actual tokenizer if available
    if (model?.includes("claude")) {
      return countTokens(text)
    }

    // Fallback to character-based estimate
    // Rough estimate: 1 token ≈ 4 characters for English
    return Math.ceil(text.length / 4)
  }

  export function estimateMessages(messages: MessageV2.WithParts[]): number {
    let total = 0

    for (const msg of messages) {
      for (const part of msg.parts) {
        if (part.type === "text") {
          total += estimate(part.text)
        } else if (part.type === "tool" && part.state.status === "completed") {
          total += estimate(part.state.output)
          total += estimate(JSON.stringify(part.state.input))
        }
      }
    }

    return total
  }
}
```

**Benefits**:
- More accurate pruning decisions
- Better compaction timing
- Improved context management

### Long-term Improvements (3+ months)

#### 7. Checkpoint Browser UI

**Goal**: Interactive UI for browsing and restoring checkpoints

**Implementation**:
- TUI component for checkpoint listing
- Keyboard shortcuts (Esc+Esc)
- Preview of checkpoint state
- Three-way recovery options

#### 8. Smart Summary Optimization

**Goal**: Intelligently determine what to keep vs summarize

**Implementation**:
- Heuristics for important vs. disposable context
- Preserve recent context, summarize old
- Keep critical decisions and errors
- Machine learning for importance scoring

#### 9. Cross-Session Context

**Goal**: Share context between related sessions

**Implementation**:
- Session relationships (parent/child)
- Shared CLAUDE.md across project
- Import context from related sessions
- Project-wide knowledge graph

---

## 11. Gap Analysis

### What We Know

#### OpenCode (High Confidence)
✅ **Context Management**:
- Overflow detection based on model token limits
- Two-level compaction (prune → summarize)
- Protection thresholds (40k for tools, 20k minimum pruning)
- Git-based snapshot system
- Message filtering based on compaction markers

✅ **Session Storage**:
- File-based hierarchical storage
- Separate storage for messages and parts
- Compaction tracking via flags
- Snapshot integration

✅ **Sub-agents**:
- Task tool for delegation
- Isolated contexts per invocation
- Tool access control
- Result handling as tool outputs

✅ **Memory Files**:
- AGENTS.md and CLAUDE.md support
- Directory tree search
- Global and local files
- Config-based additional files

#### Claude Code (Medium Confidence)
✅ **Context Management**:
- wU2 compressor at ~92% usage
- CLAUDE.md migration during compaction
- Agentic search strategy
- Sub-agent distribution

✅ **Checkpoints**:
- Every user prompt creates checkpoint
- File + conversation state
- 30-day retention
- Three recovery modes
- Interactive UI (Esc+Esc)

✅ **Session Storage**:
- Centralized registry (~/.claude.json)
- JSONL transcript format
- Timestamp tracking

✅ **Memory Files**:
- CLAUDE.md as primary
- Active updates during compaction
- Multiple file support

#### Anthropic SDK (High Confidence)
✅ **CompactionControl**:
- Default 100k token threshold
- Configurable model for summaries
- Structured 5-section prompt
- Enable/disable flag

### What We Don't Know

#### OpenCode (Gaps)
❓ **Token Counting**:
- Exact implementation of `Token.estimate()`
- Character-to-token ratio used
- Whether it accounts for model-specific tokenization

❓ **Pruning Heuristics**:
- How "important" tool results are identified
- Whether certain tool types are protected
- User feedback on pruning quality

❓ **Performance**:
- Impact of compaction on response time
- Storage size over long sessions
- Memory usage patterns

#### Claude Code (Gaps)
❓ **Implementation Details**:
- Exact wU2 compressor algorithm
- How it determines what to migrate to CLAUDE.md
- Checkpoint file format
- How conversation + code recovery works

❓ **Configuration**:
- Can users disable automatic compaction?
- Can they adjust the 92% threshold?
- What happens if CLAUDE.md gets too large?

❓ **Sub-agents**:
- Nesting depth limits
- Context sharing between sub-agents
- How results are merged back

❓ **Performance**:
- Compaction overhead
- Checkpoint creation time
- Impact on session load time

#### Anthropic SDK (Gaps)
❓ **Integration**:
- How CompactionControl integrates with streaming
- Whether it supports custom compaction logic
- Error handling during compaction
- Retry strategies

❓ **Advanced Features**:
- Selective message preservation
- Priority-based compaction
- Context window forecasting

### Research Needed

#### High Priority
1. **OpenCode Token Estimation**: Reverse-engineer or document actual implementation
2. **Claude Code wU2 Algorithm**: Understand the compaction heuristics
3. **Checkpoint Format**: Document the exact structure of checkpoint files
4. **Performance Benchmarks**: Measure compaction overhead in both systems

#### Medium Priority
5. **User Experience**: Gather feedback on compaction quality and timing
6. **Edge Cases**: Document behavior with very long sessions (>1M tokens)
7. **Error Recovery**: How systems handle compaction failures
8. **Sub-agent Limits**: Maximum nesting depth, context budget allocation

#### Low Priority
9. **Storage Optimization**: Compression and deduplication strategies
10. **Migration Paths**: How to upgrade between compaction strategies
11. **Monitoring**: Metrics and observability for context management

---

## Conclusion

### Key Takeaways

1. **OpenCode** uses a reactive, two-level compaction strategy (prune → summarize) that triggers at 100% context usage. It has solid session persistence and snapshot support but lacks persistent memory migration and proactive compaction.

2. **Claude Code** employs a more sophisticated multi-layered approach with earlier compaction (~92%), persistent memory files (CLAUDE.md), comprehensive checkpoints, and better recovery options.

3. **Anthropic SDK** provides a clean `CompactionControl` interface with structured summarization prompts, configurable thresholds, and best practices that could be adopted by OpenCode.

### Recommended Next Steps

**Immediate** (Week 1-2):
- ✅ Adopt structured 5-section summary prompt from Anthropic SDK
- ✅ Make token threshold configurable (default 100k)
- ✅ Document current behavior and edge cases

**Short-term** (Month 1):
- ⚙️ Implement active CLAUDE.md migration during compaction
- ⚙️ Add proactive compaction at 92% threshold
- ⚙️ Improve token estimation with actual tokenizer

**Medium-term** (Month 2-3):
- 🔮 Build checkpoint browser UI
- 🔮 Add conversation-level recovery
- 🔮 Implement smart summary optimization

**Long-term** (Month 3+):
- 🚀 Cross-session context sharing
- 🚀 Project-wide knowledge graphs
- 🚀 Machine learning for importance scoring

### Success Metrics

- **User Satisfaction**: Fewer complaints about context loss
- **Session Length**: Support for longer conversations (>500 turns)
- **Compaction Quality**: Summaries preserve critical information
- **Performance**: Compaction completes in <5 seconds
- **Recovery**: Successful checkpoint restoration rate >95%

---

## Appendix

### Code Locations

**OpenCode**:
- Compaction: `packages/opencode/src/session/compaction.ts`
- Session: `packages/opencode/src/session/index.ts`
- Messages: `packages/opencode/src/session/message-v2.ts`
- Prompts: `packages/opencode/src/session/prompt.ts`
- System: `packages/opencode/src/session/system.ts`
- Snapshots: `packages/opencode/src/snapshot/index.ts`
- Agents: `packages/opencode/src/agent/agent.ts`

**Anthropic SDK**:
- CompactionControl: `anthropic-sdk-typescript/src/lib/tools/CompactionControl.ts`

### References

- OpenCode Architecture: `opencode-fork/ARCHITECTURE.md`
- Claude Code Guide: `claude-code-architecture-guide.md`
- Skills Comparison: `skills-comparison.md`
- Anthropic SDK: TypeScript SDK repository

### Glossary

- **Compaction**: Process of summarizing message history to reduce token count
- **Pruning**: Removing old tool outputs while preserving conversation flow
- **Checkpoint**: Snapshot of conversation + file state for recovery
- **Sub-agent**: Isolated AI context for delegated tasks
- **Context Window**: Maximum token limit for model input
- **Summary Message**: Special assistant message containing compacted history
- **Memory File**: Persistent file (CLAUDE.md) for project context
- **wU2 Compressor**: Claude Code's compaction algorithm (name unclear)

---

*Document Version: 1.0*
*Last Updated: 2025-12-04*
*Author: Claude (Sonnet 4.5)*
