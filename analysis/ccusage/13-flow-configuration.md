# Flow: Configuration & Customization

> Setting up ccusage to match your preferences.

---

## Flow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Config File │────►│  Env Vars    │────►│  CLI Args    │────►│  Effective   │
│  (lowest)    │     │  (middle)    │     │  (highest)   │     │  Config      │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

---

## Journey 1: Zero-Config Usage

**User action**: `ccusage`

**What happens**:
1. No config file found → all defaults used
2. Default data directory auto-discovered
3. Auto cost mode, UTC timezone, en-CA locale
4. Table output, descending date order

**This works immediately** for any Claude Code user without any setup.

---

## Journey 2: Create Config File

**User action**: Create `~/.config/claude/ccusage.json`

```json
{
  "$schema": "https://ccusage.com/config-schema.json",
  "defaults": {
    "timezone": "America/New_York",
    "locale": "en-US",
    "mode": "calculate",
    "offline": true
  },
  "commands": {
    "daily": {
      "order": "desc",
      "breakdown": true
    },
    "blocks": {
      "active": true
    }
  }
}
```

**What happens**:
1. Config loader finds file at XDG config location
2. Validates JSON structure
3. Merges with built-in defaults (config wins)
4. Now `ccusage daily` automatically uses EST timezone, US date format, calculated costs, and model breakdown

**JSON Schema**: The `$schema` field enables autocomplete in VS Code and other editors.

---

## Journey 3: Project-Specific Config

**User action**: Create `.ccusage/ccusage.json` in project root

```json
{
  "defaults": {
    "mode": "display"
  },
  "commands": {
    "daily": {
      "instances": true,
      "project": "my-project"
    }
  }
}
```

**What happens**:
1. Local config found (highest file priority)
2. Merges with user config and defaults
3. When running `ccusage` from this project, automatically filters to "my-project" and uses display mode

---

## Journey 4: Environment Variables

### Multiple Data Sources
```bash
export CLAUDE_CONFIG_DIR="/path/to/team-data,/home/me/.config/claude"
ccusage daily
```
**What happens**: Aggregates data from both directories. Useful for team shared data or multiple Claude installations.

### Logging Control
```bash
LOG_LEVEL=0 ccusage daily --json | jq '.totals.totalCost'
# Silent mode: only JSON output, no logs
```

### Offline Mode
```bash
export CCUSAGE_OFFLINE=1
ccusage daily
# Uses cached pricing, no network requests
```

---

## Journey 5: CLI Argument Overrides

**User action**: Any flag on the command line overrides config and env vars

```bash
# Config says timezone=UTC, but override to Tokyo:
ccusage daily --timezone Asia/Tokyo

# Config says mode=auto, but force calculate:
ccusage daily --mode calculate

# Config says order=desc, but force ascending:
ccusage daily --order asc
```

**Precedence** (highest wins):
1. CLI arguments
2. Custom config file (`--config /path`)
3. Local project config (`.ccusage/ccusage.json`)
4. User config (`~/.config/claude/ccusage.json`)
5. Legacy config (`~/.claude/ccusage.json`)
6. Built-in defaults

---

## Journey 6: Cost Mode Selection

### Auto Mode (default)
```bash
ccusage daily --mode auto
```
- Uses `costUSD` from JSONL if present (Claude's own calculation)
- Falls back to token-based calculation for older entries
- Best for: general use with mixed data

### Calculate Mode
```bash
ccusage daily --mode calculate
```
- Always calculates from tokens using LiteLLM pricing
- Ignores pre-calculated `costUSD`
- Best for: consistent historical analysis, seeing the math

### Display Mode
```bash
ccusage daily --mode display
```
- Only shows pre-calculated `costUSD`
- Shows $0 for entries without cost data
- Best for: billing verification against Claude's numbers

### Debug Mode (cost comparison)
```bash
ccusage daily --mode calculate --debug --debug-samples 10
```
- Shows pricing mismatches between calculated and pre-calculated costs
- Displays sample discrepancies with percentage differences
- Best for: understanding pricing accuracy

---

## Journey 7: Timezone & Locale

### Timezone affects grouping
```bash
# Entry at 2025-01-15T23:00:00Z
ccusage daily --timezone UTC         # → grouped under Jan 15
ccusage daily --timezone Asia/Tokyo  # → grouped under Jan 16 (8 AM JST)
```

### Locale affects display
```bash
ccusage daily --locale en-US  # → 01/15/2025
ccusage daily --locale en-CA  # → 2025-01-15 (default)
ccusage daily --locale ja-JP  # → 2025/01/15
```

---

## Journey 8: Color Control

```bash
# Force colors on (when piping)
FORCE_COLOR=1 ccusage daily | less -R

# Disable colors
NO_COLOR=1 ccusage daily > report.txt

# Or via flags
ccusage daily --color
ccusage daily --no-color
```
