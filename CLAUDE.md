# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Nori** project: a comprehensive research repository analyzing OpenCode and Claude Code architectures with the goal of replicating Claude Code features in the open-source OpenCode project. The repository contains detailed comparisons, implementation roadmaps, and a modified OpenCode fork optimized exclusively for Anthropic/Claude models.

**Key Goal**: Understand and document all architectural differences between OpenCode and Claude Code, then implement Claude Code's best features in OpenCode while maintaining its open-source advantages.

## Repository Structure

```
nori/
├── opencode-fork/              # Modified OpenCode (Claude-only)
│   ├── packages/
│   │   ├── opencode/          # Main OpenCode package
│   │   │   ├── src/
│   │   │   │   ├── agent/     # Agent system
│   │   │   │   ├── session/   # Session management, compaction
│   │   │   │   ├── tool/      # 19 tools (bash, read, write, etc.)
│   │   │   │   ├── config/    # Configuration system
│   │   │   │   ├── lsp/       # LSP integration
│   │   │   │   └── mcp/       # MCP support
│   │   │   └── package.json
│   │   ├── sdk/               # SDK packages
│   │   ├── plugin/            # Plugin system
│   │   └── console/           # Web console
│   ├── ARCHITECTURE.md        # OpenCode architecture
│   ├── FEATURES.md            # Feature inventory
│   └── CHANGES.md             # Modifications made
│
├── Comparison Documents (270+ pages total):
│   ├── claude-code-architecture-guide.md  # Master architecture guide
│   ├── hooks-comparison.md                # 4 events vs 10 events
│   ├── skills-comparison.md               # Plugin vs native
│   ├── agents-comparison.md               # Agent architectures
│   ├── commands-comparison.md             # Slash commands
│   ├── tools-comparison.md                # 19 vs 15+ tools
│   └── context-management-comparison.md   # Context strategies
│
├── Implementation Planning:
│   ├── MASTER-ROADMAP.md      # 4-phase implementation plan
│   ├── GAP-ANALYSIS.md        # Knowledge gaps assessment
│   └── README.md              # Project overview
│
└── Supporting Files:
    ├── START-HERE.md          # Quick start guide
    ├── QUICK-START-TOMORROW.md
    └── anthropic-repos/       # Anthropic SDK and resources
```

## Development Commands

### OpenCode Fork Development

```bash
# Navigate to opencode-fork
cd opencode-fork

# Install dependencies (using Bun)
bun install

# Development mode
bun run dev

# Type checking
bun run typecheck

# Run tests
bun test

# Build
bun run build
```

### Project Workspace Commands

The root package.json uses Bun workspaces:

```bash
# Install all workspace dependencies
bun install

# Run type checking across all packages
bun turbo typecheck

# Development (runs opencode package)
bun run dev
```

### Working with OpenCode

```bash
# Start interactive session
opencode

# Launch TUI (Terminal UI)
opencode tui

# Run server mode
opencode serve

# List available models
opencode models

# Manage agents
opencode agent list
opencode agent generate "description"

# Session management
opencode session list
opencode session export <id>
```

## High-Level Architecture

### OpenCode Architecture (Anthropic-Only Fork)

**Core Philosophy**: Client-server architecture with multiple frontends (CLI, TUI, Server) interacting with Claude models exclusively.

#### Key Systems

1. **Agent System** (`packages/opencode/src/agent/`)
   - 4 built-in agents: general-purpose, code, build, plan
   - Custom agent support via markdown definitions
   - Agent selection based on task complexity
   - Sub-agent spawning for parallel work

2. **Session Management** (`packages/opencode/src/session/`)
   - Session state: messages, context, metadata
   - Context compaction when nearing token limits
   - Summary generation to preserve information
   - Message processing pipeline
   - Status tracking and error recovery

3. **Tool System** (`packages/opencode/src/tool/`)
   - **19 tools total**: Bash, Read, Write, Edit, Glob, Grep, WebFetch, WebSearch, LSP tools, etc.
   - Registry-based tool management
   - Permission system with wildcard patterns
   - Tool result streaming
   - Background execution support

4. **Configuration** (`packages/opencode/src/config/`)
   - Hierarchical config: env vars → global → project → custom
   - Markdown-based config files
   - API key management
   - Model and agent preferences
   - Hook and plugin configuration

5. **LSP Integration** (`packages/opencode/src/lsp/`)
   - 21+ language servers
   - Automatic installation
   - Hover, diagnostics, completion support
   - Language detection

6. **MCP Support** (`packages/opencode/src/mcp/`)
   - Model Context Protocol integration
   - Server management
   - Tool exposure from MCP servers

### Context Management Strategy

**Critical Understanding**: OpenCode uses reactive compaction while Claude Code uses proactive multi-layered strategy.

