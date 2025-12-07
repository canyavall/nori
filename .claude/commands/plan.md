---
description: Development workflow - creates requirements, research, tech-design, and plan
allowed-tools: Read(*), Write(*), Bash(*), Glob(*), Grep(*), mcp__serena__*(*)
argument-hint: <project-id>
---

# Plan Command - Feature Planning Workflow

Execute complete planning workflow from ticket through implementation plan.

## Step 1: Validate & Prepare

Parse argument: `<project-id>`

Check if `.claude/epics/{project-id}/ticket.md` exists.
If missing: Ask user to create it first.

**Resume capability**: Each step checks if its output file exists before running. If exists, skips to next step.

### 1.1 Analyze Ticket

Read and analyze `.claude/epics/{project-id}/ticket.md` to understand:

- Business domain (if applicable)
- Task type and technical scope
- What needs to be accomplished

### 1.2 Load Relevant Knowledge

**MANDATORY**: Load knowledge before proceeding with any planning work.

**Step 1: Discover Available Tags**

Run tag discovery to see all available tags:

```bash
node .claude/knowledge/scripts/knowledge-search.mjs --list-tags
```

**Step 2: Determine Relevant Tags**

Based on ticket analysis, select 2-4 relevant tags:

**Domain-based tags**:
- **Trading**: `trading`, `trading-oms`, `portfolio`, `market-data`
- **Tokenization**: `tokenization`, `compliance`, `primary-market`, `secondary-market`
- **Crypto**: `crypto`, `wallet`, `custody`, `blockchain`
- **Cash**: `cash`, `payment`, `sepa`, `settlement`
- **Risk**: `risk`, `compliance`, `monitoring`

**Task-type tags**:
- **Routing**: `routing`, `react-router`, `permissions`, `monorepo-routing`
- **Components**: `component-creation`, `react-component-patterns`, `styling`
- **Forms**: `forms`, `validation`, `yoda-form`
- **Testing**: `testing-basics`, `mocking`, `jest`
- **API**: `api-integration`, `data-fetching`, `react-query`
- **State**: `state-management`, `zustand`, `context`
- **Data Tables**: `data-table`, `tanstack-table`, `pagination`

**Step 3: Load Knowledge**

Run knowledge search with selected tags:

```bash
agent_id="plan-{project-id}-$(date +%s)"

node .claude/knowledge/scripts/knowledge-search.mjs \
  --command-profile plan \
  --tags [selected-tags] \
  --agent-name plan-command \
  --agent-id "$agent_id" \
  --prompt "[brief-ticket-summary]"
```

**Step 4: Read Top Packages**

From the JSON output, read the top 3-5 most relevant packages by their `knowledge_path`.

**Example**:
```bash
# Ticket: "Move routes from modules to apps"
# Selected tags: routing,react-router,monorepo-routing

agent_id="plan-feco-0000-$(date +%s)"

node .claude/knowledge/scripts/knowledge-search.mjs \
  --command-profile plan \
  --tags routing,react-router,monorepo-routing \
  --agent-name plan-command \
  --agent-id "$agent_id" \
  --prompt "Move routes from modules to apps"

# Read top packages returned
```

**If search returns 0 results**:
1. Use fewer tags (try 1-2 instead of 4)
2. Broaden tags (use more general terms)
3. Re-run `--list-tags` to verify available tags

**Proof of loading**:
After loading knowledge, state in your response:
- "Loaded: [package1], [package2], [package3]"
- OR "No relevant knowledge found: [reason]"

## Step 2: Requirements

**Check before starting**:

- If `.claude/epics/{project-id}/requirements.md` exists → Skip to Step 3
- If not exists → Continue

### 2.1 Read Ticket & Detect Domain

Read `.claude/epics/{project-id}/ticket.md`

Detect business domain from keywords (case-insensitive):

- **Trading**: trading, trade, order, execution, liquidity, portfolio, OMS, market, buy, sell, price
- **Tokenization**: tokenization, token, issuance, primary market, secondary market, compliance, asset, portfolio documents
- **Crypto**: crypto, cryptocurrency, bitcoin, ethereum, blockchain, wallet, DeFi, custody
- **Cash**: cash, fiat, SEPA, SWIFT, payment, settlement, transfer, bank account
- **None (Technical)**: refactor, move, fix, bug, error, TypeScript, test, route, component (without domain context)

