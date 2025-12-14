# Hooks System: OpenCode vs Claude Code - Complete Comparison

## Executive Summary

Both OpenCode and Claude Code implement hook systems for intercepting and modifying behavior at key lifecycle points. However, their implementations differ significantly in approach, flexibility, and integration depth.

**Key Difference**: OpenCode uses JavaScript plugins with programmatic hooks, while Claude Code uses shell scripts with JSON I/O.

---

## Architecture Comparison

### OpenCode: Plugin-Based Hooks

**Location**: `packages/opencode/src/plugin/`

**Architecture**:
- Hooks are defined as JavaScript functions in plugin files
- Plugins export an object with hook handlers
- Plugin system loads from multiple locations with priority
- Hooks receive context objects and can return modifications
- Full programmatic access to internal state

**Plugin File Structure**:
```javascript
// ~/.config/opencode/plugins/my-plugin/.opencode/plugin/index.js
export default {
  name: "my-plugin",
  version: "1.0.0",

  // Hook: Fires before every chat message
  "chat.message": async (ctx) => {
    // ctx contains: messages, config, session, tools
    // Can modify messages, inject system prompts, etc.
    ctx.messages.push({
      role: "system",
      content: "Additional context..."
    });
  },

  // Hook: Fires after session compaction
  "session.compacted": async (ctx) => {
    // Re-inject important context after summarization
    ctx.reinjectBootstrap();
  },

  // Hook: Fires before tool execution
  "tool.before": async (ctx) => {
    // ctx contains: toolName, input, session
    // Can validate, modify input, or block execution
    if (ctx.toolName === "bash" && ctx.input.command.includes("rm -rf")) {
      throw new Error("Dangerous command blocked");
    }
  },

  // Hook: Fires after tool execution
  "tool.after": async (ctx) => {
    // ctx contains: toolName, input, output, session
    // Can modify output or inject additional context
    return {
      ...ctx.output,
      additionalInfo: "Custom data"
    };
  }
};
```

**Hook Discovery**:
1. Plugins in `~/.config/opencode/plugins/` (user-level)
2. Plugins in `.opencode/plugins/` (project-level)
3. Built-in plugins in `packages/opencode/src/plugin/bundled/`

**Loading Priority**: Project > User > Built-in

### Claude Code: Shell Script Hooks

**Location**: `.claude/hooks/` (project) or `~/.claude/hooks/` (user)

**Architecture**:
- Hooks are shell scripts executed at lifecycle events
- Scripts receive JSON via stdin, return JSON via stdout
- Exit code determines success/failure/blocking
- Limited to file system operations and shell commands
- No direct access to internal state

**Hook Directory Structure**:
```
.claude/hooks/
├── SessionStart/
│   └── init.sh
├── PreToolUse/
│   ├── validate-writes.sh
│   └── security-check.sh
├── PostToolUse/
│   └── format-output.sh
├── UserPromptSubmit/
│   └── inject-context.sh
├── Stop/
│   └── cleanup.sh
└── SubagentStop/
    └── aggregate-results.sh
```

**Hook Script Example**:
```bash
#!/bin/bash
# .claude/hooks/PreToolUse/validate-writes.sh

# Read JSON input from stdin
INPUT=$(cat)

# Parse with jq
TOOL=$(echo "$INPUT" | jq -r '.tool_name')
PATH=$(echo "$INPUT" | jq -r '.tool_input.path // empty')

# Validation logic
if [[ "$TOOL" == "Write" && "$PATH" =~ \.env$ ]]; then
  # Block the operation
  echo '{
    "hookSpecificOutput": {
      "hookEventName": "PreToolUse",
      "permissionDecision": "deny",
      "permissionDecisionReason": "Cannot write to .env files"
    }
  }' >&1
  exit 0
fi

# Allow the operation
echo '{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow"
  }
}' >&1
exit 0
```

**Hook Discovery**:
1. Project hooks in `.claude/hooks/`
2. User hooks in `~/.claude/hooks/`
3. Plugin hooks in plugin directories

