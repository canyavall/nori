# KV - Architecture

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  Claude Code                                                      │
│                                                                   │
│  Hooks:                                                           │
│    SessionStart      → kv-onStart.ts                             │
│    UserPromptSubmit  → kv-onPrompt.ts                            │
│    PostToolUse       → kv-onTool.ts                              │
│                                                                   │
│  Skills:                                                          │
│    /kv-install, /kv-search, /kv-load, /kv-preload, /kv-create   │
└───────────┬──────────────────────────────┬───────────────────────┘
            │ hooks (stdin JSON)            │ skills (CLI)
            ▼                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  Triggers Layer                                                    │
│                                                                   │
│  hooks/                          api/                             │
│    kv-onStart.ts                   install.ts                    │
│    kv-onPrompt.ts                  search-knowledge.ts           │
│    kv-onTool.ts                    load-knowledge.ts             │
│    actions/                        preload-knowledge.ts          │
│      build-prompt-injection.ts     create-knowledge.ts           │
│      check-tool-type.ts                                          │
│      detect-vault-read.ts                                        │
│      invoke-smart-agent.ts                                       │
│      is-trivial-prompt.ts                                        │
└───────────┬──────────────────────────────────────────────────────┘
            │ delegates to features
            ▼
┌──────────────────────────────────────────────────────────────────┐
│  Features Layer                                                    │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌────────┐  ┌────────────┐ │
│  │   session/    │  │  knowledge/  │  │  role/  │  │distribution│ │
│  │              │  │              │  │        │  │            │ │
│  │ session-start│  │ index-build  │  │ inject │  │  install   │ │
│  │ create       │  │ search       │  │        │  │  workspace │ │
│  │ archive      │  │ load         │  └────────┘  │  -sync     │ │
│  │ report       │  │ preload      │              └────────────┘ │
│  └──────────────┘  │ auto-load    │                             │
│                    │ smart-agent  │                             │
│                    │ actions/     │                             │
│                    └──────────────┘                             │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  shared/                                                      │ │
│  │    shared-path-resolver.ts    (all KV paths)                 │ │
│  │    shared-config-reader.ts    (kv.json reading)              │ │
│  │    shared-child-flow-executor.ts  (subprocess execution)     │ │
│  │    shared-platform.ts         (OS detection)                 │ │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
kv/
├── types/
│   └── index.ts                          # All TypeScript type definitions
├── triggers/
│   ├── hooks/
│   │   ├── kv-onStart.ts                 # SessionStart hook entry
│   │   ├── kv-onPrompt.ts               # UserPromptSubmit hook entry
│   │   ├── kv-onTool.ts                 # PostToolUse hook entry
│   │   └── actions/
│   │       ├── build-prompt-injection.ts  # Context assembly + prompt transform
│   │       ├── check-tool-type.ts        # File operation tool detection
│   │       ├── detect-vault-read.ts      # Direct vault read detection
│   │       ├── invoke-smart-agent.ts     # Claude API semantic matching
│   │       └── is-trivial-prompt.ts      # Confirmation/trivial filter
│   ├── api/
│   │   ├── install.ts                    # /kv-install entry
│   │   ├── search-knowledge.ts           # /kv-search entry
│   │   ├── load-knowledge.ts            # /kv-load entry
│   │   ├── preload-knowledge.ts         # /kv-preload entry
│   │   └── create-knowledge.ts          # /kv-create entry
│   └── CLAUDE.md
├── features/
│   ├── session/
│   │   ├── session-start/                # Main orchestrator (8 steps)
│   │   │   ├── session-start.ts
│   │   │   ├── validate-structure.ts
│   │   │   ├── call-build-index.ts
│   │   │   ├── call-preload-knowledge.ts
│   │   │   ├── call-inject-role.ts
│   │   │   └── aggregate-context.ts
│   │   ├── create/                       # Session creation + archiving
│   │   │   ├── session-create.ts
│   │   │   └── actions/
│   │   ├── archive/                      # Session archiving (99 max)
│   │   ├── report/                       # Status report generation
│   │   └── actions/                      # State read/write, events, counters
│   ├── knowledge/
│   │   ├── knowledge-index-build/        # Vault → knowledge.json
│   │   ├── knowledge-search/            # Tag/text/category search
│   │   ├── knowledge-load/              # Manual package loading
│   │   ├── knowledge-preload/           # Config-based startup loading
│   │   ├── knowledge-auto-load/         # Pattern-triggered loading
│   │   ├── smart-agent/                 # Claude API semantic matching
│   │   ├── actions/                     # Shared: content loader, matchers, filters
│   │   └── utils/                       # Index loader, config reader, parsers
│   ├── role/
│   │   └── inject/
│   │       ├── role-inject.ts           # Main role injection
│   │       ├── actions/                 # Config, role selection, templates, formatting
│   │       └── templates/               # Role template .txt files
│   ├── distribution/
│   │   ├── install/                     # 11-step installation flow
│   │   ├── workspace-sync/             # Pull-only sync with conflict detection
│   │   └── actions/                     # Metadata management
│   └── shared/
│       └── utils/
│           ├── shared-path-resolver.ts  # All KV absolute paths
│           ├── shared-config-reader.ts  # kv.json reader + validators
│           ├── shared-child-flow-executor.ts  # Subprocess execution
│           └── shared-platform.ts       # OS detection
└── commands/                            # CLI documentation
```

## Data Flow: SessionStart

```
Claude Code
    │ stdin: { session_id, transcript_path, source }
    ▼
