# Code Conventions

Naming conventions and fundamental code patterns for Sygnum frontend. All rules are MANDATORY.

## Naming Conventions

**camelCase** - Variables, functions, components, hooks:
```typescript
const userName = 'John';
const getUserData = () => {};
const UserProfile = () => <Box />;
```

**UPPERCASE_WITH_UNDERSCORES** - Constants:
```typescript
const API_BASE_URL = 'https://api.example.com';
```

**lowercase** - Acronyms:
```typescript
const getFaq = () => {};
```

**Prefixes** - Booleans (is, has, should, can):
```typescript
const isLoading = true;
```

**Enums** - Plural name, camelCase keys:
```typescript
enum TransactionTypes {
  deposit = 'Deposit',
  withdrawal = 'Withdrawal',
}
```

## Code Patterns

**Always use braces** (never omit):
```typescript
if (!user) {
  return false;
}
```

**Named exports only** (NO default exports):
```typescript
export { UserProfile };
export const USER_CONSTANTS = {};
```

**ZERO comments/JSDoc/annotations** - Write self-documenting code:
```typescript
const isValidAdmin = (user: User) => {
  const hasAdminRole = user.role === 'admin';
  const hasActiveSubscription = user.subscription?.isActive === true;
  return hasAdminRole && hasActiveSubscription;
};
```

## BigNumber for Finance (MANDATORY)

Always use BigNumber.js for financial operations:
```typescript
import BigNumber from 'bignumber.js';

export const calculateTotal = (price: string, quantity: number) => {
  const subtotal = new BigNumber(price).times(quantity);
  return subtotal.toFixed(2);
};
```
