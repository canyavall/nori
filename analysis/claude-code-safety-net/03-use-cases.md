# claude-code-safety-net - Use Cases

## Primary Use Cases

### 1. Prevent Accidental Git Data Loss
**Who**: Any developer using Claude Code for git operations.
**What**: Automatically blocks `git reset --hard`, `git checkout -- <files>`, `git clean -f`, `git push --force`, and other destructive git commands before they execute.
**Value**: AI coding assistants sometimes suggest destructive commands. This prevents permanent loss of uncommitted work without requiring the user to review every command.

### 2. Prevent rm -rf Outside Safe Directories
**Who**: Any developer letting an AI assistant execute shell commands.
**What**: Blocks `rm -rf` targeting paths outside the current working directory (except temp directories). Prevents deletion of home directory, root, or unrelated project files.
**Value**: Safety net against the AI accidentally constructing a path that deletes important files.

### 3. Block Complex Destructive Patterns
**Who**: Power users running AI assistants with broad permissions.
**What**: Catches destructive commands hidden inside `bash -c '...'`, `python -c '...'`, `xargs rm -rf`, `find -delete`, and piped command chains.
**Value**: Simple regex-based protections miss these patterns. Semantic analysis catches threats that permission deny rules cannot.

### 4. Team/Project Safety Standards
**Who**: Teams that want consistent safety rules across projects.
**What**: Define custom rules in `.safety-net.json` to block project-specific dangerous patterns (e.g., block `git add -A`, require specific file adds).
**Value**: Codify team conventions into enforceable rules. New team members and AI assistants automatically follow the rules.

### 5. Paranoid Mode for High-Risk Environments
**Who**: Users working on critical codebases or production systems.
**What**: Enable paranoid modes (`SAFETY_NET_PARANOID_RM=1`, `SAFETY_NET_PARANOID_INTERPRETERS=1`) to block even more operations — rm -rf in CWD, all interpreter one-liners.
**Value**: Maximum protection for environments where data loss would be catastrophic.

### 6. Multi-Platform Protection
**Who**: Users of OpenCode, Gemini CLI, or Copilot CLI (not just Claude Code).
**What**: Same safety analysis available as plugins/hooks for 4 different AI coding platforms.
**Value**: Consistent safety regardless of which AI coding tool is used.

## Secondary Use Cases

### 7. Audit Trail
All blocked commands are logged to `~/.cc-safety-net/logs/` with timestamps, reasons, and automatic secret redaction. Useful for security reviews.

### 8. Education & Debugging
The `explain` command traces how any command is analyzed step-by-step. Useful for understanding why something was blocked or for learning about shell command safety.

### 9. Strict Mode for CI/CD
Enable `SAFETY_NET_STRICT=1` to fail-closed on any unparseable command. Ensures nothing slips through due to parsing edge cases.

## Limitations

- **Bash only**: Only analyzes bash/shell commands, not other tool types (file writes, API calls)
- **Not a sandbox**: Cannot prevent the command from being re-attempted (only blocks once, user can override)
- **Shell parsing limitations**: Some extremely exotic shell syntax may not parse correctly
- **No network protection**: Cannot block dangerous network operations (curl, wget to malicious URLs)
- **Single-command scope**: Analyzes each command independently, cannot reason about multi-command sequences across turns
