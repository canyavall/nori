# Frontend TUI Knowledge TODO

Based on detected tech stack (Solid.js, OpenTUI, Vite, TailwindCSS), consider creating:

## Solid.js Patterns
- [ ] Reactive state management (signals, stores, context)
- [ ] Component composition patterns
- [ ] Event handling in TUI context
- [ ] Performance optimization (fine-grained reactivity)

## OpenTUI Patterns (@opentui/solid v0.1.56)
- [ ] Terminal UI component patterns
- [ ] Layout strategies (terminal constraints)
- [ ] Input handling (keyboard, mouse)
- [ ] Rendering optimization

## TUI-Specific Components
- [ ] Interactive prompts (@clack/prompts)
- [ ] Progress indicators (opentui-spinner)
- [ ] List rendering (solid-list, virtua for virtualization)
- [ ] Split panes and navigation

## Styling
- [ ] TailwindCSS in terminal context
- [ ] Color schemes and themes
- [ ] Responsive terminal layouts

## State Management
- [ ] Event bus patterns (@solid-primitives/event-bus)
- [ ] Session state synchronization
- [ ] Real-time updates (streaming responses)

## Build & Development
- [ ] Vite configuration for TUI
- [ ] HMR in terminal context
- [ ] Build optimization (bundle size)

## Multi-Client Architecture
- [ ] CLI interface patterns
- [ ] TUI interface patterns
- [ ] Server mode (HTTP API)
- [ ] Web console (browser-based)

## Reference Files
- `base_repositories/opencode-fork/packages/opencode/src/` (CLI implementation)
- `base_repositories/opencode-fork/packages/console/` (Web console - Solid.js)
- Package deps: @opentui/solid, solid-js, @solidjs/router

## To create knowledge:
```bash
/knowledge-create patterns/frontend-tui <topic-name>
```

Example:
```bash
/knowledge-create patterns/frontend-tui solidjs-tui-patterns
```
