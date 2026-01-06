# Sygnum Watch Privacy

<!--
Migrated from: temp-FE-Mono/technical/sygnum-watch/sygnum-watch-privacy.md
Migration date: 2025-12-08
Original category: technical/sygnum-watch
New category: patterns/sygnum/sygnum-watch
Source repo: temp-FE-Mono
-->

# Sygnum Watch - Privacy & Sanitization

Data privacy and sanitization rules.

## NO CID DATA IN SENTRY (CRITICAL)

❌ NEVER send Customer Identifiable Data (CID) to Sentry:
- Customer names
- Email addresses
- Phone numbers
- Account numbers
- Transaction IDs
- Wallet addresses
- Any personally identifiable information

## Automatic Sanitization

sygnum-watch automatically sanitizes:
- Request/response bodies
- URL parameters
- Headers
- Cookies
- Local storage keys

```typescript
// Automatically sanitized
fetch('/api/users/john@example.com'); // Email removed from logs
localStorage.setItem('userEmail', email); // Value scrubbed
```

## Manual Sanitization

```typescript
import { sanitizeData } from '@sygnum/sygnum-watch/utils';

// Sanitize before sending
const sanitized = sanitizeData({
  name: 'John Doe',      // Will be redacted
  email: 'john@example.com',  // Will be redacted
  transactionId: '12345',     // Will be redacted
  amount: 1000,          // Preserved (not CID)
});

captureException(error, {
  contexts: { transaction: sanitized },
});
```

## Allowed Data

Safe to send to Sentry:
- Error messages (non-CID)
- Stack traces
- Feature names
- UI interaction types
- Performance metrics
- Non-identifying IDs (internal system IDs)

## Privacy Best Practices

- Review error messages for CID before capturing
- Use generic identifiers (e.g., 'user-123' not 'john@example.com')
- Sanitize user inputs before logging
- Never log full API responses
- Use `beforeSend` hook for additional filtering
