# claude-code-safety-net Analysis

Analysis of the [claude-code-safety-net](https://github.com/kenryu42/claude-code-safety-net) project - a safety plugin that blocks destructive bash commands before execution.

**Analysis date**: 2026-02-17
**Version analyzed**: latest (npm: cc-safety-net)

## Documents

### Analysis & Assessment

| # | Document | Description |
|---|----------|-------------|
| 01 | [Overview](./01-overview.md) | What it is, what it does, and how it works |
| 02 | [Technology Stack](./02-technology-stack.md) | Complete list of technologies, frameworks, and tools |
| 03 | [Use Cases](./03-use-cases.md) | Primary and secondary use cases, limitations |
| 04 | [Architecture](./04-architecture.md) | System architecture, analysis pipeline, module relationships |

### Technical Knowledge (Reusable for Building)

| # | Document | Description |
|---|----------|-------------|
| 10 | [Technical Knowledge Base](./10-technical-knowledge.md) | Shell parsing, command segmentation, git rules, rm path classification, recursive analysis, custom rules, audit logging, secret redaction, multi-platform hooks |

### User Journeys & Flows

| # | Document | Description |
|---|----------|-------------|
| 11 | [Installation & Hook Integration](./11-flow-installation.md) | Plugin install → hook registration → first block → status line → multi-platform setup |
| 12 | [Command Analysis Pipeline](./12-flow-analysis-pipeline.md) | Command input → splitting → env stripping → wrapper detection → rule dispatch → block/allow decision |
| 13 | [Custom Rules & Configuration](./13-flow-custom-rules.md) | Project rules → user rules → merging → matching → paranoid modes → strict mode |
| 14 | [Diagnostics & Audit](./14-flow-diagnostics.md) | Doctor command → explain trace → audit logs → secret redaction → verify config |

## Quick Summary

**claude-code-safety-net** is a TypeScript safety plugin (Bun/Node.js) that acts as a PreToolUse hook for Claude Code (and OpenCode, Gemini CLI, Copilot CLI). It intercepts bash commands before execution and blocks destructive operations like `git reset --hard`, `rm -rf` outside safe directories, and dangerous piped/interpreter commands. It uses semantic shell parsing rather than regex patterns, enabling it to catch threats hidden in shell wrappers, interpreter one-liners, and complex piped operations.

### Key Takeaways

- **License**: MIT
- **Maturity**: Production-ready, comprehensive test suite, multi-platform support
- **Architecture**: PreToolUse hook with recursive semantic command analysis
- **Key innovation**: Semantic analysis over pattern matching — catches `bash -c 'git reset --hard'`, `python -c 'os.system("rm -rf /")'`, `xargs rm -rf`, etc.
- **Multi-platform**: Claude Code (plugin), OpenCode (plugin), Gemini CLI (extension), Copilot CLI (hooks)
- **Most valuable patterns**: Shell command segmentation, recursive wrapper unwrapping, git subcommand safety rules, rm path classification, audit logging with secret redaction
- **Configuration**: Custom rules per-project (`.safety-net.json`) and per-user (`~/.cc-safety-net/config.json`)