**Execution**: All matching hooks run in parallel

---

## Available Hook Events

### OpenCode Hook Events

**Documented Events**:
1. **`chat.message`** - Before sending message to LLM
   - Context: messages, config, session, tools
   - Can: Modify messages, inject system prompts

2. **`session.compacted`** - After context window compaction
   - Context: session, summary
   - Can: Re-inject important context

3. **`tool.before`** - Before tool execution
   - Context: toolName, input, session
   - Can: Validate, modify input, block execution

4. **`tool.after`** - After tool execution
   - Context: toolName, input, output, session
   - Can: Modify output, inject additional data

**Implementation** (`packages/opencode/src/plugin/hooks.ts`):
```typescript
export interface HookContext {
  messages?: Message[];
  config?: Config;
  session?: Session;
  tools?: Tool[];
  toolName?: string;
  input?: any;
  output?: any;
  summary?: string;
}

export async function executeHook(
  hookName: string,
  context: HookContext
): Promise<HookContext> {
  const plugins = await loadPlugins();

  for (const plugin of plugins) {
    const handler = plugin[hookName];
    if (handler) {
      await handler(context);
    }
  }

  return context;
}
```

### Claude Code Hook Events

**10 Lifecycle Events**:

1. **`SessionStart`** - Session initiation or resume
   - Input: session_id, cwd, permission_mode
   - Use: Load context, set env vars, initialize tools

2. **`SessionEnd`** - Session termination
   - Input: session_id, cwd, final_state
   - Use: Cleanup, save state, notifications

3. **`UserPromptSubmit`** - Before Claude processes user input
   - Input: session_id, user_prompt
   - Use: Validation, context injection

4. **`PreToolUse`** - After tool parameters created, before execution
   - Input: tool_name, tool_input, session_id
   - Use: Approve/deny/modify tool calls

5. **`PostToolUse`** - After successful tool completion
   - Input: tool_name, tool_input, tool_output, session_id
   - Use: Feedback, logging, formatting

6. **`PermissionRequest`** - When permission dialog appears
   - Input: permission_type, resource, session_id
   - Use: Auto-approve/deny specific actions

7. **`Notification`** - When Claude sends alerts
   - Input: notification_type, message, session_id
   - Use: Custom notification handling

8. **`PreCompact`** - Before context window compaction
   - Input: session_id, context_size, threshold
   - Use: Save state before summarization

9. **`Stop`** - When Claude finishes responding
   - Input: session_id, final_message
   - Use: Task completion actions

10. **`SubagentStop`** - When subagent completes
    - Input: session_id, subagent_id, result
    - Use: Aggregate results, cleanup

---

## Input/Output Formats

### OpenCode: JavaScript Objects

**Input** (Function Parameters):
```javascript
// chat.message hook
{
  messages: [
    { role: "user", content: "Hello" },
    { role: "assistant", content: "Hi there!" }
  ],
  config: {
    model: "anthropic/claude-sonnet-4-5",
    temperature: 1.0
  },
  session: {
    id: "abc123",
    cwd: "/project/path"
  },
  tools: [
    { name: "read", description: "Read files" }
  ]
}

// tool.before hook
{
  toolName: "write",
  input: {
    path: "/path/to/file.ts",
    content: "console.log('hello');"
  },
  session: {
    id: "abc123",
    cwd: "/project/path"
  }
}
```

**Output** (Return Values):
```javascript
// Can return modified context
return {
  ...ctx,
  messages: [
    ...ctx.messages,
    { role: "system", content: "Additional instruction" }
  ]
};

// Or throw to block
throw new Error("Operation not allowed");

// Or return void for no changes
return;
```

### Claude Code: JSON via stdin/stdout

**Input** (stdin JSON):
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

