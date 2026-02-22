# Flow: Configuration System

> The complete journey of how OpenCode is configured: file format, environment variables, precedence, validation, and runtime updates.

---

## Flow Diagram

```
+------------------+     +------------------+     +------------------+
| Environment      |     | Global Config    |     | Local Config     |
| Variables        |     | ~/.opencode.json |     | ./.opencode.json |
+--------+---------+     +--------+---------+     +--------+---------+
         |                         |                        |
         +----------+--------------+------------------------+
                    |
           +--------v----------+
           |  Viper Merge      |
           |  (local overrides |
           |   global, env     |
           |   overrides all)  |
           +--------+----------+
                    |
           +--------v----------+
           | Provider Auto-    |
           | Detection         |
           +--------+----------+
                    |
           +--------v----------+
           | Validation        |
           | (models, tokens,  |
           |  providers, LSP)  |
           +--------+----------+
                    |
           +--------v----------+
           | config.Get()      |
           | (global singleton)|
           +-------------------+
```

---

## Step 1: Configuration File Format

### Full Config Structure
```json
{
  "$schema": "./opencode-schema.json",
  "data": {
    "directory": ".opencode"
  },
  "providers": {
    "anthropic": {
      "apiKey": "sk-ant-...",
      "disabled": false
    },
    "openai": {
      "apiKey": "sk-...",
      "disabled": false
    },
    "copilot": {
      "apiKey": "",
      "disabled": false
    },
    "gemini": {
      "apiKey": "...",
      "disabled": false
    },
    "groq": {
      "apiKey": "...",
      "disabled": false
    },
    "openrouter": {
      "apiKey": "...",
      "disabled": false
    },
    "xai": {
      "apiKey": "...",
      "disabled": false
    }
  },
  "agents": {
    "coder": {
      "model": "claude-4-sonnet",
      "maxTokens": 16384,
      "reasoningEffort": "medium"
    },
    "summarizer": {
      "model": "claude-4-sonnet",
      "maxTokens": 16384
    },
    "task": {
      "model": "gpt-4.1-mini",
      "maxTokens": 5000
    },
    "title": {
      "model": "gpt-4.1-mini",
      "maxTokens": 80
    }
  },
  "shell": {
    "path": "/bin/zsh",
    "args": ["-l"]
  },
  "mcpServers": {
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"],
      "env": ["API_KEY=value"]
    },
    "web-search": {
      "type": "sse",
      "url": "https://example.com/mcp",
      "headers": {
        "Authorization": "Bearer token"
      }
    }
  },
  "lsp": {
    "go": {
      "disabled": false,
      "command": "gopls"
    },
    "typescript": {
      "disabled": false,
      "command": "typescript-language-server",
      "args": ["--stdio"]
    }
  },
  "tui": {
    "theme": "catppuccin"
  },
  "contextPaths": [
    ".github/copilot-instructions.md",
    ".cursorrules",
    "CLAUDE.md",
    "opencode.md",
    "OpenCode.md"
  ],
  "autoCompact": true,
  "debug": false,
  "debugLSP": false
}
```

---

## Step 2: File Locations & Precedence

### Search Locations (via Viper)

| Priority | Location | Scope |
|----------|----------|-------|
| 1 (highest) | `./.opencode.json` | Project-local |
| 2 | `$XDG_CONFIG_HOME/opencode/.opencode.json` | User (XDG) |
| 3 | `$HOME/.config/opencode/.opencode.json` | User (default) |
| 4 (lowest) | `$HOME/.opencode.json` | User (legacy) |

### Merge Strategy
```go
// 1. Read global config
viper.ReadInConfig()

// 2. Read local config and merge
local := viper.New()
local.AddConfigPath(workingDir)
local.ReadInConfig()
viper.MergeConfigMap(local.AllSettings())
```

Local config values **override** global config values for the same keys. This allows per-project model selection, MCP servers, LSP configuration, etc.

---

## Step 3: Environment Variables

### Provider API Keys

