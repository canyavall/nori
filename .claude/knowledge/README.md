# Claude Code Knowledge System

> **Status:** Experimental v1 - Centralized knowledge base designed to be used as a git submodule across multiple repositories.

A shared knowledge vault for teams using Claude Code, containing 250+ modular knowledge packages for coding standards, patterns, and best practices.

## What This Is

This repository is designed to be integrated as a **git submodule** at `.claude/knowledge/` in your projects. It provides on-demand loading of coding standards and patterns, saving 80-90% of context tokens.

**Contents:**
- **Knowledge Vault** (`vault/`) - 250+ modular markdown packages organized by domain
- **Hooks** (`hooks/`) - Automated knowledge loading and session management
- **Scripts** (`scripts/`) - Knowledge search, tracking, and validation tools
- **Templates** (`templates/`) - Personality styles for different engineering roles
- **Tracking** (`tracker/`) - Analytics for knowledge usage and performance

---

## Prerequisites

### Serena MCP (Required)

Configure Serena MCP in your **global** Claude Code settings (`~/.claude/settings.json`):

**Option 1: Using npx (Recommended)**
```json
{
  "mcpServers": {
    "serena": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-serena"]
    }
  }
}
```

**Option 2: Using uv**
```json
{
  "mcpServers": {
    "serena": {
      "command": "uv",
      "args": [
        "tool",
        "run",
        "--from",
        "git+https://github.com/oraios/serena",
        "serena",
        "start-mcp-server",
        "--project",
        "/path/to/your/project"
      ]
    }
  }
}
```

**Verify installation:**
```bash
npx -y @modelcontextprotocol/server-serena --version
```

---

## Integration Steps

### 1. Add as Git Submodule

```bash
cd /path/to/your/repo
git submodule add <repository-url> .claude/knowledge
git submodule update --init --recursive
```

### 2. Configure Claude Code Settings

Create or merge into your project's `.claude.json` (at repository root):

```json
{
  "permissions": {
    "allow": [
      "WebSearch",
      "Bash(grep:*)",
      "Bash(find:*)",
      "Bash(tree:*)",
      "Bash(xargs:*)",
      "Bash(nx show projects:*)",
      "Read(//tmp/**)",
      "Bash(nx show:*)",
      "Bash(npx nx show projects:*)",
      "Bash(npx nx show project:*)",
      "Read(///**)",
      "Bash(nx lint:*)",
      "Bash(npx nx lint:*)",
      "Bash(npx nx typecheck:*)",
      "Bash(npx nx build:*)",
      "Bash(npx nx test:*)",
      "Bash(npm run typecheck:*)",
      "Bash(npx nx run-many:*)",
      "Bash(npm test:*)",
      "Bash(nx run:*)",
      "Bash(npx nx run:*)",
      "Bash(npx jest:*)",
      "Bash(npx nx list:*)",
      "Bash(nx test:*)",
      "Bash(npm run test:*)",
      "Bash(npm run:*)",
      "Read(//Users/**)",
      "Bash(copilot:*)",
      "Bash(node:*)",
      "Bash(npx nx serve:*)",
      "mcp__serena__read_memory",
      "mcp__serena__search_for_pattern",
      "mcp__serena__find_file",
      "mcp__serena__list_dir",
      "mcp__serena__get_symbols_overview",
      "mcp__serena__find_symbol"
    ],
    "deny": [],
    "ask": []
  },
  "enableAllProjectMcpServers": true,
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/knowledge/hooks/session-start-cleanup.mjs",
            "statusMessage": "Cleaning up session logs..."
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/knowledge/hooks/knowledge-prompt.mjs"
          },
          {
            "type": "command",
            "command": "node .claude/knowledge/hooks/personality-loader.mjs"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Read",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/knowledge/hooks/tool-execution-pre.mjs"
          }
        ]
      }
    ],
    "PostToolUse": []
  }
}
```

**Important:**
- If you already have a `.claude.json`, merge these settings with your existing ones
- Adjust `permissions.allow` based on your project's needs
- Hook paths point to `.claude/knowledge/hooks/` (the submodule location)

### 3. Add CLAUDE.md Snippet

Create or append to your project's `.claude/CLAUDE.md`:

