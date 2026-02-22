# Flow: Installation & Hook Integration

> From first install to blocking your first dangerous command.

---

## Flow Diagram

```
┌───────────┐     ┌───────────────┐     ┌───────────────┐     ┌──────────────┐
│  Install   │────►│  Hook         │────►│  First Block  │────►│  Status Line │
│  Plugin    │     │  Registration │     │  (automatic)  │     │  (optional)  │
└───────────┘     └───────────────┘     └───────────────┘     └──────────────┘
```

---

## Journey 1: Claude Code Plugin Install

### Step 1: Add Marketplace
```
/plugin marketplace add kenryu42/cc-marketplace
```
Adds the plugin marketplace repository to Claude Code's known sources.

### Step 2: Install Plugin
```
/plugin install safety-net@cc-marketplace
```
Downloads and registers the plugin. Adds to `~/.claude/settings.json`:
```json
{
  "enabledPlugins": {
    "safety-net@cc-marketplace": true
  }
}
```

### Step 3: Restart Claude Code
Plugin hooks are loaded on startup. After restart, the PreToolUse hook is active.

### Step 4: First Block (Automatic)

**Scenario**: AI attempts `git reset --hard`

```
Claude Code → PreToolUse hook fires
  → cc-safety-net receives JSON:
    { tool_name: "Bash", tool_input: { command: "git reset --hard" } }
  → analyzeCommand("git reset --hard")
  → BLOCK: "git reset --hard destroys all uncommitted changes permanently"
  → Output: { hookSpecificOutput: { permissionDecision: "deny", ... } }

Claude Code → Shows: "BLOCKED by Safety Net: ..."
Claude Code → AI receives deny, tries alternative approach
```

**User action**: None. The block is automatic and invisible until triggered.

---

## Journey 2: OpenCode Plugin Install

### Step 1: Install Package
```bash
npm install -g cc-safety-net
# or
bun add -g cc-safety-net
```

### Step 2: Add to Config
In `~/.config/opencode/opencode.json`:
```json
{
  "plugin": ["cc-safety-net"]
}
```

### Step 3: Automatic Hook
The plugin exports a `tool.execute.before` hook. OpenCode calls it before every tool execution. On block, the plugin throws an Error that OpenCode catches.

---

## Journey 3: Gemini CLI Extension

### Step 1: Install Package
```bash
npm install -g cc-safety-net
```

### Step 2: Configure Hook
Add hook configuration for Gemini CLI's BeforeTool event:
```json
{
  "hooks": {
    "BeforeTool": {
      "command": "npx -y cc-safety-net --gemini-cli"
    }
  }
}
```

### Step 3: Hook Format
```
Gemini CLI → BeforeTool event
  → cc-safety-net receives: { tool: "run_shell_command", args: { command: "..." } }
  → On block: { decision: "deny", reason: "...", systemMessage: "..." }
```

---

## Journey 4: Copilot CLI Hooks

### Step 1: Create Hook File
`.github/hooks/safety-net.json`:
```json
{
  "version": 1,
  "hooks": {
    "preToolUse": [
      {
        "type": "command",
        "bash": "npx -y cc-safety-net --copilot-cli",
        "cwd": ".",
        "timeoutSec": 15
      }
    ]
  }
}
```

### Step 2: Project-Level Only
Copilot CLI hooks are per-project. Each project needs its own hook file.

---

## Journey 5: Status Line Setup

### Step 1: Run Setup Command
```
/set-statusline
```
Interactive prompts:
1. Prefer `npx` or `bunx`?
2. Current status line command (if any) — chain with it?

### Step 2: Configuration Written
Adds to `~/.claude/settings.json`:
```json
{
  "statusLine": {
    "type": "command",
    "command": "bunx cc-safety-net --statusline"
  }
}
```

### Step 3: Status Bar Display
```
🛡️ Safety Net ✅       ← Normal mode
🛡️ Safety Net 🗑️      ← Paranoid RM enabled
🛡️ Safety Net 🐚      ← Paranoid interpreters enabled
🛡️ Safety Net 👁️      ← Both paranoid modes
🛡️ Safety Net 🔒      ← Strict mode
```

### Step 4: Chaining with Other Plugins
If user already has a statusline command (e.g., claude-hud), the setup can pipe through both:
```json
{
  "statusLine": {
    "command": "node ~/.claude/plugins/claude-hud/dist/index.js | bunx cc-safety-net --statusline"
  }
}
```

---

## Journey 6: Verify Installation

### Run Doctor
```bash
npx cc-safety-net doctor
```

**Output includes**:
1. **Hook Integration**: Whether safety net is registered as a hook
2. **Self-Test**: Runs sample dangerous commands through analysis
3. **Configuration**: Shows loaded config files and rules
4. **Environment**: Current mode flags (paranoid, strict)
5. **Recent Activity**: Last 7 days of blocked commands
6. **System Info**: Node/Bun version, package version
7. **Update Check**: Whether a newer version is available

```bash
# JSON output for CI/scripts
npx cc-safety-net doctor --json
```