| Environment Variable | Config Path | Provider |
|---------------------|-------------|----------|
| `ANTHROPIC_API_KEY` | `providers.anthropic.apiKey` | Anthropic |
| `OPENAI_API_KEY` | `providers.openai.apiKey` | OpenAI |
| `GEMINI_API_KEY` | `providers.gemini.apiKey` | Google Gemini |
| `GROQ_API_KEY` | `providers.groq.apiKey` | Groq |
| `OPENROUTER_API_KEY` | `providers.openrouter.apiKey` | OpenRouter |
| `XAI_API_KEY` | `providers.xai.apiKey` | xAI |
| `GITHUB_TOKEN` | `providers.copilot.apiKey` | GitHub Copilot |
| `AZURE_OPENAI_ENDPOINT` | (triggers Azure provider) | Azure OpenAI |
| `AZURE_OPENAI_API_KEY` | (optional for Entra ID) | Azure OpenAI |
| `AZURE_OPENAI_API_VERSION` | (API version) | Azure OpenAI |
| `AWS_ACCESS_KEY_ID` | (triggers Bedrock) | AWS Bedrock |
| `AWS_SECRET_ACCESS_KEY` | (triggers Bedrock) | AWS Bedrock |
| `AWS_REGION` | (triggers Bedrock) | AWS Bedrock |
| `VERTEXAI_PROJECT` | (triggers VertexAI) | Google VertexAI |
| `VERTEXAI_LOCATION` | (triggers VertexAI) | Google VertexAI |
| `LOCAL_ENDPOINT` | (triggers Local) | Self-hosted |

### Other Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `SHELL` | Default shell for bash tool | `/bin/bash` |
| `EDITOR` | External editor for Ctrl+E | (none) |
| `OPENCODE_DEV_DEBUG` | Enable file-based debug logging | `false` |

### Precedence
Environment variables take precedence over config file values (Viper default behavior with `AutomaticEnv()`).

---

## Step 4: Default Values

### Applied Automatically
```go
viper.SetDefault("data.directory", ".opencode")
viper.SetDefault("contextPaths", defaultContextPaths)
viper.SetDefault("tui.theme", "opencode")
viper.SetDefault("autoCompact", true)
viper.SetDefault("shell.path", os.Getenv("SHELL"))  // or "/bin/bash"
viper.SetDefault("shell.args", []string{"-l"})
```

### Default Context Paths
These files are automatically loaded as context if they exist:
```go
var defaultContextPaths = []string{
    ".github/copilot-instructions.md",
    ".cursorrules",
    ".cursor/rules/",
    "CLAUDE.md",
    "CLAUDE.local.md",
    "opencode.md",
    "opencode.local.md",
    "OpenCode.md",
    "OpenCode.local.md",
    "OPENCODE.md",
    "OPENCODE.local.md",
}
```

This means OpenCode automatically reads Cursor rules, Claude memory files, and its own memory files to include as context in the system prompt.

---

## Step 5: Validation

### Model Validation
For each configured agent:
1. Check if model ID exists in `SupportedModels` registry
2. If not: revert to default model for the first available provider
3. Check if the model's provider is configured and has an API key
4. If not: try to find API key from environment, or revert to default
5. Validate `maxTokens`:
   - Must be > 0
   - Must not exceed half the model's context window
   - If invalid: use model's `DefaultMaxTokens`
6. Validate `reasoningEffort`:
   - Only valid for models with `CanReason: true`
   - Must be "low", "medium", or "high"
   - Default: "medium"

### Provider Validation
- Providers with empty API keys are marked as `disabled`
- Only non-disabled providers with valid API keys are available

### LSP Validation
- LSP configs without a `command` are marked as `disabled`

### Fallback Chain
If the configured model/provider is invalid:
1. Try Copilot credentials
2. Try Anthropic credentials
3. Try OpenAI credentials
4. Try OpenRouter credentials
5. Try Gemini credentials
6. Try Groq credentials
7. Try Bedrock credentials
8. Try VertexAI credentials
9. If none available: return error

---

## Step 6: Runtime Configuration Updates

### Model Change (Ctrl+O)
```go
func UpdateAgentModel(agentName AgentName, modelID models.ModelID) error {
    // 1. Update in-memory config
    cfg.Agents[agentName] = Agent{Model: modelID, MaxTokens: ...}

    // 2. Validate the new config
    validateAgent(cfg, agentName, newAgentCfg)

    // 3. Write to config file
    updateCfgFile(func(config *Config) {
        config.Agents[agentName] = newAgentCfg
    })
}
```

