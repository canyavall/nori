# QA Scenarios Heuristics

Systematic techniques for discovering comprehensive test scenarios and writing scenarios in clear business language.

This document provides practical heuristics (patterns for generating test variations), guidelines for using domain-appropriate business terminology, and prioritization strategies for focusing testing efforts.

## Common QA Heuristics

Apply these patterns to discover test variations:

### 1. Zero-One-Many
Test quantities: zero, one, many, maximum

### 2. Boundaries
Test limits: below min, at min, normal, at max, above max

### 3. Type Variations
Test inputs: valid, invalid, null/empty, malformed

**Examples:**
```
- Happy: Email "user@example.com" (valid format)
- Error: Email "invalid-email" (invalid format)
- Error: Email "" (empty string)
- Error: Email "user@" (malformed)
```

### 4. State Variations
Test states: initial, normal, end, error

### 5. Timing Issues
Test timing: immediate, delayed, concurrent, sequential

## Business Language Guidelines

### Use Domain Terms
**Trading:** "market order", "limit order", "balance", "settlement", "liquidity provider", "order book", "execution"

**Tokenization:** "primary market", "subscription", "offering", "investor", "issuer", "compliance approval"

### Avoid Technical Terms
Use business equivalents: "system request" not "API call", "authentication failure" not "401 error"

### Use Real-World Examples
Names/IDs: "alice@example.com", "ORD-2024-12345". Amounts: CHF 10,000, 1.5 BTC

## Scenario Priority Guidelines

### High Priority (Essential: 3-5 scenarios)
Core ops, revenue features, compliance flows, common journeys (80% usage)

### Medium Priority (Comprehensive)
Important validations, secondary flows, role variations, integrations

### Low Priority (Comprehensive only)
Unusual edges, non-critical validation, nice-to-haves, low-probability corners
