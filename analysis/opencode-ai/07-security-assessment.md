# OpenCode - Security Assessment

## Security Model Overview

OpenCode implements a **permission-based security model** where dangerous tool operations (file writes, bash commands) require explicit user approval before execution. This is a significant design choice that makes it safer than tools that auto-approve everything.

## Permission System (Positive)

### Architecture
```
Tool requests permission -> Permission Service -> PubSub event -> TUI Dialog
    |                                                                  |
    | <--- blocks on channel (chan bool) ---                           |
    |                                                                  |
    v                                                 User: Allow/Deny/Allow for Session
Tool executes or returns PermissionDenied
```

### Permission Granularity
- **Per-action**: Each tool execution can be individually approved/denied
- **Per-session persistent**: "Allow for session" grants permission for the same tool+action+path combo for the session duration
- **Auto-approve**: Non-interactive mode auto-approves all permissions (necessary for scripting)

### Permission Scope
Permissions are scoped by: `(ToolName, Action, SessionID, Path)`

Tools that require permissions:
- `bash` - Shell command execution
- `write` - File creation/overwrite
- `edit` - File modification (find-and-replace)
- `patch` - Diff application
- `fetch` - URL fetching

Tools that do NOT require permissions (read-only):
- `view`, `glob`, `grep`, `ls`, `sourcegraph`, `diagnostics`

## Critical Issues

### 1. Bash Tool - Arbitrary Command Execution (HIGH)
The bash tool executes arbitrary shell commands in a persistent shell session. While it requires permission, once approved, the AI has full shell access.

**Mitigations present**:
- Banned command list (curl, wget, nc, telnet, browser commands)
- Read-only safe commands bypass permission prompt
- Timeout limits (default 1 minute, max 10 minutes)
- Output truncation (30,000 character limit)

**Gaps**:
- Banned list is incomplete (could use `python -c "import urllib"` to bypass curl ban)
- No sandbox or container isolation
- Persistent shell means environment changes carry over between commands
- No network isolation (only specific commands banned, not actual network access)

### 2. Non-Interactive Mode Auto-Approves All (MEDIUM)
When running with `-p` flag, all permissions are automatically approved:
```go
a.Permissions.AutoApproveSession(sess.ID)
```
This is by design (needed for scripting) but means any prompt injection in non-interactive mode has unrestricted access.

**Risk**: If the prompt includes untrusted content (e.g., fetched from a URL or file), the AI could execute arbitrary commands without human review.

### 3. MCP Server Execution (MEDIUM)
MCP servers are spawned as subprocesses with user-configured commands:
```json
{
  "mcpServers": {
    "example": {
      "type": "stdio",
      "command": "path/to/mcp-server",
      "env": [],
      "args": []
    }
  }
}
```
- No sandboxing of MCP server processes
- Environment variables passed through
- No verification of MCP server binaries
- MCP tools receive permissions through the same system as built-in tools

### 4. Shell Session Persistence (MEDIUM)
The bash tool uses a persistent shell session (same shell across multiple tool calls):
- Environment variables set in one command persist to the next
- A compromised command could set `PATH` or `LD_PRELOAD` to affect subsequent commands
- Virtual environment activation persists (could change Python imports)

## Medium Issues

### 5. File Write Scope
File writes are not restricted to the project directory. The AI could write to any path the user has access to. While permissions are required, the permission dialog shows the path but does not enforce directory boundaries.

### 6. Fetch Tool
The fetch tool can access arbitrary URLs, including internal network services:
- Could be used for SSRF (Server-Side Request Forgery) in environments with internal services
- No URL allowlist or denylist beyond the banned command list
- Converts HTML to markdown, which could include sensitive content

### 7. Sourcegraph Tool
Searches public code on Sourcegraph. While read-only, it could be used to:
- Search for similar code patterns to understand the codebase's purpose
- Find known-vulnerable code patterns

### 8. API Key Storage
API keys are stored in:
- Environment variables (standard practice)
- JSON config file (`~/.opencode.json`) in plaintext
- GitHub Copilot tokens read from `~/.config/github-copilot/hosts.json`

No at-rest encryption for sensitive configuration values.

### 9. SQLite Database
- Database stored in `.opencode/opencode.db` in the project directory
- Contains full conversation history including any sensitive code discussed
- No encryption at rest
- No access controls beyond filesystem permissions

## Low Issues

### 10. Version/Binary Integrity
- No checksum verification for downloaded binaries via install script
- Install script fetches from GitHub releases over HTTPS (good)
- GoReleaser builds are deterministic but not reproducibly verified

### 11. Log Data
- Debug logs (`.opencode/debug.log`) may contain sensitive information
- Message logs may be written to `.opencode/messages/` in debug mode
- No automatic log rotation or cleanup

### 12. Theme/Display Injection
- Terminal escape sequences in AI responses could potentially manipulate the terminal
- Glamour (markdown renderer) sanitizes some content but may not catch all escape sequences

## Positive Security Practices

- **Permission system exists and works**: Unlike many AI coding tools that auto-approve everything
- **Parameterized SQL**: sqlc generates parameterized queries, preventing SQL injection
- **Context-based cancellation**: All operations can be cancelled, preventing runaway processes
- **Banned command list**: At least some attempt to prevent network exfiltration
- **Read-only tools don't require permissions**: Correct risk assessment
- **Session-scoped permissions**: Permissions don't persist across sessions
- **Single binary**: No dependency chain to compromise (except at build time)
- **MIT license code is auditable**: Full source available

## Recommendations

1. **Add directory scoping for file operations**: Restrict writes to project directory and explicit allowlisted paths
2. **Add network isolation for bash tool**: Use a sandbox or network namespace to prevent unauthorized network access
3. **Add URL allowlist for fetch tool**: Prevent SSRF in corporate environments
4. **Encrypt sensitive config values**: At minimum, warn users not to store API keys in config files
5. **Add prompt injection warnings**: For non-interactive mode with untrusted input
6. **Implement MCP server sandboxing**: Run MCP servers with restricted permissions
7. **Add database encryption option**: For sensitive conversation history
8. **Sanitize terminal escape sequences**: In AI response rendering
9. **Add audit logging**: Log all tool executions with timestamps for security review
10. **Consider read-only permission for sensitive files**: Even `view` could expose secrets if the AI reads `.env` files
