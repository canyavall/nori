# Lint Prevention

AI-specific patterns to write lint-compliant code from the start. Prevents common violations.

## Prettier Line Length Rule

**140 characters determines formatting**. Count total line length to decide single vs multi-line.

**Arrays/Objects - Short (<140 chars):**
```typescript
const items = ['item1', 'item2', 'item3'];
const config = { timeout: 5000, retries: 3 };
```

**Arrays/Objects - Long (≥140 chars):**
```typescript
const items = [
  'very-long-item-name-that-makes-line-exceed-140-characters',
  'another-long-item',
];

const config = {
  timeout: 5000,
  retries: 3,
  veryLongPropertyNameThatExceedsLineLength: true,
};
```

**JSX Props - Short:**
```typescript
<Component name="value" isActive disabled />
```

**JSX Props - Long:**
```typescript
<Component
  veryLongPropertyName="value"
  anotherLongProperty="value"
  isActive
  disabled
/>
```

## Export Patterns

**Named exports only:**
```typescript
// ✅ Correct
export const MyComponent = () => <Box />;
export { MyComponent };

// ❌ Wrong - causes lint error
export default MyComponent;
```

## Import Order

Auto-fixed, but write correctly from start:
```typescript
// 1. External packages
import { FC } from 'react';
import BigNumber from 'bignumber.js';

// 2. Internal packages (@sygnum/*)
import { Button } from '@sygnum/suil';

// 3. Relative imports
import { useUserData } from './hooks/useUserData';
import { UserProfile } from './UserProfile';
```

## Arrow Functions

Use implicit return when possible:
```typescript
// ✅ Implicit return
const double = (n: number) => n * 2;
const getUser = () => ({ name: 'John' });

// ❌ Explicit return for single expression
const double = (n: number) => {
  return n * 2;
};
```

## React Patterns

**Self-closing tags:**
```typescript
// ✅ Correct
<Box />
<Button disabled />

// ❌ Wrong
<Box></Box>
```

**FC import:**
```typescript
// ✅ Correct
import { FC } from 'react';

// ❌ Wrong - breaks Storybook
import React, { FC } from 'react';
const Component: React.FC = () => <Box />;
```

## Console Statements

**Never use in src files:**
```typescript
// ❌ Lint error in src/
console.log('debug');

// ✅ Remove or use proper logging
// No console statements
```

## Function Parameters

**Max 3 parameters, use object for more:**
```typescript
// ✅ Correct
const createUser = (params: { name: string; email: string; age: number; role: string }) => {};

// ❌ Wrong - too many parameters
const createUser = (name: string, email: string, age: number, role: string) => {};
```