kv-onStart.ts
    │
    ▼
runSessionStart()
    │
    ├── 1. validateStructure()
    │      └── Auto-repair via distribution-install if broken
    │
    ├── 2. createNewSession()
    │      ├── Archive all previous sessions
    │      ├── Generate session ID (from hook or timestamp)
    │      ├── Write initial state.json
    │      └── Log session:start event
    │
    ├── 3-4. checkWorkspaceSync() [check-only mode]
    │      └── Validate sync state without modifying files
    │
    ├── 5. callBuildIndex()
    │      ├── Scan vault .md files
    │      ├── Parse frontmatter (tags, description, auto_load)
    │      ├── Derive categories from directory structure
    │      └── Write knowledge.json
    │
    ├── 6. callPreloadKnowledge()
    │      ├── Read vault.preload from kv.json
    │      ├── Filter already loaded
    │      ├── Load content (strip frontmatter)
    │      └── Update session state
    │
    ├── 7. callInjectRole()
    │      ├── Read role config (customRole > defaultRole > staff_engineer)
    │      ├── Load template .txt
    │      └── Format as <role>...</role> (prompt 0)
    │
    └── 8. aggregateSessionContext()
           ├── Session status report (box-drawing format)
           ├── Full knowledge mandate (category tree)
           ├── Preloaded knowledge content
           ├── Role template
           └── → stdout to Claude Code
```

## Data Flow: UserPromptSubmit

```
Claude Code
    │ stdin: { prompt, session_id, ... }
    ▼
kv-onPrompt.ts
    │
    ├── Check KV initialized
    ├── incrementPromptCount() → N
    │
    ├── Is reminder interval? (N % 5 == 0)
    │   └── Yes: will inject role reminder
    │
    ├── isTrivialPrompt(prompt)?
    │   ├── Empty → skip
    │   ├── > 20 chars → not trivial
    │   ├── < 2 words → skip
    │   └── Known pattern ("yes", "ok", "go ahead") → skip
    │
    ├── invokeSmartAgent(prompt) [if non-trivial]
    │   ├── Load knowledge index
    │   ├── Build category tree
    │   ├── Spawn smart-agent.mjs (claude --print)
    │   └── Returns: matched package names
    │
    ├── loadKnowledgeContent(matched packages)
    │   ├── Filter already loaded
    │   ├── Read vault .md files (strip frontmatter)
    │   └── Update session loaded_packages
    │
    ├── formatRoleOutput(template, promptCount)
    │   ├── Count=0: <role>full template</role>
    │   ├── Count%5==0: <reminder>brief</reminder>
    │   └── Else: empty
    │
    └── buildTransformedPrompt()
        ├── knowledge content + role reminder
        ├── ━━━ separator ━━━
        ├── original user prompt
        └── → stdout to Claude Code
