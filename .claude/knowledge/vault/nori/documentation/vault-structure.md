---
tags:
  - meta
  - vault-structure
  - documentation
  - nori
  - knowledge-system
description: >-
  Nori knowledge vault structure documentation: vault organization (domain, infrastructure,
  patterns, meta), tech stack detection results, command profiles (plan, implementation),
  tag system, and next steps for knowledge creation
category: nori/documentation
required_knowledge: []
---
# Knowledge Vault Structure

**Generated**: 2025-12-07
**Repository**: Nori - OpenCode/Claude Code Research & Development
**Tech Stack**: TypeScript, Solid.js, Hono, Bun, Anthropic SDK, MCP Protocol

## Overview

This vault is designed for **both research and development** activities:

1. **Research**: Documenting findings from comparing OpenCode vs Claude Code architectures
2. **Development**: Implementing features in the OpenCode fork (agents, tools, hooks, session management)

Structure uses **flat organization** with shared patterns across all packages in the monorepo.

## Vault Structure

```
vault/
├── infrastructure/                # Meta-knowledge about AI system
│   ├── knowledge-system/         # 5 files
│   │   ├── create-business-knowledge.md
│   │   ├── create-knowledge.md
│   │   ├── knowledge-loading-system.md
│   │   ├── knowledge-tag-standards.md
│   │   └── knowledge-tracking.md
│   ├── hooks/                    # 1 file
│   │   └── hooks-system.md
│   └── mcp/                      # 1 file
│       └── serena/
│           └── serena-best-practices.md
│
├── patterns/                     # Technical implementation patterns
│   ├── agent-system/            # Agent architecture patterns
│   │   └── _TODO.md             # Suggested knowledge to create
│   ├── tool-development/        # Tool creation patterns
│   │   └── _TODO.md
│   ├── session-management/      # Context & session patterns
│   │   └── _TODO.md
│   └── frontend-tui/            # Solid.js + OpenTUI patterns
│       └── _TODO.md
│
├── research/                    # Comparative analysis findings
│   └── _TODO.md                 # Research topics to document
│
├── domain/                      # Business/domain-specific knowledge
│   └── _TODO.md                 # (minimal - general-purpose tool)
│
└── ai/                          # [DEPRECATED - to be removed]
    ├── hooks/                   # Duplicates infrastructure/hooks/
    ├── knowledge/               # Duplicates infrastructure/knowledge-system/
    └── mcp/                     # Duplicates infrastructure/mcp/
```

## Migration Status

✅ **Completed**:
- Created `infrastructure/` folder with migrated knowledge (7 files)
- Created `patterns/` folder structure (4 categories)
- Created `research/` folder for analysis documentation
- Created `domain/` folder (placeholder)
- Generated TODO files for all pattern categories (6 files)
- Updated `knowledge.json` with new structure and categories

⚠️ **Pending**:
- Remove old `ai/` folder (contains duplicate files)
- Populate `patterns/` folders with actual knowledge
- Document research findings in `research/`

## Categories in knowledge.json

### Infrastructure (Meta-Knowledge)
- `infrastructure/knowledge-system` - Knowledge system documentation
- `infrastructure/hooks` - Claude Code hooks automation
- `infrastructure/mcp/serena` - Serena MCP best practices

### Patterns (Technical Implementation)
- `patterns/agent-system` - Agent definitions, selection, sub-agents
- `patterns/tool-development` - Zod schemas, tool execution, permissions
- `patterns/session-management` - Context compaction, summarization
- `patterns/frontend-tui` - Solid.js, OpenTUI, terminal UI

### Research & Domain
- `research` - OpenCode vs Claude Code comparison findings
- `domain` - Domain-specific knowledge (minimal for this project)

## Tech Stack Detection Results

### Languages
✅ TypeScript (primary)
✅ JavaScript
✅ Markdown (270+ pages of documentation)

### Frontend
✅ Solid.js (v1.9.10) - Reactive UI framework
✅ TailwindCSS (v4.1.11) - Utility-first CSS
✅ Vite (v7.1.4) - Build tool
✅ OpenTUI (@opentui/solid v0.1.56) - Terminal UI components

### Backend/Runtime
✅ Hono (v4.7.10) - Lightweight web framework
✅ Bun (v1.3.3) - JavaScript runtime & package manager

### AI/ML
✅ Anthropic SDK (@ai-sdk/anthropic v2.0.50)
✅ MCP Protocol (@modelcontextprotocol/sdk v1.15.1)
✅ AI SDK (v5.0.97)

### Testing
✅ Bun test (built-in)

### Build System
✅ Turbo (v2.5.6) - Monorepo orchestration
✅ Bun workspaces - Package management

### Infrastructure
✅ AWS S3 (@aws-sdk/client-s3)
✅ SST (v3.17.23) - Deployment framework

### Monorepo
✅ 12+ packages in workspace
✅ Flat knowledge structure (shared patterns)

## Command Profiles

### /plan
**Purpose**: Creates requirements.md, research.md, tech-design.md, plan.md

**Always loads**:
- `knowledge-loading-system` - How to load knowledge
- `create-knowledge` - How to create new knowledge

**Discovery**: Searches for patterns/research knowledge via tags

### /implement
**Purpose**: Executes implementation tasks from plan.md

**Always loads**:
- `knowledge-loading-system` - How to load knowledge

**Discovery**: Searches for technical patterns via tags

