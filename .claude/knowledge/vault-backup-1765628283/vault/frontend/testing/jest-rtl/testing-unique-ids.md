# Test Data: Unique IDs

Patterns for generating unique IDs in test data to prevent flaky tests from duplicate keys.

## Why This Matters

Duplicate IDs are the #1 cause of "Encountered two children with the same key" React warnings and order-dependent test failures. When tests reuse IDs like `'1'`, `'123'`, or `'test-id'`, they become coupled and fail unpredictably.

## Quick Rule

**Never hard-code test IDs**. Always generate unique IDs using index, timestamp, or UUID patterns.

## Patterns

### Array with Index-Based IDs

```typescript
// ✅ Unique IDs using Array.from + index
const items = Array.from({ length: 5 }, (_, i) => ({
  id: `item-${i}`,
  name: `Item ${i}`,
}));

// ✅ With seed-random for determinism
import seedrandom from 'seedrandom';
const rng = seedrandom('test-seed');
const items = Array.from({ length: 5 }, (_, i) => ({
  id: `item-${Math.floor(rng() * 10000)}-${i}`,
}));
```

### Timestamp-Based IDs

```typescript
// ✅ Timestamp + index (realistic, unique)
const baseTimestamp = Date.now();
const users = Array.from({ length: 3 }, (_, i) => ({
  id: `user-${baseTimestamp}-${i}`,
  email: `user${i}@test.com`,
}));
```

### Scoped ID Prefixes

```typescript
// ✅ Prefix with test/describe scope
describe('UserList', () => {
  const users = Array.from({ length: 3 }, (_, i) => ({
    id: `userlist-user-${i}`,  // Prefix prevents collisions with other tests
  }));
});

describe('UserProfile', () => {
  const users = Array.from({ length: 3 }, (_, i) => ({
    id: `userprofile-user-${i}`,  // Different prefix, no collision
  }));
});
```

## Common Violations

```typescript
// ❌ Duplicate keys in array
const items = [
  { id: '1', name: 'Item 1' },
  { id: '1', name: 'Item 2' },  // React warning!
];

// ❌ Hard-coded ID reused across tests
const mockUser = { id: '123' };  // Every test uses same ID

// ❌ Manual array with predictable IDs
const items = [
  { id: '1' }, { id: '2' }, { id: '3' },  // Conflicts with other tests
];
```

## Detection

```bash
# Find hard-coded IDs: rg "id: ['\"]1['\"]" **/*.spec.tsx
```

## Related Knowledge

- `testing-generators` - Factory patterns for complex data
- `testing-quick-checklist` - Pre-commit validation
