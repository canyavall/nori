# API Integration Guide

Frontend guidelines for implementing and integrating with API endpoints.

## Documentation Template

```markdown
## API: [Endpoint Name]

**Method**: [GET|POST|PUT|PATCH|DELETE]
**Path**: `/api/v1/[resource]`
**Auth**: [Required|Optional|None]

### Query Parameters
- `param` ([type], [required|optional], default: [value]) - Description

### Request Body
\```typescript
interface RequestBody { field: type; }
\```

### Response Schema
\```typescript
interface ResponseBody { data: DataType; }
\```

### Error Responses
- **400**: Bad Request
- **401**: Unauthorized

### Examples
**Request**: GET /api/v1/resource?param=value
**Response (200)**: \```json
{ "data": [] }
\```
```

## Frontend Integration Checklist

When reviewing API specifications:

- [ ] All required fields documented with types
- [ ] Optional fields clearly marked
- [ ] Enum values explicitly listed
- [ ] Date formats specified (prefer ISO 8601)
- [ ] Decimal numbers use strings (financial data)
- [ ] Pagination included for list endpoints
- [ ] Error responses documented with codes
- [ ] Authentication requirements clear
- [ ] Rate limits documented
- [ ] TypeScript interfaces can be generated
- [ ] Examples cover common use cases
- [ ] Filtering and sorting sufficient for UI needs

## Common Patterns

**Pagination**:
```typescript
// Offset-based
interface PaginationParams { page: number; pageSize: number; }

// Cursor-based
interface CursorParams { cursor?: string; limit: number; }
```

**Filtering**:
```typescript
// Query params
?status=completed&type=deposit&startDate=2025-01-01

// Complex filters (POST body)
{ "filters": { "status": ["completed"], "amountRange": { "min": 1000 } } }
```

**Sorting**:
```typescript
// Simple
?sortBy=date&sortOrder=desc

// Multiple
?sort=date:desc,amount:asc
```
