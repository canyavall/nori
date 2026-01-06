# TypeScript Type Safety

Core type safety principles including type guards, nullable checks, and nullish coalescing.

## MANDATORY Rules

- **NEVER use type casting** - No `as` for type casting, use type guards instead
- **NEVER use `||` for defaults** - Use `??` (nullish coalescing) instead
- **Strict mode enabled** - All strict TypeScript checks enforced
- **Let TypeScript infer** - Only add explicit types when inference fails or for public API contracts

## Never Use Type Casting

```typescript
// ❌ NEVER
const value = data as string;

// ✅ Use type guards
const isString = (value: unknown): value is string => typeof value === 'string';
if (isString(data)) {
  const value = data; // TypeScript knows it's string
}
```

## Type Guards

```typescript
// Typeof guard
export const isString = (value: unknown): value is string => typeof value === 'string';

// Instanceof guard
export const isError = (error: unknown): error is Error => error instanceof Error;

// Property checking
export const hasId = (obj: unknown): obj is { id: string } => {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
};

// Discriminated union (no guard needed)
type Result = { success: true; data: string } | { success: false; error: Error };
if (result.success) {
  console.log(result.data); // TypeScript knows it's success branch
}
```

## Nullable Checks

```typescript
// ✅ Check before use
if (user === null) return 'Guest';

// ✅ Optional chaining
return data?.user?.profile?.name ?? 'Unknown';

// ✅ Nullish coalescing
return name ?? 'Anonymous';

// ❌ Non-null assertion (avoid)
// const name = user!.name;
```

## Nullish Coalescing vs Logical OR

**ALWAYS use `??` instead of `||` for default values.**

```typescript
// ❌ NEVER - || treats ALL falsy values (0, false, '', NaN) as falsy
const count = value || 10; // BUG: 0 becomes 10
const enabled = config.enabled || true; // BUG: false becomes true
const message = text || 'default'; // BUG: '' becomes 'default'

// ✅ ALWAYS - ?? only treats null/undefined as nullish
const count = value ?? 10; // 0 stays 0
const enabled = config.enabled ?? true; // false stays false
const message = text ?? 'default'; // '' stays ''
```

**Why**: `||` causes bugs with valid falsy values (0, false, '', NaN). SonarQube flags `||` usage.

**Real-world examples**:
- Pagination: `page || 1` breaks when page is 0 (first page)
- Toggles: `isEnabled || true` breaks when explicitly set to false
- Counters: `count || 0` breaks when count is 0
- Search: `query || ''` would replace empty string searches
