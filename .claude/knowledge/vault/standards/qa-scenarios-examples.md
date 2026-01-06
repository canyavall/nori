# QA Scenarios Examples

Real-world test scenario examples organized by business domain.

This document provides comprehensive, ready-to-use scenario examples for the Trading and Tokenization platforms, demonstrating how to apply Given-When-Then structure to concrete business workflows with happy paths, error cases, and edge cases.

## Examples by Domain

### Trading Scenarios

**Happy path:**
```
Scenario: Successfully place market order
Given: User "trader@example.com" is logged in
And: Trading account has CHF 50,000 available
And: BTC/CHF market is active with sufficient liquidity
When: User places market order to buy 1.0 BTC
Then: Order is created with status "pending"
And: User receives order confirmation number
And: Account balance is reserved for estimated amount
And: Order appears in user's order history
```

**Error case:**
```
Scenario: Market order rejected during market closure
Given: User "trader@example.com" is logged in
And: BTC/CHF market is closed
When: User attempts to place market order to buy 1.0 BTC
Then: Order is rejected with message "Market is currently closed"
And: User sees next market opening time
And: Account balance remains unchanged
```

**Edge case:**
```
Scenario: Place order at exact market open time
Given: User "trader@example.com" is logged in
And: BTC/CHF market opens at 09:00 UTC
And: Current time is 08:59:59 UTC
When: User places market order to buy 1.0 BTC
And: Market opens at 09:00:00 UTC
Then: Order is queued and processes when market opens
And: User receives notification of queued order
```

### Tokenization Scenarios

**Happy path:**
```
Scenario: Investor successfully subscribes to token offering
Given: Investor "investor@example.com" is logged in
And: Investor is KYC-approved
And: Token offering "Real Estate Fund A" is open for subscription
And: Offering has 1,000 tokens available at CHF 100 each
When: Investor subscribes to 10 tokens for CHF 1,000
Then: Subscription is created with status "pending approval"
And: Investor receives subscription confirmation
And: Subscription appears in investor's pending subscriptions
And: Offering shows 990 tokens remaining
```

**Error case:**
```
Scenario: Subscription rejected for non-KYC investor
Given: Investor "investor@example.com" is logged in
And: Investor KYC status is "pending"
And: Token offering "Real Estate Fund A" is open
When: Investor attempts to subscribe to 10 tokens
Then: Subscription is rejected with message "KYC approval required"
And: Investor sees link to complete KYC process
And: No subscription is created
```
