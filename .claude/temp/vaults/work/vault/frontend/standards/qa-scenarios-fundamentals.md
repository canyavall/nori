# QA Scenarios Fundamentals

Foundational patterns and best practices for writing test scenarios using Specification by Example (Given-When-Then).

This document covers the core structure of effective test scenarios, how to write clear context, actions, and outcomes, and the quality criteria for ensuring testable, independent, and focused scenarios.

## Overview

Test scenarios bridge business requirements and technical implementation. They serve as:
- **Acceptance criteria** for product managers
- **Test specifications** for QA engineers
- **Implementation guidance** for developers

## Given-When-Then Structure

### Given (Context)
Sets up the **initial state** before the action.

**Best practices:**
- Be specific about the starting state
- Include relevant user roles, permissions, data state
- Avoid implementation details (UI elements, technical terms)
- Multiple Given statements are acceptable for complex setups

**Examples:**
```
✅ User "alice@example.com" is logged in as an administrator
✅ Trading account has CHF 10,000 available balance
✅ Market order form is displayed with all required fields

❌ User clicks the login button (this is an action, not context)
❌ API returns 200 status code (too technical)
```

### When (Action)
Describes the **action or event** being tested.

**Best practices:**
- Use active voice
- Focus on user actions or system events
- Be explicit about the sequence if multiple steps
- Avoid describing expected outcomes here

**Examples:**
```
✅ User places market order to buy 1.5 BTC with CHF
✅ User submits registration form with valid information
✅ External price feed service becomes unavailable

❌ User should see confirmation message (this is outcome, not action)
❌ System validates the input (implementation detail)
```

### Then (Outcome)
Specifies the **expected result** after the action.

**Best practices:**
- Be explicit about all expected changes
- Include both visible outcomes and state changes
- Verify data, notifications, redirects, side effects
- Multiple Then statements for complete verification

**Examples:**
```
✅ Order is created with status "pending"
✅ User receives confirmation email
✅ Account balance is decreased by order amount plus fees
✅ User is redirected to order confirmation page

❌ System processes the order (vague outcome)
❌ Everything works correctly (not verifiable)
```

## Scenario Types

### Happy Path
**Purpose:** Verify core functionality works with valid inputs
- Primary user flows, standard use cases, successful operations
- Include for: Critical business operations, common workflows, main features

### Error Cases
**Purpose:** Verify system handles invalid inputs and failures gracefully
- Validation failures, business rule violations, external service failures
- Include for: Critical error paths, common mistakes, system boundaries

### Edge Cases
**Purpose:** Verify system behavior at boundaries and unusual conditions
- Boundary values (min, max, zero), rare but valid scenarios
- Include for: Numeric boundaries, empty/null states, maximum capacity

See qa-scenarios-examples.md for complete scenario examples with full Given-When-Then structure.

## Scenario Quality Checklist

**Before submitting, verify:** Business-friendly language, clear Given/When/Then structure, testable outcomes, independent execution, focused behavior.

See qa-scenarios-heuristics.md for QA heuristics and prioritization.