### 2.2 Validate Ticket Completeness

Check ticket for:

- **Business Context** (for domain tasks): Business rules explained? Domain-specific requirements clear? Acceptance criteria include business scenarios?
- **Technical Clarity** (all tasks): WHAT is clear? WHY is clear? Scope defined?

### 2.3 Define Explicit Scope

Extract from ticket:

- Which apps are mentioned? (look for "apps/X" or app names)
- Which modules are mentioned? (look for "libs/modules/X/Y" or module names)
- Which features/areas are mentioned?

Define boundaries:

- **In-Scope**: Explicitly list what IS included (apps, modules, features)
- **Out-of-Scope**: Explicitly list what is NOT included
- **Ambiguities**: Flag similar names or unclear references

Use full paths when possible (e.g., "apps/synergy-client" not "synergy app").

### 2.4 Create requirements.md

Write to `.claude/epics/{project-id}/requirements.md`:

```markdown
# [Feature Title]

## Ticket Quality Assessment

**Domain Detected**: [trading/tokenization/crypto/cash/none]
**Business Context**: [✅ Complete / ⚠️ Partial / ❌ Missing]
**Technical Clarity**: [✅ Clear / ⚠️ Unclear / ❌ Vague]

**Missing Information**: [List or "None"]

## Scope

### In-Scope

- **Apps**: [list with full paths if known]
- **Modules**: [list with full paths if known, or "TBD - verify in research"]
- **Features**: [list specific features/areas]

### Out-of-Scope

- [Explicitly list what is NOT included]
- [Flag similar but different items to prevent confusion]

### Verification Needed

- [ ] [Any ambiguities requiring research verification]

## What

[2-3 sentences describing what needs to be done]

## Why

[1-2 sentences on business value]

## Business Context

[CONDITIONAL: Only if domain detected (trading, tokenization, crypto, cash)]
[Business rules and domain context from ticket]

## Acceptance Criteria

- [ ] Specific testable criterion 1
- [ ] Specific testable criterion 2
- [ ] Specific testable criterion 3

## Notes

[ONLY if ticket has critical constraints/context - otherwise SKIP]
```

Auto-continue to Step 3.

---

## Step 3: Research

**Check before starting**:

- If `.claude/epics/{project-id}/research.md` exists → Skip to Step 4
- If not exists → Continue

### 3.1 Extract Scope from requirements.md

Read `.claude/epics/{project-id}/requirements.md` scope section:

- In-scope apps (with `apps/` prefix)
- In-scope modules (if specified)
- Out-of-scope warnings

### 3.2 Time-Boxed Research (Maximum 5 iterations)

**CRITICAL**: Research is **DISCOVERY ONLY** - no design decisions, no prescriptions.

**Iteration 1 (2 minutes) - Discovery + Structure**:

- ✅ Verify imports from apps (scope verification)
- ✅ Find file locations (exact paths)
- ✅ Discover existing patterns and structure
- ✅ Document current dependencies

**Use Serena MCP tools**:

- `mcp__serena__find_file` - Find files (get exact paths)
- `mcp__serena__search_for_pattern` - Search patterns (find imports, usage)
- `mcp__serena__get_symbols_overview` - Get structure (understand file organization)
- `mcp__serena__find_symbol` - Read symbols (extract code patterns)
- `mcp__serena__find_referencing_symbols` - Track usage (understand dependencies)

**Confidence Check (After Iteration 1)**:

- ✅ **HIGH**: Sufficient understanding of current state → Proceed to write research.md
- ⚠️ **MEDIUM**: Need more context about patterns → Ask user: extend 1 more minute?
- ❌ **LOW**: Significant gaps in understanding → Ask user: extend 1 more minute?

**Iterations 2-5 (1 minute each)** - If needed:

- ✅ Reference source files with line ranges (e.g., "Pattern found at [file:15-45]")
- ✅ Discover additional patterns or dependencies
- ✅ Document test patterns and mocks

**Maximum iterations**: 5 (stop automatically after 6 minutes total)

**What Research Should NOT Do**:

- ❌ Prescribe what files to create/modify/delete
- ❌ Provide "copy-paste ready" implementation code
- ❌ Define implementation order
- ❌ Make architectural decisions

**That's the job of tech-design.md!**

### 3.3 App-First Import Tracing (Iteration 1)