- **Token Tracking**: Monitor context window usage
- **Compaction Triggers**: When >90% of context window filled
- **Summary Generation**: Structured 5-section summaries (location: `session/summary.ts`)
- **CLAUDE.md**: Project-specific guidance file (planned enhancement)

**Key Files**:
- `session/compaction.ts` - Compaction logic
- `session/summary.ts` - Summary generation
- `session/system.ts` - System prompt construction

## Implementation Priorities

Based on MASTER-ROADMAP.md, features are prioritized in 4 phases:

### Phase 1: Quick Wins (1-2 weeks)
- Structured summary format (improve context preservation)
- Configurable token threshold
- Command argument hints
- PDF reading support
- Namespace UI improvements

### Phase 2: Core Features (3-6 weeks)
- Expand hooks to 10 lifecycle events
- Advanced grep capabilities (-A/-B/-C flags)
- Active CLAUDE.md updates
- Tool restrictions per command
- NotebookEdit tool
- Enhanced error handling

### Phase 3: Advanced Features (5-8 weeks)
- Shell script hook support
- Background bash execution
- Enhanced checkpoint system
- SlashCommand tool
- Native skills integration
- LLM-based hooks

### Phase 4: Polish & Release (2-3 weeks)
- Documentation
- Migration tools
- Performance optimization
- Release preparation

## Key Code Patterns

### Agent Definitions

Agents are defined in markdown with YAML frontmatter:

```markdown
---
name: "my-agent"
description: "Custom agent for specific tasks"
model: "claude-sonnet-4"
tools: ["Read", "Write", "Bash"]
---

System prompt goes here...
```

Location: `.opencode/agents/`

### Tool Implementation Pattern

Tools follow this structure (see `tool/tool.ts`):

```typescript
export const MyTool = tool({
  name: "MyTool",
  description: "Tool description for LLM",
  parameters: z.object({
    param1: z.string().describe("Parameter description"),
  }),
  execute: async (args, context) => {
    // Implementation
    return result
  }
})
```

### Session Processing Flow

1. User input → `session/processor.ts`
2. System prompt construction → `session/system.ts`
3. API call with tools → Provider SDK
4. Tool execution → `tool/registry.ts`
5. Response streaming → Client
6. Context check → `session/compaction.ts`
7. Summary if needed → `session/summary.ts`

## Important Architectural Decisions

### Why Anthropic-Only?

The fork removes 15+ AI providers to:
- Simplify codebase (550+ lines removed)
- Optimize for Claude-specific features
- Reduce dependencies (7 packages removed)
- Focus on best-in-class integration

### Multi-Client Architecture

OpenCode supports:
- **CLI**: Direct command-line interaction
- **TUI**: Rich terminal UI (Solid.js + OpenTUI)
- **Server**: HTTP API for programmatic access
- **Web**: Browser-based interface

All clients interact with the same core session/agent system.

### Plugin System

Location: `packages/plugin/`

Plugins can:
- Add custom tools
- Register hooks (4 events: init, message, tool, complete)
- Extend configuration
- Add commands

## Testing Strategy

### Current Test Locations

```bash
# Main package tests
cd opencode-fork/packages/opencode
bun test

# Specific test files
bun test test/agent.test.ts
bun test test/tool.test.ts
```

### Test Priorities (from GAP-ANALYSIS.md)

High priority validation tests:
1. Hook invocation timing and data format
2. Skill activation triggers
3. Agent selection criteria
4. Tool permission enforcement
5. Context compaction behavior

## Critical Files to Understand

When working on enhancements, these are the most important files:

### Session & Context Management
- `packages/opencode/src/session/index.ts` - Main session orchestration
- `packages/opencode/src/session/processor.ts` - Message processing pipeline
- `packages/opencode/src/session/compaction.ts` - Context compaction logic
- `packages/opencode/src/session/summary.ts` - Summary generation

### Tool System
- `packages/opencode/src/tool/registry.ts` - Tool registration and execution
- `packages/opencode/src/tool/bash.ts` - Shell command execution
- `packages/opencode/src/tool/read.ts` - File reading
- `packages/opencode/src/tool/write.ts` - File writing
- `packages/opencode/src/tool/edit.ts` - File editing with fuzzy matching

### Agent System
- `packages/opencode/src/agent/agent.ts` - Agent definitions and selection

### Configuration
- `packages/opencode/src/config/config.ts` - Config parsing and merging

## Common Development Patterns

### Adding a New Tool

1. Create tool file: `src/tool/my-tool.ts`
2. Define schema with Zod
3. Implement execute function
4. Add to registry: `src/tool/registry.ts`
5. Add prompt: `src/tool/my-tool.txt`
6. Test thoroughly

### Modifying Context Compaction

1. Review current logic: `session/compaction.ts`
2. Update threshold or algorithm
3. Test with long conversations
4. Validate summary quality: `session/summary.ts`
5. Check performance impact

