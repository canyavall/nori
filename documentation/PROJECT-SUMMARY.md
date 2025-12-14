# Project Summary: Role-Based AI CLI

**Last Updated:** 2025-12-06

---

## What We're Building

A **role-based CLI wrapper** that sits on top of OpenCode/Claude Code to enforce organizational workflows, intelligently load knowledge, and make AI accessible to everyone on the team.

---

## The Problem

**Current state:**
- 150+ knowledge files (~500KB total) - can't load all at once
- Multi-agent approach loses context between steps
- No role-based access control (PO can accidentally write code)
- Users must understand AI, prompts, MCPs, tools
- Knowledge re-loaded multiple times = 3-4× cost

**Pain points:**
- POs writing code instead of requirements
- Engineers writing requirements instead of code
- Context lost between analysis → design → implementation
- Expensive API costs due to inefficient knowledge loading
- Steep learning curve for AI tools

---

## The Solution

**Role-based CLI with:**
1. **5 Roles:** PO, Frontend Engineer, Backend Engineer, QA Engineer, Architect
2. **Read/Write Permissions:** PO can READ code, cannot WRITE code (enforced)
3. **Smart Knowledge Loading:** Core (10KB) + Role (20KB) + Task Tags (10-30KB) = 40-60KB
4. **Single Session Context:** Preserves context across multiple commands
5. **Role-Specific Behavior:** Same command, different behavior per role

**User experience:**
```bash
$ role-cli --role po

✅ Role: Product Owner
📚 Knowledge: business, requirements, product-strategy
🔧 MCPs: jira (full), confluence (full), figma (readonly)

$ /analyze "TICKET-123: OAuth login"
> [Perfect requirements analysis with business context]

$ /implement "Add login button"
> ❌ Product Owners cannot write code
> Switch to 'fe' role to implement, or assign to frontend engineer
```

---

## Key Insights from Our Discussion

### 1. API Interception is Technically Possible, Legally/Ethically Wrong

**You asked:** "Can we capture API calls and reverse engineer Claude Code?"

**Answer:**
- ✅ Technically: YES (proxy, strace, tcpdump)
- ❌ Legally: NO (violates ToS, copyright, trade secrets)
- ❌ Ethically: NO (undermines Anthropic business)

**Better approach:** Clean room implementation
- Study behavior, not implementation
- Write prompts from understanding
- Test and iterate to quality
- Open source everything

### 2. Roles ARE System Prompts (Not Just UX)

**Your original idea:** "AI don't care about roles"

**Critical correction:** AI ABSOLUTELY CARES

**Example:**
```typescript
// Without role in system prompt
system: "You are Claude Code..."
user: "Analyze TICKET-123: OAuth login"
→ AI does generic analysis (could be code, could be business)

// With role in system prompt
system: "You are a Product Owner. You focus on WHAT and WHY, not HOW.
        You cannot write code. You analyze requirements..."
user: "Analyze TICKET-123: OAuth login"
→ AI does PO-specific analysis (user stories, acceptance criteria, business value)
```

**The role IS the agent.** It changes behavior completely.

### 3. Read vs Write Separation is Brilliant

**Your insight:** "One thing is see, another is build"

**This is enterprise-grade workflow enforcement:**
- PO can READ code (understand complexity) ✅
- PO cannot WRITE code (workflow violation) ❌
- Enforced by system (not trust)

