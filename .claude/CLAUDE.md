# CLAUDE.md

Essential guidance for working with the Nori project.

## Project Context

**Nori**: Knowledge-first AI collaboration platform for cross-functional product teams. Desktop Electron app providing visual knowledge management and role-based AI personalities for Engineers, PMs, Product Owners, Architects, CISO, and SRE.

### What Makes Nori Different

**vs Claude Code / OpenCode:**
- Desktop GUI (not terminal-based) accessible to non-engineers
- Visual knowledge browser (browse, search, edit packages)
- Role-based AI personalities (PO, Architect, Engineer, CISO, SRE)
- Workspace-vault separation (knowledge reusable across repos)

**Competitive Moat**: Curated knowledge packages compound over time. Competitors can copy code, but cannot copy thousands of domain-specific knowledge files.

### Product Vision

**For individuals**: Use Claude AI with role-appropriate personality and visible knowledge

**For teams**: Build institutional AI knowledge that compounds over time, accessible to entire product organization

**Target users**: Product teams (50-500 people) where 40% engineers, 60% other roles

### Core Architecture

**Electron Desktop App**:
- **Main Process**: Electron window management (app/src/main/)
- **Preload**: Context bridge for secure IPC (app/src/preload/)
- **Renderer**: React frontend (app/src/renderer/)

**Express Backend** (app/src/server/):
- HTTP REST API (auth, sessions, projects, knowledge)
- WebSocket chat server (AI streaming)
- SQLite database (~/.nori/nori.db)

**Key Concepts**:
- **Workspace**: Local folder with code (~/work/project/)
- **Vault**: Named knowledge collection outside workspace (~/vaults/nestle/)
- **nori.json**: Workspace config (vault reference, hooks, tools)
- **Workspace-Vault Separation**: 1 workspace → 1 vault, N workspaces → 1 vault

### Repository Structure

```
nori/
├── app/                        # Electron app (THE active codebase)
│   ├── src/
│   │   ├── main/              # Electron main process
│   │   ├── preload/           # Context bridge
│   │   ├── renderer/          # React frontend
│   │   └── server/            # Express backend + WebSocket
│   ├── package.json
│   └── tsconfig.json
│
├── .claude/                    # Claude Code configuration
│   ├── CLAUDE.md              # This file
│   ├── knowledge/             # Knowledge vault
│   ├── commands/              # Custom commands
│   └── settings.json          # Settings
│
├── base_repositories/          # Research (OpenCode, Claude Code plugins)
├── research/                   # Architecture analysis docs
└── requests_tracker/           # Feature tracking
```

### Quick Start

```bash
# Install dependencies (first time)
cd app && npm install

# Rebuild native modules (first time, or after Electron update)
cd app && npx electron-rebuild

# Start development server
/serve

# App will open on http://localhost:3000 (backend)
# Vite dev server on http://localhost:5173 (hot reload)
```

### Development Workflow

**Running the app**: Use `/serve` command
- Compiles TypeScript (main process)
- Starts Express backend (auto port: 3000-3009)
- Launches Electron window
- Starts Vite dev server (hot reload)

**Making changes**:
- Frontend changes → hot reload automatically
- Backend changes → restart `/serve`
- Preload changes → restart `/serve` (requires rebuild)

**Database**: SQLite at `~/.nori/nori.db` (auto-created on first run)

**OAuth**: Claude authentication via `console.anthropic.com` (Settings → OAuth Flow)

## Professional Objectivity

**CRITICAL MANDATE**: Your PRIMARY responsibility is technical accuracy and truth, NOT making the user feel validated. Be brutally honest, challenge bad ideas, and push back on unnecessary complexity.

### Core Principles

1. **Truth over validation**: Disagree when the user is wrong. Don't soften criticism with praise sandwiches.
2. **Question everything**: Bad assumptions, unclear requirements, over-engineering, scope creep.
3. **No fake agreement**: Never say "you're right" or "great idea" unless you genuinely believe it.
4. **Challenge authority**: The user/ticket/senior engineer can be wrong. Point it out.
5. **Simplicity bias**: Always prefer the simpler solution. Complexity needs extraordinary justification.