```markdown
## Concise Communication

Answer first, elaborate if requested. For analysis questions: Quick answer (≤30 lines) → User says "extend" for inline details → User says "report" for comprehensive file in `.claude/temp/`.

## Codebase Discovery

**CRITICAL**: Use Serena MCP for ALL code exploration. Saves 80-90% tokens.

**NEVER use Read/Grep/Glob for code files** - Always use Serena MCP instead.

**CRITICAL Tool Rules**:

**NEVER use bash `grep`, `find`, `cat`, `head`, `tail`, `sed`, `awk`, `echo` for file operations**

- ❌ `grep -r "pattern"` → ✅ Use **Grep tool**
- ❌ `grep -n "pattern" file.md` → ✅ Use **Grep tool** with `-n=true`
- ❌ `find . -name "*.md"` → ✅ Use **Glob tool**
- ❌ `cat file.md` → ✅ Use **Read tool**

**Tool hierarchy**:

1. **Code files** (.ts, .tsx, .js, .jsx, .py, etc.): **Serena MCP ONLY**

   - `mcp__serena__get_symbols_overview` - Overview first (300-500 tokens)
   - `mcp__serena__find_symbol` - Specific symbol (100-200 tokens)
   - `mcp__serena__search_for_pattern` - Find patterns
   - `mcp__serena__find_file` - Locate files
   - `mcp__serena__find_referencing_symbols` - Track usage

2. **Non-code files** (.md, .json, .txt, configs): **Dedicated Tools ONLY**

   - **Grep tool** - Search content (NOT bash grep/rg)
   - **Glob tool** - Find files by pattern (NOT bash find/fd)
   - **Read tool** - Read file contents (NOT bash cat/head/tail)
   - **Edit tool** - Modify files (NOT bash sed/awk)
   - **Write tool** - Create files (NOT bash echo)

3. **Bash tool**: ONLY for git, npm, nx, curl, docker - NOT file operations

**Token savings**:

- ❌ Read entire file → 2-5k tokens
- ✅ `get_symbols_overview` → 300-500 tokens (90% savings)
- ✅ `find_symbol` → 100-200 tokens (95% savings)

**Exception**: Only use Read for code files when about to Edit/Write them.

## Workflow Structure

**Locations**:

- `.claude/knowledge/vault/` - Modular knowledge packages (250+ packages)
- `.claude/knowledge/knowledge.json` - Knowledge catalog
- `.claude/knowledge/scripts/` - Knowledge search and management scripts
- `.claude/commands/` - Slash commands
- `.claude/temp/` - Temp files for general work, session state, etc.

## Knowledge System

**Quick start**: Use role-specific commands to load knowledge packages.

**Response format required by hooks**:
- Start response with: `"Loaded: [package1], [package2], ..."`
- OR justify: `"No knowledge needed: [specific reason]"`

Commands automatically load relevant knowledge using command profiles and tag-based search.

## CLI Tools

**Pattern search**: `rg -n "pattern" --glob '!node_modules/*'`
**Find files**: `fd filename`
**Preview**: `bat -n filepath`
**JSON**: `jq '.key' file.json`

**Rule**: One CLI command > multiple tool calls

## Internet Fetching

Use `curl` via Bash:

```bash
curl -s "https://api.example.com" | jq '.data'
```
```

### 4. Set Your Personality Role (Optional)

Edit `.claude/knowledge/settings.json`:

```json
{
  "role": "fe"
}
```

**Available roles** (from `templates/personalities/`):

| Role | File | Focus Area |
|------|------|------------|
| `fe` | `fe.txt` | Frontend: React, UI components, state management |
| `be-nest` | `be-nest.txt` | Backend: NestJS, APIs, TypeORM, microservices |
| `be-java` | `be-java.txt` | Backend: Quarkus, Spring, Java patterns |
| `qa` | `qa.txt` | Testing strategies, test automation |
| `sre` | `sre.txt` | Infrastructure, AWS, Terraform, observability |
| `pm` | `pm.txt` | Product planning, requirements, roadmaps |
| `product_owner` | `product_owner.txt` | User stories, backlog management |
| `staff_engineer` | `staff_engineer.txt` | Architecture, technical leadership |
| `cthulhu` | `cthulhu.txt` | Eldritch wisdom from beyond time and space |

**Note:** `.claude/knowledge/settings.json` is gitignored (personal preference per developer).

### 5. Create Temp Directory

```bash
mkdir -p .claude/temp
```

Add to your project's `.gitignore`:

```gitignore
# Claude temporary files
.claude/temp/

# Knowledge system session data (already gitignored in submodule)
.claude/knowledge/settings.json
.claude/knowledge/tracker/*.jsonl
```

### 6. Commit Integration

```bash
git add .claude/ .gitignore
git commit -m "Add knowledge system submodule"
git push
```

---

## Architecture

### Knowledge Vault (`vault/`)

250+ modular knowledge packages organized by domain:

```
vault/
├── frontend/           # React, routing, state management, UI components, testing
├── backend/
│   ├── node/          # NestJS, API patterns, security, observability
│   └── java-quarkus/  # Quarkus patterns and standards
├── business/          # Domain-specific business logic (CAML, Risk, Trading)
├── infrastructure/    # AWS, Terraform, ArgoCD, CI/CD patterns
├── standards/         # TypeScript, API contracts, code conventions
└── tooling/          # Nx, Storybook, Vite
```

