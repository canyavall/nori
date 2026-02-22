# OpenCode - Technology Stack

## Core Runtime

| Technology | Version | Purpose |
|------------|---------|---------|
| **Bun** | 1.3.9 | Runtime, package manager, bundler, test runner |
| **TypeScript** | 5.8.2 | Language (strict mode) |
| **Turbo** | 2.5.6 | Monorepo task orchestration |

## Server & API

| Technology | Version | Purpose |
|------------|---------|---------|
| **Hono** | 4.10.7 | HTTP server framework (REST + WebSocket) |
| **hono-openapi** | 1.1.2 | OpenAPI 3.1.1 documentation |
| **SSE** | - | Real-time event streaming to clients |
| **mDNS** (bonjour-service) | - | Local network server discovery |

## AI / LLM Layer

| Technology | Version | Purpose |
|------------|---------|---------|
| **Vercel AI SDK** | 5.0.124 | Unified LLM abstraction (`streamText`, tools) |
| **@ai-sdk/anthropic** | - | Claude models |
| **@ai-sdk/openai** | - | GPT models (chat + responses API) |
| **@ai-sdk/google** | - | Gemini models |
| **@ai-sdk/google-vertex** | - | Google Vertex AI |
| **@ai-sdk/azure** | - | Azure AI |
| **@ai-sdk/amazon-bedrock** | - | AWS Bedrock |
| **@ai-sdk/xai** | - | X.AI (Grok) |
| **@ai-sdk/mistral** | - | Mistral |
| **@ai-sdk/groq** | - | Groq |
| **@ai-sdk/deepinfra** | - | DeepInfra |
| **@ai-sdk/cerebras** | - | Cerebras |
| **@ai-sdk/cohere** | - | Cohere |
| **@ai-sdk/gateway** | - | Vercel Gateway |
| **@ai-sdk/togetherai** | - | Together AI |
| **@ai-sdk/perplexity** | - | Perplexity |
| **@openrouter/ai-sdk-provider** | - | OpenRouter |
| **@gitlab/gitlab-ai-provider** | - | GitLab Duo |
| **@ai-sdk/openai-compatible** | - | Custom endpoints (LiteLLM, etc.) |
| **@modelcontextprotocol/sdk** | - | MCP server/client |

## Database & Storage

| Technology | Version | Purpose |
|------------|---------|---------|
| **Drizzle ORM** | 1.0.0-beta.12 | Type-safe SQL ORM |
| **SQLite** (Bun built-in) | - | Local database (WAL mode) |
| **PlanetScale** | - | Cloud MySQL (enterprise) |
| **Cloudflare R2** | - | Object storage (enterprise) |

## Frontend Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **SolidJS** | 1.9.10 | Reactive UI framework (all surfaces) |
| **@solidjs/router** | 0.15.4 | Routing (web, desktop) |
| **@solidjs/start** | - | SSR framework (enterprise console) |
| **@kobalte/core** | 0.13.11 | Accessible headless UI primitives |
| **Tailwind CSS** | 4.1.11 | Utility-first styling |
| **Vite** | 7.1.4 | Build tool and dev server |

## TUI (Terminal UI)

| Technology | Version | Purpose |
|------------|---------|---------|
| **@opentui/solid** | 0.1.79 | SolidJS → ANSI terminal renderer (60fps) |
| **bun-pty** | - | Pseudo-terminal sessions |
| **tree-sitter** | - | Code parsing and AST |
| **web-tree-sitter** | - | WASM tree-sitter for code analysis |

## Desktop App

| Technology | Version | Purpose |
|------------|---------|---------|
| **Tauri** | 2.x | Native desktop shell (Rust + WebView) |
| **tauri-plugin-deep-link** | - | `opencode://` protocol |
| **tauri-plugin-dialog** | - | Native file/directory pickers |
| **tauri-plugin-updater** | - | Auto-updates |
| **tauri-plugin-shell** | - | Shell execution |
| **tauri-plugin-store** | - | Persistent config storage |
| **tauri-plugin-clipboard-manager** | - | Image paste |
| **ghostty-web** | - | Terminal emulator (web-based) |

## Code Intelligence

| Technology | Purpose |
|------------|---------|
| **LSP Clients** | TypeScript, Python, Go, Rust language servers |
| **ripgrep** (via tool) | Fast code search |
| **Shiki** | Syntax highlighting (3.20.0) |
| **@pierre/diffs** | Advanced diff visualization |
| **tree-sitter** | Code parsing for Bash commands |

## Validation & Schema

| Technology | Version | Purpose |
|------------|---------|---------|
| **Zod** | 4.1.8 | Runtime type validation |
| **jsonc-parser** | - | JSONC config parsing |
| **gray-matter** | - | YAML frontmatter extraction |
| **partial-json** | - | Streaming JSON parsing |

## Testing

| Technology | Version | Purpose |
|------------|---------|---------|
| **Playwright** | 1.51.0 | E2E browser testing |
| **Bun test** | built-in | Unit testing |
| **HappyDOM** | - | DOM simulation for tests |

## Enterprise / Cloud

| Technology | Purpose |
|------------|---------|
| **SST** (3.17.23) | Infrastructure as code |
| **Cloudflare Workers** | Serverless compute |
| **Stripe** | Billing and subscriptions |
| **OpenAuth** | Authentication (OAuth flows) |
| **AWS SES** | Email delivery |
| **Honeycomb** | Observability |
| **EmailOctopus** | Newsletter management |

## CLI & Utilities

| Technology | Purpose |
|------------|---------|
| **Yargs** (18.0.0) | CLI argument parsing |
| **@clack/prompts** | Interactive CLI prompts |
| **chokidar** | File system watching |
| **luxon** | Date/time handling |
| **remeda** | Functional utilities |
| **diff** (8.0.2) | Unified diff generation |
| **marked** (17.0.1) | Markdown parsing |
| **fuzzysort** | Fuzzy string matching |
| **decimal.js** | Precise number calculations |

## Distribution

| Channel | Package |
|---------|---------|
| npm | `opencode-ai` |
| Homebrew | `anomalyco/tap/opencode` or `opencode` |
| Scoop | `opencode` |
| Chocolatey | `opencode` |
| AUR | `opencode` / `opencode-bin` |
| Pacman | `opencode` |
| Nix | `nixpkgs#opencode` |
| Mise | `opencode` |
| curl install | `opencode.ai/install` |
| Desktop (DMG/EXE/AppImage) | GitHub releases |
| VS Code | Extension marketplace |