For each in-scope app, find actual imports:

```typescript
// Search imports in app
mcp__serena__search_for_pattern({
  pattern: "from ['\"]@.*['\"]",
  relative_path: "apps/[app-name]/src",
  restrict_search_to_code_files: true
})
```

Document verified imports with file paths.

### 3.4 Research Verified Modules Only

For each verified import, research that specific module using `relative_path` parameter.

**Red Flags (STOP and re-verify)**:
🚩 Pattern matching without relative_path - scope drift
🚩 >10 affected modules - likely pattern matching, not import tracing
🚩 Similar names (bank-client vs bank-client-eu) - clarify explicitly

### 3.5 Create research.md

Write to `.claude/epics/{project-id}/research.md`:

```markdown
# Research: [Topic]

## Scope Verification (MANDATORY)

### [App Name]

**Verified imports**: [List with file:line confirmations]

**Scope Notes**: [Excluded items, naming clarifications]

## Summary

[3-5 sentence overview - verified in-scope items only]

## Current State

### Existing Files

[List files discovered with brief description of their current purpose]

- `apps/app/src/path/file.ts` - Current purpose and role
- `libs/module/src/path/file.ts` - Current purpose and role

### Import Dependencies

[Factual list of what imports what - no prescriptions]

**From apps/[app-name]**:

```typescript
import { Thing } from '@module/path';
```

**From libs/[module-name]**:

```typescript
import { Utility } from '@sygnum/package';
```

## Discovered Patterns

### Pattern: [Pattern Name]

**Location**: `file/path.ts:startLine-endLine`
**Description**: [What this pattern does]
**Key Dependencies**: [What it depends on]
**Structure**:

```typescript
// Reference code showing the pattern structure (not for copy-paste)
export const example = () => {
  // Pattern structure
};
```

### Pattern: [Another Pattern]

**Location**: `file/path.ts:startLine-endLine`
**Description**: [What this pattern does]
**Key Dependencies**: [What it depends on]

## Type Definitions Discovered

**Type/Interface Name**: `TypeName`
**Location**: `@sygnum/package/types/type.type`
**Structure**:

```typescript
interface TypeName {
  field1: string;
  field2: number;
}
```

## Test Patterns Discovered

**Test File**: `apps/app/src/path/file.spec.tsx`
**Mock Pattern**:

```typescript
jest.mock('@module/path', () => ({
  useHook: jest.fn(() => mockValue),
}));
```

## Research Assessment

- **Confidence**: [High/Medium/Low]
- **Iterations Used**: [N/5]
- **Key Findings**: [Bullet points of discovered facts]
- **Open Questions**: [Questions that need design decisions]
- **Ready for Design**: [Yes/No]

```

Auto-continue to Step 4.

---

## Step 4: Tech-Design

**Check before starting**:
- If `.claude/epics/{project-id}/tech-design.md` exists → Skip to Step 5
- If not exists → Continue

### 4.1 Parse Input

Read:
- `.claude/epics/{project-id}/requirements.md` (mandatory - WHAT and WHY)
- `.claude/epics/{project-id}/research.md` (mandatory - DISCOVERED FACTS)

**Use research.md findings** to inform design decisions:
- Current state analysis from "Existing Files"
- Import dependencies from "Import Dependencies"
- Discovered patterns from "Discovered Patterns"
- Test patterns from "Test Patterns Discovered"

**Now make design decisions** based on these facts:
- Which files to create/modify/delete
- Implementation approach and order
- How to adapt discovered patterns

### 4.2 Clarify Requirements (if needed)

Identify underspecified aspects: edge cases, error handling, integration points, scope boundaries.

If ambiguities exist, ask user for clarification. Wait for answers before proceeding.

### 4.3 Generate Technical Document

Write to `.claude/epics/{project-id}/tech-design.md`:

