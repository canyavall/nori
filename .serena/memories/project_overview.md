# Nori Project Overview

## What is Nori?

Nori is a **knowledge-first AI collaboration platform** for cross-functional product teams. It's a desktop Electron application that provides visual knowledge management and role-based AI personalities.

## Target Users

Product teams (50-500 people) where:
- 40% engineers
- 60% other roles (PMs, Product Owners, Architects, CISO, SRE)

## Key Differentiators

**vs Claude Code / OpenCode:**
- Desktop GUI (not terminal-based) - accessible to non-engineers
- Visual knowledge browser (browse, search, edit packages)
- Role-based AI personalities (PO, Architect, Engineer, CISO, SRE)
- Workspace-vault separation (knowledge reusable across repos)

**Competitive Moat**: Curated knowledge packages compound over time. Competitors can copy code, but cannot copy thousands of domain-specific knowledge files.

## Product Vision

**For individuals**: Use Claude AI with role-appropriate personality and visible knowledge

**For teams**: Build institutional AI knowledge that compounds over time, accessible to entire product organization

## Key Concepts

- **Workspace**: Local folder with code (~/work/project/)
- **Vault**: Named knowledge collection outside workspace (~/vaults/nestle/)
- **nori.json**: Workspace config (vault reference, hooks, tools)
- **Workspace-Vault Separation**: 1 workspace → 1 vault, N workspaces → 1 vault (vault reuse encouraged)

## Core Architecture

**Electron Desktop App**:
- **Main Process**: Electron window management (app/src/main/)
- **Preload**: Context bridge for secure IPC (app/src/preload/)
- **Renderer**: React frontend (app/src/renderer/)

**Express Backend** (app/src/server/):
- HTTP REST API (auth, sessions, projects, knowledge)
- WebSocket chat server (AI streaming)
- SQLite database (~/.nori/nori.db)