### /knowledge-init
**Purpose**: Initializes vault structure

**Always loads**: None (circular dependency)

## Tag System

### Infrastructure Tags
- `ai-infrastructure`, `knowledge-system`, `hooks`, `mcp`, `serena`
- `knowledge-loading`, `knowledge-creation`, `tracking`, `metrics`
- `token-optimization`, `semantic-tools`, `automation`

### Pattern Tags
- `agent-system`, `agent-patterns`, `sub-agents`, `agent-selection`
- `tool-development`, `tool-patterns`, `zod-schemas`, `permission-system`
- `session-management`, `context-compaction`, `summarization`, `claude-md`
- `frontend`, `solidjs`, `tui`, `opentui`, `terminal-ui`

### Research Tags
- `research`, `opencode`, `claude-code`, `comparison`
- `architecture`, `gap-analysis`, `prompt-engineering`

## Next Steps

### 1. Clean Up Duplicates
```bash
# Remove old ai/ folder after verifying infrastructure/ is complete
rm -rf .claude/knowledge/vault/ai/
```

### 2. Review TODO Files
Check each TODO file for suggested knowledge to create:
- `.claude/knowledge/vault/patterns/agent-system/_TODO.md`
- `.claude/knowledge/vault/patterns/tool-development/_TODO.md`
- `.claude/knowledge/vault/patterns/session-management/_TODO.md`
- `.claude/knowledge/vault/patterns/frontend-tui/_TODO.md`
- `.claude/knowledge/vault/research/_TODO.md`

### 3. Create Knowledge Packages

Example workflow:
```bash
# Create knowledge about agent selection algorithm
/knowledge-create patterns/agent-system agent-selection-algorithm

# Create knowledge about Zod schema patterns for tools
/knowledge-create patterns/tool-development zod-schema-patterns

# Document research findings from hooks-comparison.md
/knowledge-create research hooks-system-findings
```

### 4. Test Knowledge Loading

```bash
# Search by tags
node .claude/knowledge/scripts/knowledge-search.mjs --tags agent-system,tool-development

# Search by text
node .claude/knowledge/scripts/knowledge-search.mjs --text "context compaction"

# Test command profile
node .claude/knowledge/scripts/knowledge-search.mjs --command-profile plan
```

### 5. Validate Structure

```bash
# Run validation (if script exists)
node .claude/knowledge/scripts/validate-knowledge.mjs
```

## Reference Documents

### Root-Level Comparison Documents (270+ pages)
- `hooks-comparison.md` (45 pages) - 4 events vs 10 events
- `skills-comparison.md` (40 pages) - Plugin vs native
- `agents-comparison.md` (50 pages) - Agent architectures
- `commands-comparison.md` (35 pages) - Slash commands
- `tools-comparison.md` (63 pages) - 19 vs 15+ tools
- `context-management-comparison.md` (40 pages) - Context strategies

### Implementation Planning
- `MASTER-ROADMAP.md` (38KB) - 4-phase implementation plan
- `GAP-ANALYSIS.md` (34KB) - Confidence levels and unknowns
- `claude-code-architecture-guide.md` (60KB) - Complete architecture

### OpenCode Documentation
- `base_repositories/opencode-fork/ARCHITECTURE.md` - OpenCode architecture
- `base_repositories/opencode-fork/FEATURES.md` - Feature inventory
- `base_repositories/opencode-fork/CHANGES.md` - Modifications made

### Source Code Reference
Key implementation files:
- `base_repositories/opencode-fork/packages/opencode/src/agent/agent.ts`
- `base_repositories/opencode-fork/packages/opencode/src/tool/registry.ts`
- `base_repositories/opencode-fork/packages/opencode/src/session/processor.ts`
- `base_repositories/opencode-fork/packages/opencode/src/session/compaction.ts`

## Usage Tips

### For Research Activities
1. Read comparison documents first
2. Document findings in `research/` folder
3. Tag with `research`, `comparison`, `opencode`, `claude-code`
4. Link to specific comparison doc sections

### For Development Activities
1. Identify which system you're working on (agents/tools/session/frontend)
2. Check if knowledge exists in relevant `patterns/` folder
3. If missing, create knowledge using `/knowledge-create`
4. Tag appropriately for discoverability

### For Knowledge Discovery
- Use `--tags` for broad discovery (OR logic)
- Combine tags for precision: `--tags agent-system,testing`
- Use `--text` sparingly (AND-ed with tags, very restrictive)
- Check TODO files for suggested topics

## Metrics

- **Total folders**: 9 categories
- **Existing knowledge files**: 7 (all in infrastructure/)
- **TODO files**: 6 (guiding knowledge creation)
- **Categories in knowledge.json**: 9
- **Tags in knowledge.json**: 46
- **Command profiles**: 3

## Changelog

### 2025-12-07 - Initial Vault Structure
- ✅ Created infrastructure/ folder (migrated from ai/)
- ✅ Created patterns/ folders (agent-system, tool-development, session-management, frontend-tui)
- ✅ Created research/ and domain/ folders
- ✅ Generated TODO files for all pattern categories
- ✅ Updated knowledge.json with new structure
- ✅ Documented tech stack detection results
- ⚠️ Old ai/ folder still exists (to be removed after verification)

---

**Status**: ✅ Vault initialized and ready for knowledge creation
**Next Action**: Review TODO files and start creating knowledge packages