```

## Data Flow: PostToolUse

```
Claude Code
    │ stdin: { tool_name, tool_input, tool_result }
    ▼
kv-onTool.ts
    │
    ├── isFileOperationTool(tool_name)?
    │   └── Only: Read, Edit, Write
    │
    ├── getFilePath(tool_input) → file path
    │
    ├── detectVaultRead(filePath)?
    │   └── If .md in .claude/kv/vault/ → register in loaded_packages
    │
    ├── Check autoload exceptions (glob patterns from kv.json)
    │
    ├── matchPatterns(filePath, index)
    │   ├── Match against auto_load package patterns
    │   ├── Calculate priority (specificity scoring)
    │   └── Support negation patterns (!**/test/*)
    │
    ├── filterLoadedPackages(matches) → unloaded only
    │
    ├── limitPackages(matches, 15) → top 15 by priority
    │
    ├── loadKnowledgeContent(matched packages)
    │   └── Read, strip frontmatter, format
    │
    └── Output hookSpecificOutput.additionalContext
        └── → Claude Code injects into context
```

## File System Layout (Runtime)

```
{project}/
├── .claude/
│   ├── kv.json                          # KV configuration
│   ├── kv/
│   │   ├── knowledge.json               # Generated package index
│   │   ├── vault/                        # Shared knowledge packages
│   │   │   ├── {category}/
│   │   │   │   └── {package}.md         # Knowledge content + frontmatter
│   │   │   └── ...
│   │   ├── vault-local/                  # Local-only packages (gitignored)
│   │   │   └── {category}/
│   │   │       └── {package}.md
│   │   ├── sessions/
│   │   │   ├── {id}-state.json          # Active session state
│   │   │   ├── {id}-events.jsonl        # Session event log
│   │   │   └── archive/                 # Previous sessions (max 99)
│   │   ├── system/
│   │   │   └── metadata.json            # Distribution metadata
│   │   └── .cache/
│   │       ├── workspace/               # Cloned workspace repo
│   │       ├── sync-state.json          # 3-way sync hashes
│   │       └── vault-pull-state.json    # Vault-specific sync state
│   ├── settings.json                     # Hook registrations
│   └── CLAUDE.md                         # KV docs prepended here
└── .gitignore                            # KV patterns added here
```

## Caching & Optimization Strategy

```
┌─────────────────────────────────────────────────────┐
│  Knowledge Index (knowledge.json)                     │
│  Rebuild condition: vault mtime changed               │
│  Fast path: mtime check only (~10ms vs ~120ms)       │
│                                                       │
│  Session State (state.json)                           │
│  Purpose: Deduplication of loaded packages            │
│  Write: Atomic (temp + rename)                        │
│  Scope: Per session ID (KV_SESSION_ID env var)        │
│                                                       │
│  Workspace Cache (.cache/workspace/)                  │
│  Purpose: Local copy of workspace git repo            │
│  Sync: Pull-only on session start (check) or manual   │
│                                                       │
│  Sync State (.cache/sync-state.json)                  │
│  Purpose: 3-way merge detection (local/workspace/cache)│
│  Contains: SHA-256 hashes per file                    │
│                                                       │
│  Token Optimization                                   │
│  - Max auto-load: 15 packages per tool event          │
│  - Max smart agent: 10 packages per prompt            │
│  - Trivial prompts: skip smart agent entirely         │
│  - Role injection: only every 5th prompt (80% savings)│
│  - Deduplication: loaded_packages tracked per session  │
└─────────────────────────────────────────────────────┘
```
