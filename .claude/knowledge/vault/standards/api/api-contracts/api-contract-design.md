# API Contract Design

Guidelines for defining API contracts between frontend and backend.

## Purpose

Frontend teams actively participate in API design to ensure:
- **Efficiency**: Minimize round trips and over-fetching
- **Type Safety**: Clear contracts for TypeScript
- **Performance**: Optimized data structures for UI
- **Developer Experience**: Intuitive, consistent patterns

## Endpoint Definition

```markdown
### API Endpoint: Get Transaction History

**Method**: GET
**Path**: `/api/v1/transactions`
**Auth**: Bearer token required

**Query Parameters**:
- `clientId` (string, required) - Client identifier
- `startDate` (ISO 8601, optional) - Filter from date
- `endDate` (ISO 8601, optional) - Filter to date
- `type` (enum, optional) - `deposit`, `withdrawal`, `transfer`
- `page` (number, optional, default: 0)
- `pageSize` (number, optional, default: 20, max: 100)
```

## Request/Response Schema

```typescript
interface TransactionResponse {
  data: Transaction[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasMore: boolean;
  };
  metadata: {
    currency: string;
    timezone: string;
  };
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer';
  amount: string; // Decimal as string for precision
  currency: string;
  date: string; // ISO 8601
  status: 'pending' | 'completed' | 'failed';
  description: string;
}
```

## Error Responses

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    field?: string;
    details?: string;
    retryAfter?: number; // For rate limiting
  };
}
```

**Common Status Codes**:
- 400: Invalid parameters
- 401: Invalid/expired token
- 403: Insufficient permissions
- 429: Rate limit exceeded
- 500: Server error
