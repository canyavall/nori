# Nori App - Technical Decision

## Decision: Tauri + SolidJS + Bun/Hono — Distributed as a Monorepo Library

**Date**: 2026-02-18
**Status**: Approved

---

## What we evaluated

Three proposals were considered (see `proposals.md`):

- **A: Tauri + React** — safe, large ecosystem, but React's vDOM is a bottleneck for streaming and visual canvas
- **B: Tauri + SolidJS** — fine-grained reactivity, best performance for real-time UI, what OpenCode (106k stars) chose
- **C: Electron + React** — fastest dev speed, 100% TypeScript, but heavy binaries and memory for a long-running app

## What changed the decision

The scope expanded beyond a knowledge vault manager. Nori will be:

1. AI coding agent (LLM streaming, tool execution, multi-provider)
2. Chat interface (real-time token streaming)
3. Session management (persistence, resume, history)
4. Hook system (lifecycle events, plugin architecture)
5. Knowledge vault (the original scope)
6. Visual flow builder (node-based canvas UI)

This made **performance, memory, and reactivity** the deciding factors over raw dev speed.

## Why Tauri + SolidJS

| Requirement | Why this stack wins |
|---|---|
| LLM token streaming | SolidJS updates only the text node — no vDOM diff per token |
| Visual flow canvas | Fine-grained reactivity means dragging a node doesn't re-render the graph |
| Long-running app | Tauri ~30MB memory vs Electron ~150MB |
| Chat + multiple panels | SolidJS signals are surgical — panels don't trigger each other |
| Cross-platform | Tauri: DMG, AppImage, MSI from one codebase |

## Why a monorepo with library distribution

The core engine must be installable as an npm package (`npm install @nori/core`) with **zero native dependencies**. This means:

- Developers can use the session engine, vault ops, and hook system without the desktop app
- CI/CD pipelines can run the server headless
- The desktop app is one consumer of the core, not the only one

### Key dependency decisions for library compatibility

| Need | Chosen | Why (over alternative) |
|---|---|---|
| SQLite | **sql.js** (WASM) | `better-sqlite3` requires node-gyp + C compiler. sql.js is `npm install` and done. ~2-3x slower but imperceptible for <100k rows |
| Git | **isomorphic-git** | `simple-git` requires system git installed. isomorphic-git is pure JS, zero system deps |
| Vector search | **vectra** | Pure TypeScript. No Python, no FAISS native bindings |
| LLM | **Vercel AI SDK** | Pure TypeScript, multi-provider (Anthropic, OpenAI, Google, etc.) |
| Markdown/frontmatter | **gray-matter + unified/remark** | Pure JS, mature, well-maintained |

### The desktop app CAN use faster native alternatives

When running inside Tauri, `@nori/app` can swap in `better-sqlite3` for faster DB access since the binary is packaged. The core library stays portable.

## Architecture: Three packages

```
@nori/core    — Pure TypeScript engine. Zero native deps.
                Sessions, hooks, vault, knowledge, LLM, tools, DB.
                Runs on: Node >= 20, Bun, Deno.

@nori/server  — Hono REST API + SSE. Imports @nori/core.
                Zero native deps. Runs on Node or Bun.

@nori/app     — Tauri desktop shell + SolidJS UI.
                Visual flow builder, chat, vault explorer.
                Distributed as packaged binary (DMG/AppImage/MSI).

@nori/shared  — Shared TypeScript types, Zod schemas, constants.
```

## What was explicitly rejected

| Option | Reason |
|---|---|
| Electron | Too heavy for a long-running app with streaming + canvas |
| React | vDOM reconciliation is measurably slower for token streaming and visual editors |
| Bun-only runtime | Forces users off Node. Core must run on Node >= 20 too |
| better-sqlite3 in core | Requires native compilation — breaks `npm install` portability |
| simple-git in core | Requires system git — breaks zero-deps goal |
| AGPL-licensed code (Opcode) | Incompatible with proprietary distribution |

## Next step

Define the detailed folder structure for the monorepo.
