# OpenCode - Use Cases

## Primary Use Cases

### 1. Interactive AI-Assisted Coding (TUI)
**Who**: Developers who work primarily in the terminal and want AI coding assistance without leaving it.
**What**: Launch a full TUI that provides chat-based interaction with an LLM that can read, write, edit, and execute code in your project directory.
**Value**: No context-switching to a browser or IDE plugin. The TUI provides rich rendering of markdown, code blocks, and tool outputs directly in the terminal. Persistent sessions mean you can pick up where you left off.

### 2. Multi-Provider Model Flexibility
**Who**: Developers who want to use different AI models or switch between providers based on task complexity, cost, or availability.
**What**: Configure multiple AI providers and switch between them mid-session. Use cheaper models (GPT-4o-mini, Gemini Flash) for simple tasks and more capable models (Claude Sonnet, GPT-4.1) for complex refactoring.
**Examples**:
- Use GitHub Copilot (free) for routine tasks, switch to Anthropic Claude for complex architecture decisions
- Use Groq (fast inference) for quick questions, OpenAI O3 for reasoning-heavy problems
- Use self-hosted models for sensitive codebases that cannot leave the network
**Value**: Cost optimization, provider redundancy, and ability to use the best model for each task type.

### 3. Automated Coding Tasks (Non-Interactive Mode)
**Who**: DevOps engineers, CI/CD pipelines, automation scripts.
**What**: Pass a prompt via CLI flag (`opencode -p "prompt"`) and get results to stdout. Supports JSON output format for parsing.
**Examples**:
- `opencode -p "Add error handling to all database functions in internal/db/"` in a pre-commit hook
- `opencode -p "Generate unit tests for the new parser module" -f json` in CI
- `opencode -p "Explain what changed in the last 5 commits" -q` in a daily report script
**Value**: Programmable AI coding without requiring interactive use. Auto-approves all permissions for unattended operation.

### 4. Code Exploration & Understanding
**Who**: Developers onboarding to a new codebase or investigating unfamiliar code.
**What**: Ask the AI to explore, explain, and navigate code using its built-in tools (grep, glob, view, ls, sourcegraph).
**Value**: The AI can search across files, read specific sections, check diagnostics via LSP, and provide contextual explanations. Sourcegraph integration allows searching public repos for usage examples.

### 5. LSP-Enhanced Code Quality
**Who**: Developers who want AI assistance that is aware of compile-time errors and linting issues.
**What**: Configure language servers (gopls, typescript-language-server, etc.) and the AI can query diagnostics to identify and fix errors.
**Value**: The AI does not just generate code blindly -- it can check its own output against real compiler/linter diagnostics and fix issues proactively.

### 6. MCP Server Integration
**Who**: Developers using custom tools or services they want to expose to the AI.
**What**: Configure MCP (Model Context Protocol) servers via stdio or SSE transport. The AI can discover and use tools from these servers alongside built-in tools.
**Value**: Extends the AI's capabilities with custom domain-specific tools without modifying OpenCode's source code.

### 7. Custom Command Workflows
**Who**: Teams or developers with repetitive AI-assisted workflows.
**What**: Create markdown files in `~/.config/opencode/commands/` or `.opencode/commands/` that define reusable prompts with named arguments.
**Examples**:
- `user:prime-context` -- reads key files and README to prime the AI with project context
- `project:review-pr` -- fetches a PR by number and reviews it
- `user:git:commit` -- analyzes diffs and writes conventional commit messages
**Value**: Codifies team workflows as shareable, version-controllable command files.

## Secondary / Emergent Use Cases

### 8. Context Window Management (Auto-Compact)
OpenCode monitors token usage and automatically summarizes the conversation when it reaches 95% of the model's context window. This creates a new session continuation with the summary, allowing unbounded conversations without manual intervention.

### 9. Project Memory (OpenCode.md)
The AI can create and maintain an `OpenCode.md` file that stores frequently used commands, code style preferences, and codebase structure notes. This persists across sessions and is automatically loaded as context.

### 10. Multi-Language Development
With LSP support for any language server and provider-agnostic model selection, OpenCode works equally well for Go, TypeScript, Python, Rust, or any language with LSP support.

### 11. Remote Pair Programming
In a tmux/screen session, developers can share their OpenCode session with colleagues who can observe or interact with the AI assistant in real-time.

## Limitations / Not Suited For

- **Not an IDE plugin**: Standalone terminal app, not integrated into VS Code/JetBrains
- **No GUI/web interface**: Terminal-only (the successor Crush also remains terminal-based)
- **No built-in collaboration**: Single-user tool, no shared sessions across users
- **No checkpointing/rollback**: Unlike Opcode, there is no built-in checkpoint or timeline system (relies on git for versioning)
- **No usage analytics dashboard**: Cost tracking is per-session only, no aggregate views
- **No image generation**: Can process image attachments but cannot generate images
- **Archived project**: No longer receiving updates (development continues as Crush)
- **Pre-1.0 stability**: API and config format may have changed across versions