```markdown
---
date: [YYYY-MM-DD]
type: [Feature | Bug | Chore]
ticket: [Project ID]
specification_file: .claude/epics/{project-id}/requirements.md
research_file: .claude/epics/{project-id}/research.md
status: draft
last_updated: [YYYY-MM-DD]
last_updated_by: /plan command
---

# [Title - 3-8 words]

**Type**: [Feature | Bug | Chore]
**Project**: [Project ID]
**Date**: [Current date]
**Specification**: .claude/epics/{project-id}/requirements.md

## Introduction

[Max 100 words. Context and scope.]

## Current State

[CONDITIONAL: Only for features touching existing functionality. Not for bug fixes.]
[Max 150 words. Brief summary of current implementation.]

## Bug Description

[CONDITIONAL: Only for bug fixes. Not for features.]
[Max 300 words. Technical description including reproduction steps, impact, root cause.]

## Solution

[Max 1500 words excluding diagrams. Main components, interactions, design patterns, architectural decisions. High-level only - no code.]

### Solution Overview

[High-level description of the approach]

### File Operations

**Files to Create**:
- `path/to/new/file.ts` - Purpose and why it's needed
- `path/to/another/file.ts` - Purpose and why it's needed

**Files to Modify**:
- `path/to/existing/file.ts` - What changes and why
- `path/to/another/existing.ts` - What changes and why

**Files to Delete** (if applicable):
- `path/to/deprecated/file.ts` - Why it can be safely removed
- When it's safe to delete (after migration, after verification, etc.)

### Implementation Approach

[Step-by-step high-level approach - not detailed tasks, just strategy]

1. **Phase 1**: Description (Why this order makes sense architecturally)
2. **Phase 2**: Description (Dependencies on Phase 1)
3. **Phase 3**: Description (Final integration)

### Components and Responsibilities

[Key components and their roles - optional for simple tasks]

### Data Flow

[How data flows - optional for simple tasks]

### Design Decisions

[Key decisions and rationale]

### Integration Points

[How solution integrates with existing systems - optional if not applicable]

## Testing Considerations

[Max 200 words. Document WHAT needs testing, not HOW to test it.]

Include:
- What existing test files might reference this code
- What new behavior/components are being introduced
- What edge cases or error scenarios exist
- Whether this changes any public APIs or interfaces

**CRITICAL**: NEVER state "no tests required" or "testing not needed".

## Security Concerns

[CONDITIONAL: Only if security implications exist beyond standard best practices.]
[Max 200 words. Security issues that might arise.]

## Alternatives Considered

[CONDITIONAL: Only when meaningful alternatives exist.]
[Max 300 words. Alternative solutions with explanation of why not chosen.]

---
*Generated by /plan command*
```

Auto-continue to Step 5.

---

## Step 5: Implementation Plan

**Check before starting**:

- If `.claude/epics/{project-id}/plan.md` exists → Skip to Step 6
- If not exists → Continue

### 5.1 Read Specification

Read:

- `.claude/epics/{project-id}/requirements.md` (REQUIRED - WHAT and WHY)
- `.claude/epics/{project-id}/research.md` (optional - DISCOVERED FACTS)
- `.claude/epics/{project-id}/tech-design.md` (REQUIRED - DESIGN DECISIONS)

**Use tech-design.md as source of truth** for:

- File operations (create/modify/delete)
- Implementation approach (high-level phases)
- Design decisions and rationale

**Break down tech-design implementation approach into detailed tasks.**

### 5.2 Validate Scope

From requirements.md:

- Extract in-scope apps, modules, features
- Note out-of-scope items
- Flag ambiguities

If research.md exists:

- Read **Scope Verification** section
- Check for scope drift warnings

### 5.3 Determine Testing Strategy (MANDATORY)

**Testing Decision Tree** - For the ENTIRE feature/refactor:

**1. Will existing tests break?**
Search for test files that import/mock the code being changed:

```typescript
mcp__serena__search_for_pattern({
  substring_pattern: "[file-name-being-changed]|[function-being-moved]",
  paths_include_glob: "**/*.spec.{ts,tsx,js,jsx}"
})
```

If found → Tests need UPDATING

**2. Are we adding new code with no test coverage?**

- New components, hooks, functions, APIs
- If YES → NEW tests required

**3. Are we changing behavior?**

- Bug fixes, feature additions, logic changes
- If YES → Regression tests required

**4. Is this pure refactor + tests still work?**

- Variable renames, code moves within same file
- AND: Existing tests don't need mock/import updates
- If YES → "Run test suite to verify" only

**5. Is this docs/styling/config only?**

- README, JSDoc, CSS-only, non-code config
- If YES → "No test changes needed" (state explicitly)

Document testing requirements for each task.

### 5.4 Break Down Into Tasks