**Output** (stdout JSON):
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",
    "permissionDecisionReason": "Safe operation",
    "updatedInput": {
      "path": "/validated/path/file.js",
      "content": "// Formatted\nconsole.log('hello');\n"
    }
  },
  "continue": true,
  "stopReason": null,
  "systemMessage": null
}
```

**Exit Codes**:
- `0` - Success (stdout processed)
- `2` - Blocking error (stderr fed to Claude, operation denied)
- Other - Non-blocking error (logged in verbose mode)

---

## Configuration

### OpenCode: Plugin Configuration

**Location**: `opencode.json` or `~/.config/opencode/opencode.json`

```json
{
  "plugins": {
    "my-plugin": {
      "enabled": true,
      "config": {
        "customSetting": "value"
      }
    }
  }
}
```

**Plugin Discovery**: Automatic from plugin directories

### Claude Code: Hook Configuration

**Location**: `.claude/settings.json`

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/validate.sh",
            "timeout": 30
          },
          {
            "type": "prompt",
            "prompt": "Review this tool call: $ARGUMENTS",
            "model": "claude-3-5-haiku-20241022"
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/init.sh"
          }
        ]
      }
    ]
  }
}
```

**Features**:
- **Matcher**: Regex pattern for tool names (only for tool-related events)
- **Type**: `command` (shell script) or `prompt` (LLM-based decision)
- **Timeout**: Max execution time in seconds
- **Parallel**: Multiple hooks run simultaneously

---

## Implementation Details

### OpenCode Hook System Implementation

**File**: `packages/opencode/src/plugin/hooks.ts`

```typescript
import { loadPlugins } from './loader';
import type { Plugin, HookContext } from './types';

const hookRegistry = new Map<string, Set<Function>>();

export async function registerHooks() {
  const plugins = await loadPlugins();

  for (const plugin of plugins) {
    for (const [hookName, handler] of Object.entries(plugin)) {
      if (hookName.startsWith('_') || hookName === 'name' || hookName === 'version') {
        continue;
      }

      if (!hookRegistry.has(hookName)) {
        hookRegistry.set(hookName, new Set());
      }

      hookRegistry.get(hookName)!.add(handler as Function);
    }
  }
}

export async function executeHook<T extends HookContext>(
  hookName: string,
  context: T
): Promise<T> {
  const handlers = hookRegistry.get(hookName);

  if (!handlers || handlers.size === 0) {
    return context;
  }

  let modifiedContext = { ...context };

  for (const handler of handlers) {
    try {
      const result = await handler(modifiedContext);

      if (result) {
        modifiedContext = { ...modifiedContext, ...result };
      }
    } catch (error) {
      console.error(`Hook ${hookName} failed:`, error);
      throw error; // Block execution on error
    }
  }

  return modifiedContext;
}

// Hook invocation points
export async function beforeChatMessage(messages: Message[], config: Config) {
  return executeHook('chat.message', { messages, config });
}

export async function beforeToolExecution(toolName: string, input: any) {
  return executeHook('tool.before', { toolName, input });
}

export async function afterToolExecution(toolName: string, output: any) {
  return executeHook('tool.after', { toolName, output });
}
```

**Plugin Loader** (`packages/opencode/src/plugin/loader.ts`):
```typescript
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const pluginCache = new Map<string, Plugin>();

export async function loadPlugins(): Promise<Plugin[]> {
  const plugins: Plugin[] = [];

  // Load from multiple directories
  const dirs = [
    join(process.env.HOME!, '.config/opencode/plugins'),
    join(process.cwd(), '.opencode/plugins'),
    join(__dirname, 'bundled')
  ];

  for (const dir of dirs) {
    try {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const pluginPath = join(dir, entry.name, '.opencode/plugin/index.js');

        if (pluginCache.has(pluginPath)) {
          plugins.push(pluginCache.get(pluginPath)!);
          continue;
        }

        const plugin = await import(pluginPath);
        const pluginObj = plugin.default || plugin;

        pluginCache.set(pluginPath, pluginObj);
        plugins.push(pluginObj);
      }
    } catch (error) {
      // Directory doesn't exist, skip
    }
  }

  return plugins;
}
```

### Claude Code Hook System Implementation

**Pseudocode** (based on documentation):

