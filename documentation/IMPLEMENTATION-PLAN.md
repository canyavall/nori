# Role-Based AI CLI - Implementation Plan

**Project:** Role-Based CLI for AI-Assisted Development
**Timeline:** 2 weeks (MVP) + 1 week (Production Polish)
**Team:** You + Claude Code (AI pair programming)
**Start Date:** Next week

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Week 1: MVP Development](#week-1-mvp-development)
4. [Week 2: Production Ready](#week-2-production-ready)
5. [Week 3: Polish & Launch](#week-3-polish--launch)
6. [Technical Specifications](#technical-specifications)
7. [Knowledge System](#knowledge-system)
8. [Permission System](#permission-system)
9. [Testing Strategy](#testing-strategy)
10. [Deployment](#deployment)

---

## Project Overview

### What We're Building

A role-based CLI wrapper around OpenCode/Claude Code that:

1. **Enforces organizational workflows** through roles (PO, FE, BE, QA, Architect)
2. **Loads intelligent knowledge** based on role + task tags
3. **Enforces read/write permissions** (PO can READ code, cannot WRITE code)
4. **Manages context efficiently** (single session, dynamic knowledge loading)
5. **Provides role-specific commands** (same command, different behavior per role)

### Why We're Building This

**Problems we're solving:**

1. **Knowledge overload** - 150+ knowledge files, can't load all at once
2. **Role confusion** - POs writing code, engineers writing requirements
3. **Context loss** - Multi-agent approach loses context between steps
4. **Cost inefficiency** - Knowledge re-loaded multiple times
5. **Steep learning curve** - Users need to understand AI, prompts, MCPs

**Solution:**

```bash
# User picks role
$ role-cli --role po

# Role defines behavior automatically
✅ Loads business knowledge (not React internals)
✅ Blocks code writing (enforces workflow)
✅ Enables Jira + Confluence MCPs
✅ Smart commands (/analyze = requirements analysis)

# User gets work done
$ role-cli /analyze TICKET-123
> [Perfect requirements analysis with relevant knowledge]
```

### Success Metrics

**Week 1 (MVP):**
- ✅ 3 roles implemented (PO, FE, BE)
- ✅ Permission system working (read/write enforcement)
- ✅ Knowledge loading working (core + role + tags)
- ✅ OpenCode wrapper functional
- ✅ 5 core commands working

**Week 2 (Production):**
- ✅ 5 roles complete (+ QA, Architect)
- ✅ Knowledge content created (100+ files organized)
- ✅ Documentation complete
- ✅ All tests passing
- ✅ Ready for team to use

**Week 3 (Launch):**
- ✅ Team onboarded
- ✅ Feedback collected
- ✅ Polish applied
- ✅ Production deployment

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      User (Human)                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Role-Based CLI                           │
│  - Role selection                                           │
│  - Command routing                                          │
│  - Permission enforcement                                   │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────────┐    ┌──────────────┐
│ Knowledge    │    │ Permission       │    │ OpenCode     │
│ Loader       │    │ Enforcer         │    │ Wrapper      │
│              │    │                  │    │              │
│ - Core       │    │ - canRead()      │    │ - Session    │
│ - Role       │    │ - canWrite()     │    │ - Execute    │
│ - Tags       │    │ - enforce()      │    │ - Parse      │
└──────────────┘    └──────────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    OpenCode / Claude Code                   │
│  - LLM orchestration                                        │
│  - Tool execution (Read, Write, Edit, Bash, etc.)          │
│  - Session management                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Anthropic API                            │
│  - Claude Sonnet 4                                          │
│  - System prompt caching                                    │
└─────────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### 1. Role System

**File:** `src/roles/index.ts`

```typescript
export interface Role {
  id: "po" | "fe" | "be" | "qa" | "arch"
  name: string
  systemPrompt: string
  permissions: {
    canRead: ResourcePermissions
    canWrite: ResourcePermissions
  }
  knowledgeCategories: string[]
  mcpAccess: Record<string, "full" | "readonly" | "blocked">
}
```

#### 2. Permission System

**File:** `src/permissions/enforcer.ts`

```typescript
export class PermissionEnforcer {
  constructor(private role: Role) {}

  canRead(resource: Resource): boolean
  canWrite(resource: Resource): boolean
  enforceRead(resource: Resource): void
  enforceWrite(resource: Resource): void
}
```

#### 3. Knowledge System

**File:** `src/knowledge/loader.ts`

```typescript
export class KnowledgeLoader {
  async load(role: Role, task: string): Promise<string>
  private async loadCore(): Promise<string[]>
  private async loadRoleKnowledge(role: Role): Promise<string[]>
  private async loadTagKnowledge(tags: string[]): Promise<string[]>
  private async analyzeTags(task: string): Promise<string[]>
}
```

#### 4. OpenCode Wrapper

**File:** `src/executor/opencode.ts`

```typescript
export class OpenCodeExecutor {
  async execute(params: ExecuteParams): Promise<ExecutionResult>
  private async createSession(systemPrompt: string): Promise<Session>
  private async parseOperations(result: any): Promise<Operation[]>
  private async enforceWritePermissions(ops: Operation[]): Promise<void>
}
```

#### 5. CLI Interface

**File:** `src/cli/index.ts`

```typescript
export class RoleBasedCLI {
  async run(): Promise<void>
  private async selectRole(): Promise<Role>
  private async executeCommand(command: string): Promise<void>
  private async expandContext(additionalRole: Role): Promise<void>
}
```

---

## Week 1: MVP Development

### Day 1: Project Setup + Core Types (8 hours)

**Morning (4 hours):**

1. **Initialize project** (30 min)
   ```bash
   mkdir role-based-cli
   cd role-based-cli
   bun init
   ```

2. **Install dependencies** (30 min)
   ```bash
   bun add @anthropic-ai/sdk
   bun add commander inquirer chalk ora
   bun add -d @types/node @types/inquirer typescript
   ```

3. **Create project structure** (1 hour)
   ```
   role-based-cli/
   ├── src/
   │   ├── roles/
   │   │   ├── index.ts
   │   │   └── definitions.ts
   │   ├── permissions/
   │   │   ├── index.ts
   │   │   └── enforcer.ts
   │   ├── knowledge/
   │   │   ├── index.ts
   │   │   ├── loader.ts
   │   │   └── map.ts
   │   ├── executor/
   │   │   ├── index.ts
   │   │   └── opencode.ts
   │   ├── cli/
   │   │   └── index.ts
   │   └── types/
   │       └── index.ts
   ├── knowledge/
   │   ├── core/
   │   ├── roles/
   │   │   ├── po/
   │   │   ├── fe/
   │   │   ├── be/
   │   │   ├── qa/
   │   │   └── arch/
   │   └── tags/
   ├── tests/
   └── docs/
   ```

4. **Define core types** (2 hours - AI-assisted)

   **Prompt for Claude:**
   ```
   Create TypeScript types for a role-based CLI system with:

   1. Role interface with:
      - id, name, systemPrompt
      - permissions (canRead/canWrite for: code, tests, designs, docs, tickets, database)
      - knowledgeCategories array
      - mcpAccess record (full/readonly/blocked)

   2. Resource interface with:
      - type, path

   3. Permission types

   4. Execution types

   Use Zod for runtime validation.
   ```

**Afternoon (4 hours):**

5. **Define 3 roles** (PO, FE, BE) (2 hours)

   **Task:** Write role definitions in `src/roles/definitions.ts`

   **For each role, define:**
   - System prompt (persona, responsibilities, constraints)
   - Read permissions (what they can see)
   - Write permissions (what they can modify)
   - Knowledge categories
   - MCP access

6. **Create role registry** (1 hour)

   **File:** `src/roles/index.ts`

   ```typescript
   import { ROLES } from './definitions'

   export function getRole(roleId: string): Role {
     const role = ROLES[roleId]
     if (!role) throw new Error(`Unknown role: ${roleId}`)
     return role
   }
   ```

7. **Write tests for role system** (1 hour - AI-assisted)

   **Prompt for Claude:**
   ```
   Generate comprehensive tests for role definitions:
   - Test role retrieval
   - Test permission structure
   - Test system prompt presence
   - Test knowledge categories
   ```

**Deliverables:**
- ✅ Project structure created
- ✅ Core types defined
- ✅ 3 roles defined (PO, FE, BE)
- ✅ Tests passing

---

### Day 2: Permission System (8 hours)

**Morning (4 hours):**

1. **Implement PermissionEnforcer** (3 hours - AI-assisted)

   **Prompt for Claude:**
   ```
   Implement PermissionEnforcer class with:

   Methods:
   - canRead(resource: Resource): boolean
   - canWrite(resource: Resource): boolean
   - enforceRead(resource: Resource): void (throws if denied)
   - enforceWrite(resource: Resource): void (throws if denied)

   Private methods:
   - detectResourceType(resource: Resource): ResourceType
   - getSuggestion(resource: Resource): string (helpful error messages)

   Resource type detection:
   - *.ts, *.tsx, *.js, *.jsx → "code"
   - *.spec.*, *.test.* → "tests"
   - *.figma → "designs"
   - *.md, *.txt → "docs"
   - jira-*, ticket-* → "tickets"
   - *.sql, schema.* → "database"
   ```

2. **Create custom error types** (1 hour)

   **File:** `src/permissions/errors.ts`

   ```typescript
   export class PermissionDeniedError extends Error {
     constructor(
       message: string,
       public resource: Resource,
       public role: Role,
       public suggestion: string
     ) {
       super(message)
     }
   }
   ```

**Afternoon (4 hours):**

3. **Write comprehensive tests** (2 hours - AI-assisted)

   **Prompt for Claude:**
   ```
   Generate test suite for PermissionEnforcer covering:

   For each role (PO, FE, BE):
   - Test canRead for all resource types
   - Test canWrite for all resource types
   - Test enforceRead throws on denied
   - Test enforceWrite throws on denied
   - Test error messages are helpful
   - Test suggestions point to correct role

   Edge cases:
   - Unknown resource type
   - Null/undefined resource
   - Invalid role
   ```

4. **Manual testing** (1 hour)

   **Test scenarios:**
   ```typescript
   // PO tries to read code (should allow)
   // PO tries to write code (should deny)
   // FE tries to write code (should allow)
   // BE tries to write database (should allow)
   // FE tries to write database (should deny)
   ```

5. **Polish error messages** (1 hour)

   **Make errors helpful:**
   ```
   ❌ Product Owner cannot write code

   You tried to edit: src/components/Button.tsx

   Your role (Product Owner) can:
   ✅ Read code to understand complexity
   ✅ Write requirements and user stories

   To write code, either:
   1. Switch to 'fe' role: role-cli --role fe
   2. Assign ticket to frontend engineer
   ```

**Deliverables:**
- ✅ PermissionEnforcer implemented
- ✅ Custom error types
- ✅ Comprehensive tests passing
- ✅ Helpful error messages

---

### Day 3: Knowledge System (8 hours)

**Morning (4 hours):**

1. **Create knowledge map** (2 hours)

   **File:** `src/knowledge/map.ts`

   ```typescript
   export const KNOWLEDGE_MAP = {
     // Core (always loaded)
     core: [
       "knowledge/core/company-overview.md",
       "knowledge/core/coding-standards.md",
       "knowledge/core/git-workflow.md"
     ],

     // Role-specific
     roles: {
       po: [
         "knowledge/roles/po/product-strategy.md",
         "knowledge/roles/po/requirements-template.md",
         "knowledge/roles/po/user-story-guide.md"
       ],
       fe: [
         "knowledge/roles/fe/react-patterns.md",
         "knowledge/roles/fe/component-library.md",
         "knowledge/roles/fe/testing-guide.md"
       ],
       be: [
         "knowledge/roles/be/api-design.md",
         "knowledge/roles/be/database-guide.md",
         "knowledge/roles/be/microservices.md"
       ]
     },

     // Tag-based (loaded dynamically)
     tags: {
       auth: ["knowledge/tags/auth/oauth.md", "knowledge/tags/auth/jwt.md"],
       payments: ["knowledge/tags/payments/stripe.md"],
       ui: ["knowledge/tags/ui/design-system.md"],
       api: ["knowledge/tags/api/rest.md", "knowledge/tags/api/graphql.md"]
     }
   }
   ```

2. **Implement KnowledgeLoader** (2 hours - AI-assisted)

   **Prompt for Claude:**
   ```
   Implement KnowledgeLoader class with:

   Main method:
   - load(role: Role, task: string): Promise<string>
     1. Load core knowledge
     2. Load role-specific knowledge
     3. Analyze task for tags (using Anthropic API)
     4. Filter tags by role permissions
     5. Load tag knowledge
     6. Concatenate all knowledge

   Private methods:
   - loadCore(): Promise<string[]>
   - loadRoleKnowledge(role: Role): Promise<string[]>
   - loadTagKnowledge(tags: string[]): Promise<string[]>
   - analyzeTags(task: string): Promise<string[]>
   - filterTagsByRole(tags: string[], role: Role): string[]
   - concatenate(files: string[]): string
   ```

**Afternoon (4 hours):**

3. **Implement tag analysis** (2 hours)

   **Use Haiku for cheap tag extraction:**

   ```typescript
   private async analyzeTags(task: string): Promise<string[]> {
     const response = await this.anthropic.messages.create({
       model: "claude-3-haiku-20240307",
       max_tokens: 100,
       messages: [{
         role: "user",
         content: `Extract tags from this task. Return ONLY a JSON array.

   Available tags: auth, payments, ui, api, database, testing, deployment

   Task: ${task}

   Output format: ["tag1", "tag2"]`
       }]
     })

     return JSON.parse(response.content[0].text)
   }
   ```

4. **Create sample knowledge files** (1 hour)

   **Create placeholder files:**
   - `knowledge/core/company-overview.md`
   - `knowledge/roles/po/requirements-template.md`
   - `knowledge/roles/fe/react-patterns.md`
   - `knowledge/tags/auth/oauth.md`

   **Content:** Simple placeholders for now, will expand in Week 2

5. **Write tests** (1 hour - AI-assisted)

   **Test:**
   - Core knowledge loading
   - Role knowledge loading
   - Tag analysis
   - Tag filtering by role
   - Full knowledge concatenation

**Deliverables:**
- ✅ Knowledge map created
- ✅ KnowledgeLoader implemented
- ✅ Tag analysis working
- ✅ Sample knowledge files
- ✅ Tests passing

---

### Day 4: OpenCode Wrapper (8 hours)

**Morning (4 hours):**

1. **Study OpenCode API** (1 hour)

   **Read:**
   - `opencode-fork/packages/opencode/src/session/index.ts`
   - `opencode-fork/packages/opencode/src/command/index.ts`
   - Understand session creation, command execution

2. **Implement OpenCodeExecutor** (3 hours - AI-assisted)

   **Prompt for Claude:**
   ```
   Implement OpenCodeExecutor class that wraps OpenCode client:

   Methods:
   - execute(params: ExecuteParams): Promise<ExecutionResult>
     1. Create OpenCode session with custom system prompt
     2. Execute command
     3. Parse operations from result
     4. Return structured result

   - createSession(systemPrompt: string): Promise<Session>
   - parseOperations(result: any): Promise<Operation[]>
     Detect: read, write, edit, bash commands

   Types:
   - ExecuteParams: { role: Role, command: string, systemPrompt: string }
   - ExecutionResult: { output: string, operations: Operation[] }
   - Operation: { type: "read" | "write" | "edit", resource: Resource }
   ```

**Afternoon (4 hours):**

3. **Test integration with OpenCode** (2 hours)

   **Setup OpenCode:**
   ```bash
   cd opencode-fork
   bun install
   bun run build
   ```

   **Test basic execution:**
   ```typescript
   const executor = new OpenCodeExecutor(opencodeClient)
   const result = await executor.execute({
     role: getRole("fe"),
     command: "/read src/App.tsx",
     systemPrompt: "You are a frontend engineer..."
   })
   ```

4. **Handle edge cases** (1 hour)

   **Test:**
   - OpenCode errors
   - Invalid commands
   - Timeouts
   - Session cleanup

5. **Write integration tests** (1 hour)

   **Test:**
   - Session creation
   - Command execution
   - Operation parsing
   - Error handling

**Deliverables:**
- ✅ OpenCodeExecutor implemented
- ✅ Integration with OpenCode working
- ✅ Operation parsing working
- ✅ Tests passing

---

### Day 5: CLI Interface (8 hours)

**Morning (4 hours):**

1. **Implement CLI skeleton** (2 hours - AI-assisted)

   **Prompt for Claude:**
   ```
   Implement RoleBasedCLI class:

   Methods:
   - run(): Promise<void>
     1. Show welcome message
     2. Select role (interactive)
     3. Show role info
     4. Enter command loop

   - selectRole(): Promise<Role>
     Use inquirer for interactive selection

   - executeCommand(command: string): Promise<void>
     1. Load knowledge
     2. Build system prompt
     3. Call executor
     4. Enforce permissions
     5. Display output

   - handleError(error: Error): void
     Pretty error messages
   ```

2. **Add interactive prompts** (1 hour)

   **Use inquirer:**
   ```typescript
   private async selectRole(): Promise<Role> {
     const { roleId } = await inquirer.prompt([{
       type: 'list',
       name: 'roleId',
       message: 'Select your role:',
       choices: [
         { name: '🎯 Product Owner', value: 'po' },
         { name: '💻 Frontend Engineer', value: 'fe' },
         { name: '⚙️  Backend Engineer', value: 'be' }
       ]
     }])

     return getRole(roleId)
   }
   ```

3. **Add color output** (1 hour)

   **Use chalk:**
   ```typescript
   console.log(chalk.green('✅ Role: Product Owner'))
   console.log(chalk.blue('📚 Knowledge: business, requirements, product-strategy'))
   console.log(chalk.yellow('🔧 MCPs: jira (full), confluence (full), figma (readonly)'))
   ```

**Afternoon (4 hours):**

4. **Implement core commands** (2 hours)

   **Commands:**
   - `/analyze <task>` - Analyze from role perspective
   - `/implement <task>` - Implement (if role allows)
   - `/review <target>` - Review from role perspective
   - `/expand-context <role>` - Add additional role context
   - `/exit` - Exit CLI

5. **Add permission enforcement** (1 hour)

   **Before executing:**
   ```typescript
   private async executeCommand(command: string) {
     try {
       // Load knowledge
       const knowledge = await this.knowledge.load(this.role, command)

       // Build system prompt
       const systemPrompt = this.buildSystemPrompt(this.role, knowledge)

       // Execute
       const result = await this.executor.execute({
         role: this.role,
         command,
         systemPrompt
       })

       // Enforce write permissions
       for (const op of result.operations) {
         if (op.type === "write" || op.type === "edit") {
           this.enforcer.enforceWrite(op.resource)
         }
       }

       console.log(result.output)

     } catch (error) {
       this.handleError(error)
     }
   }
   ```

6. **Manual E2E testing** (1 hour)

   **Test full workflow:**
   ```bash
   $ role-cli
   ? Select your role: Product Owner

   ✅ Role: Product Owner
   📚 Knowledge: business, requirements, product-strategy
   🔧 MCPs: jira, confluence, figma (readonly)

   $ /analyze "TICKET-123: OAuth login"
   > [AI analyzes from PO perspective...]

   $ /implement "Add login button"
   > ❌ Product Owners cannot write code
   ```

**Deliverables:**
- ✅ CLI interface working
- ✅ Interactive role selection
- ✅ Core commands implemented
- ✅ Permission enforcement working
- ✅ E2E tests passing

---

## Week 2: Production Ready

### Day 6-7: Knowledge Content Creation (16 hours)

**Goal:** Create comprehensive knowledge base

**Core Knowledge (4 hours):**
1. Company overview
2. Coding standards
3. Git workflow
4. Security policies
5. Architecture overview

**Role-Specific Knowledge (8 hours):**

**Product Owner (2 hours):**
- Product strategy framework
- Requirements template
- User story guide
- Acceptance criteria examples
- Prioritization framework

**Frontend Engineer (2 hours):**
- React patterns
- Component library guide
- Testing best practices
- Accessibility guidelines
- Performance optimization

**Backend Engineer (2 hours):**
- API design principles
- Database schema guide
- Microservices architecture
- Security best practices
- Performance tuning

**QA Engineer (1 hour):**
- Test strategy
- Automation framework
- Performance testing
- E2E testing guide

**Architect (1 hour):**
- System design principles
- Architecture decision records
- Technology evaluation framework
- Scalability patterns

**Tag-Based Knowledge (4 hours):**
- Authentication (OAuth, JWT, sessions)
- Payments (Stripe, webhooks)
- UI (design system, components)
- API (REST, GraphQL)
- Database (schema, migrations)
- Testing (unit, integration, E2E)
- Deployment (CI/CD, Docker)

**Deliverables:**
- ✅ 50+ knowledge files created
- ✅ Well-organized by category
- ✅ Practical, actionable content

---

### Day 8: Additional Roles + Polish (8 hours)

**Morning (4 hours):**

1. **Add QA role** (2 hours)

   **Define:**
   - System prompt (QA persona)
   - Permissions (can write tests, not app code)
   - Knowledge categories
   - MCP access

2. **Add Architect role** (2 hours)

   **Define:**
   - System prompt (Architect persona)
   - Permissions (can read all, write docs/designs)
   - Knowledge categories
   - MCP access (full visibility)

**Afternoon (4 hours):**

3. **Implement context expansion** (2 hours - AI-assisted)

   **Feature:** Allow PO to temporarily access FE knowledge

   ```typescript
   private async expandContext(additionalRole: Role) {
     console.log(`Expanding context with ${additionalRole.name} knowledge...`)

     // Load additional knowledge
     const additionalKnowledge = await this.knowledge.loadRoleKnowledge(additionalRole)

     // Merge with current knowledge
     this.currentKnowledge += "\n\n" + additionalKnowledge

     // Update system prompt
     this.systemPrompt += `\n\nCONTEXT EXPANSION:\n${additionalKnowledge}`

     console.log('✅ Context expanded. You can now ask questions about ${additionalRole.name} topics.')
   }
   ```

4. **Add command aliases** (1 hour)

   ```typescript
   const COMMAND_ALIASES = {
     "/a": "/analyze",
     "/i": "/implement",
     "/r": "/review",
     "/e": "/expand-context"
   }
   ```

5. **Improve error handling** (1 hour)

   **Better errors:**
   - Network errors (Anthropic API down)
   - OpenCode errors (session timeout)
   - File not found
   - Permission denied

**Deliverables:**
- ✅ 5 roles complete
- ✅ Context expansion working
- ✅ Command aliases
- ✅ Robust error handling

---

### Day 9: Testing & Documentation (8 hours)

**Morning (4 hours):**

1. **Complete test coverage** (3 hours - AI-assisted)

   **Tests needed:**
   - Unit tests (all components)
   - Integration tests (OpenCode wrapper)
   - E2E tests (full workflows)
   - Permission tests (all roles × all resources)

   **Prompt for Claude:**
   ```
   Generate comprehensive test suite covering:
   - All 5 roles
   - All permissions (read/write)
   - All commands
   - Knowledge loading
   - Error handling
   - Edge cases
   ```

2. **Fix failing tests** (1 hour)

**Afternoon (4 hours):**

3. **Write user documentation** (3 hours)

   **Create:**
   - `README.md` - Project overview, installation
   - `docs/GETTING-STARTED.md` - Quick start guide
   - `docs/ROLES.md` - Role comparison table
   - `docs/COMMANDS.md` - Command reference
   - `docs/KNOWLEDGE.md` - How knowledge system works
   - `docs/TROUBLESHOOTING.md` - Common issues

4. **Create video demo** (1 hour)

   **Record:**
   - Installation
   - Role selection
   - Running commands
   - Permission enforcement in action

**Deliverables:**
- ✅ 90%+ test coverage
- ✅ All tests passing
- ✅ Complete documentation
- ✅ Demo video

---

### Day 10: Integration Testing & Bug Fixes (8 hours)

**Full Day:**

1. **E2E testing with real scenarios** (4 hours)

   **Test workflows:**

   **Scenario 1: PO analyzing ticket**
   ```bash
   $ role-cli --role po
   $ /analyze "TICKET-123: Add OAuth login"
   Expected: Requirements analysis with acceptance criteria
   ```

   **Scenario 2: FE implementing feature**
   ```bash
   $ role-cli --role fe
   $ /implement "Add login button component"
   Expected: Creates Button.tsx with tests
   ```

   **Scenario 3: BE creating API**
   ```bash
   $ role-cli --role be
   $ /implement "Create /auth/login endpoint"
   Expected: Creates API endpoint with validation
   ```

   **Scenario 4: QA writing tests**
   ```bash
   $ role-cli --role qa
   $ /implement "E2E test for OAuth flow"
   Expected: Creates Cypress test
   ```

   **Scenario 5: Permission denied**
   ```bash
   $ role-cli --role po
   $ /implement "Add login button"
   Expected: Error with helpful message
   ```

2. **Fix bugs** (3 hours)

   **Common issues:**
   - Knowledge loading slow (add caching)
   - Tag analysis inaccurate (improve prompt)
   - OpenCode errors not handled
   - Permission checks too strict/loose

3. **Performance optimization** (1 hour)

   **Optimize:**
   - Cache knowledge files
   - Cache tag analysis results
   - Parallel file loading
   - Reduce API calls

**Deliverables:**
- ✅ All scenarios working
- ✅ All bugs fixed
- ✅ Performance optimized
- ✅ Ready for production

---

## Week 3: Polish & Launch

### Day 11-12: Team Onboarding (16 hours)

**Day 11 (8 hours):**

1. **Setup for 3 team members** (2 hours)

   **Install on each machine:**
   ```bash
   git clone <repo>
   cd role-based-cli
   bun install
   bun run build
   bun link
   ```

2. **Training session** (3 hours)

   **Cover:**
   - Why we built this
   - How roles work
   - Permission system
   - Commands overview
   - Live demo

3. **Hands-on practice** (3 hours)

   **Each person:**
   - Select their role
   - Run real tasks
   - Hit permission errors
   - Learn workflow

**Day 12 (8 hours):**

4. **Collect feedback** (2 hours)

   **Questions:**
   - Is role selection intuitive?
   - Are commands discoverable?
   - Are error messages helpful?
   - Is knowledge relevant?
   - What's missing?

5. **Iterate based on feedback** (4 hours)

   **Common fixes:**
   - Unclear error messages → Rewrite
   - Missing knowledge → Add files
   - Commands confusing → Rename/add aliases
   - Permissions too strict → Adjust

6. **Polish UX** (2 hours)

   **Improvements:**
   - Better welcome message
   - Progress indicators
   - Colored output
   - Helpful hints

**Deliverables:**
- ✅ 3+ team members trained
- ✅ Feedback collected
- ✅ UX improvements applied

---

### Day 13: Production Deployment (8 hours)

**Morning (4 hours):**

1. **Create deployment package** (1 hour)

   ```bash
   bun run build
   bun run test
   npm pack
   ```

2. **Setup internal npm registry** (1 hour)

   **Or publish to company npm:**
   ```bash
   npm publish --registry https://npm.company.com
   ```

3. **Create installation script** (1 hour)

   **File:** `install.sh`
   ```bash
   #!/bin/bash
   npm install -g @company/role-cli
   role-cli setup
   ```

4. **Write deployment docs** (1 hour)

   **File:** `docs/DEPLOYMENT.md`
   - Installation instructions
   - Configuration
   - Troubleshooting
   - Support contact

**Afternoon (4 hours):**

5. **Deploy to production** (2 hours)

   **Steps:**
   - Publish package
   - Send installation instructions to team
   - Monitor for issues
   - Be available for support

6. **Monitor usage** (1 hour)

   **Track:**
   - Number of users
   - Most used commands
   - Error rates
   - Performance metrics

7. **Celebrate! 🎉** (1 hour)

   **Team retrospective:**
   - What went well
   - What was challenging
   - What we learned
   - Next improvements

**Deliverables:**
- ✅ Production deployment
- ✅ Team using the tool
- ✅ Monitoring in place
- ✅ Support available

---

## Technical Specifications

### Role Definitions

#### Product Owner

```typescript
{
  id: "po",
  name: "Product Owner",
  systemPrompt: `You are a senior Product Owner with 8+ years of experience.

YOUR IDENTITY:
- Analyze requirements from business perspective
- Write user stories with clear acceptance criteria
- Define business value and prioritization
- Communicate with stakeholders
- Focus on WHAT and WHY, not HOW

YOUR CONSTRAINTS:
- You CANNOT write code
- You CANNOT modify tests
- You CANNOT edit designs (Figma)
- You CAN read all of the above for context

YOUR WORKFLOW:
1. Analyze ticket/request from business perspective
2. Write detailed user stories
3. Define acceptance criteria
4. Identify open questions
5. Communicate with engineers for estimates

YOUR TOOLS:
- Read: All files (code, tests, designs, docs)
- Write: Requirements docs, user stories, tickets
- Jira: Full access (create/edit tickets)
- Confluence: Full access (write docs)
- Figma: Read-only (view designs)
- GitHub: Read-only (track progress)`,

  permissions: {
    canRead: {
      code: true,
      tests: true,
      designs: true,
      docs: true,
      tickets: true,
      database: false
    },
    canWrite: {
      code: false,
      tests: false,
      designs: false,
      docs: true,
      tickets: true,
      database: false
    }
  },

  knowledgeCategories: [
    "core",
    "business",
    "product-strategy",
    "requirements",
    "user-stories"
  ],

  mcpAccess: {
    jira: "full",
    confluence: "full",
    figma: "readonly",
    github: "readonly",
    database: "blocked",
    aws: "blocked"
  }
}
```

#### Frontend Engineer

```typescript
{
  id: "fe",
  name: "Frontend Engineer",
  systemPrompt: `You are a senior Frontend Engineer specializing in React/TypeScript.

YOUR IDENTITY:
- Implement UI components from designs
- Write accessible, performant, maintainable code
- Follow design system guidelines
- Write unit and integration tests
- Collaborate with designers and backend engineers

YOUR CONSTRAINTS:
- Follow ESLint and Prettier rules
- Use design system components (Chakra UI)
- Write tests for all new components
- Ensure WCAG 2.1 AA accessibility
- Get approval for design changes

YOUR WORKFLOW:
1. Review Figma designs
2. Implement component structure
3. Add styles following design system
4. Write component tests
5. Test accessibility
6. Create PR for review

YOUR TOOLS:
- Read/Write: Frontend code (src/components/, src/pages/)
- Read: Backend code (for API types)
- Write: Frontend tests
- Figma: Read designs, extract specs
- Storybook: Document components`,

  permissions: {
    canRead: {
      code: true,
      tests: true,
      designs: true,
      docs: true,
      tickets: true,
      database: false
    },
    canWrite: {
      code: true,  // Only frontend code
      tests: true,  // Only frontend tests
      designs: false,
      docs: true,
      tickets: true,
      database: false
    }
  },

  knowledgeCategories: [
    "core",
    "frontend",
    "react",
    "typescript",
    "design-system",
    "testing",
    "accessibility"
  ],

  mcpAccess: {
    figma: "full",
    storybook: "full",
    github: "full",
    jira: "readonly",
    database: "blocked",
    aws: "blocked"
  }
}
```

#### Backend Engineer

```typescript
{
  id: "be",
  name: "Backend Engineer",
  systemPrompt: `You are a senior Backend Engineer specializing in Node.js/TypeScript APIs.

YOUR IDENTITY:
- Design and implement RESTful APIs
- Manage database schemas and migrations
- Ensure security, performance, scalability
- Write integration and unit tests
- Collaborate with frontend engineers

YOUR CONSTRAINTS:
- Follow API design principles (REST/GraphQL)
- Write database migrations (never direct schema changes)
- Implement authentication and authorization
- Handle errors gracefully
- Log all security-relevant events

YOUR WORKFLOW:
1. Design API endpoints
2. Define database schema changes
3. Implement business logic
4. Write tests (unit + integration)
5. Document API (OpenAPI/Swagger)
6. Create PR for review

YOUR TOOLS:
- Read/Write: Backend code (src/api/, src/services/)
- Read: Frontend code (for API contract)
- Write: Backend tests, migrations
- Database: Full access (schema, queries)
- AWS: Deployment access`,

  permissions: {
    canRead: {
      code: true,
      tests: true,
      designs: true,
      docs: true,
      tickets: true,
      database: true
    },
    canWrite: {
      code: true,  // Only backend code
      tests: true,  // Only backend tests
      designs: false,
      docs: true,
      tickets: true,
      database: true
    }
  },

  knowledgeCategories: [
    "core",
    "backend",
    "api-design",
    "database",
    "security",
    "performance",
    "microservices"
  ],

  mcpAccess: {
    database: "full",
    aws: "full",
    github: "full",
    jira: "readonly",
    figma: "readonly"
  }
}
```

#### QA Engineer

```typescript
{
  id: "qa",
  name: "QA Engineer",
  systemPrompt: `You are a senior QA Engineer specializing in test automation.

YOUR IDENTITY:
- Design comprehensive test strategies
- Write automated tests (unit, integration, E2E)
- Perform manual testing for UX/edge cases
- Identify bugs and regression issues
- Ensure quality standards

YOUR CONSTRAINTS:
- You CANNOT modify application code
- You CAN write test code (any type)
- You MUST verify all acceptance criteria
- You MUST test edge cases
- You MUST ensure accessibility

YOUR WORKFLOW:
1. Review requirements and acceptance criteria
2. Design test strategy (what to test)
3. Write automated tests
4. Perform manual testing
5. Document bugs in Jira
6. Verify bug fixes

YOUR TOOLS:
- Read: All code (to understand what to test)
- Write: All tests (unit, integration, E2E)
- Jira: Full access (create bug reports)
- Test runners: Jest, Cypress, Playwright`,

  permissions: {
    canRead: {
      code: true,
      tests: true,
      designs: true,
      docs: true,
      tickets: true,
      database: true
    },
    canWrite: {
      code: false,
      tests: true,  // All test types
      designs: false,
      docs: true,
      tickets: true,
      database: false
    }
  },

  knowledgeCategories: [
    "core",
    "testing",
    "qa-strategy",
    "automation",
    "performance-testing",
    "accessibility-testing"
  ],

  mcpAccess: {
    jira: "full",
    github: "readonly",
    database: "readonly",
    figma: "readonly"
  }
}
```

#### Architect

```typescript
{
  id: "arch",
  name: "Architect",
  systemPrompt: `You are a senior Software Architect with 10+ years of experience.

YOUR IDENTITY:
- Design system architecture
- Make technology decisions
- Evaluate scalability and performance
- Define technical standards
- Guide engineering teams

YOUR CONSTRAINTS:
- You DESIGN, you don't implement
- You REVIEW, you don't write code
- You DECIDE on technology, not business features
- You DOCUMENT decisions (ADRs)
- You GUIDE teams, not dictate

YOUR WORKFLOW:
1. Understand business requirements
2. Design system architecture
3. Evaluate technology options
4. Write architecture decision records (ADRs)
5. Review implementations
6. Ensure best practices

YOUR TOOLS:
- Read: All code, designs, docs
- Write: Architecture docs, ADRs, diagrams
- Review: PRs, designs, technical decisions
- Full visibility: All systems, databases, AWS`,

  permissions: {
    canRead: {
      code: true,
      tests: true,
      designs: true,
      docs: true,
      tickets: true,
      database: true
    },
    canWrite: {
      code: false,  // Architects design, don't implement
      tests: false,
      designs: true,  // Architecture diagrams
      docs: true,  // ADRs, architecture docs
      tickets: true,
      database: false  // Design schema, don't execute
    }
  },

  knowledgeCategories: [
    "core",
    "architecture",
    "system-design",
    "scalability",
    "technology-evaluation",
    "best-practices"
  ],

  mcpAccess: {
    github: "full",
    aws: "readonly",
    database: "readonly",
    jira: "readonly",
    figma: "full",
    confluence: "full"
  }
}
```

---

## Knowledge System

### Directory Structure

```
knowledge/
├── core/                           # Always loaded (10-15KB)
│   ├── company-overview.md
│   ├── coding-standards.md
│   ├── git-workflow.md
│   ├── security-policy.md
│   └── architecture-overview.md
│
├── roles/                          # Loaded per role (20-30KB)
│   ├── po/
│   │   ├── product-strategy.md
│   │   ├── requirements-template.md
│   │   ├── user-story-guide.md
│   │   └── prioritization.md
│   ├── fe/
│   │   ├── react-patterns.md
│   │   ├── component-library.md
│   │   ├── testing-guide.md
│   │   └── accessibility.md
│   ├── be/
│   │   ├── api-design.md
│   │   ├── database-guide.md
│   │   ├── microservices.md
│   │   └── security.md
│   ├── qa/
│   │   ├── test-strategy.md
│   │   ├── automation-framework.md
│   │   └── performance-testing.md
│   └── arch/
│       ├── system-design.md
│       ├── adr-template.md
│       └── tech-evaluation.md
│
└── tags/                           # Loaded dynamically (10-30KB)
    ├── auth/
    │   ├── oauth.md
    │   ├── jwt.md
    │   └── sessions.md
    ├── payments/
    │   ├── stripe.md
    │   └── webhooks.md
    ├── ui/
    │   ├── design-system.md
    │   └── components.md
    ├── api/
    │   ├── rest.md
    │   └── graphql.md
    ├── database/
    │   ├── schema.md
    │   └── migrations.md
    └── testing/
        ├── unit.md
        ├── integration.md
        └── e2e.md
```

### Knowledge Loading Strategy

```typescript
// Example: PO analyzing "TICKET-123: Add OAuth login"

// 1. Core knowledge (always loaded)
const core = [
  "knowledge/core/company-overview.md",      // 3KB
  "knowledge/core/coding-standards.md",      // 2KB
  "knowledge/core/git-workflow.md",          // 2KB
  "knowledge/core/security-policy.md",       // 3KB
]
// Total: 10KB

// 2. Role knowledge (PO-specific)
const roleKnowledge = [
  "knowledge/roles/po/product-strategy.md",    // 5KB
  "knowledge/roles/po/requirements-template.md", // 4KB
  "knowledge/roles/po/user-story-guide.md",    // 6KB
  "knowledge/roles/po/prioritization.md"       // 5KB
]
// Total: 20KB

// 3. Tag analysis (using Haiku)
const tags = await analyzeTags("TICKET-123: Add OAuth login")
// Result: ["auth", "ui"]

// 4. Filter tags by role (PO doesn't need implementation details)
const filteredTags = filterByRole(tags, "po")
// Result: ["auth"] (ui filtered out, too technical for PO)

// 5. Load tag knowledge
const tagKnowledge = [
  "knowledge/tags/auth/oauth.md"  // 8KB (business perspective)
]
// Total: 8KB

// Grand total: 10KB + 20KB + 8KB = 38KB
// Well within system prompt limits
// Highly relevant to the task
```

---

## Permission System

### Resource Type Detection

```typescript
function detectResourceType(resource: Resource): ResourceType {
  const path = resource.path.toLowerCase()

  // Code
  if (path.match(/\.(ts|tsx|js|jsx|py|java|go|rs)$/)) {
    // Further detect frontend vs backend
    if (path.includes('/components/') || path.includes('/pages/')) {
      return 'frontend-code'
    }
    if (path.includes('/api/') || path.includes('/services/')) {
      return 'backend-code'
    }
    return 'code'
  }

  // Tests
  if (path.includes('.test.') || path.includes('.spec.') || path.includes('__tests__')) {
    if (path.includes('/components/') || path.includes('/pages/')) {
      return 'frontend-tests'
    }
    if (path.includes('/api/') || path.includes('/services/')) {
      return 'backend-tests'
    }
    return 'tests'
  }

  // Designs
  if (path.endsWith('.figma') || path.includes('designs/')) {
    return 'designs'
  }

  // Documentation
  if (path.match(/\.(md|txt|pdf|docx)$/)) {
    return 'docs'
  }

  // Tickets
  if (path.includes('jira-') || path.includes('ticket-')) {
    return 'tickets'
  }

  // Database
  if (path.match(/\.(sql|prisma)$/) || path.includes('schema') || path.includes('migration')) {
    return 'database'
  }

  return 'unknown'
}
```

### Permission Matrix

| Role | Code (Read) | Code (Write) | Tests (Read) | Tests (Write) | Designs (Read) | Designs (Write) | Docs (Read) | Docs (Write) | Tickets (Read) | Tickets (Write) | DB (Read) | DB (Write) |
|------|-------------|--------------|--------------|---------------|----------------|-----------------|-------------|--------------|----------------|-----------------|-----------|------------|
| **PO** | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **FE** | ✅ | ✅ (FE only) | ✅ | ✅ (FE only) | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **BE** | ✅ | ✅ (BE only) | ✅ | ✅ (BE only) | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **QA** | ✅ | ❌ | ✅ | ✅ (all) | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Arch** | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ (diagrams) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

---

## Testing Strategy

### Unit Tests

**File:** `tests/unit/permissions.test.ts`

```typescript
describe('PermissionEnforcer', () => {
  describe('Product Owner', () => {
    const enforcer = new PermissionEnforcer(getRole('po'))

    test('can read code', () => {
      expect(enforcer.canRead({
        type: 'code',
        path: 'src/App.tsx'
      })).toBe(true)
    })

    test('cannot write code', () => {
      expect(enforcer.canWrite({
        type: 'code',
        path: 'src/App.tsx'
      })).toBe(false)
    })

    test('can write docs', () => {
      expect(enforcer.canWrite({
        type: 'docs',
        path: 'docs/requirements.md'
      })).toBe(true)
    })

    test('throws helpful error when writing code', () => {
      expect(() => {
        enforcer.enforceWrite({
          type: 'code',
          path: 'src/App.tsx'
        })
      }).toThrow('Product Owners cannot write code')
    })
  })

  // ... tests for FE, BE, QA, Arch
})
```

### Integration Tests

**File:** `tests/integration/knowledge.test.ts`

```typescript
describe('KnowledgeLoader', () => {
  const loader = new KnowledgeLoader()

  test('loads core + role + tag knowledge for PO', async () => {
    const knowledge = await loader.load(
      getRole('po'),
      'TICKET-123: Add OAuth login'
    )

    // Should include core
    expect(knowledge).toContain('company-overview')

    // Should include PO role knowledge
    expect(knowledge).toContain('product-strategy')

    // Should include auth tag knowledge
    expect(knowledge).toContain('oauth')

    // Should NOT include FE-specific knowledge
    expect(knowledge).not.toContain('react-patterns')
  })
})
```

### E2E Tests

**File:** `tests/e2e/workflows.test.ts`

```typescript
describe('E2E Workflows', () => {
  test('PO analyzes ticket successfully', async () => {
    const cli = new RoleBasedCLI()

    // Select PO role
    await cli.selectRole('po')

    // Execute analyze command
    const result = await cli.executeCommand('/analyze TICKET-123: OAuth login')

    // Should return requirements analysis
    expect(result.output).toContain('User Stories')
    expect(result.output).toContain('Acceptance Criteria')
    expect(result.output).not.toContain('implementation')
  })

  test('PO cannot implement code', async () => {
    const cli = new RoleBasedCLI()
    await cli.selectRole('po')

    // Try to implement (should fail)
    await expect(
      cli.executeCommand('/implement Add login button')
    ).rejects.toThrow(PermissionDeniedError)
  })

  test('FE implements feature successfully', async () => {
    const cli = new RoleBasedCLI()
    await cli.selectRole('fe')

    // Implement feature
    const result = await cli.executeCommand('/implement Add login button component')

    // Should create component file
    expect(result.operations).toContainEqual({
      type: 'write',
      path: 'src/components/LoginButton.tsx'
    })
  })
})
```

---

## Deployment

### Installation

```bash
# Clone repo
git clone https://github.com/company/role-based-cli.git
cd role-based-cli

# Install dependencies
bun install

# Build
bun run build

# Link globally
bun link

# Setup
role-cli setup
```

### Configuration

**File:** `~/.role-cli/config.json`

```json
{
  "defaultRole": "po",
  "knowledgePath": "/path/to/knowledge",
  "opencodePath": "/path/to/opencode",
  "anthropicApiKey": "sk-...",
  "mcpServers": {
    "jira": {
      "command": "npx",
      "args": ["-y", "@jira/mcp-server"],
      "env": {
        "JIRA_API_TOKEN": "..."
      }
    },
    "confluence": {
      "command": "npx",
      "args": ["-y", "@confluence/mcp-server"]
    }
  }
}
```

---

## Next Steps After Week 3

### Phase 2 (Month 2)

1. **Advanced Features**
   - Multi-session support
   - Session history/replay
   - Cost tracking per role
   - Performance analytics

2. **Knowledge Expansion**
   - 200+ knowledge files
   - Multi-language support
   - Video tutorials embedded

3. **Team Features**
   - Shared sessions (pair programming)
   - Code review workflows
   - Team analytics

### Phase 3 (Month 3-6)

1. **AI Improvements**
   - Custom fine-tuned models per role
   - Better tag analysis
   - Proactive suggestions

2. **Enterprise Features**
   - SSO integration
   - Audit logging to database
   - Compliance reports
   - Role management UI

3. **Ecosystem**
   - VS Code extension
   - JetBrains plugin
   - Web interface
   - Mobile app

---

## Success Criteria

**Week 1 (MVP):**
- ✅ 3 roles work end-to-end
- ✅ Permission system prevents violations
- ✅ Knowledge loads correctly
- ✅ OpenCode integration functional

**Week 2 (Production):**
- ✅ 5 roles complete
- ✅ 50+ knowledge files
- ✅ Documentation complete
- ✅ Tests passing

**Week 3 (Launch):**
- ✅ 3+ team members using daily
- ✅ Zero critical bugs
- ✅ Positive feedback
- ✅ Clear ROI (time saved, quality improved)

**Month 2:**
- ✅ 10+ team members
- ✅ 50% reduction in workflow violations
- ✅ 30% faster task completion
- ✅ Measurable quality improvement

---

## Budget

**Week 1-3 Development:**
- Time: 120 hours (3 weeks × 40 hours)
- Rate: $150/hour (your time)
- Cost: $18,000

**AI Assistance (Anthropic API):**
- Development: ~$200
- Testing: ~$100
- Production (month 1): ~$500

**Total Initial Investment:** ~$19,000

**Monthly Cost (Production):**
- AI usage: $500-1000/month (10 users)
- Maintenance: 10 hours/month × $150 = $1,500

**Total Monthly:** ~$2,000-2,500

**ROI Calculation:**

Assumptions:
- 10 users
- Save 2 hours/week each (20 hours total)
- Value: $100/hour (blended rate)

Savings per month: 20 hours/week × 4 weeks × $100 = $8,000
Cost per month: $2,500

**Net savings: $5,500/month**
**Payback period: 3.5 months**

---

**LET'S BUILD THIS!** 🚀
