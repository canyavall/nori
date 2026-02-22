# Opcode - Security Assessment

## Critical Issues

### 1. `--dangerously-skip-permissions` Flag (CRITICAL)
**All Claude executions bypass Claude's built-in safety checks.** This flag is used in both desktop and web modes.

```rust
// Both desktop and web mode use this:
["--dangerously-skip-permissions"]
```

- Claude Code's permission system exists to prevent unauthorized file writes, destructive commands, and network access
- Opcode bypasses ALL of these protections
- Any agent or prompt can read/write any file, execute any command, make any network request
- **Risk**: A malicious or poorly-written agent could destroy files, exfiltrate data, or compromise the system

### 2. Web Server - No Authentication (CRITICAL)
The web server mode has zero authentication:
- Anyone on the local network can access the full API
- No token, password, or session management
- CORS allows any origin
- Direct access to Claude execution, file system, database

### 3. Raw SQL Execution Exposed (HIGH)
The `storage_execute_sql` Tauri command allows arbitrary SQL execution from the frontend:
- Could be exploited if there's any XSS or injection vector
- `storage_reset_database` can wipe all agent data
- No role-based access control

### 4. Web Mode Session Isolation Broken (HIGH)
Multiple concurrent web sessions interfere with each other:
- Events dispatched globally instead of per-session
- Output from one session appears in another
- Could leak sensitive information between users/sessions

## Medium Issues

### 5. Process Management
- PIDs stored but not validated before kill attempts
- No resource limits on subprocess output accumulation (memory risk)
- No timeout on subprocess output reading (hanging process risk)

### 6. Proxy Credentials in Plaintext
- HTTP/HTTPS proxy settings (potentially including passwords) stored unencrypted in SQLite
- No at-rest encryption for sensitive settings

### 7. MCP Server Execution
- Executes arbitrary MCP server processes without sandboxing
- Environment variables passed through without filtering
- No capability restrictions on spawned MCP processes

### 8. Content Security Policy Gaps
- `unsafe-eval` allowed for scripts (needed for PostHog but widens attack surface)
- PostHog endpoints whitelisted, creating a data exfiltration channel

## Low Issues

### 9. Path Encoding Collisions
- Project path encoding (`/` to `-`) is lossy
- Different paths could map to the same encoded form
- More of a correctness issue than security

### 10. No Code Signing Verification
- Claude binary discovery doesn't verify binary integrity
- A malicious binary placed in PATH could be executed instead

## Positive Security Practices

- Parameterized SQL queries (rusqlite) - no SQL injection in normal operations
- File system scope limited to `$HOME` in Tauri capabilities
- Shell execution restricted to `claude` binary in capabilities
- PII sanitization in analytics
- Consent-required analytics
- Process isolation for agent execution
- Graceful shutdown with SIGTERM -> SIGKILL fallback
- Table name validation in storage commands

## Recommendations

1. **Remove `--dangerously-skip-permissions`** or make it opt-in per agent with clear warnings
2. **Add authentication to web server** (at minimum, a configurable token/password)
3. **Remove or restrict storage_execute_sql** from the frontend API
4. **Fix web server session isolation** before any multi-user deployment
5. **Encrypt sensitive settings** at rest (proxy credentials, custom paths)
6. **Add binary integrity checks** (checksum verification for claude binary)
7. **Restrict CORS** in web mode to specific origins
8. **Add resource limits** to process output accumulation
