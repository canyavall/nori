# Flow: Configuration & Project Setup

> How OpenCode discovers, loads, and merges configuration across multiple layers.

---

## Configuration Precedence (Low → High)

```
1. Remote .well-known/opencode    (organization defaults)
        ▼
2. Global: ~/.config/opencode/opencode.json(c)
        ▼
3. OPENCODE_CONFIG env var        (custom path)
        ▼
4. Project: opencode.json(c)      (project root)
        ▼
5. .opencode/opencode.json(c)     (.opencode directories)
        ▼
6. OPENCODE_CONFIG_CONTENT env    (inline JSON)
        ▼
7. Managed: /etc/opencode/        (enterprise, highest priority)
```

Each layer merges into the previous. Arrays concatenate (plugins, instructions). Objects deep-merge.

---

## Project Discovery

### Step 1: Find Worktree
```
1. Look for .git directory (walk up from CWD)
2. If found → worktree = git root
3. If not → worktree = CWD
```

### Step 2: Calculate Project ID
```
1. Run: git rev-list --max-parents=0 HEAD
2. Hash the root commit → project ID
3. Cache in .git/opencode file
4. Fallback: "global" for non-git projects
```

### Step 3: Initialize Project
```
1. Create/update project record in SQLite
2. Load configuration (7 layers)
3. Start LSP clients for detected languages
4. Start MCP servers from config
5. Start file watcher (chokidar)
6. Detect VCS (git)
```

---

## Configuration Schema

```jsonc
{
  // JSON Schema reference
  "$schema": "https://opencode.ai/schema.json",

  // Agent definitions (override or add)
  "agent": {
    "my-agent": {
      "name": "My Agent",
      "description": "Custom agent for my workflow",
      "mode": "primary",
      "permission": [
        { "permission": "bash", "pattern": "npm *", "action": "allow" },
        { "permission": "edit", "pattern": "*.env", "action": "deny" },
        { "permission": "*", "pattern": "*", "action": "ask" }
      ],
      "model": {
        "modelID": "claude-sonnet-4-20250514",
        "providerID": "anthropic"
      },
      "prompt": "You are a specialized agent for...",
      "temperature": 0.7,
      "steps": 50
    }
  },

  // System prompt additions (appended to all agents)
  "instructions": [
    "Always use TypeScript",
    "Follow the project style guide",
    "Run tests before committing"
  ],

  // Provider configuration
  "provider": {
    "anthropic": {
      "options": { "apiKey": "sk-ant-..." }
    },
    "openai-compatible": {
      "options": {
        "baseURL": "http://localhost:11434/v1",
        "name": "Ollama",
        "models": {
          "llama3.2": {
            "name": "Llama 3.2",
            "cost": { "input": 0, "output": 0 }
          }
        }
      }
    }
  },

  // Permission overrides
  "permission": {
    "bash": {
      "allow": ["npm test", "npm run build"],
      "deny": ["rm -rf *"]
    }
  },

  // MCP servers
  "mcp": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem"],
      "env": {}
    }
  },

  // Plugins
  "plugin": [
    "https://example.com/plugin.ts",
    "./local-plugin.ts"
  ],

  // Skills
  "skills": {
    "paths": [".opencode/skills", "~/.opencode/skills"],
    "urls": ["https://example.com/skill.md"]
  },

  // Commands
  "command": {
    "test": { "description": "Run tests", "command": "npm test" },
    "deploy": { "description": "Deploy", "command": "./deploy.sh" }
  },

  // Experimental features
  "experimental": {
    "chat": { "system": { "transform": true } }
  }
}
```

---

## Auto-Discovery Directories

```
.opencode/
├── opencode.json(c)   Config file
├── agents/            Agent definition files
├── commands/          Custom command files
├── plugins/           Plugin source files
└── skills/            Skill definitions (SKILL.md)

~/.opencode/           Global user-level equivalents
~/.config/opencode/    XDG-compliant global config
```

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `OPENCODE_CONFIG` | Custom config file path |
| `OPENCODE_CONFIG_CONTENT` | Inline JSON config |
| `OPENCODE_SERVER_PASSWORD` | Server HTTP Basic Auth password |
| `OPENCODE_SERVER_USERNAME` | Server HTTP Basic Auth username |
| `OPENCODE_ENABLE_EXA` | Enable Exa-based search tools |
| `OPENCODE_ENABLE_QUESTION_TOOL` | Enable question tool in headless mode |
| `OPENCODE_DISABLE_SHARE` | Disable session sharing |
| `OPENCODE_INSTALL_DIR` | Custom install directory |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `OPENAI_API_KEY` | OpenAI API key |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI key |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | AWS Bedrock |
| `AZURE_OPENAI_ENDPOINT` | Azure endpoint |
| ... | (each provider has its own env vars) |

---

## Config File Watching

```
1. Load config file
2. Set up file watcher (chokidar)
3. On file change:
   a. Re-parse config
   b. Re-validate with Zod
   c. Re-merge layers
   d. Bus.publish(Config.Event.Updated)
   e. Reload affected systems (tools, agents, MCP)
```
