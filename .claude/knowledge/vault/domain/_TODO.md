# Domain Knowledge TODO

This repository is a **research and development project**, not a business application.

## Domain Context
- **Primary domain**: AI coding assistant architecture research
- **Secondary domain**: OpenCode development tool enhancement
- **Business logic**: Minimal (general-purpose development tool)

## Potential Domain Knowledge

If you need to document domain-specific concepts:

### AI Assistant Patterns
- [ ] Coding assistant workflows (code generation, debugging, refactoring)
- [ ] Multi-agent collaboration patterns
- [ ] Context-aware code assistance

### Developer Experience
- [ ] CLI/TUI interaction patterns
- [ ] Session-based workflows
- [ ] Permission and safety boundaries

### Tool Ecosystem
- [ ] LSP integration patterns (language-specific assistance)
- [ ] MCP server integration (external tool providers)
- [ ] Plugin development workflows

## Notes

Since this is not a business-heavy application (no approval workflows, complex domain rules, or industry-specific regulations), most "domain knowledge" will actually be **technical patterns** and should live in `patterns/` folders instead.

Only create knowledge here if you discover genuinely domain-specific concepts that don't fit in:
- `patterns/agent-system/` - Agent-related patterns
- `patterns/tool-development/` - Tool creation patterns
- `patterns/session-management/` - Session and context patterns
- `patterns/frontend-tui/` - UI/UX patterns
- `research/` - Comparative analysis and findings

## To create knowledge (if needed):
```bash
/knowledge-create domain <topic-name>
```

Example:
```bash
/knowledge-create domain ai-assistant-safety-patterns
```
