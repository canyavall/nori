# OpenCode - Technology Stack

## Core Language & Runtime

| Technology | Version | Purpose |
|------------|---------|---------|
| **Go** | 1.24.0 | Primary language, single binary compilation |

## TUI Framework (Charmbracelet Ecosystem)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Bubble Tea** | v1.3.5 | TUI framework (Elm architecture: Model/Update/View) |
| **Bubbles** | v0.21.0 | Pre-built TUI components (text input, viewport, list, etc.) |
| **Lip Gloss** | v1.1.0 | Terminal styling (colors, borders, padding, alignment) |
| **Glamour** | v0.9.1 | Markdown rendering in terminal |
| **BubbleZone** | latest | Mouse zone support for Bubble Tea |
| **charmbracelet/x/ansi** | v0.8.0 | ANSI escape code handling |
| **charmbracelet/colorprofile** | v0.2.3 | Terminal color profile detection |
| **charmbracelet/x/cellbuf** | v0.0.13 | Cell buffer for terminal rendering |
| **charmbracelet/x/term** | v0.2.1 | Terminal capabilities detection |

## AI Provider SDKs

| Technology | Version | Purpose |
|------------|---------|---------|
| **anthropic-sdk-go** | v1.4.0 | Official Anthropic Go SDK (Claude models) |
| **openai-go** | v0.1.0-beta.2 | Official OpenAI Go SDK (GPT models, also used for Groq, OpenRouter, Azure, xAI, Local) |
| **google.golang.org/genai** | v1.3.0 | Google Generative AI SDK (Gemini models) |
| **aws-sdk-go-v2** | v1.30.3 | AWS SDK (Bedrock for Claude) |
| **azure-sdk-for-go/azidentity** | v1.7.0 | Azure AD authentication (Azure OpenAI) |

## Database

| Technology | Version | Purpose |
|------------|---------|---------|
| **go-sqlite3** (ncruces) | v0.25.0 | Pure Go SQLite (via Wasm, no CGo required) |
| **goose** | v3.24.2 | Database migration management |
| **tetratelabs/wazero** | v1.9.0 | WebAssembly runtime (used by ncruces/go-sqlite3) |

## MCP (Model Context Protocol)

| Technology | Version | Purpose |
|------------|---------|---------|
| **mcp-go** | v0.17.0 | MCP client implementation (stdio + SSE transport) |
| **gorilla/websocket** | v1.5.3 | WebSocket support for MCP SSE transport |

## CLI & Configuration

| Technology | Version | Purpose |
|------------|---------|---------|
| **cobra** | v1.9.1 | CLI framework (commands, flags, help) |
| **viper** | v1.20.0 | Configuration management (JSON files, env vars, defaults) |

## Code Processing & Display

| Technology | Version | Purpose |
|------------|---------|---------|
| **chroma** | v2.15.0 | Syntax highlighting for code blocks |
| **go-diff** (sergi) | v1.3.2 | Diff generation for file changes |
| **go-udiff** | v0.2.0 | Unified diff format handling |
| **html-to-markdown** | v1.6.0 | Convert fetched HTML to markdown (fetch tool) |
| **goquery** | v1.9.2 | HTML DOM parsing (used by fetch tool) |
| **goldmark** | v1.7.8 | Markdown parsing (used by Glamour) |
| **goldmark-emoji** | v1.0.5 | Emoji support in markdown |
| **catppuccin/go** | v0.3.0 | Catppuccin color palette for themes |

## File System & Utilities

| Technology | Version | Purpose |
|------------|---------|---------|
| **fsnotify** | v1.8.0 | File system watcher (LSP file notifications) |
| **doublestar** | v4.8.1 | Glob pattern matching with ** support |
| **google/uuid** | v1.6.0 | UUID generation for sessions, messages, permissions |
| **lithammer/fuzzysearch** | v1.1.8 | Fuzzy string matching (command dialog, model search) |
| **lucasb-eyer/go-colorful** | v1.2.0 | Color manipulation for themes |
| **disintegration/imaging** | v1.6.2 | Image processing (for image attachments in TUI) |

## Testing

| Technology | Version | Purpose |
|------------|---------|---------|
| **testify** | v1.10.0 | Test assertions and mocking |

## Build & Dev Tools

| Tool | Purpose |
|------|---------|
| **Go build** | Single binary compilation |
| **GoReleaser** | Multi-platform release builds (`.goreleaser.yml`) |
| **GitHub Actions** | CI/CD (build + release workflows) |
| **sqlc** | SQL query code generation from `.sql` files |
| **Homebrew tap** | macOS/Linux package distribution |
| **AUR package** | Arch Linux distribution |
| **Install script** | Bash install script for direct download |

## Data Storage

| Store | Technology | Location |
|-------|-----------|----------|
| Sessions | SQLite | `.opencode/opencode.db` |
| Messages | SQLite | `.opencode/opencode.db` |
| Files (change tracking) | SQLite | `.opencode/opencode.db` |
| Configuration | JSON (Viper) | `~/.opencode.json` or `./.opencode.json` |
| Custom commands | Markdown files | `~/.config/opencode/commands/` or `.opencode/commands/` |
| Debug logs | Text files | `.opencode/debug.log` |

## Platforms Supported

| Platform | Status | Distribution |
|----------|--------|--------------|
| macOS (Intel + Apple Silicon) | Supported | Homebrew, install script, go install |
| Linux (x86_64, arm64) | Supported | Homebrew, AUR, install script, go install |
| Windows | Supported | go install, GoReleaser builds |
| Any platform with Go | Supported | `go install` or build from source |

## Key Architectural Dependencies

```
Bubble Tea (TUI)
  |
  +-- Lip Gloss (styling)
  +-- Bubbles (components)
  +-- Glamour (markdown)
  +-- BubbleZone (mouse)

Provider SDKs (AI)
  |
  +-- anthropic-sdk-go (Anthropic)
  +-- openai-go (OpenAI, Groq, OpenRouter, Azure, xAI, Local)
  +-- genai (Google Gemini, VertexAI)
  +-- aws-sdk-go-v2 (Bedrock)

Storage
  |
  +-- ncruces/go-sqlite3 (pure Go, Wasm-based)
  +-- goose (migrations)

MCP
  |
  +-- mcp-go (client)
  +-- gorilla/websocket (transport)
```

## Notable Dependency Choices

1. **ncruces/go-sqlite3 instead of mattn/go-sqlite3**: Uses a pure-Go SQLite implementation via WebAssembly (wazero), avoiding CGo dependency. This simplifies cross-compilation and produces truly static binaries, but may have performance implications for very large databases.

2. **Official provider SDKs**: Uses official Go SDKs from Anthropic and OpenAI rather than generic HTTP clients. The OpenAI SDK is reused for Groq, OpenRouter, xAI, and local providers by simply changing the base URL.

3. **Viper for configuration**: Provides multi-source config (files, env vars, defaults) with merge semantics. Config files are searched in multiple locations with local overriding global.

4. **sqlc for query generation**: SQL queries are written in `.sql` files and compiled to type-safe Go code, avoiding both raw SQL strings and heavy ORMs.