### Adding Hook Events

1. Define event type in plugin system
2. Update hook registration
3. Add invocation points in session processor
4. Document event data format
5. Add tests for hook timing

## Build System

**Package Manager**: Bun (v1.3.3+)

**Workspaces**: Turbo for monorepo management

**Build Process**:
1. TypeScript compilation
2. Bundle generation for different targets
3. Binary generation (CLI)
4. Asset copying

**Key Build Files**:
- `package.json` - Workspace configuration
- `turbo.json` - Turbo pipeline config
- `tsconfig.json` - TypeScript config
- `packages/opencode/script/build.ts` - Build script

## Performance Considerations

### Context Window Management
- Default compaction at 90% capacity
- Summary generation overhead: ~1-2s
- Trade-off: speed vs context retention

### Tool Execution
- Most tools are synchronous
- Bash commands can be long-running
- WebFetch has caching (15-minute TTL)
- LSP operations are async

### Session Storage
- Sessions stored in `~/.opencode/sessions/`
- JSON format with ULID-based IDs
- Export/import for migration

## Security Considerations

### API Key Management
- Never commit API keys
- Use environment variables: `ANTHROPIC_API_KEY`
- Global config: `~/.opencode/config.json` (user-only permissions)
- Validate keys before use

### Tool Permissions
- Wildcard pattern matching for file access
- Bash command restrictions possible
- Plugin sandboxing (limited)

### File Access
- Respect `.gitignore` patterns
- Permission checks before reading/writing
- Path validation to prevent traversal attacks

## Documentation Conventions

When creating or updating documentation:

1. **Architecture Changes**: Update `opencode-fork/ARCHITECTURE.md`
2. **Feature Changes**: Update `opencode-fork/FEATURES.md`
3. **API Changes**: Update comparison documents
4. **Breaking Changes**: Document in `opencode-fork/CHANGES.md`
5. **Roadmap Updates**: Update `MASTER-ROADMAP.md` and `GAP-ANALYSIS.md`

## Comparison Documents Usage

The comparison documents are comprehensive references (270+ pages):

- **When adding hooks**: Reference `hooks-comparison.md`
- **When adding skills**: Reference `skills-comparison.md`
- **When working on agents**: Reference `agents-comparison.md`
- **When adding commands**: Reference `commands-comparison.md`
- **When modifying tools**: Reference `tools-comparison.md`
- **When changing context management**: Reference `context-management-comparison.md`

These documents compare OpenCode vs Claude Code implementations and provide implementation guidance.

## Project Status

**Current State**: Research and planning complete, ready for implementation

**Confidence Levels** (from GAP-ANALYSIS.md):
- Commands: 85% (can implement immediately)
- Tools: 80% (signatures known, internal logic to refine)
- Hooks: 75% (architecture clear, edge cases unknown)
- Agents: 70% (structure clear, runtime behavior to validate)
- Context: 65% (strategy known, wU2 algorithm unclear)
- Skills: 60% (concept clear, activation logic unknown)

**Next Steps**: Begin Phase 1 implementation (Quick Wins)

## Tips for Working in This Codebase

1. **Read comparison docs first**: Before implementing features, check if there's a comparison document analyzing it
2. **Update confidence levels**: When you learn something new, update `GAP-ANALYSIS.md`
3. **Follow the roadmap**: Use `MASTER-ROADMAP.md` for prioritization
4. **Test incrementally**: Don't batch changes, test each enhancement
5. **Document unknowns**: If you encounter unclear behavior, document it
6. **Reference OpenCode patterns**: Existing OpenCode code provides good patterns to follow
7. **Think about migration**: Consider backward compatibility for existing users

## Common Gotchas

1. **Bun vs Node**: This project uses Bun, not Node.js. Some APIs differ.
2. **Workspace dependencies**: Use `workspace:*` for internal packages
3. **Path handling**: Always use absolute paths in tools, not relative
4. **Context limits**: Claude models have different context windows (200K for Sonnet 4)
5. **Tool streaming**: Some tools stream results, others return complete results
6. **Hook timing**: Hooks fire at specific lifecycle points, test carefully
7. **Config precedence**: Remember the hierarchy: env → global → project → custom

## Resources

- **OpenCode Original**: https://github.com/sst/opencode
- **Anthropic SDK**: `anthropic-repos/anthropic-sdk-typescript/`
- **Comparison Docs**: Root directory (*.md files)
- **Architecture Guide**: `claude-code-architecture-guide.md` (60KB, comprehensive)
- **Implementation Plan**: `MASTER-ROADMAP.md` (38KB, detailed)

## License

- **OpenCode**: MIT License (SST/Jay)
- **This Project**: Educational analysis and open-source development
- **Claude Code**: Proprietary (Anthropic) - not being reverse engineered, only analyzed via public documentation