### Theme Change (Ctrl+T)
```go
func UpdateTheme(themeName string) error {
    // 1. Update in-memory config
    cfg.TUI.Theme = themeName

    // 2. Write to config file
    updateCfgFile(func(config *Config) {
        config.TUI.Theme = themeName
    })
}
```

### Config File Update Pattern
```go
func updateCfgFile(updateCfg func(config *Config)) error {
    // 1. Find config file path (or create at ~/.opencode.json)
    configFile := viper.ConfigFileUsed()

    // 2. Read existing file
    data, _ := os.ReadFile(configFile)

    // 3. Parse JSON
    var userCfg *Config
    json.Unmarshal(data, &userCfg)

    // 4. Apply update function
    updateCfg(userCfg)

    // 5. Write back with pretty formatting
    updatedData, _ := json.MarshalIndent(userCfg, "", "  ")
    os.WriteFile(configFile, updatedData, 0644)
}
```

---

## Step 7: Data Directory

### Location
Default: `.opencode/` in the current working directory (configurable via `data.directory`)

### Contents
```
.opencode/
+-- opencode.db              # SQLite database (sessions, messages, files)
+-- debug.log                # Debug log (if OPENCODE_DEV_DEBUG=true)
+-- messages/                # Message dumps (if OPENCODE_DEV_DEBUG=true)
+-- commands/                # Project-level custom commands
```

### Database Initialization
```go
func Connect(dbPath string) (*sql.DB, error) {
    conn, _ := sql.Open("sqlite3", dbPath)
    // Run goose migrations (embedded in binary)
    goose.Up(conn, ".")
    return conn, nil
}
```

Migrations are embedded in the Go binary via `embed.FS`, so the database schema is automatically created/updated on first run.

---

## Step 8: Custom Commands Location

### User Commands
```
$XDG_CONFIG_HOME/opencode/commands/    (e.g., ~/.config/opencode/commands/)
$HOME/.opencode/commands/              (fallback)
```

### Project Commands
```
<working_dir>/.opencode/commands/
```

### Command Discovery
```go
func LoadCustomCommands() ([]Command, error) {
    // 1. Find user command directories
    // 2. Find project command directories
    // 3. Walk directories for .md files
    // 4. Parse each file:
    //    - Filename (without .md) = command ID
    //    - Subdirectory = namespace (e.g., git/commit.md -> git:commit)
    //    - Prefix: "user:" or "project:"
    //    - Content = command body
    // 5. Detect named arguments ($NAME patterns)
    // 6. Return as dialog.Command slice
}
```

---

## Step 9: GitHub Copilot Token Discovery

Special handling for Copilot authentication:
```go
func LoadGitHubToken() (string, error) {
    // 1. Check $GITHUB_TOKEN env var
    if token := os.Getenv("GITHUB_TOKEN"); token != "" {
        return token, nil
    }

    // 2. Check Copilot config files
    configDir := getConfigDir()  // XDG or platform-specific
    filePaths := []string{
        filepath.Join(configDir, "github-copilot", "hosts.json"),
        filepath.Join(configDir, "github-copilot", "apps.json"),
    }

    for _, filePath := range filePaths {
        data, _ := os.ReadFile(filePath)
        var config map[string]map[string]interface{}
        json.Unmarshal(data, &config)
        for key, value := range config {
            if strings.Contains(key, "github.com") {
                if oauthToken, ok := value["oauth_token"].(string); ok {
                    return oauthToken, nil
                }
            }
        }
    }
    return "", fmt.Errorf("GitHub token not found")
}
```

This allows OpenCode to use existing GitHub Copilot authentication from VS Code, the `gh` CLI, or Neovim Copilot plugins without additional configuration.

---

## Step 10: JSON Schema

OpenCode provides a JSON schema file (`opencode-schema.json`) that can be referenced in config files:
```json
{
    "$schema": "./opencode-schema.json",
    ...
}
```

This enables IDE autocompletion and validation when editing the config file. The schema is generated from the Go config struct via `cmd/schema/main.go`.
