# TypeScript Pitfalls - Const & Defaults

Correct use of `as const` for literal types and `??` for default values.

## ✅ Using `as const` (CORRECT)
**Note**: `as const` is NOT type casting - it's a const assertion for literal types

```typescript
// ✅ CORRECT - as const creates readonly tuple with literal types
const STATUSES = ['active', 'inactive'] as const;
type Status = typeof STATUSES[number]; // 'active' | 'inactive'

// ✅ CORRECT - Use for constant objects
const CONFIG = { apiUrl: 'https://api.example.com' } as const;
```

**Don't confuse** `as const` with type casting (`as Type`):
```typescript
// ❌ WRONG - Type casting (bypasses type safety)
const value = data as string;

// ✅ CORRECT - Const assertion (enables literal types)
const value = 'active' as const;
```

## ❌ Using `||` for defaults
**Problem**: Treats all falsy values as nullish (0, false, '', NaN)

```typescript
// ❌ Wrong - breaks with valid falsy values
const count = value || 10; // 0 becomes 10
const enabled = config.enabled || true; // false becomes true

// ✅ Correct - only null/undefined trigger default
const count = value ?? 10; // 0 stays 0
const enabled = config.enabled ?? true; // false stays false
```

## Best Practices Recap

- **DO** use type guards instead of type casting
- **DO** use `unknown` instead of `any`
- **DO** check for null/undefined explicitly
- **DO** use `import type` for type-only imports
- **DO** use `as const` for literal types and readonly values
- **DO** use `??` (nullish coalescing) for defaults
- **DON'T** use `as Type` for type casting (use type guards)
- **DON'T** use non-null assertion (`!`)
- **DON'T** ignore TypeScript errors
- **DON'T** use `||` for default values
