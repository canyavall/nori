# Agent Systems Comparison: OpenCode vs Claude Code

**Last Updated:** 2025-12-04

This document provides a comprehensive comparison of the agent systems in OpenCode and Claude Code, based on analysis of the OpenCode codebase and Claude Code's architecture.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Built-in Agents](#2-built-in-agents)
3. [Custom Agent Definition](#3-custom-agent-definition)
4. [Agent Configuration](#4-agent-configuration)
5. [Sub-agent System](#5-sub-agent-system)
6. [Tool Access Control](#6-tool-access-control)
7. [Context Isolation](#7-context-isolation)
8. [Implementation Details](#8-implementation-details)
9. [Feature Comparison Table](#9-feature-comparison-table)
10. [Implementation Roadmap](#10-implementation-roadmap)
11. [Gap Analysis](#11-gap-analysis)

---

## 1. Architecture Overview

### OpenCode Agent Architecture

OpenCode implements a **mode-based agent system** where agents can operate in different roles:

```typescript
// From: packages/opencode/src/agent/agent.ts
export namespace Agent {
  export const Info = z.object({
    name: z.string(),
    description: z.string().optional(),
    mode: z.enum(["subagent", "primary", "all"]),
    builtIn: z.boolean(),
    topP: z.number().optional(),
    temperature: z.number().optional(),
    color: z.string().optional(),
    permission: z.object({
      edit: Config.Permission,
      bash: z.record(z.string(), Config.Permission),
      webfetch: Config.Permission.optional(),
      doom_loop: Config.Permission.optional(),
      external_directory: Config.Permission.optional(),
    }),
    model: z.object({
      modelID: z.string(),
      providerID: z.string(),
    }).optional(),
    prompt: z.string().optional(),
    tools: z.record(z.string(), z.boolean()),
    options: z.record(z.string(), z.any()),
  })
}
```

**Key architectural features:**
- **Three modes:** `primary`, `subagent`, `all`
- **Primary agents:** User-facing agents that handle main interactions
- **Subagents:** Specialized agents invoked by primary agents or other subagents
- **Permission system:** Granular control over tool access
- **Tool registry:** Centralized tool management with filtering

### Claude Code Agent Architecture

Claude Code uses a **skill-based agent system** (based on architectural context):

**Key architectural features:**
- **Agent tool:** Agents are accessed via a special "Agent" tool
- **Task delegation:** Main agent can spawn sub-agents for specific tasks
- **Context isolation:** Each agent operates in its own context
- **Tool restrictions:** Agents can have different tool sets
- **Session management:** Separate sessions for agent invocations

**Comparison:**

| Aspect | OpenCode | Claude Code |
|--------|----------|-------------|
| Agent invocation | Task tool with `subagent_type` parameter | Agent tool with agent name |
| Agent definition | Configuration files (JSON/Markdown) | Built-in system (details not fully known) |
| Mode system | Explicit `primary`/`subagent`/`all` modes | Implicit based on invocation context |
| Tool access | Permission-based with allow/deny/ask | Tool restriction via agent configuration |

---

## 2. Built-in Agents

### OpenCode Built-in Agents

From `packages/opencode/src/agent/agent.ts`:

#### 1. **general** (Subagent)
- **Mode:** `subagent`
- **Description:** General-purpose agent for researching complex questions and executing multi-step tasks. Use this agent to execute multiple units of work in parallel.
- **Tools:** All default tools except `todoread`, `todowrite`
- **Permission:** Standard agent permissions (allow all)

#### 2. **explore** (Subagent)
- **Mode:** `subagent`
- **Description:** Fast agent specialized for exploring codebases. Use this when you need to quickly find files by patterns, search code for keywords, or answer questions about the codebase.
- **Tools:** Read-only tools (no `edit`, `write`, `todoread`, `todowrite`)
- **Permission:** Standard agent permissions
- **Custom Prompt:**
```
You are a file search specialist. You excel at thoroughly navigating and exploring codebases.

Your strengths:
- Rapidly finding files using glob patterns
- Searching code and text with powerful regex patterns
- Reading and analyzing file contents

Guidelines:
- Use Glob for broad file pattern matching
- Use Grep for searching file contents with regex
- Use Read when you know the specific file path you need to read
- Use Bash for file operations like copying, moving, or listing directory contents
- Adapt your search approach based on the thoroughness level specified by the caller
- Return file paths as absolute paths in your final response
- For clear communication, avoid using emojis
- Do not create any files, or run bash commands that modify the user's system state in any way
```

#### 3. **build** (Primary)
- **Mode:** `primary`
- **Description:** Default primary agent for building and modifying code
- **Tools:** All default tools
- **Permission:** Standard agent permissions

#### 4. **plan** (Primary)
- **Mode:** `primary`
- **Description:** Planning agent with restricted write access
- **Tools:** All default tools
- **Permission:** Highly restricted bash commands, no edit permission
- **Bash whitelist:**
  - Read-only commands: `cut*`, `diff*`, `du*`, `file*`, `find*` (with restrictions), `git diff*`, `git log*`, `git show*`, `git status*`, `git branch`, `grep*`, `head*`, `less*`, `ls*`, `more*`, `pwd*`, `rg*`, `sort*`, `stat*`, `tail*`, `tree*`, `uniq*`, `wc*`, `whereis*`, `which*`
  - All other commands: `ask`

### Claude Code Built-in Agents

Based on architectural context (exact list unknown):
- Likely includes specialized agents for different tasks
- Agents are invoked via the Agent tool
- Tool access is restricted per agent

**Comparison:**

| Feature | OpenCode | Claude Code |
|---------|----------|-------------|
| Number of built-in agents | 4 (general, explore, build, plan) | Unknown (likely similar or more) |
| Specialization | Mode-based + tool restrictions | Role-based with tool restrictions |
| Customizability | Fully configurable via config | Unknown (likely more limited) |
| Read-only agent | `explore` agent | Likely has equivalent |
| Planning agent | `plan` agent with bash whitelist | Likely has equivalent |

---

## 3. Custom Agent Definition

### OpenCode Custom Agents

OpenCode supports custom agents through **Markdown configuration files**:

**Location:** `.opencode/agent/*.md` or global config directory

**Example agent file** (`.opencode/agent/git-committer.md`):

```markdown
---
description: Use this agent when you are asked to commit and push code changes to a git repository.
mode: subagent
---

You commit and push to git

Commit messages should be brief since they are used to generate release notes.

Messages should say WHY the change was made and not WHAT was changed.
```

**Agent creation flow** (from `packages/opencode/src/cli/cmd/agent.ts`):

```typescript
// CLI command: opencode agent create
AgentCreateCommand = cmd({
  command: "create",
  describe: "create a new agent",
  async handler() {
    // 1. Ask user for scope (global or project)
    const scope: "global" | "project" = /* ... */

    // 2. Get agent description from user
    const query = await prompts.text({
      message: "Description",
      placeholder: "What should this agent do?",
    })

    // 3. Generate agent configuration using LLM
    const generated = await Agent.generate({ description: query })
    // Returns: { identifier, whenToUse, systemPrompt }

    // 4. Select tools
    const selectedTools = await prompts.multiselect({
      message: "Select tools to enable",
      options: ["bash", "read", "write", "edit", "list", "glob", "grep",
                "webfetch", "task", "todowrite", "todoread"],
    })

    // 5. Select agent mode
    const modeResult = await prompts.select({
      message: "Agent mode",
      options: ["all", "primary", "subagent"],
    })

    // 6. Write to Markdown file with frontmatter
    const content = matter.stringify(generated.systemPrompt, {
      description: generated.whenToUse,
      mode: modeResult,
      tools: toolsConfig,
    })
    await Bun.write(filePath, content)
  },
})
```

**Agent loading** (from `packages/opencode/src/config/config.ts`):

```typescript
const AGENT_GLOB = new Bun.Glob("agent/**/*.md")

async function loadAgent(dir: string) {
  const result: Record<string, Agent> = {}

  for await (const item of AGENT_GLOB.scan({ absolute: true, cwd: dir })) {
    const md = await ConfigMarkdown.parse(item)

    // Extract agent name from file path
    let agentName = path.basename(item, ".md")

    // Support nested agents (e.g., "category/agent-name")
    if (agentFolderPath.includes("/")) {
      const relativePath = agentFolderPath.replace(".md", "")
      const pathParts = relativePath.split("/")
      agentName = pathParts.slice(0, -1).join("/") + "/" + pathParts[pathParts.length - 1]
    }

    const config = {
      name: agentName,
      ...md.data,
      prompt: md.content.trim(),
    }

    const parsed = Agent.safeParse(config)
    if (parsed.success) {
      result[config.name] = parsed.data
    }
  }
  return result
}
```

### Claude Code Custom Agents

**Current state:** Limited information available about custom agent definition in Claude Code.

**Likely approach:**
- May not support user-defined custom agents in the same way
- Built-in agents are likely predefined in the system
- Customization may be through configuration rather than new agent creation

**Comparison:**

| Feature | OpenCode | Claude Code |
|---------|----------|-------------|
| Custom agent support | ✅ Full support via Markdown | ❓ Unknown |
| Agent creation UI | CLI wizard + LLM generation | ❓ Unknown |
| Agent file format | Markdown with frontmatter | N/A |
| Nested agents | ✅ Supported via folder structure | ❓ Unknown |
| LLM-assisted creation | ✅ Uses generateObject to create config | ❓ Unknown |

---

## 4. Agent Configuration

### OpenCode Configuration Format

**JSON/JSONC Configuration** (in `opencode.json` or `opencode.jsonc`):

```json
{
  "agent": {
    "myagent": {
      "description": "When to use this agent",
      "mode": "subagent",
      "model": "anthropic/claude-3-5-sonnet-20241022",
      "temperature": 0.7,
      "top_p": 0.9,
      "color": "#FF5733",
      "prompt": "You are a specialized agent...",
      "tools": {
        "bash": false,
        "write": false
      },
      "permission": {
        "edit": "deny",
        "bash": {
          "git*": "allow",
          "*": "ask"
        },
        "webfetch": "allow"
      }
    }
  }
}
```

**Markdown Configuration** (`.opencode/agent/myagent.md`):

```markdown
---
description: When to use this agent
mode: subagent
model: anthropic/claude-3-5-sonnet-20241022
temperature: 0.7
top_p: 0.9
color: "#FF5733"
tools:
  bash: false
  write: false
permission:
  edit: deny
  bash:
    "git*": allow
    "*": ask
  webfetch: allow
---

You are a specialized agent...

Your responsibilities:
- Do X
- Do Y
- Do Z

Guidelines:
- Follow pattern A
- Avoid pattern B
```

**Configuration schema** (from `packages/opencode/src/config/config.ts`):

```typescript
export const Agent = z.object({
  model: z.string().optional(),
  temperature: z.number().optional(),
  top_p: z.number().optional(),
  prompt: z.string().optional(),
  tools: z.record(z.string(), z.boolean()).optional(),
  disable: z.boolean().optional(),
  description: z.string().optional(),
  mode: z.enum(["subagent", "primary", "all"]).optional(),
  color: z.string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color format")
    .optional(),
  permission: z.object({
    edit: Permission.optional(),
    bash: z.union([Permission, z.record(z.string(), Permission)]).optional(),
    webfetch: Permission.optional(),
    doom_loop: Permission.optional(),
    external_directory: Permission.optional(),
  }).optional(),
}).catchall(z.any())

// Permission: z.enum(["ask", "allow", "deny"])
```

### Claude Code Configuration Format

**Current state:** Details unknown. Likely uses internal configuration.

**Comparison:**

| Feature | OpenCode | Claude Code |
|---------|----------|-------------|
| Configuration file | JSON/JSONC or Markdown | ❓ Unknown |
| Model override | ✅ Per-agent model | ❓ Unknown |
| Temperature/top_p | ✅ Per-agent settings | ❓ Unknown |
| Custom prompts | ✅ Full system prompt override | ❓ Likely limited |
| Tool enable/disable | ✅ Per-tool boolean flags | ❓ Unknown |
| Color coding | ✅ Hex color for UI | ❓ Unknown |
| Permission system | ✅ Granular edit/bash/webfetch | ❓ Unknown |

---

## 5. Sub-agent System

### OpenCode Sub-agent Implementation

**Task tool** (from `packages/opencode/src/tool/task.ts`):

```typescript
export const TaskTool = Tool.define("task", async () => {
  // Get all agents that can be subagents (not primary-only)
  const agents = await Agent.list().then((x) => x.filter((a) => a.mode !== "primary"))

  const description = DESCRIPTION.replace(
    "{agents}",
    agents.map((a) =>
      `- ${a.name}: ${a.description ?? "This subagent should only be called manually by the user."}`
    ).join("\n"),
  )

  return {
    description,
    parameters: z.object({
      description: z.string().describe("A short (3-5 words) description of the task"),
      prompt: z.string().describe("The task for the agent to perform"),
      subagent_type: z.string().describe("The type of specialized agent to use for this task"),
      session_id: z.string().describe("Existing Task session to continue").optional(),
    }),
    async execute(params, ctx) {
      const agent = await Agent.get(params.subagent_type)
      if (!agent) throw new Error(`Unknown agent type: ${params.subagent_type}`)

      // Create or continue session
      const session = await iife(async () => {
        if (params.session_id) {
          const found = await Session.get(params.session_id).catch(() => {})
          if (found) return found
        }

        // Create child session with parentID
        return await Session.create({
          parentID: ctx.sessionID,
          title: params.description + ` (@${agent.name} subagent)`,
        })
      })

      // Get model from agent or parent message
      const model = agent.model ?? {
        modelID: msg.info.modelID,
        providerID: msg.info.providerID,
      }

      // Invoke the subagent with restricted tools
      const result = await SessionPrompt.prompt({
        messageID,
        sessionID: session.id,
        model: {
          modelID: model.modelID,
          providerID: model.providerID,
        },
        agent: agent.name,
        tools: {
          todowrite: false,
          todoread: false,
          task: false,  // Prevent recursive task calls
          ...Object.fromEntries((config.experimental?.primary_tools ?? []).map((t) => [t, false])),
          ...agent.tools,
        },
        parts: promptParts,
      })

      // Return result with session metadata
      return {
        title: params.description,
        metadata: {
          summary: all,
          sessionId: session.id,
        },
        output: text + "\n\n" + ["<task_metadata>", `session_id: ${session.id}`, "</task_metadata>"].join("\n"),
      }
    },
  }
})
```

**Key features:**
1. **Child session creation:** Each subagent runs in a child session
2. **Tool restrictions:** Prevents recursive task calls, disables todo tools
3. **Primary tool filtering:** Experimental feature to restrict certain tools to primary agents
4. **Session continuity:** Can continue an existing subagent session
5. **Metadata tracking:** Returns session ID for reference

**Task tool prompt** (from `packages/opencode/src/tool/task.txt`):

```
Launch a new agent to handle complex, multi-step tasks autonomously.

Available agent types and the tools they have access to:
{agents}

When to use the Task tool:
- When you are instructed to execute custom slash commands
- [Other use cases...]

When NOT to use the Task tool:
- If you want to read a specific file path, use the Read or Glob tool instead
- If you are searching for a specific class definition, use the Glob tool instead
- [Other anti-patterns...]

Usage notes:
1. Launch multiple agents concurrently whenever possible
2. The result returned by the agent is not visible to the user
3. Each agent invocation is stateless unless you provide a session_id
4. The agent's outputs should generally be trusted
5. Clearly tell the agent whether you expect it to write code or just research
```

### Claude Code Sub-agent Implementation

Based on architectural understanding:
- Uses Agent tool to invoke sub-agents
- Each agent runs in isolated context
- Results are returned to parent agent
- Likely has similar session management

**Comparison:**

| Feature | OpenCode | Claude Code |
|---------|----------|-------------|
| Sub-agent invocation | Task tool with parameters | Agent tool |
| Session management | Child sessions with parentID | Separate contexts |
| Tool restrictions | Configurable per invocation | Fixed per agent |
| Recursion prevention | Disables task tool in subagents | Unknown |
| Session continuity | ✅ Can resume sessions | ❓ Unknown |
| Parallel execution | ✅ Explicitly encouraged | ✅ Likely supported |
| Result visibility | Not visible to user by default | Unknown |

---

## 6. Tool Access Control

### OpenCode Permission System

**Permission levels** (from `packages/opencode/src/config/config.ts`):

```typescript
export const Permission = z.enum(["ask", "allow", "deny"])
```

**Permission structure** (from `packages/opencode/src/agent/agent.ts`):

```typescript
permission: z.object({
  edit: Config.Permission,  // "ask" | "allow" | "deny"
  bash: z.record(z.string(), Config.Permission),  // Pattern matching
  webfetch: Config.Permission.optional(),
  doom_loop: Config.Permission.optional(),  // Infinite loop protection
  external_directory: Config.Permission.optional(),  // Access outside project
})
```

**Permission merging** (from `packages/opencode/src/agent/agent.ts`):

```typescript
function mergeAgentPermissions(basePermission: any, overridePermission: any): Agent.Info["permission"] {
  // Convert string bash permission to object
  if (typeof basePermission.bash === "string") {
    basePermission.bash = { "*": basePermission.bash }
  }
  if (typeof overridePermission.bash === "string") {
    overridePermission.bash = { "*": overridePermission.bash }
  }

  // Deep merge permissions
  const merged = mergeDeep(basePermission ?? {}, overridePermission ?? {})

  // Merge bash patterns with wildcard support
  let mergedBash
  if (merged.bash) {
    if (typeof merged.bash === "string") {
      mergedBash = { "*": merged.bash }
    } else if (typeof merged.bash === "object") {
      mergedBash = mergeDeep({ "*": "allow" }, merged.bash)
    }
  }

  return {
    edit: merged.edit ?? "allow",
    webfetch: merged.webfetch ?? "allow",
    bash: mergedBash ?? { "*": "allow" },
    doom_loop: merged.doom_loop,
    external_directory: merged.external_directory,
  }
}
```

**Default permissions:**

```typescript
// Standard agent permission (build, explore, general)
const defaultPermission: Info["permission"] = {
  edit: "allow",
  bash: { "*": "allow" },
  webfetch: "allow",
  doom_loop: "ask",
  external_directory: "ask",
}

// Plan agent permission (read-only focused)
const planPermission = {
  edit: "deny",
  bash: {
    "cut*": "allow",
    "diff*": "allow",
    "du*": "allow",
    "file *": "allow",
    "find * -delete*": "ask",
    "find * -exec*": "ask",
    "find *": "allow",
    "git diff*": "allow",
    "git log*": "allow",
    "git show*": "allow",
    "git status*": "allow",
    "git branch": "allow",
    "grep*": "allow",
    "head*": "allow",
    "less*": "allow",
    "ls*": "allow",
    "more*": "allow",
    "pwd*": "allow",
    "rg*": "allow",
    "sort*": "allow",
    "stat*": "allow",
    "tail*": "allow",
    "tree*": "allow",
    "uniq*": "allow",
    "wc*": "allow",
    "whereis*": "allow",
    "which*": "allow",
    "*": "ask",  // All other commands require approval
  },
  webfetch: "allow",
}
```

**Tool registry filtering** (from `packages/opencode/src/tool/registry.ts`):

```typescript
export async function enabled(agent: Agent.Info): Promise<Record<string, boolean>> {
  const result: Record<string, boolean> = {}

  // Disable edit/write if edit permission is denied
  if (agent.permission.edit === "deny") {
    result["edit"] = false
    result["write"] = false
  }

  // Disable bash if all commands are denied
  if (agent.permission.bash["*"] === "deny" && Object.keys(agent.permission.bash).length === 1) {
    result["bash"] = false
  }

  // Disable web-based tools if webfetch is denied
  if (agent.permission.webfetch === "deny") {
    result["webfetch"] = false
    result["codesearch"] = false
    result["websearch"] = false
  }

  return result
}
```

### Claude Code Tool Access Control

Based on architectural knowledge:
- Tools are assigned to agents
- Agents have fixed or configurable tool sets
- Tool restrictions prevent certain operations

**Comparison:**

| Feature | OpenCode | Claude Code |
|---------|----------|-------------|
| Permission model | ask/allow/deny per tool | Tool inclusion/exclusion |
| Bash command filtering | ✅ Pattern matching (wildcards) | ❓ Unknown |
| Edit control | ✅ Separate edit/write control | ❓ Likely combined |
| Webfetch control | ✅ Separate permission | ❓ Unknown |
| Doom loop protection | ✅ Configurable | ❓ Unknown |
| External directory | ✅ Controlled access | ❓ Unknown |
| Permission inheritance | ✅ Config → agent → invocation | ❓ Unknown |
| Runtime permission | ✅ User approval via "ask" | ❓ Unknown |

---

## 7. Context Isolation

### OpenCode Session Management

**Session structure** (from `packages/opencode/src/session/index.ts`):

```typescript
export const Info = z.object({
  id: Identifier.schema("session"),
  projectID: z.string(),
  directory: z.string(),
  parentID: Identifier.schema("session").optional(),  // Child session reference
  title: z.string(),
  version: z.string(),
  time: z.object({
    created: z.number(),
    updated: z.number(),
    compacting: z.number().optional(),
  }),
  // ... other fields
})
```

**Child session creation:**

```typescript
export async function createNext(input: {
  id?: string;
  title?: string;
  parentID?: string;  // Links to parent session
  directory: string
}) {
  const result: Info = {
    id: Identifier.descending("session", input.id),
    version: Installation.VERSION,
    projectID: Instance.project.id,
    directory: input.directory,
    parentID: input.parentID,  // Establishes parent-child relationship
    title: input.title ?? createDefaultTitle(!!input.parentID),
    time: {
      created: Date.now(),
      updated: Date.now(),
    },
  }

  await Storage.write(["session", Instance.project.id, result.id], result)
  Bus.publish(Event.Created, { info: result })

  return result
}
```

**Key isolation features:**
1. **Separate session IDs:** Each subagent gets its own session ID
2. **Parent tracking:** `parentID` field links child to parent
3. **Separate message history:** Messages are scoped to session ID
4. **Independent state:** Each session has its own todo list, file tracking, etc.
5. **Title prefixing:** Child sessions get "Child session -" prefix

**Session hierarchy:**
```
Parent Session (01234567-89ab-cdef-0123-456789abcdef)
├── Message 1 (user)
├── Message 2 (assistant - calls Task tool)
└── Child Session 1 (01234567-89ab-cdef-0123-456789abcde0)
    ├── Message 1 (user - from task prompt)
    ├── Message 2 (assistant)
    └── Message 3 (assistant - final result)
```

### Claude Code Context Isolation

Based on architectural understanding:
- Each agent runs in isolated context
- Results are passed back to parent
- Likely uses similar session management

**Comparison:**

| Feature | OpenCode | Claude Code |
|---------|----------|-------------|
| Session isolation | ✅ Separate sessions per subagent | ✅ Likely similar |
| Parent tracking | ✅ parentID field | ❓ Unknown |
| Message scope | ✅ Per-session message history | ✅ Likely similar |
| State isolation | ✅ Per-session state | ✅ Likely similar |
| Session reuse | ✅ Can continue sessions | ❓ Unknown |
| Hierarchy visualization | ✅ Child session prefix | ❓ Unknown |

---

## 8. Implementation Details

### OpenCode Agent Loading

**Configuration loading order** (from `packages/opencode/src/config/config.ts`):

```typescript
export const state = Instance.state(async () => {
  // 1. Load global config
  let result = await global()

  // 2. Override with custom config path
  if (Flag.OPENCODE_CONFIG) {
    result = mergeConfigWithPlugins(result, await loadFile(Flag.OPENCODE_CONFIG))
  }

  // 3. Find and merge project configs
  for (const file of ["opencode.jsonc", "opencode.json"]) {
    const found = await Filesystem.findUp(file, Instance.directory, Instance.worktree)
    for (const resolved of found.toReversed()) {
      result = mergeConfigWithPlugins(result, await loadFile(resolved))
    }
  }

  // 4. Load agent markdown files from directories
  const directories = [
    Global.Path.config,
    ...await Array.fromAsync(Filesystem.up({
      targets: [".opencode"],
      start: Instance.directory,
      stop: Instance.worktree,
    })),
  ]

  for (const dir of directories) {
    result.agent = mergeDeep(result.agent ?? {}, await loadAgent(dir))
  }

  // 5. Migrate deprecated mode field to agent field
  for (const [name, mode] of Object.entries(result.mode)) {
    result.agent = mergeDeep(result.agent ?? {}, {
      [name]: { ...mode, mode: "primary" as const },
    })
  }

  return { config: result, directories }
})
```

**Agent initialization** (from `packages/opencode/src/agent/agent.ts`):

```typescript
const state = Instance.state(async () => {
  const cfg = await Config.get()
  const defaultTools = cfg.tools ?? {}

  // Define default permissions
  const defaultPermission: Info["permission"] = {
    edit: "allow",
    bash: { "*": "allow" },
    webfetch: "allow",
    doom_loop: "ask",
    external_directory: "ask",
  }

  const agentPermission = mergeAgentPermissions(defaultPermission, cfg.permission ?? {})

  // Define built-in agents
  const result: Record<string, Info> = {
    general: { /* ... */ },
    explore: { /* ... */ },
    build: { /* ... */ },
    plan: { /* ... */ },
  }

  // Merge custom agents from config
  for (const [key, value] of Object.entries(cfg.agent ?? {})) {
    if (value.disable) {
      delete result[key]
      continue
    }

    let item = result[key]
    if (!item) {
      item = result[key] = {
        name: key,
        mode: "all",
        permission: agentPermission,
        options: {},
        tools: {},
        builtIn: false,
      }
    }

    // Apply config overrides
    const { name, model, prompt, tools, description, temperature, top_p, mode, permission, color, ...extra } = value

    if (model) item.model = Provider.parseModel(model)
    if (prompt) item.prompt = prompt
    if (tools) item.tools = { ...item.tools, ...tools }
    if (description) item.description = description
    if (temperature != undefined) item.temperature = temperature
    if (top_p != undefined) item.topP = top_p
    if (mode) item.mode = mode
    if (color) item.color = color
    if (permission ?? cfg.permission) {
      item.permission = mergeAgentPermissions(cfg.permission ?? {}, permission ?? {})
    }

    // Merge with default tools
    item.tools = { ...defaultTools, ...item.tools }
    item.options = { ...item.options, ...extra }
  }

  return result
})
```

### OpenCode Tool Resolution

**Tool resolution for agent** (from `packages/opencode/src/session/prompt.ts`):

```typescript
async function resolveTools(input: {
  agent: Agent.Info
  model: Provider.Model
  sessionID: string
  tools?: Record<string, boolean>
  processor: SessionProcessor.Info
}) {
  const tools: Record<string, AITool> = {}

  // Merge tool configurations
  const enabledTools = pipe(
    input.agent.tools,  // Agent-specific tools
    mergeDeep(await ToolRegistry.enabled(input.agent)),  // Permission-based filtering
    mergeDeep(input.tools ?? {}),  // Invocation-specific overrides
  )

  // Add built-in tools
  for (const item of await ToolRegistry.tools(input.model.providerID)) {
    if (Wildcard.all(item.id, enabledTools) === false) continue

    const schema = ProviderTransform.schema(input.model, z.toJSONSchema(item.parameters))
    tools[item.id] = tool({
      id: item.id,
      description: item.description,
      inputSchema: jsonSchema(schema),
      async execute(args, options) {
        // Plugin hooks
        await Plugin.trigger("tool.execute.before", /* ... */)

        const result = await item.execute(args, {
          sessionID: input.sessionID,
          abort: options.abortSignal!,
          messageID: input.processor.message.id,
          callID: options.toolCallId,
          extra: { model: input.model },
          agent: input.agent.name,
          metadata: async (val) => { /* ... */ },
        })

        await Plugin.trigger("tool.execute.after", /* ... */)
        return result
      },
    })
  }

  // Add MCP tools
  for (const [key, item] of Object.entries(await MCP.tools())) {
    if (Wildcard.all(key, enabledTools) === false) continue
    // Wrap MCP tool execution...
    tools[key] = item
  }

  return tools
}
```

### OpenCode Agent Prompt Resolution

**System prompt resolution** (from `packages/opencode/src/session/prompt.ts`):

```typescript
async function resolveSystemPrompt(input: {
  system?: string;
  agent: Agent.Info;
  model: Provider.Model
}) {
  let system = SystemPrompt.header(input.model.providerID)

  // Add agent-specific or custom system prompt
  system.push(
    ...(() => {
      if (input.system) return [input.system]  // Invocation override
      if (input.agent.prompt) return [input.agent.prompt]  // Agent config
      return SystemPrompt.provider(input.model)  // Provider default
    })(),
  )

  // Add environment and custom instructions
  system.push(...(await SystemPrompt.environment()))
  system.push(...(await SystemPrompt.custom()))

  // Consolidate for caching (max 2 system messages)
  const [first, ...rest] = system
  system = [first, rest.join("\n")]

  return system
}
```

### Claude Code Implementation (Unknown)

Most implementation details for Claude Code are not publicly available.

**Comparison:**

| Aspect | OpenCode | Claude Code |
|--------|----------|-------------|
| Config loading | Multi-layer merge | ❓ Unknown |
| Agent initialization | Lazy state initialization | ❓ Unknown |
| Tool resolution | Dynamic with wildcards | ❓ Unknown |
| Prompt resolution | Hierarchical override | ❓ Unknown |
| Plugin system | Hook-based extensibility | ❓ Unknown |

---

## 9. Feature Comparison Table

| Feature | OpenCode | Claude Code | Notes |
|---------|----------|-------------|-------|
| **Agent Definition** | | | |
| Custom agents | ✅ Full support | ❓ Unknown | OpenCode uses Markdown files |
| Agent modes | ✅ primary/subagent/all | ❌ No explicit modes | Claude Code uses invocation context |
| Built-in agents | 4 (general, explore, build, plan) | ❓ Unknown | |
| Agent creation wizard | ✅ CLI with LLM | ❌ No | |
| **Configuration** | | | |
| Config format | JSON/JSONC/Markdown | ❓ Unknown | |
| Per-agent model | ✅ Yes | ❓ Unknown | |
| Per-agent temperature | ✅ Yes | ❓ Unknown | |
| Custom system prompt | ✅ Full override | ❓ Limited | |
| Color coding | ✅ Hex colors | ❓ Unknown | |
| **Tool Access** | | | |
| Permission model | ask/allow/deny | Inclusion/exclusion | OpenCode more granular |
| Bash filtering | ✅ Pattern matching | ❓ Unknown | |
| Edit control | ✅ Separate edit/write | ❓ Combined | |
| Tool per invocation | ✅ Override at runtime | ❓ Unknown | |
| **Sub-agents** | | | |
| Sub-agent invocation | Task tool | Agent tool | Different tool names |
| Session isolation | ✅ Child sessions | ✅ Likely similar | |
| Session continuity | ✅ Resume by ID | ❓ Unknown | |
| Parallel execution | ✅ Encouraged | ✅ Likely supported | |
| Recursion prevention | ✅ Disable task in subagents | ❓ Unknown | |
| **Context Management** | | | |
| Parent tracking | ✅ parentID field | ❓ Unknown | |
| Message scope | ✅ Per-session | ✅ Likely similar | |
| State isolation | ✅ Per-session | ✅ Likely similar | |
| **Implementation** | | | |
| Source available | ✅ Open source | ❌ Closed | |
| Plugin system | ✅ Hook-based | ❌ No plugins | |
| Config merging | ✅ Multi-layer | ❓ Unknown | |
| Lazy loading | ✅ Instance.state | ❓ Unknown | |

---

## 10. Implementation Roadmap

### Phase 1: Basic Agent Support (High Priority)

**Goal:** Implement core agent functionality similar to OpenCode

1. **Define agent schema**
   ```typescript
   interface Agent {
     name: string
     description?: string
     mode: "primary" | "subagent" | "all"
     prompt?: string
     tools: Record<string, boolean>
     model?: { provider: string; model: string }
     temperature?: number
     topP?: number
   }
   ```

2. **Create agent configuration loader**
   - Support `.claude-code/agents/*.md` files
   - Parse frontmatter for configuration
   - Load markdown content as system prompt
   - Merge with defaults

3. **Implement built-in agents**
   - `build`: Default primary agent
   - `explore`: Read-only codebase exploration
   - `plan`: Planning with restricted writes

4. **Add agent CLI commands**
   - `claude-code agent list`: List all agents
   - `claude-code agent create`: Wizard to create new agent
   - Consider LLM-assisted generation

### Phase 2: Task Tool & Sub-agents (High Priority)

**Goal:** Enable agent delegation like OpenCode

1. **Create Task tool**
   - Define tool schema with `subagent_type`, `prompt`, `description`
   - Filter available agents (exclude primary-only)
   - Create tool description with agent list

2. **Implement session management**
   - Add `parentID` to session structure
   - Create child session on task invocation
   - Track session hierarchy

3. **Tool restriction in sub-agents**
   - Disable `task` tool in sub-agents (prevent recursion)
   - Apply agent-specific tool restrictions
   - Filter based on agent permissions

4. **Session continuity**
   - Add `session_id` parameter to Task tool
   - Allow resuming existing sub-agent sessions
   - Maintain conversation context

### Phase 3: Permission System (Medium Priority)

**Goal:** Implement granular tool access control

1. **Define permission types**
   ```typescript
   type Permission = "ask" | "allow" | "deny"

   interface AgentPermissions {
     edit: Permission
     bash: Permission | Record<string, Permission>  // Pattern matching
     webfetch: Permission
   }
   ```

2. **Implement permission merging**
   - Config-level defaults
   - Agent-level overrides
   - Invocation-level overrides
   - Handle bash pattern matching with wildcards

3. **Tool filtering based on permissions**
   - Check permissions before adding tools
   - Disable edit/write if edit denied
   - Disable bash if all patterns denied
   - Runtime permission prompts for "ask"

4. **Bash command filtering**
   - Pattern matching for bash commands
   - Whitelist/blacklist approach
   - Default safe patterns for read-only agents

### Phase 4: Advanced Features (Lower Priority)

**Goal:** Match OpenCode feature parity

1. **Agent metadata**
   - Color coding for UI
   - Agent descriptions
   - Per-agent options/extra config

2. **LLM-assisted agent creation**
   - Use `generateObject` to create agent config
   - Generate identifier, description, system prompt
   - Interactive tool selection
   - Interactive mode selection

3. **Nested agent support**
   - Support folder structure: `agents/category/agent.md`
   - Generate namespaced agent names: `category/agent`
   - Group related agents

4. **Primary tool restriction**
   - Add `experimental.primary_tools` config
   - Disable these tools in sub-agents
   - Use for UI-specific or high-level tools

### Phase 5: Polish & Testing (Ongoing)

1. **Documentation**
   - Document agent system in user docs
   - Add examples for common use cases
   - Create migration guide from other systems

2. **Testing**
   - Unit tests for agent loading
   - Integration tests for sub-agent invocation
   - Permission system tests
   - End-to-end workflow tests

3. **Performance optimization**
   - Lazy loading of agent configs
   - Cache agent resolution
   - Optimize tool filtering

4. **Error handling**
   - Graceful degradation on invalid configs
   - Clear error messages for users
   - Validation on agent creation

---

## 11. Gap Analysis

### What We Know About OpenCode

✅ **Fully documented:**
- Agent configuration schema
- Tool restriction mechanisms
- Permission system with ask/allow/deny
- Sub-agent invocation via Task tool
- Session management with parent/child relationships
- Agent loading and merging logic
- Tool resolution and filtering
- Bash command pattern matching
- Built-in agent configurations
- Agent creation workflow
- Markdown config format with frontmatter

### What We Know About Claude Code

✅ **Confirmed:**
- Has agent system for task delegation
- Agents run in isolated contexts
- Results return to parent agent
- Tool restrictions per agent

❓ **Likely but unconfirmed:**
- Uses similar session management
- Has built-in specialized agents
- Supports tool filtering
- Parallel agent execution

### What We Don't Know About Claude Code

❌ **Unknown:**
- Exact agent configuration format
- Custom agent creation process
- Permission system details
- Bash command filtering approach
- Agent metadata (colors, descriptions)
- LLM-assisted agent generation
- Nested agent support
- Config file locations and merging
- Primary vs subagent distinction
- Tool override at invocation time
- Session continuity mechanism
- Agent mode system

### Knowledge Gaps Impacting Implementation

**High impact:**
1. **Custom agent creation:** Don't know if Claude Code supports user-defined agents
2. **Permission granularity:** Unclear if Claude Code has ask/allow/deny system
3. **Configuration format:** Don't know config file structure or location

**Medium impact:**
4. **Bash filtering:** Unknown if/how Claude Code filters bash commands
5. **Agent modes:** Don't know if primary/subagent distinction exists
6. **Tool overrides:** Unclear if tools can be overridden per invocation

**Low impact:**
7. **Agent metadata:** Don't know if colors or extra config supported
8. **Nested agents:** Unknown if folder structure supported
9. **LLM generation:** Don't know if agents can be LLM-generated

### Research Needed

To close these gaps, we would need to:

1. **Examine Claude Code codebase** (if available)
2. **Test Claude Code features** through experimentation
3. **Review Claude Code documentation** for agent details
4. **Interview Claude Code developers** about design decisions
5. **Analyze Claude Code API** for agent-related endpoints

---

## Appendix A: Code Examples

### OpenCode Agent Configuration Examples

**Example 1: Simple subagent** (`.opencode/agent/reviewer.md`):

```markdown
---
description: Reviews code for quality and suggests improvements
mode: subagent
tools:
  edit: false
  write: false
---

You are a code reviewer focused on quality and best practices.

When reviewing code:
- Check for bugs and edge cases
- Suggest performance improvements
- Verify adherence to style guidelines
- Look for security vulnerabilities

Format your review as:
1. Summary
2. Issues found (if any)
3. Recommendations
```

**Example 2: Primary agent with custom model** (`.opencode/agent/architect.md`):

```markdown
---
description: Designs system architecture and high-level solutions
mode: primary
model: anthropic/claude-3-5-sonnet-20241022
temperature: 0.8
---

You are a software architect specializing in system design.

Your responsibilities:
- Design scalable system architectures
- Choose appropriate technologies
- Create detailed technical specifications
- Consider trade-offs and constraints

Always provide:
- Architecture diagrams (as text)
- Technology justifications
- Implementation phases
```

**Example 3: Agent with restricted bash** (JSON config):

```json
{
  "agent": {
    "security-scanner": {
      "description": "Scans code for security vulnerabilities",
      "mode": "subagent",
      "permission": {
        "edit": "deny",
        "bash": {
          "grep*": "allow",
          "rg*": "allow",
          "find*": "allow",
          "git grep*": "allow",
          "*": "deny"
        }
      }
    }
  }
}
```

### OpenCode Task Tool Usage Examples

**Example 1: Parallel agent execution**:

```typescript
// Agent receives user message: "Review the authentication code and check for security issues"

// Agent response:
// 1. Call Task tool with explore agent
Task({
  description: "Find auth code",
  prompt: "Find all authentication-related files in the codebase. Look for login, auth, authentication, session management files.",
  subagent_type: "explore"
})

// 2. Simultaneously call Task tool with security scanner
Task({
  description: "Security scan",
  prompt: "Scan the authentication code for common security vulnerabilities: SQL injection, XSS, CSRF, weak password hashing, session fixation",
  subagent_type: "security-scanner"
})

// 3. After results, call Task tool with reviewer
Task({
  description: "Code review",
  prompt: "Review the authentication code found at [files from explore agent]. Focus on: error handling, edge cases, code quality. Here are security issues found: [results from security scanner]",
  subagent_type: "reviewer"
})
```

**Example 2: Continuing a session**:

```typescript
// First invocation
const result1 = await Task({
  description: "Research APIs",
  prompt: "Research the best APIs for payment processing. Compare Stripe, PayPal, and Square.",
  subagent_type: "general"
})
// Returns: { session_id: "abc123", output: "..." }

// Later, continue the research
const result2 = await Task({
  description: "Research APIs",
  prompt: "Based on your previous research, dive deeper into Stripe's API. Focus on subscription management and webhooks.",
  subagent_type: "general",
  session_id: "abc123"  // Continue previous session
})
```

---

## Appendix B: References

### OpenCode Source Files

- `packages/opencode/src/agent/agent.ts` - Agent definition and initialization
- `packages/opencode/src/tool/task.ts` - Task tool implementation
- `packages/opencode/src/config/config.ts` - Configuration loading and merging
- `packages/opencode/src/session/prompt.ts` - Prompt and tool resolution
- `packages/opencode/src/session/index.ts` - Session management
- `packages/opencode/src/tool/registry.ts` - Tool registry and filtering
- `packages/opencode/src/cli/cmd/agent.ts` - Agent CLI commands
- `.opencode/agent/*.md` - Example agent configurations

### Documentation

- OpenCode docs: https://opencode.ai/docs
- OpenCode GitHub: https://github.com/opencode-ai/opencode

---

## Conclusion

This comparison reveals that OpenCode has a **comprehensive, well-architected agent system** with extensive configurability:

**OpenCode Strengths:**
- Full support for custom agents
- Granular permission system with ask/allow/deny
- Bash command pattern matching
- Flexible configuration via JSON or Markdown
- LLM-assisted agent creation
- Clear separation of primary vs subagent modes
- Session hierarchy with parent tracking

**Claude Code Unknown Factors:**
- Most implementation details are not publicly documented
- May have different design philosophy
- Could have features not present in OpenCode

**Implementation Priority for Claude Code:**
1. Basic agent support with configuration loading
2. Task tool and sub-agent system
3. Permission system for tool access control
4. Advanced features like LLM generation

The roadmap provides a clear path to implement OpenCode-like agent functionality in Claude Code, assuming the current architecture can support these features.
