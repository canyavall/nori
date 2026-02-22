# Flow: Installation & Setup

> From plugin install to seeing your first HUD display.

---

## Flow Diagram

```
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌──────────────┐
│  Add       │────►│  Install   │────►│  Run      │────►│  HUD Active  │
│ Marketplace│     │  Plugin    │     │  /setup   │     │  (immediate) │
└───────────┘     └───────────┘     └───────────┘     └──────────────┘
```

---

## Step 1: Add Marketplace

**User action**:
```
/plugin marketplace add jarrodwatts/claude-hud
```

Registers the plugin marketplace repository.

---

## Step 2: Install Plugin

**User action**:
```
/plugin install claude-hud
```

**What happens**:
1. Plugin downloaded to `~/.claude/plugins/claude-hud/`
2. Contains: `dist/index.js`, `plugin.json`, setup scripts
3. No restart needed

---

## Step 3: Run Setup Wizard

**User action**:
```
/claude-hud:setup
```

### Interactive Flow

**Step 3a: Preset Selection**
```
Choose a preset:
  1. Full       — Everything enabled (all git, all display, activity lines)
  2. Essential  — Core features (git dirty, context, usage, activity)
  3. Minimal    — Compact single-line (git, context only)
```

**Step 3b: Fine-Tune (Optional)**
After preset, user can toggle individual features:
- Show tools? (yes/no)
- Show agents? (yes/no)
- Show todos? (yes/no)
- Show git ahead/behind? (yes/no)
- Show file stats? (yes/no)
- Path levels? (1/2/3)

**Step 3c: Preview**
Shows exactly what the HUD will look like with chosen settings.

**Step 3d: Save**
1. Configuration written to `~/.claude/plugins/claude-hud/config.json`
2. Statusline registered in `~/.claude/settings.json`:
```json
{
  "statusLine": {
    "command": "node ~/.claude/plugins/claude-hud/dist/index.js"
  }
}
```

---

## Step 4: HUD Appears Immediately

**What the user sees** (expanded layout, essential preset):
```
[Opus | Max] │ my-project git:(main*)
Context █████░░░░░ 45% │ Usage ██░░░░░░░░ 25% (1h 30m / 5h)
```

No restart needed. Claude Code picks up the statusline command on next invocation (~300ms).

---

## Alternative: No Setup Needed

If user skips `/claude-hud:setup`, the plugin still works with sensible defaults:
- Expanded layout
- Model, project path, git branch shown
- Context bar and usage bar shown
- No activity lines (tools/agents/todos hidden by default)

---

## Linux Users: TMPDIR Workaround

**Issue**: On some Linux systems, TMPDIR points to a separate filesystem, causing plugin installation issues.

**Fix**:
```bash
mkdir -p ~/.cache/tmp
TMPDIR=~/.cache/tmp claude
# Then install plugin in that session
```

---

## Reconfigure Later

**User action**:
```
/claude-hud:configure
```

Same guided flow as setup, but starts from current config instead of preset selection.

Or manually edit `~/.claude/plugins/claude-hud/config.json`.
