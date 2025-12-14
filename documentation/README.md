# Nori Project Documentation

**Complete documentation for the Nori research project analyzing OpenCode and Claude Code architectures**

---

## Documentation Structure

```
documentation/
├── README.md (this file)
│
├── requests-tracker/           # Request interception & analysis
│   ├── REQUEST-INTERCEPTION-GUIDE.md  # Complete guide (800+ lines)
│   ├── FINDINGS.md             # Research findings summary
│   ├── README.md               # Project overview
│   ├── QUICK-START.md          # 5-minute quickstart
│   ├── INSTALL.md              # Installation guide
│   └── EXAMPLE-OUTPUT.md       # Expected output examples
│
├── Core Comparisons (270+ pages total):
│   ├── claude-code-architecture-guide.md   # Master architecture (60KB)
│   ├── agents-comparison.md                # Agent systems
│   ├── commands-comparison.md              # Slash commands
│   ├── context-management-comparison.md    # Context strategies
│   ├── hooks-comparison.md                 # Lifecycle hooks
│   ├── skills-comparison.md                # Plugin vs native
│   └── tools-comparison.md                 # 19 vs 15+ tools
│
├── Implementation Planning:
│   ├── MASTER-ROADMAP.md       # 4-phase plan (38KB)
│   ├── GAP-ANALYSIS.md         # Knowledge gaps (34KB)
│   └── IMPLEMENTATION-PLAN.md  # Detailed implementation
│
├── Project Documentation:
│   ├── PROJECT-SUMMARY.md      # Project overview
│   ├── two-track-strategy.md   # Development strategy
│   └── why-claude-code-is-better.md
│
└── Analysis & Research:
    ├── ai-assisted-development-timeline.md
    ├── role-based-cli-brutal-review.md
    ├── dynamic-knowledge-loading.md
    ├── opencode-modification-summary.md
    └── [other analysis docs]
```

---

## Quick Navigation

### I want to...

**Understand request interception**:
→ `requests-tracker/REQUEST-INTERCEPTION-GUIDE.md`

**See research findings**:
→ `requests-tracker/FINDINGS.md`

**Learn Claude Code architecture**:
→ `claude-code-architecture-guide.md`

**Compare specific features**:
→ `[feature]-comparison.md` files

**See implementation plan**:
→ `MASTER-ROADMAP.md`

**Understand what's missing**:
→ `GAP-ANALYSIS.md`

**Get project overview**:
→ `PROJECT-SUMMARY.md`

---

## Key Documents by Purpose

### 1. Request Interception & Analysis

**Start here**: `requests-tracker/REQUEST-INTERCEPTION-GUIDE.md`

Complete guide to:
- Installing and configuring mitmproxy
- Capturing Claude Code API requests
- Analyzing system prompts, tools, and behavior
- Understanding what makes Claude Code better

**Key finding**: Claude Code's quality is 80% model + 15% prompt engineering + 5% tools. NOT from CLAUDE.md/skills/rules magic.

**Related files**:
- `FINDINGS.md` - Executive summary
- `INSTALL.md` - Installation only
- `QUICK-START.md` - 5-minute setup
- `EXAMPLE-OUTPUT.md` - What to expect

### 2. Architecture Comparison

**Master guide**: `claude-code-architecture-guide.md` (60KB, comprehensive)

**Detailed comparisons**:
- `agents-comparison.md` - Agent architectures
- `commands-comparison.md` - Slash commands
- `context-management-comparison.md` - Context strategies
- `hooks-comparison.md` - Lifecycle hooks
- `skills-comparison.md` - Skills system
- `tools-comparison.md` - Tool sets

**Total**: 270+ pages of detailed analysis

### 3. Implementation Planning

**Roadmap**: `MASTER-ROADMAP.md` (38KB, 4-phase plan)

**Phases**:
1. Quick Wins (1-2 weeks)
2. Core Features (3-6 weeks)
3. Advanced Features (5-8 weeks)
4. Polish & Release (2-3 weeks)

**Gap Analysis**: `GAP-ANALYSIS.md` (34KB)
- Confidence levels for each feature
- Testing priorities
- Known unknowns

**Implementation**: `IMPLEMENTATION-PLAN.md`
- Detailed task breakdown
- Code locations
- Testing strategies

### 4. Project Context

**Overview**: `PROJECT-SUMMARY.md`
- Project goals
- Repository structure
- Development status

**Strategy**: `two-track-strategy.md`
- Parallel development approach
- Risk mitigation
- Timeline

**Analysis**: `why-claude-code-is-better.md`
- Quality breakdown
- Feature comparison
- User experience

---

## Reading Order by Goal

### Goal: Understand the Project

1. `PROJECT-SUMMARY.md` - Overview
2. `claude-code-architecture-guide.md` - Deep dive
3. `MASTER-ROADMAP.md` - Implementation plan

### Goal: Implement OpenCode Features

1. `GAP-ANALYSIS.md` - Understand what's missing
2. `MASTER-ROADMAP.md` - See implementation phases
3. `[feature]-comparison.md` - Specific feature details
4. `IMPLEMENTATION-PLAN.md` - Detailed tasks

### Goal: Understand Claude Code Quality

1. `requests-tracker/FINDINGS.md` - Executive summary
2. `requests-tracker/REQUEST-INTERCEPTION-GUIDE.md` - Complete analysis
3. `why-claude-code-is-better.md` - Quality breakdown

### Goal: Set Up Request Interception

1. `requests-tracker/QUICK-START.md` - Get running in 5 minutes
2. `requests-tracker/INSTALL.md` - Detailed installation
3. `requests-tracker/REQUEST-INTERCEPTION-GUIDE.md` - Complete reference

---

## Major Documents

**Total documentation**: ~400KB across 40+ files

**Largest documents**:
- `claude-code-architecture-guide.md`: 60KB
- `context-management-comparison.md`: 58KB
- `tools-comparison.md`: 54KB
- `agents-comparison.md`: 44KB
- `commands-comparison.md`: 40KB
- `MASTER-ROADMAP.md`: 38KB
- `REQUEST-INTERCEPTION-GUIDE.md`: 35KB
- `GAP-ANALYSIS.md`: 34KB

**Comparison docs total**: 270+ pages

---

## External Resources

### Official Documentation

**Anthropic**:
- API docs: https://docs.anthropic.com
- Claude Code: https://claude.com/claude-code
- Agent SDK: https://github.com/anthropics/anthropic-agent-sdk

**OpenCode**:
- GitHub: https://github.com/sst/opencode

### Related Projects

**Captured repositories** (in `base_repositories/`):
- `claudecodeui/` - Web UI wrapper
- `opcode/` - Tauri desktop app
- `claude-code-webui/` - Lightweight wrapper
- `claude-plugins-official/` - Official plugins
- `claude-code-plugins-plus/` - Community plugins

---

## Changelog

**2025-12-13**:
- Added comprehensive request interception guide
- Consolidated docs/ and documentation/ folders
- Created master documentation README
- Added requests-tracker/ subdirectory

**2025-12-07**:
- Created comparison documents (270+ pages)
- Added master roadmap and gap analysis

**2025-12-04**:
- Initial documentation creation
- Project summary and overview

---

## License

**OpenCode**: MIT License (SST/Jay)
**This Project**: Educational analysis and open-source development
**Claude Code**: Proprietary (Anthropic)

Documentation created for educational and research purposes.
