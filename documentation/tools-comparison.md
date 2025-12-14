# OpenCode vs Claude Code: Tools System Comparison

**Last Updated:** 2025-12-04

This document provides a comprehensive comparison between OpenCode and Claude Code's tool systems, analyzing their architectures, implementations, and capabilities.

---

## Table of Contents

1. [Tool Architecture](#1-tool-architecture)
2. [Available Tools](#2-available-tools)
3. [Tool Implementation](#3-tool-implementation)
4. [Permission System](#4-permission-system)
5. [Tool Parameters](#5-tool-parameters)
6. [Tool Output](#6-tool-output)
7. [Bash Tool](#7-bash-tool)
8. [File Tools](#8-file-tools)
9. [Search Tools](#9-search-tools)
10. [Web Tools](#10-web-tools)
11. [Feature Comparison Table](#11-feature-comparison-table)
12. [Implementation Roadmap](#12-implementation-roadmap)
13. [Gap Analysis](#13-gap-analysis)

---

## 1. Tool Architecture

### OpenCode Architecture

OpenCode uses a clean, TypeScript-based tool definition system with two main approaches:

#### Core Tool System (`packages/opencode/src/tool/tool.ts`)

```typescript
export namespace Tool {
  export type Context<M extends Metadata = Metadata> = {
    sessionID: string
    messageID: string
    agent: string
    abort: AbortSignal
    callID?: string
    extra?: { [key: string]: any }
    metadata(input: { title?: string; metadata?: M }): void
  }

  export interface Info<Parameters extends z.ZodType = z.ZodType, M extends Metadata = Metadata> {
    id: string
    init: () => Promise<{
      description: string
      parameters: Parameters
      execute(
        args: z.infer<Parameters>,
        ctx: Context,
      ): Promise<{
        title: string
        metadata: M
        output: string
        attachments?: MessageV2.FilePart[]
      }>
      formatValidationError?(error: z.ZodError): string
    }>
  }

  export function define<Parameters extends z.ZodType, Result extends Metadata>(
    id: string,
    init: Info<Parameters, Result>["init"] | Awaited<ReturnType<Info<Parameters, Result>["init"]>>,
  ): Info<Parameters, Result>
}
```

**Key Features:**
- Namespace-based organization
- Zod schema validation built-in
- Streaming metadata support via `ctx.metadata()`
- Abort signal support for cancellation
- Custom validation error formatting
- Lazy initialization with async `init()` function
- Attachment support for images/files

#### Plugin Tool System (`packages/plugin/src/tool.ts`)

```typescript
export type ToolContext = {
  sessionID: string
  messageID: string
  agent: string
  abort: AbortSignal
}

export function tool<Args extends z.ZodRawShape>(input: {
  description: string
  args: Args
  execute(args: z.infer<z.ZodObject<Args>>, context: ToolContext): Promise<string>
}) {
  return input
}
```

**Key Features:**
- Simplified plugin API
- Minimal context (no metadata streaming)
- Direct string output
- Easier for third-party plugins

### Claude Code Architecture

Based on the tool descriptions and system prompts, Claude Code uses:

- **JSON Schema** for parameter definitions
- **Direct function invocation** model
- **Streaming output** for long-running operations
- **Built-in tools** (no plugin system mentioned)
- **Sandboxed execution** environment

**Key Differences:**
- OpenCode uses Zod schemas, Claude Code uses JSON Schema
- OpenCode has plugin extensibility, Claude Code appears more locked-down
- OpenCode has explicit metadata streaming, Claude Code streams via responses
- OpenCode has abort signals, Claude Code has timeout-based cancellation

---

## 2. Available Tools

### OpenCode Tools (19 total)

From `packages/opencode/src/tool/`:

1. **bash** - Execute shell commands
2. **read** - Read file contents
3. **write** - Write/create files
4. **edit** - String replacement editing
5. **multiedit** - Batch edit operations (unknown details)
6. **patch** - Apply unified diff patches
7. **grep** - Content search with ripgrep
8. **glob** - File pattern matching
9. **list** (ls) - Directory listing
10. **webfetch** - Fetch web content
11. **websearch** - Web search via Exa AI
12. **task** - Delegate to sub-agents
13. **todowrite** - Manage todo lists
14. **todoread** - Read todo lists
15. **lsp-diagnostics** - Get LSP diagnostics
16. **lsp-hover** - Get LSP hover info
17. **codesearch** - Code-specific search (unknown details)
18. **batch** - Batch operations (unknown details)
19. **invalid** - Invalid tool handler (unknown details)

### Claude Code Tools (11+ core tools)

From system prompts and architectural knowledge:

1. **Bash** - Execute shell commands with advanced features
2. **Read** - Read files with image support
3. **Write** - Write files with LSP integration
4. **Edit** - Exact string replacement
5. **NotebookEdit** - Jupyter notebook editing
6. **Grep** - Advanced ripgrep wrapper
7. **Glob** - File pattern matching
8. **WebFetch** - Fetch and process web content
9. **WebSearch** - Web search functionality
10. **TodoWrite** - Task management
11. **AskUserQuestion** - Interactive user prompts
12. **SlashCommand** - Custom slash commands
13. **Skill** - Skill system invocation
14. **BashOutput** - Background bash monitoring
15. **KillShell** - Terminate background processes

**Additional Features:**
- MCP (Model Context Protocol) tool integration
- Sourcegraph integration (mentioned in docs)
- PDF/Jupyter reading (via Read tool)

---

## 3. Tool Implementation

### OpenCode: Bash Tool Implementation

```typescript
export const BashTool = Tool.define("bash", async () => {
  const shell = iife(() => {
    const s = process.env.SHELL
    if (s) {
      if (!new Set(["/bin/fish", "/bin/nu", "/usr/bin/fish", "/usr/bin/nu"]).has(s)) {
        return s
      }
    }
    if (process.platform === "darwin") return "/bin/zsh"
    if (process.platform === "win32") return process.env.COMSPEC || true
    const bash = Bun.which("bash")
    if (bash) return bash
    return true
  })

  return {
    description: DESCRIPTION,
    parameters: z.object({
      command: z.string().describe("The command to execute"),
      timeout: z.number().describe("Optional timeout in milliseconds").optional(),
      description: z.string().describe("Clear, concise description..."),
    }),
    async execute(params, ctx) {
      // Permission checks
      const tree = await parser().then((p) => p.parse(params.command))
      const agent = await Agent.get(ctx.agent)
      const permissions = agent.permission.bash

      // Parse command tree and check permissions
      for (const node of tree.rootNode.descendantsOfType("command")) {
        // Extract command parts
        // Check against wildcard patterns
        // Ask for permission if needed
      }

      // Execute with spawn
      const proc = spawn(params.command, {
        shell,
        cwd: Instance.directory,
        env: { ...process.env },
        stdio: ["ignore", "pipe", "pipe"],
        detached: process.platform !== "win32",
      })

      // Stream output via metadata
      const append = (chunk: Buffer) => {
        output += chunk.toString()
        ctx.metadata({
          metadata: { output, description: params.description }
        })
      }

      proc.stdout?.on("data", append)
      proc.stderr?.on("data", append)

      // Handle timeout and abort
      // Kill process tree on cancel

      return {
        title: params.description,
        metadata: { output, exit: proc.exitCode, description: params.description },
        output,
      }
    },
  }
})
```

**Key Features:**
1. **Shell detection** - Auto-detects best shell per platform
2. **Command parsing** - Uses tree-sitter to parse bash syntax
3. **Permission checks** - Granular command-level permissions
4. **Path validation** - Checks for external directory access
5. **Streaming output** - Real-time output via metadata
6. **Abort support** - Proper process tree cleanup
7. **Output truncation** - 30,000 char limit (configurable)

### OpenCode: Edit Tool Implementation

The edit tool uses multiple fallback strategies for fuzzy matching:

```typescript
export function replace(content: string, oldString: string, newString: string, replaceAll = false): string {
  for (const replacer of [
    SimpleReplacer,           // Exact match
    LineTrimmedReplacer,      // Trimmed line matching
    BlockAnchorReplacer,      // First/last line anchoring with similarity
    WhitespaceNormalizedReplacer,  // Normalize whitespace
    IndentationFlexibleReplacer,   // Ignore indentation differences
    EscapeNormalizedReplacer,      // Handle escape sequences
    TrimmedBoundaryReplacer,       // Try trimmed boundaries
    ContextAwareReplacer,          // Context-based matching
    MultiOccurrenceReplacer,       // Find all occurrences
  ]) {
    for (const search of replacer(content, oldString)) {
      const index = content.indexOf(search)
      if (index === -1) continue
      if (replaceAll) return content.replaceAll(search, newString)
      const lastIndex = content.lastIndexOf(search)
      if (index !== lastIndex) continue
      return content.substring(0, index) + newString + content.substring(index + search.length)
    }
  }
  throw new Error("oldString not found in content")
}
```

**Replacer Strategies:**

1. **BlockAnchorReplacer** - Uses Levenshtein distance for similarity matching:
```typescript
const SINGLE_CANDIDATE_SIMILARITY_THRESHOLD = 0.0
const MULTIPLE_CANDIDATES_SIMILARITY_THRESHOLD = 0.3

// Finds blocks by matching first and last lines
// Calculates similarity for middle lines
// Uses lower threshold if only one candidate found
```

2. **Sources** - Adapted from:
   - Cline: `diff-apply` approach
   - Google Gemini CLI: `editCorrector` strategy

### Claude Code Implementation

Claude Code's implementation details are not directly available, but based on tool descriptions:

**Bash Tool:**
- Background execution support (`run_in_background` parameter)
- Shell ID tracking for monitoring
- Output filtering with regex
- Parallel command execution guidance
- Git operation safeguards
- Pre-commit hook handling

**Edit Tool:**
- Simpler exact-match approach
- Line number preservation from Read output
- Less fuzzy matching (based on error messages)
- Requires exact indentation match

---

## 4. Permission System

### OpenCode Permission System

```typescript
export namespace Permission {
  export type Info = {
    id: string
    type: string
    pattern?: string | string[]
    sessionID: string
    messageID: string
    callID?: string
    title: string
    metadata: Record<string, any>
    time: { created: number }
  }

  export async function ask(input: {
    type: Info["type"]
    title: Info["title"]
    pattern?: Info["pattern"]
    callID?: Info["callID"]
    sessionID: Info["sessionID"]
    messageID: Info["messageID"]
    metadata: Info["metadata"]
  }) {
    // Check if already approved
    const approvedForSession = approved[input.sessionID] || {}
    const keys = toKeys(input.pattern, input.type)
    if (covered(keys, approvedForSession)) return

    // Trigger plugin hook
    const result = await Plugin.trigger("permission.ask", info, { status: "ask" })
    if (result.status === "deny") throw new RejectedError(...)
    if (result.status === "allow") return

    // Wait for user response
    return new Promise<void>((resolve, reject) => {
      pending[input.sessionID][info.id] = { info, resolve, reject }
      Bus.publish(Event.Updated, info)
    })
  }

  export function respond(input: {
    sessionID: string
    permissionID: string
    response: "once" | "always" | "reject"
  }) {
    // Handle response
    // If "always", approve pattern for all future requests
    // Auto-approve pending requests that match pattern
  }
}
```

**Permission Types:**
- `bash` - Command execution (with wildcard patterns)
- `edit` - File editing
- `write` - File writing/creation
- `external_directory` - Access outside working directory
- `webfetch` - Web content fetching
- `websearch` - Web search operations

**Features:**
1. **Pattern-based approval** - Wildcard matching (e.g., `git add *`, `npm install *`)
2. **Session-scoped** - Approvals last for session
3. **Plugin hooks** - Plugins can intercept and auto-approve
4. **Batch approval** - "Always allow" approves future similar requests
5. **Event-driven** - UI subscribes to permission events

**Example Permission Check (Bash):**

```typescript
// Parse command into AST
const tree = await parser().then((p) => p.parse(params.command))

// Check each command node
for (const node of tree.rootNode.descendantsOfType("command")) {
  const command = extractCommandParts(node)

  // Check against permission patterns
  const action = Wildcard.allStructured(
    { head: command[0], tail: command.slice(1) },
    permissions
  )

  if (action === "deny") throw new Error("Command not allowed")
  if (action === "ask") {
    await Permission.ask({
      type: "bash",
      pattern: [`${command[0]} ${subcommand} *`],
      title: params.command,
      // ...
    })
  }
}
```

### Claude Code Permission System

**Evidence from tool descriptions:**
- No explicit permission system mentioned in tool APIs
- Likely uses sandbox/container restrictions
- Git operations have safeguards (no --force to main, etc.)
- File operations appear unrestricted within working directory

**Inferred Approach:**
- Pre-execution validation (e.g., git safety checks)
- Post-hoc error handling rather than permission prompts
- User must manually review/approve in UI

**Key Difference:** OpenCode has granular, pattern-based runtime permissions while Claude Code appears to use static validation rules.

---

## 5. Tool Parameters

### OpenCode Parameter Definition

```typescript
// Example: Edit Tool
parameters: z.object({
  filePath: z.string().describe("The absolute path to the file to modify"),
  oldString: z.string().describe("The text to replace"),
  newString: z.string().describe("The text to replace it with (must be different from oldString)"),
  replaceAll: z.boolean().optional().describe("Replace all occurrences of oldString (default false)"),
})
```

**Validation:**
```typescript
execute: (args, ctx) => {
  try {
    toolInfo.parameters.parse(args)
  } catch (error) {
    if (error instanceof z.ZodError && toolInfo.formatValidationError) {
      throw new Error(toolInfo.formatValidationError(error), { cause: error })
    }
    throw new Error(
      `The ${id} tool was called with invalid arguments: ${error}.
       Please rewrite the input so it satisfies the expected schema.`,
      { cause: error }
    )
  }
  return execute(args, ctx)
}
```

**Features:**
- Zod schema with `.describe()` for LLM hints
- Automatic validation before execution
- Custom error formatters
- Type inference from schema

### Claude Code Parameter Definition

Based on tool function signatures, uses JSON Schema:

```json
{
  "parameters": {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
      "file_path": {
        "type": "string",
        "description": "The absolute path to the file to modify"
      },
      "old_string": {
        "type": "string",
        "description": "The text to replace"
      },
      "new_string": {
        "type": "string",
        "description": "The text to replace it with (must be different from old_string)"
      },
      "replace_all": {
        "type": "boolean",
        "default": false,
        "description": "Replace all occurences of old_string (default false)"
      }
    },
    "required": ["file_path", "old_string", "new_string"],
    "additionalProperties": false
  }
}
```

**Key Differences:**
- JSON Schema vs Zod
- snake_case vs camelCase naming
- More detailed schema metadata
- `additionalProperties: false` enforcement

---

## 6. Tool Output

### OpenCode Output Format

```typescript
type ToolOutput = {
  title: string           // Short description shown in UI
  metadata: M             // Structured data for UI/streaming
  output: string          // Text output for LLM
  attachments?: Array<{   // Optional file attachments
    id: string
    sessionID: string
    messageID: string
    type: "file"
    mime: string
    url: string  // Data URL for images
  }>
}
```

**Streaming Metadata:**
```typescript
// During execution, update metadata for live progress
ctx.metadata({
  title: "Running tests...",
  metadata: {
    output: currentOutput,
    progress: 0.5
  }
})
```

**Example: Bash Tool Output**
```typescript
return {
  title: "npm install",
  metadata: {
    output: "added 42 packages...",
    exit: 0,
    description: "Install package dependencies"
  },
  output: "added 42 packages..."
}
```

### Claude Code Output Format

**Based on observations:**
- Returns plain string for LLM
- Uses special XML tags for metadata:
  ```xml
  <bash_metadata>
  Output exceeded length limit of 30000 chars
  Command terminated after exceeding timeout 120000 ms
  </bash_metadata>
  ```
- Session IDs embedded in output:
  ```xml
  <task_metadata>
  session_id: task_abc123
  </task_metadata>
  ```

**Key Differences:**
1. OpenCode has structured metadata separate from output
2. Claude Code embeds metadata in string output
3. OpenCode supports attachments (images), Claude Code unknown
4. OpenCode can stream metadata updates, Claude Code buffers

---

## 7. Bash Tool

### Detailed Feature Comparison

| Feature | OpenCode | Claude Code |
|---------|----------|-------------|
| **Shell Selection** | Auto-detect (zsh/bash/cmd) | Unknown |
| **Command Parsing** | tree-sitter AST | Unknown (likely regex) |
| **Permission Granularity** | Per-command patterns | Unknown |
| **External Dir Access** | Explicit permission | Unknown |
| **Streaming Output** | Yes (via metadata) | Unknown |
| **Background Execution** | No | Yes (`run_in_background`) |
| **Process Monitoring** | No | Yes (`BashOutput` tool) |
| **Process Killing** | Timeout + abort | `KillShell` tool |
| **Max Output Length** | 30,000 chars (configurable) | 30,000 chars |
| **Default Timeout** | 60 seconds | 120 seconds |
| **Max Timeout** | 10 minutes | 10 minutes |

### OpenCode: Path Resolution & Security

```typescript
// Check for external directory access
if (["cd", "rm", "cp", "mv", "mkdir", "touch", "chmod", "chown"].includes(command[0])) {
  for (const arg of command.slice(1)) {
    if (arg.startsWith("-")) continue

    // Resolve to absolute path
    const resolved = await $`realpath ${arg}`.text().then((x) => x.trim())

    // Windows Git Bash path normalization
    const normalized = process.platform === "win32" && resolved.match(/^\/[a-z]\//)
      ? resolved.replace(/^\/([a-z])\//, (_, drive) => `${drive.toUpperCase()}:\\`).replace(/\//g, "\\")
      : resolved

    if (!Filesystem.contains(Instance.directory, normalized)) {
      // Ask permission or deny
      await Permission.ask({
        type: "external_directory",
        pattern: [parentDir, path.join(parentDir, "*")],
        // ...
      })
    }
  }
}
```

### Claude Code: Git Safety

From bash.txt description:
```
Git Safety Protocol:
- NEVER update the git config
- NEVER run destructive/irreversible git commands (like push --force, hard reset, etc)
- NEVER skip hooks (--no-verify, --no-gpg-sign, etc)
- NEVER run force push to main/master, warn the user if they request it
- Avoid git commit --amend. ONLY use --amend when:
  (1) user explicitly requested amend OR
  (2) adding edits from pre-commit hook
- Before amending: ALWAYS check authorship (git log -1 --format='%an %ae')
- NEVER commit changes unless the user explicitly asks
```

**Implementation:** Likely prompt-based guidance rather than code enforcement.

---

## 8. File Tools

### Read Tool Comparison

| Feature | OpenCode | Claude Code |
|---------|----------|-------------|
| **Default Line Limit** | 2000 | 2000 |
| **Max Line Length** | 2000 chars | 2000 chars |
| **Offset/Limit** | Yes | Yes |
| **Line Number Format** | `00001| content` | Same (cat -n) |
| **Image Support** | Yes (base64 data URLs) | Yes |
| **PDF Support** | No | Yes |
| **Jupyter Notebooks** | No | Yes (via Read) |
| **Binary Detection** | Sophisticated (null bytes, 30% threshold) | Unknown |
| **External Dir Check** | Yes (with permissions) | Unknown |
| **File Suggestions** | Yes (fuzzy filename match) | Unknown |
| **LSP Integration** | Yes (`LSP.touchFile()`) | Unknown |
| **File Time Tracking** | Yes (`FileTime.read()`) | Unknown |

### OpenCode: Image Handling

```typescript
const isImage = isImageFile(filepath)
const supportsImages = model?.capabilities.input.image ?? false

if (isImage) {
  if (!supportsImages) {
    throw new Error(`Failed to read image: ${filepath}, model may not be able to read images`)
  }
  return {
    title,
    output: "Image read successfully",
    metadata: { preview: "Image read successfully" },
    attachments: [{
      id: Identifier.ascending("part"),
      sessionID: ctx.sessionID,
      messageID: ctx.messageID,
      type: "file",
      mime: file.type,
      url: `data:${mime};base64,${Buffer.from(await file.bytes()).toString("base64")}`,
    }],
  }
}
```

### OpenCode: Binary Detection

```typescript
async function isBinaryFile(filepath: string, file: Bun.BunFile): Promise<boolean> {
  // Check known binary extensions
  const ext = path.extname(filepath).toLowerCase()
  if ([".zip", ".tar", ".exe", ".dll", ".so", ".class", ".wasm", ".pyc", /* ... */].includes(ext)) {
    return true
  }

  // Read first 4KB
  const bufferSize = Math.min(4096, fileSize)
  const bytes = new Uint8Array(buffer.slice(0, bufferSize))

  // Check for null bytes
  let nonPrintableCount = 0
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === 0) return true
    if (bytes[i] < 9 || (bytes[i] > 13 && bytes[i] < 32)) {
      nonPrintableCount++
    }
  }

  // If >30% non-printable characters, consider it binary
  return nonPrintableCount / bytes.length > 0.3
}
```

### Write Tool Comparison

| Feature | OpenCode | Claude Code |
|---------|----------|-------------|
| **Path Handling** | Absolute or relative to Instance.directory | Must be absolute |
| **Overwrite Check** | Yes (requires FileTime tracking) | Yes (requires prior Read) |
| **Permission Prompt** | Separate for create vs overwrite | Combined |
| **LSP Integration** | Yes (diagnostics after write) | Unknown |
| **Error Reporting** | Inline diagnostics in output | Unknown |
| **External Dir Check** | Yes | Unknown |
| **File Events** | Publishes `File.Event.Edited` | Unknown |

### OpenCode: LSP Integration

```typescript
await Bun.write(filepath, params.content)
await Bus.publish(File.Event.Edited, { file: filepath })
FileTime.read(ctx.sessionID, filepath)

let output = ""
await LSP.touchFile(filepath, true)
const diagnostics = await LSP.diagnostics()

for (const [file, issues] of Object.entries(diagnostics)) {
  if (issues.length === 0) continue
  if (file === filepath) {
    output += `\nThis file has errors, please fix\n<file_diagnostics>\n${issues.map(LSP.Diagnostic.pretty).join("\n")}\n</file_diagnostics>\n`
  } else {
    output += `\n<project_diagnostics>\n${file}\n${issues.map(LSP.Diagnostic.pretty).join("\n")}\n</project_diagnostics>\n`
  }
}
```

**Feature:** Automatically runs LSP diagnostics after write and includes errors in output.

### Edit Tool: Advanced Comparison

| Feature | OpenCode | Claude Code |
|---------|----------|-------------|
| **Matching Strategy** | 9 fallback strategies | Exact match |
| **Fuzzy Matching** | Yes (Levenshtein, whitespace, indentation) | No |
| **Block Anchoring** | Yes (first/last line + similarity) | No |
| **Replace All** | Yes | Yes |
| **Diff Generation** | Yes (unified diff) | Unknown |
| **LSP Integration** | Yes (error reporting) | Unknown |
| **File Time Check** | Yes (prevents overwrite conflicts) | Unknown |
| **Permission System** | Yes | Unknown |

### OpenCode: FileTime Tracking

```typescript
// In edit.ts
await FileTime.assert(ctx.sessionID, filePath)

// FileTime.assert() checks:
// - If file was modified since last read in this session
// - Throws error if modified externally to prevent conflicts
```

**Purpose:** Prevents the "lost update" problem where two edits conflict.

### Patch Tool (OpenCode Only)

OpenCode has a dedicated patch tool for unified diff application:

```typescript
export const PatchTool = Tool.define("patch", {
  description: "Apply a patch to modify multiple files. Supports adding, updating, and deleting files with context-aware changes.",
  parameters: z.object({
    patchText: z.string().describe("The full patch text that describes all changes to be made"),
  }),
  async execute(params, ctx) {
    // Parse unified diff
    const parseResult = Patch.parsePatch(params.patchText)

    // Handle hunks: add, update, delete, move
    for (const hunk of hunks) {
      switch (hunk.type) {
        case "add": /* create new file */
        case "update": /* apply chunks */
        case "delete": /* remove file */
        case "move": /* rename + update */
      }
    }

    // Single permission check for all changes
    await Permission.ask({
      type: "edit",
      title: `Apply patch to ${fileChanges.length} files`,
      metadata: { diff: totalDiff }
    })
  }
})
```

**Claude Code:** No patch tool found. Edit must be used for each file.

### NotebookEdit (Claude Code Only)

Claude Code has dedicated Jupyter notebook editing:

```typescript
// From function signature
NotebookEdit({
  notebook_path: string,      // Absolute path
  cell_id?: string,           // Cell to edit/insert after
  edit_mode?: "replace" | "insert" | "delete",
  cell_type?: "code" | "markdown",
  new_source?: string
})
```

**OpenCode:** No notebook editing tool found.

---

## 9. Search Tools

### Grep Tool Comparison

| Feature | OpenCode | Claude Code |
|---------|----------|-------------|
| **Backend** | ripgrep | ripgrep |
| **Output Format** | File list with line numbers | Configurable (content/files/count) |
| **Default Output** | Content with line numbers | files_with_matches |
| **Result Limit** | 100 matches | Configurable via head_limit |
| **Sorting** | By modification time (newest first) | By modification time |
| **Context Lines** | No | Yes (-A, -B, -C) |
| **Case Insensitive** | No explicit param | Yes (-i) |
| **File Filtering** | `include` parameter | `glob` and `type` parameters |
| **Multiline** | No | Yes (multiline parameter) |
| **Line Numbers** | Always included | Optional (-n) |
| **Offset Support** | No | Yes (offset + head_limit) |

### OpenCode: Grep Implementation

```typescript
export const GrepTool = Tool.define("grep", {
  description: DESCRIPTION,
  parameters: z.object({
    pattern: z.string().describe("The regex pattern to search for in file contents"),
    path: z.string().optional().describe("The directory to search in. Defaults to the current working directory."),
    include: z.string().optional().describe('File pattern to include in the search (e.g. "*.js", "*.{ts,tsx}")'),
  }),
  async execute(params) {
    const rgPath = await Ripgrep.filepath()
    const args = ["-nH", "--field-match-separator=|", "--regexp", params.pattern]
    if (params.include) args.push("--glob", params.include)
    args.push(searchPath)

    const proc = Bun.spawn([rgPath, ...args], { stdout: "pipe", stderr: "pipe" })
    const output = await new Response(proc.stdout).text()

    // Parse output
    const lines = output.trim().split("\n")
    const matches = []
    for (const line of lines) {
      const [filePath, lineNumStr, ...lineTextParts] = line.split("|")
      matches.push({ path: filePath, lineNum: parseInt(lineNumStr), lineText: lineTextParts.join("|") })
    }

    // Sort by modification time
    matches.sort((a, b) => b.modTime - a.modTime)

    // Format output
    const outputLines = [`Found ${finalMatches.length} matches`]
    let currentFile = ""
    for (const match of finalMatches) {
      if (currentFile !== match.path) {
        currentFile = match.path
        outputLines.push(`${match.path}:`)
      }
      outputLines.push(`  Line ${match.lineNum}: ${truncatedLineText}`)
    }
  }
})
```

### Claude Code: Advanced Grep Features

From tool description:
- **Output modes:**
  - `content` - Shows matching lines with context
  - `files_with_matches` - Only file paths (default)
  - `count` - Match counts per file

- **Context parameters:**
  - `-A` (after), `-B` (before), `-C` (both)
  - Only work with `output_mode: "content"`

- **Pagination:**
  - `head_limit` - Limit results
  - `offset` - Skip first N results
  - Works across all output modes

- **Multiline:**
  - `multiline: true` - Enables dot matching newlines
  - For patterns like `struct \{[\s\S]*?field`

### Glob Tool Comparison

| Feature | OpenCode | Claude Code |
|---------|----------|-------------|
| **Backend** | ripgrep `--files` | Unknown (likely ripgrep) |
| **Pattern Syntax** | Glob (e.g., `**/*.js`) | Same |
| **Result Limit** | 100 files | 100 (configurable) |
| **Sorting** | By modification time | Same |
| **Default Path** | Instance.directory | Current working directory |
| **Path Handling** | Absolute or relative | Must omit for default (not "undefined") |

### OpenCode: Glob Implementation

```typescript
export const GlobTool = Tool.define("glob", {
  parameters: z.object({
    pattern: z.string().describe("The glob pattern to match files against"),
    path: z.string().optional().describe("The directory to search in..."),
  }),
  async execute(params) {
    let search = params.path ?? Instance.directory
    search = path.isAbsolute(search) ? search : path.resolve(Instance.directory, search)

    const files = []
    for await (const file of Ripgrep.files({ cwd: search, glob: [params.pattern] })) {
      if (files.length >= 100) {
        truncated = true
        break
      }
      files.push({ path: full, mtime: stats })
    }

    files.sort((a, b) => b.mtime - a.mtime)
    return { title, metadata: { count, truncated }, output: files.map(f => f.path).join("\n") }
  }
})
```

**Key Insight:** Both use ripgrep for file listing, not separate glob libraries.

---

## 10. Web Tools

### WebFetch Comparison

| Feature | OpenCode | Claude Code |
|---------|----------|-------------|
| **Format Options** | text, markdown, html | Single format (markdown) |
| **HTML Conversion** | Turndown.js | Unknown (likely similar) |
| **Max Response Size** | 5MB | Unknown |
| **Default Timeout** | 30 seconds | Unknown |
| **Max Timeout** | 2 minutes | Unknown |
| **User Agent** | Chrome 120 | Unknown |
| **Accept Headers** | Format-specific with fallbacks | Unknown |
| **Permission Check** | Yes (configurable) | Unknown |
| **Cache** | No | Yes (15-minute self-cleaning) |
| **Prompt Processing** | No | Yes (AI summarization) |

### OpenCode: WebFetch Implementation

```typescript
export const WebFetchTool = Tool.define("webfetch", {
  parameters: z.object({
    url: z.string().describe("The URL to fetch content from"),
    format: z.enum(["text", "markdown", "html"]).describe("The format to return the content in"),
    timeout: z.number().optional().describe("Optional timeout in seconds (max 120)"),
  }),
  async execute(params, ctx) {
    // Permission check
    const cfg = await Config.get()
    if (cfg.permission?.webfetch === "ask") {
      await Permission.ask({ type: "webfetch", url: params.url, ... })
    }

    // Build Accept header based on format
    let acceptHeader = "*/*"
    switch (params.format) {
      case "markdown":
        acceptHeader = "text/markdown;q=1.0, text/x-markdown;q=0.9, text/plain;q=0.8, text/html;q=0.7, */*;q=0.1"
        break
      // ...
    }

    const response = await fetch(params.url, {
      signal: AbortSignal.any([controller.signal, ctx.abort]),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ...",
        Accept: acceptHeader,
        "Accept-Language": "en-US,en;q=0.9",
      },
    })

    // Convert based on format
    if (params.format === "markdown" && contentType.includes("text/html")) {
      return { output: convertHTMLToMarkdown(content), ... }
    }
  }
})
```

### Claude Code: WebFetch with AI Processing

From tool description:
```
- Fetches content from a specified URL and processes it using an AI model
- Takes a URL and a prompt as input
- Fetches the URL content, converts HTML to markdown
- Processes the content with the prompt using a small, fast model
- Returns the model's response about the content
```

**Key Difference:** Claude Code runs a secondary LLM to summarize/extract information based on a prompt. OpenCode returns raw content.

**Example usage:**
```
WebFetch("https://example.com", "What are the main features listed on this page?")
// Returns AI-generated summary, not raw HTML
```

### WebSearch Comparison

| Feature | OpenCode | Claude Code |
|---------|----------|-------------|
| **Backend** | Exa AI (mcp.exa.ai) | Unknown (possibly same) |
| **Num Results** | Configurable (default 8) | Unknown |
| **Live Crawl** | Yes (fallback/preferred) | Unknown |
| **Search Type** | auto/fast/deep | Unknown |
| **Context Length** | Configurable (default 10000 chars) | Unknown |
| **Domain Filtering** | No | Yes (allowed_domains, blocked_domains) |
| **Date Filtering** | No | Yes (via query) |
| **Permission Check** | Yes (uses webfetch permission) | Unknown |
| **Output Format** | Raw text | Markdown with source links |

### OpenCode: WebSearch Implementation

```typescript
export const WebSearchTool = Tool.define("websearch", {
  parameters: z.object({
    query: z.string().describe("Websearch query"),
    numResults: z.number().optional().describe("Number of search results to return (default: 8)"),
    livecrawl: z.enum(["fallback", "preferred"]).optional(),
    type: z.enum(["auto", "fast", "deep"]).optional(),
    contextMaxCharacters: z.number().optional(),
  }),
  async execute(params, ctx) {
    // MCP request to Exa AI
    const searchRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "web_search_exa",
        arguments: {
          query: params.query,
          type: params.type || "auto",
          numResults: params.numResults || 8,
          livecrawl: params.livecrawl || "fallback",
          contextMaxCharacters: params.contextMaxCharacters,
        },
      },
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEARCH}`, {
      method: "POST",
      headers: { accept: "application/json, text/event-stream", ... },
      body: JSON.stringify(searchRequest),
    })

    // Parse SSE response
    const lines = responseText.split("\n")
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = JSON.parse(line.substring(6))
        if (data.result?.content?.[0]?.text) {
          return { output: data.result.content[0].text, ... }
        }
      }
    }
  }
})
```

### Claude Code: WebSearch Requirements

From tool description:
```
CRITICAL REQUIREMENT - You MUST follow this:
  - After answering the user's question, you MUST include a "Sources:" section at the end of your response
  - In the Sources section, list all relevant URLs from the search results as markdown hyperlinks: [Title](URL)
  - This is MANDATORY - never skip including sources in your response
```

**Implementation:** Enforced via prompt, not code.

---

## 11. Feature Comparison Table

### Core Capabilities

| Feature | OpenCode | Claude Code |
|---------|----------|-------------|
| **Language** | TypeScript (Bun) | Unknown (likely TypeScript/Python) |
| **Schema Validation** | Zod | JSON Schema |
| **Plugin System** | Yes (simplified API) | No (MCP instead) |
| **Streaming Output** | Yes (metadata) | Unknown |
| **Abort/Cancel** | AbortSignal | Timeout-based |
| **Permission System** | Granular, pattern-based | Unknown (likely simpler) |
| **LSP Integration** | Yes (diagnostics, hover) | Unknown |
| **File Time Tracking** | Yes (conflict prevention) | Unknown |
| **Background Jobs** | No | Yes (Bash) |
| **Image Support** | Yes (Read tool) | Yes (Read tool) |
| **PDF Support** | No | Yes (Read tool) |
| **Jupyter Support** | No | Yes (NotebookEdit) |
| **Git Safeguards** | Minimal | Extensive (prompt-based) |
| **MCP Support** | Partial (Exa AI) | Yes (full MCP integration) |

### Tool Availability

| Tool | OpenCode | Claude Code |
|------|----------|-------------|
| **Bash** | ✅ | ✅ |
| **Read** | ✅ | ✅ |
| **Write** | ✅ | ✅ |
| **Edit** | ✅ (9 strategies) | ✅ (exact match) |
| **Patch** | ✅ | ❌ |
| **MultiEdit** | ✅ (unknown) | ❌ |
| **NotebookEdit** | ❌ | ✅ |
| **Grep** | ✅ (basic) | ✅ (advanced) |
| **Glob** | ✅ | ✅ |
| **List (ls)** | ✅ | ❌ |
| **WebFetch** | ✅ (raw) | ✅ (AI-processed) |
| **WebSearch** | ✅ | ✅ |
| **Task** | ✅ (sub-agents) | ❌ |
| **TodoWrite** | ✅ | ✅ |
| **TodoRead** | ✅ | ❌ (combined in TodoWrite?) |
| **LSP Diagnostics** | ✅ | ❌ |
| **LSP Hover** | ✅ | ❌ |
| **CodeSearch** | ✅ (unknown) | ❌ |
| **Batch** | ✅ (unknown) | ❌ |
| **AskUserQuestion** | ❌ | ✅ |
| **SlashCommand** | ❌ | ✅ |
| **Skill** | ❌ | ✅ |
| **BashOutput** | ❌ | ✅ |
| **KillShell** | ❌ | ✅ |

### Permission Granularity

| Permission Type | OpenCode | Claude Code |
|-----------------|----------|-------------|
| **Bash Commands** | Pattern-based (e.g., `git add *`) | Unknown |
| **File Editing** | Per-file or batch | Unknown |
| **External Directories** | Explicit ask with path | Unknown |
| **Web Fetch** | Configurable (ask/allow/deny) | Unknown |
| **Response Options** | once/always/reject | Unknown |
| **Plugin Hooks** | Yes (auto-approve possible) | No |
| **Session Scope** | Yes | Unknown |

---

## 12. Implementation Roadmap

### Priority 1: Critical Claude Code Features for OpenCode

#### 1. Advanced Grep Capabilities
**Gap:** OpenCode's grep is basic compared to Claude Code.

**Implementation:**
```typescript
// Add to GrepTool parameters
parameters: z.object({
  pattern: z.string(),
  path: z.string().optional(),
  include: z.string().optional(),
  // NEW:
  output_mode: z.enum(["content", "files_with_matches", "count"]).default("files_with_matches"),
  "-A": z.number().optional().describe("Number of lines to show after each match"),
  "-B": z.number().optional().describe("Number of lines to show before each match"),
  "-C": z.number().optional().describe("Number of lines to show before and after each match"),
  "-i": z.boolean().optional().describe("Case insensitive search"),
  multiline: z.boolean().default(false).describe("Enable multiline mode"),
  head_limit: z.number().optional().describe("Limit output to first N results"),
  offset: z.number().default(0).describe("Skip first N results"),
})

// Update ripgrep args
const args = ["-nH", "--field-match-separator=|", "--regexp", params.pattern]
if (params["-i"]) args.push("-i")
if (params.multiline) args.push("-U", "--multiline-dotall")
if (params["-A"]) args.push(`-A${params["-A"]}`)
if (params["-B"]) args.push(`-B${params["-B"]}`)
if (params["-C"]) args.push(`-C${params["-C"]}`)

// Handle output modes
if (params.output_mode === "files_with_matches") {
  args.push("-l")  // Files with matches only
} else if (params.output_mode === "count") {
  args.push("-c")  // Count per file
}

// Apply head_limit and offset
if (params.offset > 0) matches = matches.slice(params.offset)
if (params.head_limit) matches = matches.slice(0, params.head_limit)
```

**Effort:** Medium (2-3 days)

#### 2. Background Bash Execution
**Gap:** OpenCode can't run long-running commands in background.

**Implementation:**
```typescript
// Add to BashTool parameters
parameters: z.object({
  command: z.string(),
  timeout: z.number().optional(),
  description: z.string(),
  // NEW:
  run_in_background: z.boolean().optional().describe("Set to true to run this command in the background"),
})

// Background process registry
const backgroundProcesses = new Map<string, {
  proc: ChildProcess
  output: string
  started: number
  description: string
}>()

async execute(params, ctx) {
  if (params.run_in_background) {
    const shellID = Identifier.ascending("shell")
    const proc = spawn(params.command, { /* ... */ })

    let output = ""
    proc.stdout?.on("data", (chunk) => { output += chunk.toString() })
    proc.stderr?.on("data", (chunk) => { output += chunk.toString() })

    backgroundProcesses.set(shellID, {
      proc,
      output: "",
      started: Date.now(),
      description: params.description
    })

    // Update output continuously
    const interval = setInterval(() => {
      const bg = backgroundProcesses.get(shellID)
      if (bg) {
        ctx.metadata({ metadata: { output: bg.output, shell_id: shellID } })
      }
    }, 500)

    proc.on("exit", () => clearInterval(interval))

    return {
      title: params.description,
      metadata: { shell_id: shellID },
      output: `Started background process ${shellID}\nUse BashOutput tool to monitor output.`
    }
  }

  // ... existing sync execution
}
```

```typescript
// New BashOutputTool
export const BashOutputTool = Tool.define("bash_output", {
  description: "Retrieves output from a running or completed background bash shell",
  parameters: z.object({
    bash_id: z.string().describe("The ID of the background shell to retrieve output from"),
    filter: z.string().optional().describe("Optional regex to filter output lines"),
  }),
  async execute(params) {
    const bg = backgroundProcesses.get(params.bash_id)
    if (!bg) throw new Error(`No background process with ID ${params.bash_id}`)

    let output = bg.output
    if (params.filter) {
      const regex = new RegExp(params.filter)
      output = output.split("\n").filter(line => regex.test(line)).join("\n")
    }

    return {
      title: bg.description,
      metadata: { running: !bg.proc.exitCode },
      output
    }
  }
})

// New KillShellTool
export const KillShellTool = Tool.define("kill_shell", {
  description: "Kills a running background bash shell by its ID",
  parameters: z.object({
    shell_id: z.string().describe("The ID of the background shell to kill"),
  }),
  async execute(params) {
    const bg = backgroundProcesses.get(params.shell_id)
    if (!bg) throw new Error(`No background process with ID ${params.shell_id}`)

    bg.proc.kill("SIGTERM")
    backgroundProcesses.delete(params.shell_id)

    return {
      title: "Process killed",
      metadata: {},
      output: `Killed background process ${params.shell_id}`
    }
  }
})
```

**Effort:** High (5-7 days)

#### 3. NotebookEdit Tool
**Gap:** OpenCode can't edit Jupyter notebooks.

**Implementation:**
```typescript
export const NotebookEditTool = Tool.define("notebook_edit", {
  description: "Edits a specific cell in a Jupyter notebook",
  parameters: z.object({
    notebook_path: z.string().describe("The absolute path to the Jupyter notebook file"),
    cell_id: z.string().optional().describe("The ID of the cell to edit"),
    edit_mode: z.enum(["replace", "insert", "delete"]).default("replace"),
    cell_type: z.enum(["code", "markdown"]).optional(),
    new_source: z.string().describe("The new source for the cell"),
  }),
  async execute(params, ctx) {
    const notebook = JSON.parse(await Bun.file(params.notebook_path).text())

    if (params.edit_mode === "insert") {
      const index = params.cell_id
        ? notebook.cells.findIndex(c => c.id === params.cell_id) + 1
        : notebook.cells.length

      notebook.cells.splice(index, 0, {
        id: Identifier.ascending("cell"),
        cell_type: params.cell_type || "code",
        source: params.new_source.split("\n"),
        metadata: {},
        outputs: [],
        execution_count: null
      })
    } else if (params.edit_mode === "delete") {
      const index = notebook.cells.findIndex(c => c.id === params.cell_id)
      notebook.cells.splice(index, 1)
    } else {
      const cell = notebook.cells.find(c => c.id === params.cell_id)
      if (!cell) throw new Error(`Cell ${params.cell_id} not found`)
      cell.source = params.new_source.split("\n")
      if (params.cell_type) cell.cell_type = params.cell_type
    }

    await Bun.write(params.notebook_path, JSON.stringify(notebook, null, 2))

    return {
      title: path.basename(params.notebook_path),
      metadata: { cells: notebook.cells.length },
      output: `Updated cell in ${params.notebook_path}`
    }
  }
})
```

**Effort:** Medium (3-4 days)

#### 4. AskUserQuestion Tool
**Gap:** OpenCode can't interactively prompt user during execution.

**Implementation:**
```typescript
export const AskUserQuestionTool = Tool.define("ask_user_question", {
  description: "Ask the user questions during execution to gather preferences or clarify requirements",
  parameters: z.object({
    questions: z.array(z.object({
      question: z.string().describe("The question to ask"),
      header: z.string().max(12).describe("Short label displayed as chip"),
      multiSelect: z.boolean().describe("Allow multiple selections"),
      options: z.array(z.object({
        label: z.string().describe("Display text for option"),
        description: z.string().describe("Explanation of option"),
      })).min(2).max(4),
    })).min(1).max(4),
    answers: z.record(z.string(), z.string()).optional(),
  }),
  async execute(params, ctx) {
    if (params.answers) {
      // Answers provided, return them
      return {
        title: "User responses",
        metadata: { answers: params.answers },
        output: JSON.stringify(params.answers, null, 2)
      }
    }

    // Publish question event
    const questionID = Identifier.ascending("question")
    await Bus.publish(UserQuestion.Event.Asked, {
      id: questionID,
      sessionID: ctx.sessionID,
      messageID: ctx.messageID,
      questions: params.questions,
    })

    // Wait for response
    return new Promise((resolve, reject) => {
      const unsub = Bus.subscribe(UserQuestion.Event.Answered, (evt) => {
        if (evt.properties.id !== questionID) return
        unsub()

        resolve({
          title: "User responses",
          metadata: { answers: evt.properties.answers },
          output: JSON.stringify(evt.properties.answers, null, 2)
        })
      })

      // Timeout after 5 minutes
      setTimeout(() => {
        unsub()
        reject(new Error("User question timed out"))
      }, 5 * 60 * 1000)
    })
  }
})
```

**Effort:** Medium-High (4-5 days, requires UI work)

### Priority 2: Enhancements

#### 5. WebFetch AI Processing
**Current:** OpenCode returns raw content
**Target:** Add AI summarization like Claude Code

```typescript
// Add to WebFetchTool
parameters: z.object({
  url: z.string(),
  format: z.enum(["text", "markdown", "html"]),
  timeout: z.number().optional(),
  // NEW:
  prompt: z.string().optional().describe("AI prompt to process the fetched content"),
})

async execute(params, ctx) {
  // ... existing fetch logic ...

  if (params.prompt) {
    // Use a fast model to summarize
    const result = await Provider.prompt({
      model: { providerID: "anthropic", modelID: "claude-3-haiku-20240307" },
      messages: [
        { role: "user", content: `${params.prompt}\n\n<content>\n${content}\n</content>` }
      ]
    })

    return {
      title: `${params.url} (AI processed)`,
      metadata: { raw_length: content.length },
      output: result.content[0].text
    }
  }

  return { /* existing raw output */ }
}
```

**Effort:** Low (1-2 days)

#### 6. PDF Reading
**Gap:** OpenCode can't read PDFs

Use a library like `pdf-parse`:

```typescript
// In ReadTool
const isPDF = filepath.endsWith(".pdf")
if (isPDF) {
  const pdfParse = await import("pdf-parse")
  const dataBuffer = await file.arrayBuffer()
  const data = await pdfParse(Buffer.from(dataBuffer))

  return {
    title,
    output: data.text,
    metadata: {
      pages: data.numpages,
      preview: data.text.slice(0, 500)
    }
  }
}
```

**Effort:** Low (1 day)

### Priority 3: Nice-to-Haves

#### 7. Sourcegraph Integration
**Gap:** Neither implementation has this yet

Would require Sourcegraph API integration:

```typescript
export const SourcegraphSearchTool = Tool.define("sourcegraph_search", {
  description: "Search code across repositories using Sourcegraph",
  parameters: z.object({
    query: z.string().describe("Sourcegraph search query"),
    repo: z.string().optional().describe("Repository filter"),
  }),
  async execute(params) {
    const response = await fetch("https://sourcegraph.com/.api/search/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: params.query,
        // ... Sourcegraph query syntax
      })
    })

    // Parse streaming response
    // Format results
  }
})
```

**Effort:** Medium (3-4 days)

#### 8. Slash Commands & Skills
**Gap:** OpenCode doesn't have these features

Would require:
- Command registry system
- File-based command definitions (`.claude/commands/`)
- Skill packaging system

**Effort:** High (2-3 weeks)

---

## 13. Gap Analysis

### What We Know

#### OpenCode Architecture
✅ **Complete understanding:**
- Tool definition system (namespace + plugin APIs)
- Permission system implementation
- File tools (read, write, edit, patch)
- Search tools (grep, glob)
- Web tools (fetch, search via Exa AI)
- LSP integration
- FileTime tracking system
- Sub-agent task delegation
- Todo management
- Process spawning and output handling

#### Claude Code Features
✅ **Well documented:**
- Tool function signatures and parameters
- Permission requirements (from prompts)
- Git safeguards (from prompts)
- Background bash execution
- Jupyter notebook editing
- User question prompts
- Slash command system (high-level)
- Skill system (high-level)

### What We Don't Know

#### OpenCode Unknowns

❓ **Limited information:**
1. **MultiEdit Tool** - No implementation found
   - Likely batch edit operations
   - Parameters unknown

2. **CodeSearch Tool** - No implementation found
   - Possibly semantic code search
   - May use AST parsing or embeddings

3. **Batch Tool** - No implementation found
   - Likely parallel tool execution
   - Could be for batching multiple operations

4. **Invalid Tool** - Found but purpose unclear
   - Error handling?
   - Fallback tool?

5. **LSP Hover** - Implementation not examined
   - Retrieves type information
   - Shows documentation

6. **LSP Diagnostics** - Implementation not examined
   - Returns errors/warnings
   - Integration with edit/write tools

#### Claude Code Unknowns

❓ **Not documented:**
1. **Internal Architecture**
   - Language/framework used
   - Tool registration mechanism
   - Streaming implementation
   - Sandboxing approach

2. **Permission System Implementation**
   - How permissions are checked
   - Storage mechanism
   - UI integration

3. **MCP Integration Details**
   - Tool discovery protocol
   - Authentication
   - Error handling

4. **Sourcegraph Integration**
   - API used
   - Query syntax
   - Result formatting

5. **PDF/Jupyter Reading Implementation**
   - Libraries used
   - Parsing approach
   - Error handling

6. **WebFetch AI Processing**
   - Model used for summarization
   - Prompt engineering
   - Cost optimization

7. **Skill System**
   - Packaging format
   - Distribution mechanism
   - Versioning

8. **Background Job Management**
   - Process isolation
   - Resource limits
   - Cleanup strategy

### Confidence Levels

#### High Confidence (90%+)
- OpenCode tool architecture
- OpenCode permission system
- OpenCode file operations
- Claude Code tool parameters
- Claude Code git safeguards

#### Medium Confidence (60-90%)
- Claude Code permission system (inferred from prompts)
- OpenCode LSP integration (partial)
- Web tool implementations (both)
- Background bash execution (Claude Code)

#### Low Confidence (<60%)
- Claude Code internal architecture
- MCP protocol details
- Skill/SlashCommand implementation
- Sourcegraph integration
- PDF reading implementation
- AI processing in WebFetch

### Investigation Priorities

To fill gaps:

1. **High Priority:**
   - Examine OpenCode LSP tools implementation
   - Test Claude Code permission behavior
   - Document MCP protocol from OpenCode's Exa integration

2. **Medium Priority:**
   - Reverse-engineer Claude Code's AI processing
   - Test background bash execution patterns
   - Understand Jupyter notebook format

3. **Low Priority:**
   - Skill system details (can be mocked)
   - Sourcegraph API (well-documented externally)
   - PDF parsing (library choice)

---

## Conclusion

### Key Insights

1. **Architecture Philosophy:**
   - **OpenCode:** Extensible, plugin-friendly, Zod-based validation
   - **Claude Code:** Locked-down, MCP-integrated, JSON Schema validation

2. **Permission Approach:**
   - **OpenCode:** Granular, pattern-based, runtime checks with plugin hooks
   - **Claude Code:** Likely simpler, prompt-based guidance + static validation

3. **Editing Strategy:**
   - **OpenCode:** Sophisticated fuzzy matching with 9 fallback strategies
   - **Claude Code:** Simpler exact matching, relies on LLM precision

4. **LSP Integration:**
   - **OpenCode:** Deep integration with diagnostics and hover
   - **Claude Code:** Unknown, possibly none

5. **Background Jobs:**
   - **OpenCode:** Not supported
   - **Claude Code:** First-class feature with monitoring

6. **Web Tools:**
   - **OpenCode:** Raw content fetching
   - **Claude Code:** AI-processed summaries

### Recommendations for OpenCode

**Short-term (1-2 months):**
1. Add advanced grep features (output modes, context, multiline)
2. Implement PDF reading support
3. Add AI processing to WebFetch
4. Create NotebookEdit tool

**Medium-term (3-6 months):**
1. Build background bash execution system
2. Add AskUserQuestion tool
3. Improve permission system UI
4. Add Sourcegraph integration

**Long-term (6+ months):**
1. Design and implement skill system
2. Add slash command infrastructure
3. Explore MCP protocol adoption
4. Build tool marketplace

### Recommendations for Claude Code

Based on OpenCode strengths:

1. **Consider adding:**
   - Pattern-based permission system
   - Plugin/extension API
   - Advanced fuzzy edit matching
   - LSP integration for diagnostics
   - Sub-agent task delegation

2. **Consider open-sourcing:**
   - Tool implementation details
   - MCP protocol documentation
   - Best practices for tool development

---

**Document Version:** 1.0
**Last Updated:** 2025-12-04
**Authors:** Analysis based on OpenCode codebase at `C:\Users\canya\Documents\projects\nori\opencode-fork\`