Each package is a focused markdown file with specific patterns, conventions, or standards.

### Knowledge Scripts (`scripts/`)

**`knowledge-search.mjs`** - Tag-based knowledge discovery
```bash
node .claude/knowledge/scripts/knowledge-search.mjs \
  --tags routing,react-router,testing \
  --agent-name user \
  --agent-id "prompt-$(date +%s)"
```

**`build-knowledge-index.mjs`** - Build searchable knowledge index

**`validate-frontmatter.mjs`** - Validate knowledge package structure

**`analyze-metrics.mjs`** - Analyze knowledge usage patterns

### Hooks (`hooks/`)

**`knowledge-prompt.mjs`** - Automatically prepends knowledge loading instructions to every user prompt. First prompt shows full category-tag map (~2k tokens), subsequent prompts show abbreviated reminder (~100 tokens, 90% token savings).

**`personality-loader.mjs`** - Loads personality style based on `.claude/knowledge/settings.json` role configuration.

**`session-start-cleanup.mjs`** - Resets session state on new conversations.

**`tool-execution-pre.mjs`** - Tracks tool usage and prevents direct Read on code files (enforces Serena MCP usage).

### Tracking (`tracker/`)

JSONL files tracking:
- `knowledge-tracking.jsonl` - Knowledge package loads
- `knowledge-hook-metrics.jsonl` - Hook performance metrics
- `knowledge-session-state.jsonl` - Session state (first/subsequent prompts)
- `session-events.jsonl` - Session lifecycle events

---

## How It Works

1. **User makes request** → Hooks inject knowledge loading protocol
2. **Claude investigates** → Explores codebase using Serena MCP
3. **Claude loads knowledge** → Uses `knowledge-search.mjs` with relevant tags
4. **Claude responds** → With context-aware, standards-compliant solution

---

## Key Features

**Token Optimization:**
- First prompt: ~2k tokens (full category-tag map)
- Subsequent prompts: ~100 tokens (abbreviated reminder)
- **90% token savings** after first interaction

**Serena MCP Integration:**
- Enforces efficient code exploration
- 80-90% token savings vs. reading entire files
- Automatic tool usage tracking

**Role-Based Context:**
- Personality styles influence communication and focus
- Automatic knowledge loading based on role expertise

---

## Updating the Submodule

Periodically update the knowledge submodule to get latest packages:

```bash
cd /path/to/your/repo
git submodule update --remote .claude/knowledge
git add .claude/knowledge
git commit -m "Update knowledge submodule"
git push
```

---

## Troubleshooting

### Hooks not running

**Verify paths:**
```bash
node .claude/knowledge/hooks/session-start-cleanup.mjs
```

If you get an error:
1. Ensure Node.js is installed
2. Verify paths in `.claude.json` are correct
3. Check submodule is initialized: `git submodule update --init --recursive`

### Knowledge not loading

**Verify knowledge.json exists:**
```bash
ls -la .claude/knowledge/knowledge.json
```

**Check hook logs:**
```bash
cat .claude/knowledge/tracker/*.jsonl
```

### Serena MCP not working

**Test Serena:**
```bash
npx -y @modelcontextprotocol/server-serena --version
```

**Verify MCP permissions in `.claude.json`:**
- `mcp__serena__read_memory`
- `mcp__serena__search_for_pattern`
- `mcp__serena__find_file`
- `mcp__serena__list_dir`
- `mcp__serena__get_symbols_overview`
- `mcp__serena__find_symbol`

### Submodule not updating

```bash
git submodule update --init --recursive --remote
```

---

## Contributing to Knowledge Base

This is a **shared knowledge base** - improvements benefit all teams:

1. **Add new packages**: Create markdown files in `vault/` with frontmatter
2. **Update existing packages**: Edit `vault/` files directly
3. **Validate changes**: Run validation scripts
4. **Submit changes**: PR your improvements back to this repository

All teams using this submodule benefit from shared knowledge improvements.

---

## Repository Structure

```
.claude/knowledge/           # ← This submodule
├── vault/                   # Knowledge packages
├── hooks/                   # Automation hooks
├── scripts/                 # Knowledge management scripts
├── templates/              # Personalities and templates
├── tracker/                # Usage analytics (gitignored)
├── knowledge.json          # Knowledge catalog (auto-generated, gitignored)
├── settings.json           # Personal role setting (gitignored)
├── .gitignore
└── README.md              # This file
```

---

## Why This Exists

Loading every coding standard into every conversation wastes tokens. This system loads only what's needed, when it's needed, saving 80-90% of context tokens while maintaining consistency.

---

**Warning:** This is experimental infrastructure. Use at your own risk.