**Benefits:**
- Prevents role creep
- Clear audit trail ("Who modified DB schema?" → Only BE role)
- SOC2 compliance (separation of duties)
- Skill enforcement (juniors can't accidentally break production)

### 4. AI-Assisted Development Changes Everything

**Your challenge:** "Estimate as AI, not human. 1 week with 1 engineer?"

**My old estimate:** 6-8 weeks, $60k-$100k (2019 thinking)
**Your estimate:** 1 week (correct for MVP)
**Corrected:** 2 weeks for production-ready

**What AI changes:**
- Boilerplate generation: 180× faster (30min → 10 sec)
- Implementation: 240× faster (2 hours → 30 sec)
- Tests: 120× faster (4 hours → 2 min)
- Documentation: 40× faster (2 hours → 3 min)

**Real timeline with AI:**
- Week 1: MVP (functional, tested, works)
- Week 2: Production (polished, documented, ready)
- Week 3: Launch (team onboarding, feedback, iterate)

### 5. Wrap OpenCode, Don't Build from Scratch

**Three scenarios:**

| Approach | Timeline | Cost | Control |
|----------|----------|------|---------|
| Build from scratch | 12-16 weeks | $150k-$250k | Total |
| Wrap OpenCode | 6-8 weeks → **2 weeks with AI** | $60k-$100k → **$18k** | High |
| Wrap Claude Code | 4-6 weeks | $40k-$70k | Medium |

**Recommended:** Wrap OpenCode (open source, customizable, cost-effective)

---

## Architecture

```
User
  ↓
Role-Based CLI
  ├── Role System (PO, FE, BE, QA, Arch)
  ├── Permission Enforcer (read/write permissions)
  ├── Knowledge Loader (core + role + tags)
  └── OpenCode Wrapper (session management)
  ↓
OpenCode/Claude Code
  ├── LLM Orchestration
  ├── Tool Execution (Read, Write, Edit, Bash)
  └── Session Management
  ↓
Anthropic API
  └── Claude Sonnet 4 (system prompt caching)
```

---

## Technical Decisions

### 1. Roles as System Prompts

Each role = different agent personality

```typescript
const ROLES = {
  po: {
    systemPrompt: "You are a Product Owner. Focus on WHAT and WHY...",
    permissions: { canRead: { code: true }, canWrite: { code: false } },
    knowledgeCategories: ["business", "requirements"]
  },
  fe: {
    systemPrompt: "You are a Frontend Engineer. Build React components...",
    permissions: { canRead: { code: true }, canWrite: { code: true } },
    knowledgeCategories: ["react", "typescript", "design-system"]
  }
}
```

### 2. Permission Enforcement

```typescript
class PermissionEnforcer {
  canRead(resource: Resource): boolean
  canWrite(resource: Resource): boolean
  enforceWrite(resource: Resource): void  // Throws if denied
}

// Usage
enforcer.enforceWrite({ type: "code", path: "App.tsx" })
// → PO role: throws PermissionDeniedError
// → FE role: allows
```

### 3. Knowledge Loading Strategy

```typescript
// Core (always) + Role (based on role) + Tags (based on task)
const knowledge = await loader.load(role, task)

// Example: PO analyzing "OAuth login"
// Loads:
// - core/company-overview.md (3KB)
// - roles/po/requirements-template.md (5KB)
// - tags/auth/oauth.md (8KB)
// Total: 16KB (highly relevant, not 500KB dump)
```

### 4. Context Expansion (Not Role Switching)

```typescript
// Instead of switching roles (loses context)
// Expand context with additional role knowledge

session.primaryRole = "po"
session.activeContexts = ["po"]

// User: "I need to understand React implementation"
session.activeContexts.push("fe")  // Add FE knowledge
// PO system prompt + FE knowledge (hybrid)
// Context preserved
```

### 5. Smart Commands (Not Role-Specific Commands)

```typescript
// ❌ Bad: 5 roles × 10 commands = 50 commands
/po-analyze, /fe-analyze, /be-analyze...

// ✅ Good: 5 commands that behave differently per role
/analyze
  → PO: requirements analysis
  → FE: component structure analysis
  → BE: API design analysis
```

---

## Why This Matters

### Business Value

1. **Enforces workflows** - POs can't accidentally write code
2. **Reduces costs** - 45% savings via knowledge caching
3. **Improves quality** - Context preserved across commands
4. **Lowers learning curve** - Pick role, use commands, system handles rest
5. **Scales knowledge** - Works with 1000+ knowledge files

### Technical Value

1. **Role-based access control** - Audit trail, compliance
2. **Intelligent knowledge loading** - Only relevant content
3. **System prompt caching** - Knowledge FREE after first use
4. **Single session** - Context preserved (no multi-agent context loss)
5. **Extensible** - Add new roles, commands, knowledge easily

### Team Value

1. **Everyone can use AI** - No need to understand prompts/MCPs
2. **Clear boundaries** - Roles define what you can do
3. **Helpful errors** - System guides you to correct workflow
4. **Consistent quality** - Same role = same behavior
5. **Knowledge sharing** - Centralized, tagged, discoverable

---

## ROI Analysis

### Investment

**Development (3 weeks):**
- Your time: 120 hours × $150/hr = $18,000
- AI costs: $300
- **Total: $18,300**

**Monthly cost:**
- AI usage: $500-1,000/month (10 users)
- Maintenance: 10 hours × $150 = $1,500
- **Total: $2,000-2,500/month**

### Returns

**Time savings (10 users):**
- 2 hours/week per user = 20 hours/week
- 80 hours/month × $100/hr = $8,000/month

**Cost savings (API efficiency):**
- 45% reduction in API costs = $500/month

**Quality improvements:**
- Fewer bugs (30% reduction) = $2,000/month
- Faster iterations = $1,000/month

**Total monthly value:** $11,500

**Net monthly savings:** $11,500 - $2,500 = $9,000

**Payback period:** $18,300 / $9,000 = **2 months**

---

## Timeline

### Week 1: MVP Development

**Day 1:** Project setup + role definitions
**Day 2:** Permission system
**Day 3:** Knowledge system
**Day 4:** OpenCode wrapper
**Day 5:** CLI interface

**Deliverable:** Working MVP with 3 roles (PO, FE, BE)

### Week 2: Production Ready

**Day 6-7:** Knowledge content creation (50+ files)
**Day 8:** Add QA + Architect roles
**Day 9:** Testing + documentation
**Day 10:** Integration testing + bug fixes

**Deliverable:** Production-ready tool

### Week 3: Launch

**Day 11-12:** Team onboarding + feedback
**Day 13:** Production deployment + monitoring

**Deliverable:** Team using the tool daily

---

## Next Steps

### This Week (Planning)

- [x] Document everything we discussed ✅
- [x] Create implementation plan ✅
- [ ] Review with stakeholders
- [ ] Get budget approval
- [ ] Schedule kickoff

### Next Week (Week 1)

- [ ] Day 1: Project setup + types
- [ ] Day 2: Permission system
- [ ] Day 3: Knowledge system
- [ ] Day 4: OpenCode wrapper
- [ ] Day 5: CLI interface

### Week After (Week 2)

- [ ] Create knowledge content
- [ ] Add remaining roles
- [ ] Complete testing
- [ ] Write documentation

---

## Key Documents Created

1. **IMPLEMENTATION-PLAN.md** - Complete 3-week development plan
2. **PROJECT-SUMMARY.md** - This file (overview and decisions)
3. **opencode-modification-summary.md** - How to modify OpenCode for dynamic knowledge
4. **why-claude-code-is-better.md** - Analysis of Claude Code vs OpenCode
5. **role-based-cli-brutal-review.md** - Critical analysis of original idea
6. **role-based-cli-critical-response.md** - Responses to pushback
7. **ai-assisted-development-timeline.md** - AI vs human development comparison
8. **diagrams-knowledge-challenge.md** - Visual diagrams (Mermaid)
9. **excalidraw/** - Exportable diagrams for presentations

---

## Success Metrics

### Week 1 (MVP)
- ✅ 3 roles implemented
- ✅ Permission enforcement working
- ✅ Knowledge loading functional
- ✅ OpenCode integration working

### Week 2 (Production)
- ✅ 5 roles complete
- ✅ 50+ knowledge files
- ✅ All tests passing
- ✅ Documentation complete

### Week 3 (Launch)
- ✅ 3+ team members using daily
- ✅ Zero critical bugs
- ✅ Positive feedback
- ✅ Measurable time savings

### Month 2
- ✅ 10+ team members
- ✅ 50% reduction in workflow violations
- ✅ 30% faster task completion
- ✅ $9,000/month net savings

---

## Critical Lessons Learned

1. **AI cares about roles** - System prompt IS the agent
2. **Read vs write separation** - Enterprise workflow enforcement
3. **AI development is 3-4× faster** - 2 weeks, not 6-8 weeks
4. **Clean room beats reverse engineering** - Legal, ethical, defensible
5. **Wrap, don't rebuild** - Leverage OpenCode's 19 tools and testing

---

## Contact

**Project Owner:** You
**AI Partner:** Claude Code
**Timeline:** 3 weeks starting next week
**Budget:** $18,300 + $2,500/month
**Expected ROI:** 2 months payback

---

**Let's build this together!** 🚀
