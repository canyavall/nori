# @nori/app

Tauri 2 desktop shell + SolidJS frontend. Distributed as packaged binary (DMG/AppImage/MSI).

## What this package does

The desktop application. Provides the UI for all Nori features: chat, vault management, knowledge editing, session browser, visual flow builder, and settings.

## Structure

```
src-tauri/
  src/
    main.rs             Tauri entry point
    lib.rs              Plugin registration, window management
  tauri.conf.json       Tauri configuration

src/
  index.tsx             SolidJS app entry
  App.tsx               Router + layout providers

  features/             Frontend flows (mirror core features by domain)
    vault/
      vault-registration/   Steps + components for vault registration wizard
      vault-link-project/   Steps + components for project linking
      vault-sync-panel/     Steps + components for sync UI
    knowledge/
      knowledge-create/     Steps + components for knowledge creation wizard
      knowledge-edit/       Steps + components for editing
      knowledge-delete/     Steps + components for deletion confirmation
      knowledge-search/     Steps + components for search UI
    session/
      session-browser/      Steps + components for session list/detail

  components/
    ui/                 Generic UI primitives (Kobalte-based)
    layout/             Shell, Sidebar, StatusBar

  stores/               SolidJS stores (signals-based state)
    app.store.ts        Theme, sidebar, global UI state
    vault.store.ts      Vault list, sync status
    knowledge.store.ts  Knowledge entries, search results
    session.store.ts    Sessions, active session

  lib/
    api.ts              Typed fetch client for @nori/server
    sse.ts              SSE event listener utility

  pages/                Route-level page components
  styles/               Tailwind CSS
```

## Frontend flow conventions

Each frontend flow follows this structure:

```
features/{domain}/{flow-name}/
  steps/                 Step documentation (JSON files)
    01-step-name.json
    02-step-name.json
  {FlowName}Wizard.tsx   Orchestrator component (or Panel/Dialog)
  {StepComponent}.tsx    One component per UI step
  validate-{name}.ts     Client-side validation functions
```

- `ui_action` steps render a SolidJS component
- `validation` steps run a TypeScript function
- `api_call` steps call `@nori/server` and listen to SSE — this is the bridge to backend flows
- The `api_call` step JSON references a contract from `@nori/shared`

## Tech

- SolidJS 1.9 (fine-grained reactivity, signals)
- @solidjs/router
- Kobalte (accessible headless UI)
- Tailwind CSS v4
- Vite 7
- Tauri 2 (Rust desktop shell)
