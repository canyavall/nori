---
tags:
  - knowledge-system
  - architecture
  - namespaces
  - organization
description: Namespace structure and organization decisions for the knowledge vault
category: meta/knowledge-system
required_knowledge: []
---

# Knowledge Namespace Architecture

Namespace structure and organization decisions for the knowledge vault.

## Namespace Overview

The knowledge vault is organized into 7 top-level namespaces:

### 1. meta/
AI infrastructure and knowledge system itself.
- `meta/knowledge-system` - Knowledge system documentation
- `meta/hooks` - Claude Code hooks and automation
- `meta/mcp/serena` - Serena MCP server patterns

### 2. frontend/
Frontend-specific patterns, libraries, and frameworks.
- `frontend/core/` - React, routing, i18n, styling fundamentals
- `frontend/state-management/` - sygnum-store, sygnum-query
- `frontend/ui-components/` - sygnum-ui, sygnum-themes, suil
- `frontend/data-display/` - sygnum-table, sygnum-charts
- `frontend/forms/` - yoda-form, sygnum-stepper
- `frontend/authentication/` - sygnum-idp, sygnum-access
- `frontend/observability/` - sygnum-watch
- `frontend/testing/` - jest-rtl, mocks, sygnum-testing
- `frontend/tooling/` - nx, vite, storybook
- `frontend/utilities/` - sutils, sygnum-csv, sygnum-toastify
- `frontend/modules/` - Domain modules (banking, trading, etc.)
- `frontend/standards/` - Code conventions, patterns, anti-patterns
- `frontend/shared/` - Cross-cutting frontend concerns

### 3. backend/
Backend-specific patterns across multiple stacks.

**backend/java-quarkus/**
- `core/` - Quarkus patterns, dependency injection
- `api/` - REST, GraphQL, OpenAPI
- `database/` - Hibernate, Panache, migrations
- `security/` - Authentication, authorization, JWT
- `testing/` - JUnit, RestAssured, test containers
- `observability/` - Logging, metrics, tracing
- `frameworks/` - Reactive, native builds, extensions
- `standards/` - Code conventions, architecture patterns
- `utilities/` - Configuration, helpers

**backend/java-spring/**
- Same category structure as java-quarkus
- Spring-specific patterns (Spring Boot, Spring Data, Spring Security)

**backend/node/**
- Same category structure
- Node.js/TypeScript backend patterns (Express, NestJS, Prisma)

### 4. infrastructure/
Infrastructure, deployment, and operations.
- `deployment/` - Deployment pipelines, strategies
- `monitoring/` - Prometheus, Grafana, alerting
- `cloud/` - AWS/GCP/Azure patterns
- `docker/` - Container patterns, optimization
- `kubernetes/` - K8s manifests, scaling, service mesh
- `ci-cd/` - GitHub Actions, automation
- `networking/` - Load balancing, service discovery
- `security/` - Secrets, certificates, network policies

### 5. business/
Business rules, workflows, and domain knowledge.
- `trading/` - Trading platform business rules
- `tokenization/` - Digital asset tokenization
- `risk/` - Risk management rules
- `banking/` - Banking operations
- `onboarding/` - KYC/KYB workflows
- `compliance/` - AML, regulatory requirements

### 6. shared/
Cross-cutting concerns across all stacks.
- `shared/api-contracts` - API specifications, contracts
- `shared/standards` - Company-wide standards
- `shared/tooling` - Shared development tools

### 7. apps/
Application-specific knowledge.
- `apps/onboarding` - Onboarding app specifics
- (Additional apps as needed)

## Architectural Decisions

### Decision 1: Business Knowledge in Vault

**Decision:** Business knowledge lives in `.claude/knowledge/vault/business/`, not `docs/business/`.

**Rationale:**
- Git submodule propagation - Knowledge folder will be shared across repos as submodule
- Tag-based search - Business packages searchable via `--tags business,trading`
- Dependency tracking - Auto-load related business context
- Unified tooling - Same validation, tracking as technical knowledge
- Cross-repo visibility - Teams can open vault standalone for multi-repo context

**Trade-offs accepted:**
- Higher coupling - Business changes affect knowledge system
- Token overhead - Business packages appear in searches (mitigated by filtering)
- Validation overhead - Business updates run through knowledge validation

### Decision 2: Single knowledge.json

**Decision:** All namespaces in single `knowledge.json` file (not split by namespace).

**Rationale:**
- Simple maintenance - One file to update
- Atomic updates - All changes in single commit
- Works with current tooling - Scripts already load full file
- Size is manageable - 800+ packages → ~400KB (trivial for Node.js)
- Parse performance - <3ms, not a bottleneck

**Future optimization available:**
- Add namespace filtering at load time if needed
- Scripts can filter by category prefix before search
- Doesn't require splitting file, just filtering logic

### Decision 3: Git Submodule Strategy

**Decision:** `.claude/knowledge/` becomes company-wide shared submodule.

**Rationale:**
- Knowledge propagation across repos (FE, BE Java Quarkus, BE Java Spring, BE Node)
- Single source of truth for patterns
- Version-controlled knowledge updates
- Teams can work in vault standalone for cross-repo visibility

**Implementation:**
```bash
# Future setup (not yet implemented)
git submodule add <sygnum-knowledge-repo> .claude/knowledge

# Each repo includes full vault
sygnum-frontend/.claude/knowledge/ -> submodule
sygnum-backend-quarkus/.claude/knowledge/ -> submodule
sygnum-backend-spring/.claude/knowledge/ -> submodule
```

**Benefit of full download:**
- Enables cross-stack AI assistance
- Platform engineers can open vault with visibility across FE + BE
- Business knowledge accessible to all roles
- No fragmentation of knowledge

## Category Selection Guide

**When creating knowledge, choose category based on:**

### Use frontend/* when:
- React/TypeScript patterns
- Browser-specific concerns
- UI component patterns
- Frontend state management
- Client-side routing/forms

### Use backend/* when:
- Server-side patterns
- API implementation details
- Database access patterns
- Backend testing strategies
- Stack-specific frameworks

**Choose specific backend stack:**
- `backend/java-quarkus/` - Quarkus patterns
- `backend/java-spring/` - Spring Boot patterns
- `backend/node/` - Node.js/NestJS patterns

### Use infrastructure/* when:
- Deployment concerns
- Cloud provider patterns
- Container/K8s manifests
- CI/CD pipelines
- Infrastructure security

### Use business/* when:
- Business rules (not implementation)
- Domain workflows
- Regulatory requirements
- Business terminology
- User journeys

### Use shared/* when:
- API contracts between FE/BE
- Company-wide standards
- Cross-stack patterns
- Shared tooling

### Use meta/* when:
- Knowledge system itself
- Claude Code hooks
- MCP server patterns
- AI infrastructure

## Naming Conventions

**Category format:** `namespace/subcategory/package-name`

Examples:
- `backend/java-quarkus/testing` - Quarkus testing patterns
- `backend/node/api` - Node.js API patterns
- `business/trading` - Trading business knowledge
- `infrastructure/kubernetes` - K8s patterns

**File path pattern:**
```
.claude/knowledge/vault/[namespace]/[category]/[package]/[package].md
```

Examples:
```
.claude/knowledge/vault/backend/java-quarkus/testing/junit-patterns/junit-patterns.md
.claude/knowledge/vault/business/trading/trading-overview/trading-overview.md
.claude/knowledge/vault/infrastructure/kubernetes/k8s-deployment/k8s-deployment.md
```

## Migration Path

Existing knowledge remains in current structure. New knowledge follows namespace architecture.

**No breaking changes** - Backward compatible with existing packages.
