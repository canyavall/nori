# claude-code-safety-net - Project Overview

## What Is It

**claude-code-safety-net** is a safety plugin that acts as a PreToolUse hook for Claude Code (and other AI coding tools). It intercepts bash commands before execution and blocks destructive operations — preventing accidental data loss from dangerous git operations (`git reset --hard`, `git checkout --`) and destructive filesystem commands (`rm -rf` outside safe directories).

**Repository**: https://github.com/kenryu42/claude-code-safety-net
**Package**: `cc-safety-net` on npm
**License**: MIT
**Runtime**: Bun (primary), Node.js 18+ compatible

## What It Does

The plugin sits between the AI coding assistant and the shell. When the AI attempts to execute a bash command, the safety net analyzes it semantically — not with simple regex patterns, but by parsing the shell command structure, unwrapping wrappers, and applying rule-based analysis.

### 1. Git Protection
- Blocks `git reset --hard` and `--merge` (destroys uncommitted changes)
- Blocks `git checkout -- <files>` (discards changes to files)
- Blocks `git restore` without `--staged` (discards working tree changes)
- Blocks `git clean -f` (deletes untracked files permanently)
- Blocks `git push --force` (allows `--force-with-lease`)
- Blocks `git branch -D` (force-delete, allows `-d` with merge check)
- Blocks `git stash drop` and `git stash clear`

### 2. Filesystem Protection
- Blocks `rm -rf` targeting root (`/`), home (`~`, `$HOME`), or paths outside cwd
- Allows `rm -rf` within current directory (configurable) and temp directories
- Blocks `find -delete` and `find -exec rm -rf`
- Blocks dangerous `xargs rm -rf` and `xargs bash -c` patterns
- Blocks dangerous `parallel` command expansions

### 3. Deep Analysis
- Unwraps shell wrappers: catches `bash -c 'git reset --hard'`
- Detects interpreter one-liners: `python -c 'os.system("rm -rf /")'`
- Follows command chains: `&&`, `||`, `|`, `;` — each segment analyzed
- Tracks CWD changes: after `cd`, paths become unknown (more conservative)
- Recursion up to 10 levels deep

### 4. Custom Rules
- Project-level rules in `.safety-net.json`
- User-level rules in `~/.cc-safety-net/config.json`
- Match by command, subcommand, and blocked arguments

### 5. Multi-Platform Support
- Claude Code (native plugin via marketplace)
- OpenCode (plugin config)
- Gemini CLI (extension)
- GitHub Copilot CLI (project-level hooks)

### 6. Diagnostics
- `doctor` command: comprehensive health check
- `explain` command: step-by-step trace of how a command is analyzed
- Audit logging with automatic secret redaction

## How It Works (High Level)

```
AI Tool (Claude Code, OpenCode, etc.)
    │
    ▼ PreToolUse hook
cc-safety-net
    │
    ├── Read hook JSON from stdin
    ├── Extract command + cwd
    │
    ├── Split into segments (&&, ||, |, ;)
    ├── For each segment:
    │   ├── Strip env vars (VAR=value)
    │   ├── Strip wrappers (sudo, env, command)
    │   ├── Detect shell wrappers (bash -c) → recurse
    │   ├── Detect interpreters (python -c) → analyze code
    │   ├── Apply git rules
    │   ├── Apply rm rules (path classification)
    │   ├── Apply find/xargs/parallel rules
    │   └── Apply custom rules
    │
    ▼
ALLOW (silent) or DENY (JSON with reason)
```
