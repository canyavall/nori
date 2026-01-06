# QA Scenarios Anti-Patterns

Common mistakes to avoid when writing test scenarios, with correct alternatives for each.

This document showcases what NOT to do when writing scenarios and provides corrected versions that follow best practices. Learn to identify and eliminate vague language, technical jargon, and scope creep from your scenarios.

## Anti-Patterns to Avoid

### Anti-Pattern: Too Technical
```
Given: User sends POST request to /api/orders endpoint
When: Server validates request payload
Then: Response returns 201 status code with JSON body
```

### Correct: Business-Focused
```
Given: User is on order placement form
When: User submits valid order information
Then: Order is created successfully
And: User receives confirmation message
```

---

### Anti-Pattern: Vague Outcomes
```
Then: System processes the order correctly
And: Everything works as expected
```

### Correct: Specific Outcomes
```
Then: Order is created with status "pending"
And: Order confirmation email is sent
And: Account balance is updated
And: Order appears in user's order history
```

---

### Anti-Pattern: Testing Multiple Things
```
Scenario: Complete user registration and place first order
Given: New user is on registration page
When: User registers and then places an order
Then: Registration succeeds and order is placed
```

### Correct: Focused Scenario
```
Scenario: Successfully complete user registration
Given: New user is on registration page
When: User submits registration form with valid information
Then: User account is created
And: Verification email is sent
And: User is redirected to email verification page

(Separate scenario for placing first order)
```

## Summary

**Key takeaways:**
1. Use Given-When-Then structure for clarity
2. Write in business language, avoid technical jargon
3. Be specific and testable in outcomes
4. Apply QA heuristics to discover variations
5. Prioritize scenarios based on business criticality
6. Focus each scenario on one primary behavior
7. Use real-world examples and domain terms

**Before submitting:**
- Read scenarios aloud to check readability
- Verify outcomes are observable and verifiable
- Ensure no technical terms or implementation details
- Confirm independence: can run in any order
- Check that each scenario tests exactly ONE behavior