```typescript
// hooks.ts
import { spawn } from 'child_process';
import { readdir } from 'fs/promises';
import { join } from 'path';

interface HookConfig {
  type: 'command' | 'prompt';
  command?: string;
  prompt?: string;
  model?: string;
  timeout?: number;
}

interface HookInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode: string;
  hook_event_name: string;
  tool_name?: string;
  tool_input?: any;
  tool_output?: any;
}

interface HookOutput {
  hookSpecificOutput?: {
    hookEventName: string;
    permissionDecision?: 'allow' | 'deny' | 'ask';
    permissionDecisionReason?: string;
    updatedInput?: any;
  };
  continue?: boolean;
  stopReason?: string;
  systemMessage?: string;
}

async function executeHook(
  hookConfig: HookConfig,
  input: HookInput
): Promise<HookOutput> {
  if (hookConfig.type === 'command') {
    return executeCommandHook(hookConfig, input);
  } else {
    return executePromptHook(hookConfig, input);
  }
}

async function executeCommandHook(
  hookConfig: HookConfig,
  input: HookInput
): Promise<HookOutput> {
  return new Promise((resolve, reject) => {
    const child = spawn(hookConfig.command!, [], {
      cwd: input.cwd,
      timeout: (hookConfig.timeout || 60) * 1000,
      env: {
        ...process.env,
        CLAUDE_PROJECT_DIR: input.cwd,
        CLAUDE_SESSION_ID: input.session_id
      }
    });

    // Send JSON to stdin
    child.stdin.write(JSON.stringify(input));
    child.stdin.end();

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        // Success - parse JSON output
        try {
          const output = JSON.parse(stdout);
          resolve(output);
        } catch {
          // No JSON, just log stdout
          resolve({});
        }
      } else if (code === 2) {
        // Blocking error
        reject(new Error(stderr));
      } else {
        // Non-blocking error
        console.error('Hook failed:', stderr);
        resolve({});
      }
    });
  });
}

async function executePromptHook(
  hookConfig: HookConfig,
  input: HookInput
): Promise<HookOutput> {
  const prompt = hookConfig.prompt!
    .replace('$ARGUMENTS', JSON.stringify(input.tool_input));

  const response = await anthropic.messages.create({
    model: hookConfig.model || 'claude-3-5-haiku-20241022',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1024
  });

  const result = JSON.parse(response.content[0].text);

  return {
    hookSpecificOutput: {
      hookEventName: input.hook_event_name,
      permissionDecision: result.decision,
      permissionDecisionReason: result.reason
    },
    continue: result.continue !== false
  };
}

async function executeHooksForEvent(
  eventName: string,
  input: HookInput
): Promise<HookOutput[]> {
  const hooks = getHooksForEvent(eventName, input.tool_name);
  const results = await Promise.all(
    hooks.map(hook => executeHook(hook, input))
  );
  return results;
}
```

---

## Feature Comparison Table

| Feature | OpenCode | Claude Code |
|---------|----------|-------------|
| **Language** | JavaScript/TypeScript | Shell scripts (bash, etc.) |
| **Input Format** | JavaScript objects | JSON via stdin |
| **Output Format** | Return values / exceptions | JSON via stdout + exit codes |
| **State Access** | Full programmatic access | Limited to provided JSON |
| **Modification** | In-memory object mutation | JSON transformation |
| **Async Support** | Native async/await | Sequential execution |
| **Error Handling** | Try/catch exceptions | Exit codes |
| **Parallelization** | Sequential by default | Parallel by default |
| **Tool Matching** | N/A (per-hook logic) | Regex matchers |
| **Event Count** | 4 documented | 10 lifecycle events |
| **LLM-based Hooks** | No | Yes (prompt-based) |
| **Configuration** | Plugin config object | settings.json |
| **Discovery** | Automatic from dirs | Automatic from dirs |
| **Priority** | Project > User > Built-in | All hooks run in parallel |
| **Timeout** | No default | 60s default, configurable |
| **Deduplication** | No | Yes (identical commands) |
| **Environment** | Node.js runtime | Shell environment + special vars |

---

## Use Cases Comparison

