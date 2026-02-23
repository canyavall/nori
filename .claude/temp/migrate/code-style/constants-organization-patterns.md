---
tags:
  - constants
  - constant
  - config-service
  - ts
  - tsx
description: >-
  Constants organization: UPPER_SNAKE_CASE naming, 7 category types, 4-level
  hierarchy, ConfigService integration, .ts vs .tsx extension rules
required_knowledge: []
rules:
  - "**/*.constant.{ts,tsx}"
---
# Constants Organization Patterns

## Critical Rule: UPPER_SNAKE_CASE

**ALWAYS** in `.constant.ts` / `.constant.tsx` files. camelCase reserved for non-constant files.

```typescript
// ✅ .constant.ts
export const API_BASE_URL = 'https://api.example.com';
export const MAX_RETRY_ATTEMPTS = 3;

// ❌ Wrong in .constant.ts
export const apiBaseUrl = 'https://api.example.com';
```

## 7 Constant Categories

| Category | Example | Location |
|----------|---------|----------|
| API Endpoints | `BANK_CLIENT_GATEWAY_API` | `basics/constants/apiUrls.constant.ts` |
| Routes | `cryptoRoutes.crypto` | `basics/constants/routes.constant.ts` |
| Magic Numbers | `MAX_UPLOAD_FILE_SIZE_ALLOWED` | `basics/constants/{domain}.constant.ts` |
| Regex | `emailRegex`, `PHONE_NUMBER_REGEX` | `basics/constants/regex.constant.ts` |
| Arrays/Lists | `FORBIDDEN_NATIONALITIES`, `SUPPORTED_CURRENCIES` | Module or shared |
| Enum Mappings | `STATUS_LABELS: Record<OrderStatus, string>` | With related enum |
| Form Configs | `onboardingLegalEntityConfig` | `basics/constants/{form}Config.constant.ts` |

## Organization Hierarchy

1. **Shared Library** (`libs/sygnum-shared/shared-*/basics/constants/`) — used by 3+ modules
2. **Module-Level** (`libs/modules/{domain}/{app}/basics/constants/`) — domain-specific
3. **Component-Level** (`{Component}/{Component}.constant.ts`) — single component only
4. **E2E Test** (`apps/e2e/{app}-e2e/basics/constants/`) — test fixtures

## ConfigService Integration

```typescript
import { ConfigService } from '@sygnum/sutils/services/ConfigService';
const apiUrl = ConfigService.config().BANK_CLIENT_GATEWAY_API_URL;

export const API_ENDPOINTS = {
  BASE: apiUrl,
  USERS: `${apiUrl}/users`,
};
```

Use ConfigService for: environment-specific values, secrets, feature flags, third-party URLs.

## API Endpoint Pattern

```typescript
import { buildSygnumQueryApiUrlsSource } from '@sygnum/query/basics/utils/apiAnalyzer.util';

export const BANK_CLIENT_GATEWAY_API = buildSygnumQueryApiUrlsSource(
  {
    clients: `${apiUrl}/cbs/clients`,
    cmsContent: (collectionType: UrlBuilderArgument) => `${apiUrl}/content/${collectionType}`,
  },
  'bank-client-gateway',
);
```

## .ts vs .tsx Extension

- **`.constant.ts`** (default) — all non-JSX constants
- **`.constant.tsx`** (rare) — ONLY for constants with structural JSX (component mappings with render functions, step configs with icon elements)

## Decision Tree

- **Primitives, configs, URLs, arrays** → Constants (`.constant.ts`)
- **Fixed set of related values, switch cases** → Enums (`.enum.ts`)
- **Simple string/number literals, tree-shaking needed** → Union types (`.type.ts`)

## Anti-Patterns

- ❌ camelCase in `.constant.ts` files
- ❌ Inline magic numbers — extract to constants
- ❌ Constants in component files — use `.constant.ts`
- ❌ `.constant.tsx` for non-JSX constants
- ❌ Barrel files for constant re-exports
- ❌ Mix constants with logic — constants only
