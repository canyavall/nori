# OpenCode - Code Quality Assessment

## Overview

The codebase is **well-structured and idiomatic Go** with clean package boundaries. It demonstrates strong software engineering patterns (interfaces, dependency injection, generics) while maintaining readability. The project has ~90 Go source files across a well-organized `internal/` package structure.

## Strengths

### Architecture
- Clean package separation with `internal/` enforcing encapsulation
- Service layer pattern with interfaces for all domain services (session, message, permission, history)
- Generic pub/sub broker (`Broker[T]`) used consistently across all services
- Provider factory pattern with functional options for clean extensibility
- Tool interface (`BaseTool`) makes adding new tools trivial
- Agent loop is clean and handles tool execution, cancellation, and summarization elegantly
- sqlc-generated queries eliminate hand-written SQL marshaling

### Type Safety & Go Idioms
- Proper use of Go interfaces throughout (Provider, Service, BaseTool)
- Context-based cancellation with `context.WithCancel`
- Thread-safe concurrent access via `sync.Map` for active requests
- Proper error wrapping with `fmt.Errorf("...: %w", err)`
- Generic types for pub/sub (`Broker[T]`, `Event[T]`)
- Functional options pattern for provider configuration

### Bubble Tea TUI
- Proper Elm architecture implementation (Model/Update/View)
- Dialog overlay system with proper keyboard focus management
- Multiple page support with lazy initialization
- Theme system with 10+ built-in themes and runtime switching
- Status bar with timed info/warn/error messages

### Code Organization
- One concern per file (e.g., each tool is its own file)
- Each provider implementation is its own file
- Each model provider's model definitions are separate files
- Clear separation between `llm/` (AI), `tui/` (UI), `db/` (storage), `lsp/` (language servers)

### Testing
- sqlc ensures query correctness at compile time
- testify used for assertions
- Some test files present (prompt_test.go, ls_test.go, theme_test.go, custom_commands_test.go)
- Mock provider placeholder in models (ProviderMock, though not yet implemented)

## Weaknesses & Issues

### Incomplete Features
- **Mock provider**: `ProviderMock` panics with "not implemented" -- no test mocking available
- **Tool use delta**: Commented out in agent.go with TODO about how to handle streaming tool input
- **Some models commented out**: Gemini 2.5 Pro and Gemini 2.0 Flash are commented out in models.go

### Error Handling Gaps
- `agent.TrackUsage` errors are returned but could fail silently in some paths
- `finishMessage` ignores the error from `messages.Update`
- Some `slog` calls in config validation use `fmt.Printf` instead of logging
- Copilot monkey-patch code is commented out but left in place

### Code Smells
- **Large TUI model**: `tui.go` is very large (~600+ lines) with many boolean flags for dialog visibility (showPermissions, showHelp, showQuit, showSessionDialog, showCommandDialog, showModelDialog, showInitDialog, showFilepicker, showThemeDialog, showMultiArgumentsDialog, isCompacting). This could benefit from a dialog manager abstraction.
- **Config validation is complex**: `config.go` has extensive provider fallback logic (~500+ lines) that chains through all providers. This is functional but fragile.
- **Provider precedence is hardcoded**: The order of provider auto-detection (Copilot > Anthropic > OpenAI > Gemini > ...) is repeated in multiple places.
- **Bash tool banned commands**: The banned command list is hardcoded and may miss variations or aliases.

### Test Coverage
- Limited test files visible (4 test files found)
- No integration tests for the agent loop
- No TUI component tests (Bubble Tea testing is possible but not implemented)
- No end-to-end tests
- No test coverage for provider implementations

### Documentation
- Good README with comprehensive feature documentation
- No GoDoc comments on exported types in many files
- No architecture documentation (design docs, ADRs)
- Custom command format documented only in README, not in code

## Metrics

| Metric | Value |
|--------|-------|
| Go source files | ~90 |
| Package count | ~20 |
| AI provider implementations | 8 (+ 2 via OpenAI reuse) |
| Built-in tools | 12 |
| TUI themes | 10+ |
| Dialog overlays | 11 |
| Database tables | 3 |
| Database migrations | 2 |
| Test files | 4 |
| Direct dependencies | ~30 |
| Indirect dependencies | ~70 |
| Supported model count | 50+ |
| Custom AI providers | 10+ |

## Technical Debt Summary

| Item | Severity | Effort |
|------|----------|--------|
| Implement mock provider for testing | Medium | Hours |
| Extract dialog manager from tui.go | Medium | Days |
| Add GoDoc comments to exported types | Low | Days |
| Add integration tests for agent loop | Medium | Days |
| Implement tool use delta streaming | Low | Hours |
| Clean up config provider fallback chains | Medium | Days |
| Add TUI component tests | Medium | Days-Weeks |
| Remove commented-out code (monkey patch, models) | Low | Minutes |
| Add structured error types instead of string errors | Low | Days |
| Add comprehensive E2E tests | High | Weeks |