### OpenCode Strengths

1. **Complex Logic**: JavaScript allows sophisticated validation and transformation
2. **State Access**: Full access to session state, config, messages
3. **Type Safety**: TypeScript plugins with full type checking
4. **Reusable Libraries**: Can use npm packages in hooks
5. **Performance**: In-process execution, no IPC overhead

**Example - Complex Validation**:
```javascript
"tool.before": async (ctx) => {
  if (ctx.toolName === "write") {
    // Complex logic using external library
    const prettier = await import('prettier');
    const formatted = await prettier.format(ctx.input.content, {
      parser: 'typescript'
    });

    // Modify input with formatted code
    return {
      ...ctx,
      input: {
        ...ctx.input,
        content: formatted
      }
    };
  }
}
```

### Claude Code Strengths

1. **Simplicity**: Shell scripts are familiar and easy to write
2. **Language Agnostic**: Can use Python, Ruby, etc. via shebang
3. **Security**: Process isolation prevents plugin from corrupting state
4. **LLM Integration**: Prompt-based hooks for intelligent decisions
5. **Granular Events**: 10 lifecycle events for precise control
6. **Tool Matching**: Regex matchers for selective hook execution

**Example - LLM-based Security Decision**:
```json
{
  "type": "prompt",
  "prompt": "Tool: $TOOL_NAME\nInput: $ARGUMENTS\n\nIs this safe to execute? Consider: 1) Data access 2) System modification 3) External calls\n\nReturn JSON with: {\"decision\": \"allow|deny\", \"reason\": \"explanation\"}",
  "model": "claude-3-5-haiku-20241022"
}
```

---

## Implementation Roadmap: Add Claude Code Hook Features to OpenCode

### Phase 1: Event Expansion (1-2 weeks)

**Goal**: Add Claude Code's 10 lifecycle events to OpenCode

**Tasks**:
1. Map Claude Code events to OpenCode architecture:
   - `SessionStart` → Add to session initialization
   - `SessionEnd` → Add to session cleanup
   - `UserPromptSubmit` → Add before message processing
   - `PreToolUse` → Already exists as `tool.before`
   - `PostToolUse` → Already exists as `tool.after`
   - `PermissionRequest` → Add to permission system
   - `Notification` → Add to notification system
   - `PreCompact` → Already exists as `session.compacted` (add pre-version)
   - `Stop` → Add after final message
   - `SubagentStop` → Add to agent completion

2. Update plugin interface:
```typescript
export interface Plugin {
  name: string;
  version: string;

  // Existing
  'chat.message'?: HookHandler;
  'session.compacted'?: HookHandler;
  'tool.before'?: HookHandler;
  'tool.after'?: HookHandler;

  // New
  'session.start'?: HookHandler;
  'session.end'?: HookHandler;
  'user.prompt'?: HookHandler;
  'permission.request'?: HookHandler;
  'notification'?: HookHandler;
  'compaction.before'?: HookHandler;
  'message.stop'?: HookHandler;
  'agent.stop'?: HookHandler;
}
```

3. Add hook invocation points throughout codebase

**Files to Modify**:
- `packages/opencode/src/plugin/types.ts` - Add hook types
- `packages/opencode/src/plugin/hooks.ts` - Add hook executors
- `packages/opencode/src/session/session.ts` - Add session hooks
- `packages/opencode/src/permission/permission.ts` - Add permission hooks
- `packages/opencode/src/agent/agent.ts` - Add agent hooks

### Phase 2: Shell Script Support (2-3 weeks)

**Goal**: Allow hooks to be shell scripts like Claude Code

