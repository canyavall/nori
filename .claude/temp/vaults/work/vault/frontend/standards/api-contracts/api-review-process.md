# API Review Process

Guidelines for challenging and improving API designs from frontend perspective.

## When to Challenge

- **Over-fetching**: API returns too much data
- **Under-fetching**: Multiple calls needed for one UI operation
- **Poor naming**: Unclear or inconsistent conventions
- **Missing fields**: Frontend needs data not provided
- **Wrong granularity**: Too coarse or too fine-grained
- **Performance issues**: Slow responses or large payloads
- **Inflexible filtering**: Can't filter/sort as needed
- **Poor pagination**: No cursor-based pagination for large datasets

## Challenge Example

```markdown
## API Challenge: Transaction History Endpoint

**Issue**: Over-fetching - returns all fields including internal data not needed by UI

**Current Response** (520KB for 100 transactions):
- Includes 45+ fields per transaction
- Contains internal IDs, audit fields, legacy data
- No field selection mechanism

**Proposed Solution**:
1. Add `fields` query parameter for field selection
2. Return only essential fields by default
3. Reduce payload to ~80KB for same dataset

**Benefits**:
- 85% reduction in payload size
- Faster load times (520KB → 80KB)
- Reduced bandwidth costs
- Better mobile performance

**Example**:
GET /api/v1/transactions?clientId=123&fields=id,type,amount,date,status
```

## Common Challenge Patterns

**Missing Aggregations**:
- Problem: Need 3 separate calls for transaction totals
- Proposal: Add `/api/v1/transactions/summary` endpoint

**Poor Filtering**:
- Problem: Can only filter by date, need amount range
- Proposal: Add `minAmount` and `maxAmount` parameters

**No Bulk Operations**:
- Problem: 50 transactions require 50 API calls
- Proposal: Add POST `/api/v1/transactions/bulk-approve`

## Best Practices

**DO**:
- Use TypeScript interfaces for schemas
- Document all parameters with types and defaults
- Specify error codes and meanings
- Include pagination metadata
- Use ISO 8601 for dates
- Return decimals as strings for precision
- Provide examples for complex requests

**DON'T**:
- Return internal/audit fields by default
- Use ambiguous field names
- Omit error details
- Skip pagination for large datasets
- Use numbers for monetary amounts
