# Sutils ConfigService

Environment configuration management with type safety. **500+ usages across 232 files** - critical infrastructure utility.

## Basic Usage

```typescript
import { ConfigService } from '@sygnum/sutils/services/ConfigService';

// 1. Initialize with environment configuration (once, at app startup)
ConfigService.init(envConfig);

// 2. Access typed configuration anywhere
const config = ConfigService.config<AppConfigType>();
const apiUrl = config.API_BASE_URL;
const featureEnabled = config.ENABLE_FEATURE_X;
```

## Type-Safe Configuration

```typescript
// Define your config type
interface AppConfig {
  API_BASE_URL: string;
  API_TIMEOUT: number;
  ENABLE_ANALYTICS: boolean;
  ENVIRONMENT: 'development' | 'staging' | 'production';
}

// Use with type safety
const config = ConfigService.config<AppConfig>();

// Fully typed access
const apiUrl: string = config.API_BASE_URL;
const timeout: number = config.API_TIMEOUT;
const isAnalyticsEnabled: boolean = config.ENABLE_ANALYTICS;
```

## Real Codebase Examples

```typescript
// API Client Setup
const config = ConfigService.config<{ API_BASE_URL: string }>();
const apiClient = axios.create({ baseURL: config.API_BASE_URL });

// Feature Flags
if (config.ENABLE_TRADING) {
  // Show trading features
}

// Environment-Specific
if (config.ENVIRONMENT === 'development') {
  console.log('Debug info...');
}
```

## Initialization Pattern

```typescript
// app/root.tsx or main entry point
import { ConfigService } from '@sygnum/sutils/services/ConfigService';

// Environment config from Vite or build process
const envConfig = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  ENVIRONMENT: import.meta.env.MODE,
};

// Initialize ONCE at startup
ConfigService.init(envConfig);

// Now accessible anywhere in the app
export default function App() {
  return <Router />;
}
```

## Common Patterns

```typescript
// Conditional rendering
{config.ENABLE_CRYPTO && <CryptoModule />}

// Endpoint construction
const endpoint = `${config.API_BASE_URL}/api/v1/users`;
```

## Best Practices

- **Initialize once** at app startup, not in components
- **Use type parameter** for type safety: `ConfigService.config<YourConfigType>()`
- **Define config interface** in shared types file
- **Never mutate** config values (read-only access)
- **Environment variables** should be prefixed (e.g., `VITE_`, `REACT_APP_`)

## When to Use

- ✅ API endpoints and URLs
- ✅ Feature flags
- ✅ Environment-specific settings
- ✅ Third-party service keys (non-sensitive)
- ❌ Sensitive secrets (use secure env variables)
- ❌ Runtime configuration (use state management)
