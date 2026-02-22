# Opcode - Use Cases

## Primary Use Cases

### 1. Visual Claude Code Session Management
**Who**: Developers who prefer a GUI over terminal-only interaction with Claude Code.
**What**: Launch, browse, resume, and manage multiple Claude Code sessions in a tabbed interface with rich rendering of messages, code blocks, and tool outputs.
**Value**: Removes the friction of managing multiple terminal sessions, provides better message visualization, and enables session discovery across projects.

### 2. Custom Agent Automation
**Who**: Development teams or individual developers with repetitive Claude Code workflows.
**What**: Define specialized agents with custom system prompts, model choices, and permission scopes. Execute them against any project directory with one click.
**Examples**:
- **Git Commit Bot**: Analyzes diffs, writes conventional commit messages, pushes changes
- **Security Scanner**: Runs OWASP-style SAST analysis with STRIDE threat modeling
- **Unit Test Generator**: Generates tests matching codebase conventions with coverage targets
**Value**: Codifies best practices into reusable, shareable agents. Enables non-expert users to run sophisticated workflows.

### 3. Session Versioning & Checkpoints
**Who**: Developers doing complex multi-step refactoring or exploration with Claude Code.
**What**: Snapshot your project state at any point during a Claude session. Fork timelines, restore to previous states, compare diffs between checkpoints.
**Value**: Safety net for AI-assisted coding. Lets you experiment freely knowing you can revert. The branching timeline enables "what if" exploration.

### 4. API Usage Monitoring & Cost Control
**Who**: Teams or individuals concerned about Claude API costs.
**What**: Dashboard showing token usage, costs by model/project/date, with charts and export.
**Value**: Visibility into spending. Helps optimize model selection (e.g., using Sonnet instead of Opus for simple tasks).

### 5. MCP Server Management
**Who**: Developers using Model Context Protocol servers to extend Claude's capabilities.
**What**: Central UI to add, configure, test, and monitor MCP servers. Import configs from Claude Desktop.
**Value**: Simplifies MCP setup which is normally JSON file editing.

### 6. Remote/Mobile Access (Web Server Mode)
**Who**: Developers who want to access Claude Code from a phone or another device.
**What**: Run Opcode as a web server, accessible via browser on the local network.
**Value**: Enables reviewing or continuing Claude sessions from a mobile device.
**Caveat**: Currently experimental with critical issues (session isolation, process cancellation).

### 7. CLAUDE.md Editing
**Who**: Any Claude Code user who configures project-level instructions.
**What**: Built-in editor with live preview and project scanner.
**Value**: More convenient than switching to a text editor.

## Secondary / Emergent Use Cases

### 8. Agent Marketplace / Sharing
The `.opcode.json` export format and GitHub browser integration suggest a community agent sharing ecosystem. Users can publish agents to GitHub and others can import them.

### 9. Team Onboarding
Pre-configured agents (security scanner, test generator) can standardize Claude Code usage across a team without everyone needing to know the right prompts.

### 10. Development Workflow Orchestration
With custom agents and the tab system, Opcode could serve as a lightweight orchestration layer - running security scans, generating tests, and committing code in sequence.

## Limitations / Not Suited For

- **Not a replacement for Claude Code CLI**: It wraps the CLI, so the CLI must be installed
- **Not a cloud service**: Runs locally only (no multi-user server deployment)
- **Not production-ready web mode**: Web server has critical session isolation issues
- **Not IDE integration**: It's a standalone app, not a VS Code/JetBrains plugin
- **No API key management**: Relies on the Claude CLI's own authentication
