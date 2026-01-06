# Nori Business Case

**Product**: Nori - Knowledge-First AI Collaboration Platform
**Date**: January 1, 2026
**Status**: Pre-Development

---

## Executive Summary

Nori is a desktop AI collaboration tool that enables **cross-functional teams** (Engineers, PMs, POs, Architects, CISO, SRE) to work with Claude AI through **role-specific personalities** and a **curated knowledge system**. Unlike terminal-focused tools, Nori provides a visual, non-technical-user-friendly interface with advanced knowledge management.

**Target Market**: Organizations wanting AI-enhanced productivity for entire product teams, not just engineers.

**Differentiation**: Knowledge management as a first-class feature + multi-role support.

---

## Problem Statement

### Current State

**Existing Tools (Claude Code, OpenCode)**:
- Terminal-based interfaces (intimidating for non-engineers)
- No role differentiation (same interface for PO and Engineer)
- Hidden knowledge systems (no visibility into what AI "knows")
- No knowledge curation tools (can't browse, edit, or create knowledge)
- Single-user focused (no team collaboration primitives)

**Pain Points**:
1. **PMs/POs can't use AI coding tools** - Too technical, too scary
2. **Knowledge is invisible** - "Why did AI suggest this?" is unknown
3. **No knowledge reuse** - Same questions answered repeatedly
4. **Role confusion** - AI acts like engineer even when PO asks business questions
5. **No collaboration** - Can't share knowledge across team

### Market Gap

No tool exists that:
- ✅ Works for non-engineers (PMs, POs, Architects)
- ✅ Makes knowledge visible and editable
- ✅ Supports role-based personalities
- ✅ Enables knowledge sharing across teams

---

## Solution: Nori

### Core Value Proposition

**For Individual Users**:
"Use Claude AI with role-appropriate personality and visible knowledge system"

**For Teams**:
"Build institutional AI knowledge that compounds over time, accessible to entire product org"

### Key Features (MVP)

1. **Role Switcher**: PO, Architect, Engineer, CISO, SRE personalities
2. **Knowledge Browser**: Visual tree of knowledge packages with search
3. **Knowledge Editor**: Create/edit knowledge packages visually
4. **Chat Interface**: Claude integration with streaming responses
5. **Knowledge Visibility**: See what knowledge is loaded per conversation
6. **Custom Hooks**: Users can write hooks in any language

### What We're NOT Building (MVP)

- ❌ Remote sync (local-only for now)
- ❌ Jobs/parallelization (single-threaded chat)
- ❌ Multi-window (single window MVP)
- ❌ Mobile apps
- ❌ Team features (sharing, permissions)

---

## Market Analysis

### Target Customers

**Primary**: Software product teams (50-500 people)
- Engineers: 40% of team
- PMs/POs: 20% of team
- Architects/Tech Leads: 10% of team
- QA/CISO/SRE: 30% of team

**Secondary**: Consultancies, agencies, startups

**Geography**: Global (Mac + Windows support)

### Market Size

**TAM** (Total Addressable Market):
- 10M software professionals globally
- $20/mo → $200M/month → **$2.4B/year**

**SAM** (Serviceable Addressable Market):
- 1M early adopters (teams already using AI tools)
- $20/mo → **$240M/year**

**SOM** (Serviceable Obtainable Market):
- 10K users in Year 1
- $20/mo → $200K/month → **$2.4M/year**

### Competitive Landscape

| Tool | Target Users | Price | Strengths | Weaknesses |
|------|--------------|-------|-----------|------------|
| **Claude Code** | Engineers | $20-100/mo | Best SWE-bench, official support | Terminal-only, no knowledge UI |
| **OpenCode** | Engineers | Free + API | Open source, multi-LLM | Terminal-only, engineer-focused |
| **Cursor** | Engineers | $20/mo | IDE integration | No knowledge system, engineer-only |
| **GitHub Copilot** | Engineers | $10/mo | IDE integration, autocomplete | No chat, no knowledge |
| **Nori** | **All roles** | TBD | Knowledge UI, multi-role | New, unproven |

**Competitive Moat**: Knowledge management + cross-functional usability

---

## Business Model

### Revenue Streams

**Phase 1: Free (MVP)**
- Build user base
- Gather feedback
- Prove product-market fit

**Phase 2: Freemium (6 months)**
- Free: Local-only, up to 10 knowledge packages
- Pro ($20/mo): Unlimited knowledge, remote sync, priority support
- Enterprise ($50/user/mo): Team features, SSO, compliance

**Phase 3: Enterprise (12 months)**
- Hosted knowledge platform
- Custom integrations
- Training and onboarding
- SLA and support

### Unit Economics (Year 2)

**Assumptions**:
- 10K free users
- 1K Pro users ($20/mo) = $20K/mo
- 100 Enterprise users ($50/mo) = $5K/mo
- **Total MRR**: $25K/mo = **$300K ARR**

**Costs**:
- Infrastructure: $2K/mo (CDN, storage, servers)
- Support: $5K/mo (1 FTE)
- Development: $30K/mo (2 FTE)
- **Total costs**: $37K/mo = $444K/year

**Burn rate**: $144K/year (need funding or revenue growth)

---

## Go-to-Market Strategy

### Phase 1: Beta Launch (Months 1-3)

**Target**: 100 alpha users
**Channels**:
- Product Hunt launch
- Hacker News Show HN
- Reddit (r/programming, r/MachineLearning)
- Twitter/X developer community

**Success Metric**: 500+ GitHub stars, 100 active users

### Phase 2: Community Growth (Months 4-9)

**Target**: 1,000 active users
**Channels**:
- Content marketing (blog posts on knowledge management)
- Developer advocates (hire 1 FTE)
- Integration showcases (Slack, Linear, Jira)

**Success Metric**: 5,000 GitHub stars, 20% MoM growth

### Phase 3: Enterprise Sales (Months 10-12)

**Target**: 10 enterprise customers
**Channels**:
- Direct outreach to VP Engineering
- Case studies and ROI calculators
- Conference sponsorships (React Conf, etc.)

**Success Metric**: $100K ARR from enterprise

---

## Development Roadmap

### MVP (4 months)

**Q1 2026**:
- ✅ Tauri app with React frontend
- ✅ Role switcher (5 roles)
- ✅ Knowledge browser (read-only)
- ✅ Knowledge editor (create/edit)
- ✅ Chat interface (Claude SDK)
- ✅ Custom hooks support

**Team**: 2 engineers
**Budget**: $0 (founders or open source)

### V1.0 (Months 5-8)

**Q2 2026**:
- ✅ Jobs system (parallelization)
- ✅ Multi-window support
- ✅ Remote sync (Git-based)
- ✅ Knowledge creation suggestions
- ✅ Advanced search/filter

**Team**: 3 engineers
**Budget**: $50K (seed funding or revenue)

### V2.0 (Months 9-12)

**Q3-Q4 2026**:
- ✅ Team features (sharing, permissions)
- ✅ Enterprise SSO
- ✅ Plugin marketplace
- ✅ Mobile companion app
- ✅ API for integrations

**Team**: 5 engineers + 1 PM
**Budget**: $150K

---

## Risk Assessment

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Tauri instability | High | Low | Proven in 2.0, fallback to Electron |
| Claude SDK changes | Medium | Medium | Abstract behind interface layer |
| Performance issues | Medium | Low | Profile early, optimize rendering |
| Knowledge sync conflicts | Low | Medium | Git handles it, defer complex CRDTs |

### Market Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Claude Code adds knowledge UI | High | Medium | Nori is open source, multi-LLM future |
| Low adoption by non-engineers | High | Medium | UX testing, onboarding flows |
| Crowded AI tools market | Medium | High | Focus on knowledge moat, not chat |
| Enterprise slow to adopt | Medium | High | Self-hosted option, SOC2 later |

### Financial Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Can't monetize | High | Medium | Freemium proven model, B2B path |
| High CAC (customer acquisition cost) | Medium | Medium | Organic growth, word-of-mouth |
| Churn after trial | Medium | High | Focus on knowledge lock-in |

---

## Success Metrics

### MVP (Month 4)

- ✅ 100 active users
- ✅ 50%+ using non-engineer roles (PO, Architect)
- ✅ 500+ knowledge packages created
- ✅ <2s app startup time
- ✅ <100ms knowledge search

### V1.0 (Month 8)

- ✅ 1,000 active users
- ✅ 10 paying customers (Pro or Enterprise)
- ✅ 5,000+ knowledge packages
- ✅ 4.0+ App Store rating
- ✅ 20% MoM growth

### V2.0 (Month 12)

- ✅ 5,000 active users
- ✅ $100K ARR
- ✅ 50 enterprise customers
- ✅ 50K+ knowledge packages
- ✅ Break-even on costs

---

## Investment Ask

**Not seeking funding for MVP** - bootstrapped or open source

**Future funding** (post-MVP):
- Seed: $500K at $5M valuation (10% dilution)
- Use of funds: 3 engineers ($300K), marketing ($100K), infrastructure ($50K), buffer ($50K)
- Runway: 12 months to $100K ARR

---

## Why Now?

1. **AI adoption is exploding** - Teams need better tools for non-engineers
2. **Knowledge management is unsolved** - No one has visual AI knowledge curation
3. **Claude is SOTA** - 72.7% SWE-bench, best in class
4. **Tauri 2.0 just shipped** - Modern desktop framework ready
5. **We have domain expertise** - Built 41 knowledge packages, understand the problem

---

## Why Us?

**Unfair Advantages**:
1. **Knowledge system already built** - 41 packages, proven hooks, working search
2. **Research completed** - 270 pages of OpenCode/Claude Code analysis
3. **Patterns extracted** - Agent selection, hooks, context management documented
4. **Existing base** - Can reuse ClaudeCodeUI patterns for UI

**Team DNA**:
- Staff engineer mindset: pragmatic, skeptical, focused on delivery
- Knowledge-first philosophy: already living the workflow
- Cross-functional empathy: understand PM/PO/Architect needs

---

## Decision Point

**Do we build Nori?**

**YES, because**:
- Clear market gap (no tool for non-engineers)
- Strong differentiation (knowledge management)
- Proven patterns (ClaudeCodeUI, OpenCode, Claude Code analyzed)
- Manageable scope (4-month MVP)
- Compounding moat (knowledge compounds, code doesn't)

**Recommendation**: Proceed to MVP development

---

**Status**: ✅ Approved for MVP
**Next Step**: Create epic and start development