Create vertical slices (all layers + tests per task):

- Each task independently testable/committable
- Include testing requirements from step 5.3 in EVERY task
- 3-8 tasks per plan (fewer is better)

**Task Template**:

```markdown
## TASK-XXX: [Descriptive Technical Title]

**Status**: TODO
**Priority**: [Critical/High/Medium/Low]

**Description**:
[Clear technical description - WHAT to implement]
[Specific components, functions, modules, files]

**Goal**:
[Technical outcome - WHY this matters]

**Requirements**:

- [ ] Include ALL layers (DB, service, API, UI)
- [ ] Handle errors and edge cases
- [ ] Follow project standards
- [ ] Type-safe implementation
- [ ] NO JSDoc/comments (self-documenting code)

**Testing Requirements** (MANDATORY):

- [ ] Update test mocks: [specific files and changes] OR "No mocks to update"
- [ ] Write unit tests: [specific functions/hooks to test] OR "No new tests needed"
- [ ] Write integration tests: [specific flows to test] OR "No integration tests needed"
- [ ] Run test suite: npx nx test [app-name]
- [ ] Fix broken tests: [estimate or "none expected"]
  OR (only if truly no test work):
- [ ] No test changes needed: [explicit reason]

**Acceptance Criteria**:

- [ ] Implementation complete
- [ ] Build succeeds: npx nx build [app]
- [ ] Type checker passes: npx nx typecheck [app]
- [ ] Linter passes: npx nx lint [app]
- [ ] All tests pass: npx nx test [app]
- [ ] Feature works end-to-end (manual verification)
- [ ] Ready to commit

**Dependencies**:

- TASK-XXX: [Description] (or None)

**Notes**:

- [Implementation decisions, gotchas, links]
```

### 5.5 Self-Check (MANDATORY before writing)

**STOP and verify**:

**Testing**:

- ✅ Completed step 5.3 (Testing Strategy)
- ✅ EVERY task has "Testing Requirements" section
- ✅ At least ONE task includes "Run test suite: npx nx test [app]"
- ✅ Testing requirements are specific

**Task structure**:

- ✅ All tasks are vertical slices
- ✅ All Nx commands use `npx nx` prefix
- ✅ 3-6 tasks total

### 5.6 Create Plan

Write to `.claude/epics/{project-id}/plan.md`:

```markdown
# Implementation Plan: [Feature Name]

**Spec Location**: `.claude/epics/{project-id}/requirements.md`
**Created**: [Date]
**Domain**: [Backend/Frontend/etc]
**Total Tasks**: [N]
**Scope Validated**: [Yes - from where]

## Tasks

[All tasks using template above]

---

## Suggested Commit Message

```

[TICKET-ID] Brief description (50 chars max)

- Key change 1
- Key change 2
- Key change 3

This implements [summary of what was built].

```
```

Auto-continue to Step 6.

---

## Step 6: Summary

Show summary with status for each file (created, skipped, or already existed):

```markdown
✅ Planning workflow complete for {project-id}

Status:

- [✅ Created | ⏭️ Skipped (already exists)] requirements.md
- [✅ Created | ⏭️ Skipped (already exists)] research.md
- [✅ Created | ⏭️ Skipped (already exists)] tech-design.md
- [✅ Created | ⏭️ Skipped (already exists)] plan.md

All documents in: .claude/epics/{project-id}/

Next: Run /implement {project-id} to start coding
```

Ask user if they want to review documents or proceed with implementation.

---

## Critical Rules

**ALWAYS**:

- ✅ Use Serena MCP for ALL code research (Step 3)
- ✅ Research is DISCOVERY ONLY (no design decisions)
- ✅ Tech-design makes ALL file operation and implementation decisions
- ✅ Planning uses tech-design as source of truth (NOT research)
- ✅ Create vertical slice tasks (not layer-based)
- ✅ Include testing requirements in EVERY task
- ✅ Use `npx nx` prefix in all commands
- ✅ Check resume capability at each step

**NEVER**:

- ❌ Make design decisions in research.md (discovery only!)
- ❌ Prescribe file operations in research.md (that's tech-design's job!)
- ❌ Use research.md for implementation order (use tech-design.md!)
- ❌ Conduct additional research in planning phase
- ❌ Create layer-based tasks
- ❌ Use bare `nx` commands

---

**Now begin workflow.**