**Tasks**:
1. Create shell hook executor:
```typescript
// packages/opencode/src/plugin/shell-hooks.ts
import { spawn } from 'child_process';

export async function executeShellHook(
  scriptPath: string,
  input: HookInput,
  timeout: number = 60000
): Promise<HookOutput> {
  return new Promise((resolve, reject) => {
    const child = spawn(scriptPath, [], {
      timeout,
      env: {
        ...process.env,
        OPENCODE_SESSION_ID: input.session_id,
        OPENCODE_CWD: input.cwd
      }
    });

    child.stdin.write(JSON.stringify(input));
    child.stdin.end();

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => stdout += data);
    child.stderr.on('data', (data) => stderr += data);

    child.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(stdout));
        } catch {
          resolve({});
        }
      } else if (code === 2) {
        reject(new Error(stderr));
      } else {
        console.error('Hook error:', stderr);
        resolve({});
      }
    });
  });
}
```

2. Update plugin loader to discover shell scripts:
```typescript
// Look for .sh files in hooks/ directories
const hookDirs = [
  join(process.env.HOME!, '.config/opencode/hooks'),
  join(process.cwd(), '.opencode/hooks')
];

for (const dir of hookDirs) {
  const events = await readdir(dir);

  for (const event of events) {
    const scripts = await readdir(join(dir, event));

    for (const script of scripts) {
      if (script.endsWith('.sh')) {
        registerShellHook(event, join(dir, event, script));
      }
    }
  }
}
```

3. Add configuration format:
```json
{
  "hooks": {
    "tool.before": [
      {
        "type": "shell",
        "script": ".opencode/hooks/validate.sh",
        "timeout": 30,
        "matcher": "write|edit"
      }
    ]
  }
}
```

**Files to Create**:
- `packages/opencode/src/plugin/shell-hooks.ts`
- `packages/opencode/src/plugin/shell-loader.ts`

**Files to Modify**:
- `packages/opencode/src/plugin/loader.ts` - Add shell hook loading
- `packages/opencode/src/plugin/hooks.ts` - Add shell hook execution

### Phase 3: LLM-based Hooks (1 week)

**Goal**: Add Claude Code's prompt-based hooks

**Tasks**:
1. Create prompt hook executor:
```typescript
// packages/opencode/src/plugin/prompt-hooks.ts
import Anthropic from '@anthropic-ai/sdk';

export async function executePromptHook(
  config: PromptHookConfig,
  input: HookInput
): Promise<HookOutput> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  const prompt = config.prompt
    .replace('$TOOL_NAME', input.toolName || '')
    .replace('$ARGUMENTS', JSON.stringify(input.toolInput || {}));

  const message = await anthropic.messages.create({
    model: config.model || 'claude-3-5-haiku-20241022',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }]
  });

  const result = JSON.parse(message.content[0].text);

  return {
    hookSpecificOutput: {
      hookEventName: input.hookEventName,
      permissionDecision: result.decision,
      permissionDecisionReason: result.reason
    }
  };
}
```

2. Add to configuration:
```json
{
  "hooks": {
    "tool.before": [
      {
        "type": "prompt",
        "prompt": "Review this tool call: $TOOL_NAME with args $ARGUMENTS. Is it safe?",
        "model": "claude-3-5-haiku-20241022",
        "matcher": "bash"
      }
    ]
  }
}
```

**Files to Create**:
- `packages/opencode/src/plugin/prompt-hooks.ts`

**Files to Modify**:
- `packages/opencode/src/plugin/hooks.ts` - Add prompt hook execution

### Phase 4: Tool Matching (3 days)

**Goal**: Add regex matchers like Claude Code

**Tasks**:
1. Update hook configuration:
```typescript
interface HookConfig {
  type: 'plugin' | 'shell' | 'prompt';
  matcher?: string; // Regex pattern
  // ... other config
}
```

2. Implement matching logic:
```typescript
function matchesTool(pattern: string | undefined, toolName: string): boolean {
  if (!pattern) return true; // No matcher = match all

  // Exact match
  if (pattern === toolName) return true;

  // Regex match
  try {
    const regex = new RegExp(pattern);
    return regex.test(toolName);
  } catch {
    return false;
  }
}

// In hook executor
const matchingHooks = hooks.filter(h => matchesTool(h.matcher, toolName));
```

**Files to Modify**:
- `packages/opencode/src/plugin/hooks.ts` - Add matcher logic

### Phase 5: Parallel Execution & Deduplication (3 days)

