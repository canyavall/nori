# Vite Proxy Configuration

Configure Vite development server proxies using the `normalizeProxy` utility to apply consistent defaults and eliminate duplication.

## Pattern

```typescript
import { normalizeProxy } from '../../vite/normalizeProxy';

export const PROXY_CONFIG = normalizeProxy({
  '/api': {
    target: 'https://backend.develop.example.com',
  },
  '/socket.io': {
    target: 'wss://backend.develop.example.com',
    ws: true,
  },
});
```

## normalizeProxy Defaults

**Location**: `vite/normalizeProxy.ts`

Applies these defaults to all proxy routes:

- `timeout: 10000` - Prevents WebSocket blocking (Vite default is 120s)
- `secure: true` - Accepts self-signed certificates
- `changeOrigin: true` - Changes origin header to match target

## Common Patterns

**WebSocket**:

```typescript
normalizeProxy({
  '/socket.io': {
    target: 'wss://backend.com',
    ws: true, // Required for WebSocket
  },
});
```

**Path Rewriting**:

```typescript
normalizeProxy({
  '/internal-api': {
    target: 'https://backend.com',
    rewrite: path => path.replace(/^\/internal-api/, '/api'),
  },
});
```

**Multiple Backends**:

```typescript
normalizeProxy({
  '/auth': { target: 'https://auth.develop.example.com' },
  '/api/trading': { target: 'https://trading.develop.example.com' },
  '/api/banking': { target: 'https://banking.develop.example.com' },
});
```

**Override Defaults** (when needed):

```typescript
normalizeProxy({
  '/slow-api': {
    target: 'https://backend.com',
    timeout: 30000, // Override for slow endpoints
  },
});
```

## Rules

✅ **Always use normalizeProxy** - Even for empty configs ✅ **Remove secure/changeOrigin/timeout** - Let normalizeProxy handle them ✅
**Keep proxy.conf.ts minimal** - Only target, ws, rewrite ❌ **Don't hardcode defaults** - Causes duplication across 48+ routes ❌ **Don't
use catch-all routes** - Be specific (`/api` not `/*`)
