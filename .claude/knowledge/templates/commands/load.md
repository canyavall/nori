---
description: Load knowledge packages based on your configured role (project)
allowed-tools: Read(*), Bash(*)
---

# Load Command - Load Configured Role Knowledge

Manually load knowledge packages for your configured role from settings.json.

## When to Use

Use `/load` when:
- You want to manually load role knowledge instead of auto-loading at session start
- You need to refresh role knowledge in current session
- You want to load role packages on-demand to save tokens

## Workflow

### Step 1: Load Role from Settings

Run the load-role script to get packages from your configured role:

```bash
node .claude/knowledge/scripts/load-role.mjs --from-settings
```

**Expected output:**
- JSON with `knowledge_paths`, `packages`, `already_loaded_packages`
- If no role configured or disabled: script outputs warning and exits

**Handle cases:**
- **No role configured**: Tell user to configure role in `.claude/knowledge/settings.json` or run `/role <name>` instead
- **Preload disabled**: Tell user that role preload is disabled in settings
- **Success**: Proceed to Step 2

### Step 2: Read Knowledge Files

Parse the JSON output from Step 1:

1. Extract `knowledge_paths` array
2. Use Read tool on EVERY file path in the array
3. Actually read the content (critical - don't skip)

### Step 3: Update Session State

After reading files, update session state to prevent duplicate loading:

```bash
node .claude/knowledge/scripts/session-manager.mjs add <comma-separated-package-names>
```

Use the `packages` array from Step 1 output, joined with commas.

### Step 4: Report to User

Confirm what was loaded:

```
✅ Loaded <Role Name> knowledge (<N> packages):
- package-1
- package-2
- package-3
...

[If any already loaded:]
Skipped (already loaded):
- package-x
- package-y
```

## Configuration

Configure your role in `.claude/knowledge/settings.json`:

```json
{
  "role": "fe"
}
```

**Supported roles:**
- `fe` / `fe-dev` - Frontend Developer
- `be` / `be-dev` - Backend Developer
- `qa` - QA Engineer
- `po` - Product Owner
- `sre` - Site Reliability Engineer
- `ai` - AI Infrastructure Manager (all meta knowledge: hooks, knowledge system, Serena MCP)

## Alternative: Load Different Role

If you want to load a different role (not from settings), use `/role <name>` instead:

```
/role fe
/role backend
/role qa
```

## Notes

- Loads from `.claude/knowledge/settings.json` → `role` field
- Session state prevents duplicate loading (same session)
- Run `/load` again to ensure packages are loaded (idempotent)
- For one-time role loading, use `/role <name>` instead
