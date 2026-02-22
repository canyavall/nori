# OpenCode - Architecture

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Clients                                    │
│                                                                   │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌────────┐  ┌───────┐│
│  │   TUI   │  │  Web App │  │ Desktop │  │ VS Code│  │ Slack ││
│  │(OpenTUI)│  │ (SolidJS)│  │ (Tauri) │  │  Ext.  │  │  Bot  ││
│  └────┬────┘  └────┬─────┘  └────┬────┘  └───┬────┘  └───┬───┘│
│       │             │             │            │           │     │
└───────┼─────────────┼─────────────┼────────────┼───────────┼─────┘
        │             │             │            │           │
        └─────────────┼─────────────┼────────────┼───────────┘
                      │ HTTP REST + SSE Events   │
                      ▼                          ▼
        ┌──────────────────────────────────────────┐
        │        OpenCode Server (Hono/Bun)         │
        │                                           │
        │  ┌─────────────┐  ┌────────────────────┐ │
        │  │ REST Routes  │  │  SSE Event Stream  │ │
        │  └──────┬──────┘  └────────┬───────────┘ │
        │         │                   │             │
        │  ┌──────▼──────────────────▼────────┐    │
        │  │         Event Bus (pub/sub)       │    │
        │  └──────┬──────┬──────┬──────┬──────┘    │
        │         │      │      │      │            │
        │  ┌──────▼┐ ┌───▼──┐ ┌▼────┐ ┌▼─────────┐│
        │  │Session│ │Tools │ │Agent│ │Permission ││
        │  │Manager│ │System│ │Exec │ │  System   ││
        │  └──┬───┘ └──┬───┘ └──┬──┘ └───────────┘│
        │     │         │        │                  │
        │  ┌──▼─────────▼────────▼───────────────┐ │
        │  │        LLM Stream Processor          │ │
        │  │     (Vercel AI SDK streamText)        │ │
        │  └──┬──────┬──────┬──────┬─────────────┘ │
        │     │      │      │      │                │
        └─────┼──────┼──────┼──────┼────────────────┘
              │      │      │      │
     ┌────────▼┐ ┌───▼──┐ ┌▼────┐ ┌▼──────────┐
     │  SQLite │ │ LSP  │ │ MCP │ │AI Provider │
     │(Drizzle)│ │Clients│ │Srvrs│ │(19+ APIs) │
     └─────────┘ └──────┘ └─────┘ └───────────┘
```

## Monorepo Structure

```
opencode/
├── packages/
│   ├── opencode/        # Core: CLI, server, tools, agents, LLM, DB
│   ├── app/             # Shared web UI (SolidJS)
│   ├── ui/              # Component library (SolidJS + Kobalte)
│   ├── desktop/         # Tauri desktop wrapper
│   ├── web/             # Public website (Astro + Starlight)
│   ├── sdk/js/          # TypeScript SDK (generated from OpenAPI)
│   ├── plugin/          # Plugin system (@opencode-ai/plugin)
│   ├── enterprise/      # Cloud collaboration (SolidStart)
│   ├── console/         # Admin dashboard + billing
│   │   ├── app/         # Console UI (SolidStart)
│   │   ├── core/        # DB schema + business logic
│   │   ├── function/    # Serverless functions
│   │   └── mail/        # Email templates
│   ├── function/        # Cloudflare Workers API
│   ├── containers/      # CI Docker images
│   ├── slack/           # Slack bot integration
│   ├── docs/            # Documentation content
│   └── util/            # Shared utilities
├── sdks/vscode/         # VS Code extension
├── infra/               # SST infrastructure (Cloudflare, PlanetScale, Stripe)
├── github/              # GitHub Actions + workflows
├── script/              # Build scripts
├── specs/               # Design documents
└── nix/                 # NixOS packaging
```

## Server Routes

```
/global              Global state
/auth/:providerID    Provider authentication (PUT/DELETE)
/project             Project management
/pty                 Pseudo-terminal sessions
/config              Configuration
/experimental        Experimental features
/session             Session CRUD + messaging
/permission          Permission management
/question            User question prompts
/provider            AI provider listing
/file                File operations
/mcp                 MCP server management
/tui                 TUI-specific endpoints
/instance/dispose    Cleanup
/path                System paths
/vcs                 Version control info
/command             Available commands
/log                 Logging
/agent               Agent listing
/skill               Skill listing
/lsp                 LSP status
/formatter           Formatter status
/event               SSE event stream (heartbeat every 10s)
```

## Database Schema (Drizzle ORM + SQLite)

```sql
-- Core tables
session          -- Session metadata (title, summary, permissions, timestamps)
message          -- Messages in sessions (JSON-serialized data)
part             -- Message parts: text, tool calls, snapshots, diffs, files
todo             -- Task tracking per session
permission       -- Project-level permission overrides
project          -- Project metadata
session_share    -- Share links for sessions
control_account  -- Admin/control settings

-- Pragmas (performance)
journal_mode = WAL
synchronous = NORMAL
busy_timeout = 5000
cache_size = -64000 (64MB)
foreign_keys = ON
```

## Event Bus Architecture

```
Publisher → Bus.publish(EventDef, payload)
                    │
                    ▼
            Event Bus (in-memory)
                    │
        ┌───────────┼──────────────┐
        ▼           ▼              ▼
   Subscribers   SSE Stream    Global Bus
   (in-process)  (HTTP clients)  (cross-process IPC)
```

**Key Events**: session.created, session.updated, session.diff, permission.asked, permission.replied, mcp.tools.changed, lsp.diagnostics, server.heartbeat

## Permission Model

```
Rules evaluated in order:
  Rule { permission: "bash", pattern: "rm *", action: "deny" }
  Rule { permission: "edit", pattern: "*.env", action: "ask" }
  Rule { permission: "read", pattern: "*", action: "allow" }

Actions:
  allow  → Execute immediately
  deny   → Reject with DeniedError
  ask    → Suspend, emit event, wait for user reply (once/always/reject)
```

## Configuration Precedence (Low → High)

```
1. Remote .well-known/opencode (organization defaults)
2. Global config (~/.config/opencode/opencode.json)
3. OPENCODE_CONFIG env var
4. Project config (opencode.json in project root)
5. .opencode/ directories
6. OPENCODE_CONFIG_CONTENT env var
7. Managed config (enterprise: /etc/opencode/)
```

## Multi-Provider Abstraction

```
Provider.Info {
  id, name, api: { id, url }
  models: Record<modelID, Provider.Model>
}

Provider.Model {
  id, name, providerID
  cost: { input, output }  // per 1M tokens
  capabilities: { temperature, topP, streaming, vision, caching }
}

┌─────────────────────────────────────────┐
│         Vercel AI SDK (streamText)       │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌────────┐ │
│  │Claude│ │ GPT  │ │Gemini│ │Bedrock │ │
│  │      │ │      │ │      │ │        │ │
│  └──────┘ └──────┘ └──────┘ └────────┘ │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌────────┐ │
│  │OpenR.│ │ Groq │ │Mistal│ │ +12    │ │
│  │      │ │      │ │      │ │  more  │ │
│  └──────┘ └──────┘ └──────┘ └────────┘ │
└─────────────────────────────────────────┘
```