### What Critical Feedback Looks Like

**DO say:**

- "This is over-engineered for the problem."
- "This will cause performance issues because..."
- "This duplicates existing functionality at [location]."
- "The ticket is unclear about X. We need clarification before proceeding."
- "This abstraction is premature. We should wait for more use cases."
- "This test doesn't actually test anything meaningful."
- "This refactor makes the code harder to understand, not easier."

**DON'T say:**

- "Great idea! Let me implement that..." (when it's not a great idea)
- "You're absolutely right..." (unless they actually are)
- "This looks good, but maybe we could..." (say it's bad if it's bad)
- "I understand your concern..." (if the concern is unfounded, say so)

### Push Back Hard On

- **Unnecessary abstractions**: "We need a factory pattern" → No, a simple function is fine.
- **Premature optimization**: "Let's cache this" → Show me the performance problem first.
- **Resume-driven development**: "Let's use GraphQL" → Why? REST works fine here.
- **Scope creep**: "While we're at it..." → No. Separate ticket.
- **Fake requirements**: "We might need..." → We don't build for hypotheticals.
- **Copy-paste solutions**: "I saw this pattern online" → Is it appropriate HERE?
- **Cargo cult practices**: "Best practices say..." → Best for what context?

### Examples of Critical Responses

**Bad ticket:**

> "This ticket says 'improve performance' with no metrics, benchmarks, or specific problems. I can't plan this. What SPECIFICALLY is slow? What's the target improvement? How do we measure success?"

**Over-engineered solution:**

> "You're proposing a pub/sub system for communication between 2 components. Just pass a callback. We don't need message queues for this."

**Unnecessary refactor:**

> "Moving this code to a shared library 'because we might reuse it' is premature. It's used in ONE place. Wait until we have a SECOND use case."

**Unclear requirements:**

> "The ticket doesn't specify error handling, edge cases, or what happens when the API is down. I need answers before writing code, or I'll make wrong assumptions."

**Bad code in PR:**

> "This function is 200 lines with 5 levels of nesting. It's unmaintainable. Break it into smaller functions with clear names."

**Pointless test:**

> "This test mocks everything and asserts the mock was called. It doesn't test any real behavior. Delete it or make it test something actual."

### Balance

Be critical of IDEAS and CODE, not PEOPLE. Say "this approach has problems" not "you don't understand." Explain WHY something is wrong, don't just say it's wrong.

**Remember**: Respectful honesty serves the user better than polite agreement that leads to bad code.

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

3. **Bash tool**: ONLY for git, npm, electron-rebuild, curl, docker - NOT file operations

**Token savings**:

- ❌ Read entire file → 2-5k tokens
- ✅ `get_symbols_overview` → 300-500 tokens (90% savings)
- ✅ `find_symbol` → 100-200 tokens (95% savings)

**Exception**: Only use Read for code files when about to Edit/Write them.

## Workflow Structure

**Locations**:

- `.claude/epics/[project-id]/` - Feature epics (requirements.md, research.md, tech-design.md, plan.md)
- `.claude/knowledge/` - Modular knowledge packages (not auto-loaded)
- `.claude/knowledge/knowledge.json` - Knowledge catalog
- `.claude/commands/` - User commands
- `.claude/temp/` - Temporary files

## Feature Development Workflow

**Commands:**

1. **`/epic [prompt|id]`** command:

- Loads relevant knowledge based on ticket/prompt analysis
- Creates requirements.md (business check, WHAT/WHY)
- Does research in-memory (technical investigation using Serena MCP)
- Does tech-design in-memory (high-level architecture decisions)
- Creates plan.md (implementation tasks breakdown)
- Fast-track: Only 2 docs (requirements + plan), research/design kept in context

2. **`/implement <id>`** command:

- Loads relevant knowledge based on plan tasks
- Executes tasks ONE AT A TIME from plan.md
- STOPS after each task for user testing (testing checkpoint)
- Writes all code/tests (unit & integration ONLY, NOT e2e)
- Updates task statuses in plan.md
- Uses Haiku for 92% cost savings

3. **`/serve`** command:

- Starts Electron development server
- Compiles TypeScript, launches Express + Vite + Electron
- Opens app window with dev tools

## Knowledge System

Knowledge packages are modular coding standards and patterns. Commands load knowledge using command profiles and task-type tags for precise discovery.

### How It Works

**Two-step loading:**

1. **Always-load**: Core knowledge (standards, architecture)
2. **Task-specific**: Domain knowledge by task type (routing, testing, forms)

**See**: `.claude/knowledge/vault/ai/knowledge/knowledge-loading-system.md` for complete workflow.

### Knowledge Loading

**Commands use profiles + task types:**

```bash
# /epic command example (routing task)
node .claude/knowledge/scripts/knowledge-search.mjs \
  --command-profile plan \
  --task-type routing_implementation \
  --agent-name epic-command \
  --agent-id "epic-0001-$(date +%s)"

# /implement command example (routing task)
node .claude/knowledge/scripts/knowledge-search.mjs \
  --command-profile implementation \
  --task-type routing_implementation \
  --agent-name implementation-command \
  --agent-id "implementation-epic-0001-$(date +%s)"

# Returns: core packages + routing packages
```

**Available task types by profile:**

- **plan profile**: routing_implementation, component_implementation, test_fixing, api_implementation, form_implementation
- **implementation profile**: Same + data_table_implementation, state_management

**Note**: Command profiles are configuration presets in `knowledge.json` that define which packages to load. The `/epic` command uses the `plan` profile and the `/implement` command uses the `implementation` profile for their knowledge loading configuration.

**Full list**: See `knowledge.json` → `command_profiles.[profile].always_load`

### Manual Search (Optional)

**For ad-hoc discovery:**

```bash
# Search by tags
node .claude/knowledge/scripts/knowledge-search.mjs --tags react,testing

# Search by text
node .claude/knowledge/scripts/knowledge-search.mjs --text "API integration"

# Filter by category
node .claude/knowledge/scripts/knowledge-search.mjs --category core --tags routing
```

**Token savings**:

- ❌ Read knowledge.json → 2,000-3,000 tokens
- ✅ Use knowledge-search.mjs → 0 tokens (bash call)

### 0-Results Investigation Protocol

**CRITICAL**: When knowledge search returns 0 results, **NEVER accept immediately**. Always investigate.

**Protocol when getting 0 results:**

1. **Remove --text filter** (if used) - text is AND-ed with tags, very restrictive
   ```bash
   # Original (0 results)
   --tags business,documentation --text "risk module"

   # Try without text
   --tags business,documentation
   ```

2. **Reduce to single tag** - try with just the most relevant tag
   ```bash
   --tags business
   ```

3. **Manually verify** - check if package exists in knowledge.json
   ```bash
   grep "business-knowledge" .claude/knowledge/knowledge.json
   ```

4. **Only then conclude** - after investigation, you can say "no relevant knowledge exists"

**Why this matters**: 0 results usually means overly restrictive search, not missing knowledge. The script now warns when returning 0 results with debugging suggestions.

**Common causes of false 0 results:**

- Combining `--text` with tags (AND logic is too restrictive)
- Using domain-specific terms in `--text` that aren't in descriptions
- Too many tags (though tags use OR, it can still over-filter)

**See**: `.claude/knowledge/instructions/knowledge-loading-guide.md` for complete reference.

### Tracking

**Automatic tracking** to `.claude/knowledge/tracker/tracker.jsonl`:

```
[path] | [agent-name] | [agent-id] | [timestamp]
```

Enabled when `--agent-name` and `--agent-id` provided.

## Knowledge Gap Detection

Implementation-agent checks confidence before implementing:

- ✅ High: Have knowledge with clear patterns → proceed
- ⚠️ Medium: No specific knowledge → ask user
- ❌ Low: Uncertain → ask user

Then propose creating knowledge package if information is reusable.

## Commands

**Feature development:**

- `/epic [prompt|id]` - Planning workflow (requirements + plan, research/design in-memory) [Sonnet]
- `/implement <id>` - Execute implementation tasks from plan [Haiku - 92% cost savings]
- `/task "description"` - Standalone quick fix (implement + document after-action report) [Sonnet]
- `/next` - Discover what you were working on (scans epics, tasks, git, files) [Haiku]
- `/serve` - Start Electron development server [No model]

**Model strategy:** Sonnet for planning/decisions, Haiku for execution. Override available: "Use Sonnet for TASK-003"

**Knowledge system:**

- `/knowledge-validate` - Validate knowledge vault structure and quality
- `/knowledge-port [source-vault-path]` - Migrate knowledge vault from old structure to new infrastructure/patterns/domain layout
- `/knowledge-init` - Initialize knowledge vault structure with tech stack detection
- `/knowledge-extract <source-file-or-url>` - Extract knowledge from existing documentation or conversations
- `/knowledge-create [description or --from-content <file>]` - Create new knowledge package with AI-guided categorization

## Workflow Setup

**Recommended flow**:

1. Run `/epic "description"` or `/epic epic-id`
   - Creates epic-XXXX folder (auto-incremental)
   - Generates requirements.md and plan.md
   - Does research and tech-design in-memory (no docs, faster)

2. Review generated requirements.md and plan.md

3. Run `/implement epic-XXXX` to execute the plan
   - Haiku executes tasks one at a time
   - Testing checkpoint after each task
   - 92% cost savings vs Sonnet

## Working With Epics (Natural Language)

**Epic tasks and subtasks use natural conversation, not command parameters:**

**Add task to epic:**
```
"Add a task to epic-0001: Fix button styling in header"
```

**Add subtask to current task:**
```
"Create a subtask for TASK-003: Fix regex validation bug"
```

**Work on specific task:**
```
"Implement TASK-003 from epic-0001"
```

**Why natural language?** Claude has conversation context. No need for command parameters or state tracking.

## Nori-Specific Development

### Architecture Principles

**Workspace-Vault Separation**: Core Nori concept
- Workspace (code context) ≠ Vault (knowledge storage)
- 1 workspace → 1 vault (configured in nori.json)
- N workspaces → 1 vault (vault reuse encouraged)
- Vaults are named (nestle, xeenaa, family) and stored outside workspace

**Configuration**:
- `nori.json` in workspace root (NOT `.claude/settings.json`)
- Global vault registry: `~/.nori/config.json`

**See**: `.claude/knowledge/vault/nori/architecture/workspace-vault-separation.md`

### Tech Stack

**Frontend**: React 18, TypeScript, Vite
**Backend**: Express, WebSocket, better-sqlite3
**Desktop**: Electron 28, context isolation enabled
**AI**: Anthropic Claude SDK (claude-sonnet-4)
**Dev**: Hot reload (Vite), TypeScript watch mode

### Testing

**OAuth Flow**:
1. Settings → OAuth Flow
2. Click "Start OAuth Flow" → opens system browser
3. Authorize on console.anthropic.com
4. Copy authorization code (format: `code#state`)
5. Paste code → Complete OAuth
6. API key saved to `~/.nori/auth.json`

**Database**: SQLite at `~/.nori/nori.db`
- Auto-created on first run
- Schema migrations handled by server init
- Use `sqlite3 ~/.nori/nori.db` to inspect

### Common Issues

**Electron window blank**: Check backend startup in terminal logs
**OAuth link doesn't open**: Use `window.nori.openExternal()` (not `window.open()`)
**Database locked**: Close all Nori instances, remove `~/.nori/nori.db-wal`
**TypeScript errors**: Run `npm run typecheck` in app/
**Native module errors**: Run `npx electron-rebuild` in app/

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
