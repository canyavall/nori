# Business Documentation Index

## Overview

Business domain documentation lives in `docs/business/` rather than the knowledge vault. This separation ensures:

- **Volatility**: Business rules change frequently; knowledge patterns stay stable
- **Accessibility**: Non-developers (product, compliance, business) can access documentation
- **Maintenance**: Business changes don't trigger knowledge system validation
- **Token efficiency**: Load business docs only when implementing business features

## Available Documentation

### Risk Management (5 docs)

**Location:** `docs/business/risk/`

- `risk-overview.md` - Risk management system overview and capabilities
- `risk-business-rules.md` - Business rules for risk calculations and thresholds
- `risk-integrations.md` - External system integrations (market data, compliance)
- `risk-workflows.md` - User workflows and operational processes
- `risk-terminology.md` - Domain terminology and glossary

**When to load:** Implementing risk features, risk calculations, or compliance workflows

### Tokenization Platform (11 docs)

**Location:** `docs/business/tokenization/`

**Primary/Secondary Markets:**
- `tokenization-primary-market.md` - Token offerings and subscriptions
- `tokenization-secondary-market.md` - OTF trading platform

**Portfolio Management:**
- `tokenization-portfolio-analytics.md` - Portfolio analytics and reporting
- `tokenization-portfolio-documents-governance.md` - Document management and governance

**Architecture:**
- `tokenization-architecture-modules.md` - Module structure and dependencies
- `tokenization-architecture-integration.md` - Integration patterns and APIs

**Compliance:**
- `tokenization-compliance-regulatory.md` - Regulatory requirements
- `tokenization-compliance-governance-reporting.md` - Governance and reporting

**Specialized:**
- `tokenization-dchf.md` - DCHF stablecoin integration
- `tokenization-nft-custody-overview.md` - NFT custody system (currently disabled)
- `tokenization-nft-custody-business.md` - NFT custody business rules

**When to load:** Implementing tokenization features, portfolio management, or compliance

### Trading Platform (12 docs)

**Location:** `docs/business/trading/`

**Core:**
- `trading-overview.md` - Trading platform overview and capabilities
- `trading-business-model.md` - Business model and revenue streams
- `trading-order-types.md` - Market, limit, stop orders

**Users & Workflows:**
- `trading-users.md` - User types, permissions, and access control
- `trading-workflows.md` - Trading workflows and user journeys
- `trading-business-rules.md` - Business rules and validation logic

**Operations:**
- `trading-fees-settlement.md` - Fee structures and settlement processes
- `trading-risk-management.md` - Risk management and limits
- `trading-integrations.md` - External integrations (exchanges, liquidity)

**Metrics & Planning:**
- `trading-metrics.md` - KPIs, metrics, and reporting
- `trading-terminology.md` - Trading terminology and glossary
- `trading-roadmap.md` - Product roadmap and future features

**When to load:** Implementing trading features, order management, or risk controls

## How to Load Business Documentation

When implementing business features, load relevant documentation using Read tool:

```bash
# Example: Implementing order placement
Read: docs/business/trading/trading-order-types.md
Read: docs/business/trading/trading-business-rules.md
Read: docs/business/trading/trading-risk-management.md

# Example: Implementing portfolio analytics
Read: docs/business/tokenization/tokenization-portfolio-analytics.md
Read: docs/business/tokenization/tokenization-architecture-modules.md
```

## When to Load Business Docs

**Load business docs when:**
- Implementing new business features
- Modifying business logic or validation rules
- Understanding domain terminology
- Integrating with business systems
- Writing business-aware tests

**Don't load when:**
- Implementing pure UI components
- Writing utility functions
- Setting up infrastructure
- Refactoring technical code

## Related Knowledge

- `knowledge-loading-system` - How knowledge loading works
- `create-knowledge` - When to create technical knowledge vs business docs
