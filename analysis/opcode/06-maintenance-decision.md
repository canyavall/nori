# Opcode - Maintenance Decision Analysis

## Context

This document evaluates whether we should adopt, fork, contribute to, or build alternatives to Opcode for our needs.

## Key Factors

### License: AGPL-3.0

**This is the most critical factor.** The AGPL-3.0 license requires:
- Any modifications must be released under AGPL-3.0
- If you deploy it as a network service (web server mode), users must be able to access the source code
- Derivative works must also be AGPL-3.0
- You cannot incorporate AGPL code into proprietary software

**Impact**: If we modify Opcode and distribute it (even internally as a service), we must open-source our changes. This makes it **incompatible with proprietary/closed-source projects**.

### Project Maturity

| Indicator | Assessment |
|-----------|------------|
| Version | 0.2.1 (pre-1.0, early stage) |
| Published binaries | None yet ("coming soon") |
| Web server mode | Experimental, critical bugs documented |
| Test coverage | Minimal (no frontend tests visible) |
| Documentation | Good README, design docs exist |
| Community | Discord exists, Star History chart present |
| CI/CD | Mature (multi-platform builds, code signing, notarization) |

**Assessment**: Early-stage project with good foundations but not production-ready.

### Dependency on Claude Code CLI

Opcode is a **wrapper around the `claude` CLI binary**. It:
- Discovers and invokes `claude` as a subprocess
- Parses its JSONL stream output
- Reads its session files from `~/.claude/projects/`
- Uses `--dangerously-skip-permissions` flag

**Risk**: Any breaking change to Claude Code CLI (output format, file locations, flags) would break Opcode. We'd be maintaining compatibility with an external tool we don't control.

### Maintenance Burden

**What maintaining a fork would require**:

1. **Rust + Tauri expertise**: Backend is non-trivial (848-line web server, checkpoint system, process management)
2. **React + TypeScript**: Large frontend (~121 files, ~27k LOC)
3. **Multi-platform builds**: macOS code signing/notarization, Linux packages, Windows builds
4. **Claude CLI compatibility**: Track changes to `claude` CLI output formats and flags
5. **Tauri 2 ecosystem**: Keep up with Tauri framework updates
6. **Security patches**: Address the `--dangerously-skip-permissions` usage and web mode vulnerabilities

**Estimated effort to maintain actively**: 1-2 developers part-time minimum.

### What We Could Reuse

If we're building similar tooling, these are the most valuable pieces:

| Component | Reusability | Notes |
|-----------|------------|-------|
| Agent definition format (.opcode.json) | High | Simple JSON schema, model-agnostic |
| Pre-built agents (security, git, tests) | High | System prompts are the real value |
| Checkpoint/timeline system | Medium | Clever content-addressable design, but tightly coupled |
| Claude binary discovery | Medium | Multi-platform discovery logic |
| Dual-mode API adapter | Medium | Tauri + web pattern is well-designed |
| UI components | Low | Tied to specific Radix/shadcn setup |
| Analytics system | Low | PostHog-specific, very granular |

### Alternatives to Consider

1. **Use Claude Code CLI directly**: If GUI isn't critical, the CLI is sufficient
2. **Claude Code in VS Code**: If IDE integration is the goal, consider existing extensions
3. **Build a lighter wrapper**: If we only need agent execution + session management, a simpler tool would be easier to maintain
4. **Contribute upstream**: If Opcode fits 80%+ of needs, contribute missing features rather than forking

---

## Decision Matrix

| Factor | Score (1-5) | Weight | Notes |
|--------|-------------|--------|-------|
| Feature fit for our needs | ? | High | Depends on specific requirements |
| License compatibility | 1 | Critical | AGPL-3.0 is restrictive for proprietary use |
| Project maturity | 2 | High | Pre-release, incomplete features |
| Maintenance cost | 2 | High | Rust + Tauri + React, multi-platform |
| External dependency risk | 2 | Medium | Tightly coupled to claude CLI internals |
| Code quality | 3 | Medium | Good foundations, some debt |
| Community/support | 2 | Medium | Small team, early community |
| Security posture | 2 | Medium | Several concerns (permission bypass, no auth) |

## Recommendations

### If our product is proprietary / closed-source:
**DO NOT fork or integrate Opcode.** The AGPL-3.0 license is incompatible. Instead:
- Extract ideas and architectural patterns (these aren't copyrightable)
- Study the agent definition format and pre-built agent prompts
- Build our own tool with a permissive or proprietary license

### If our product is open-source (AGPL-compatible):
**Consider contributing upstream** rather than forking. The project has good bones but needs:
- Security hardening (remove `--dangerously-skip-permissions`)
- Web server mode fixes
- Frontend testing
- Production readiness

### If we just need agent execution:
**Extract the agent system prompts** (git commit bot, security scanner, unit test generator) and use them directly with the Claude CLI or our own tooling. The prompts are the most immediately valuable, reusable artifacts.

### If we need a Claude Code GUI:
**Wait for Opcode to mature** (reach 1.0 with published binaries) or build a minimal alternative focused on our specific needs. The current state has too many incomplete features and security issues for production use.

---

## Summary

| Question | Answer |
|----------|--------|
| Should we use Opcode as-is? | **No** - too immature, security concerns |
| Should we fork and maintain it? | **Probably not** - AGPL license, high maintenance burden |
| Should we contribute to it? | **Maybe** - if AGPL is acceptable and our needs align |
| Should we learn from it? | **Yes** - good architectural ideas, agent prompts are valuable |
| Should we build our own? | **Depends** - only if we have a clear need for a Claude Code GUI |