**Goal**: Run multiple hooks in parallel like Claude Code

**Tasks**:
1. Update hook executor for parallel execution:
```typescript
export async function executeHooksForEvent(
  eventName: string,
  context: HookContext
): Promise<HookContext> {
  const hooks = getHooksForEvent(eventName, context.toolName);

  // Deduplicate identical commands
  const uniqueHooks = deduplicateHooks(hooks);

  // Execute in parallel
  const results = await Promise.allSettled(
    uniqueHooks.map(hook => executeHook(hook, context))
  );

  // Merge results
  let modifiedContext = { ...context };

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      modifiedContext = mergeHookOutputs(modifiedContext, result.value);
    } else if (result.status === 'rejected') {
      // Handle blocking errors
      throw result.reason;
    }
  }

  return modifiedContext;
}

function deduplicateHooks(hooks: HookConfig[]): HookConfig[] {
  const seen = new Set<string>();
  const unique: HookConfig[] = [];

  for (const hook of hooks) {
    const key = JSON.stringify(hook);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(hook);
    }
  }

  return unique;
}
```

**Files to Modify**:
- `packages/opencode/src/plugin/hooks.ts` - Update execution strategy

### Phase 6: Integration & Testing (1 week)

**Goal**: Integrate all features and test thoroughly

**Tasks**:
1. Update documentation
2. Create example hooks for each type
3. Add tests for hook system
4. Migration guide for existing plugins

**Files to Create**:
- `docs/hooks/shell-hooks.md`
- `docs/hooks/prompt-hooks.md`
- `docs/hooks/migration.md`
- `examples/hooks/` - Example hook implementations

---

## Gap Analysis: What We Don't Know

### Known Unknowns

1. **Exact Hook Trigger Points**: We know the 10 events but not exactly where in Claude Code's execution flow they fire
2. **Hook Priority System**: How Claude Code determines hook execution order when multiple hooks match
3. **Error Recovery**: How Claude Code handles hook failures (retry logic, fallbacks, etc.)
4. **Performance Impact**: How hooks affect overall latency (caching, optimization strategies)
5. **Security Model**: How Claude Code sandboxes hook execution (filesystem restrictions, network access, etc.)
6. **State Persistence**: Whether hook outputs are persisted across sessions
7. **Hook Debugging**: Tools and techniques for debugging hook failures
8. **Compaction Behavior**: Exactly what gets preserved/discarded during `PreCompact` hook

### Implementation Risks

1. **Breaking Changes**: Adding shell hooks might break existing JavaScript plugins
2. **Performance**: Parallel hook execution could cause race conditions
3. **Security**: Shell hooks need sandboxing to prevent malicious code
4. **Compatibility**: Prompt-based hooks require Anthropic API access (cost implications)

### Mitigation Strategies

1. **Versioning**: Use plugin version field to handle breaking changes
2. **Feature Flags**: Make new hook features opt-in via config
3. **Sandboxing**: Use Docker or other isolation for shell hooks
4. **Caching**: Cache LLM responses for identical prompt hooks
5. **Documentation**: Comprehensive migration guides and examples

---

## Conclusion

**OpenCode** currently has a simpler hook system focused on JavaScript plugins with programmatic access. It's powerful but limited to in-process execution.

**Claude Code** has a more mature hook system with 10 lifecycle events, shell script support, LLM-based decisions, and parallel execution with deduplication.

**To achieve parity**, OpenCode needs:
1. ✅ Expand to 10 lifecycle events (straightforward)
2. ✅ Add shell script support (moderate complexity)
3. ✅ Add LLM-based hooks (easy with existing Anthropic integration)
4. ✅ Implement tool matching (trivial)
5. ✅ Add parallel execution (moderate complexity)

**Estimated Effort**: 6-8 weeks for full implementation with testing

**Recommendation**: Start with Phase 1 (event expansion) as it provides immediate value and doesn't break existing plugins. Then add shell support (Phase 2) to enable Claude Code-style hooks. Phases 3-5 can be done in parallel as they're independent features.
