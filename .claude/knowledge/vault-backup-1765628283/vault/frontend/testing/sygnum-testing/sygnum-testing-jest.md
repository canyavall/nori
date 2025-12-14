# Sygnum Testing Jest

<!--
Migrated from: temp-FE-Mono/technical/sygnum-testing/sygnum-testing-jest.md
Migration date: 2025-12-08
Original category: technical/sygnum-testing
New category: patterns/sygnum/sygnum-testing
Source repo: temp-FE-Mono
-->

# Sygnum Testing - Jest

Jest testing utilities and patterns.

## Core Utilities

```typescript
import {
  renderMinimal,
  renderWithQuery,
  renderWithI18n,
  renderWithAuth,
} from '@sygnum/sygnum-testing/utils';

// Minimal render (React only)
const { getByText } = renderMinimal(<Component />);

// With React Query
const { getByText } = renderWithQuery(<Component />);

// With i18n
const { getByText } = renderWithI18n(<Component />);

// With authentication
const { getByText } = renderWithAuth(<Component />, {
  user: mockUser,
  isAuthenticated: true,
});
```

## Component Testing Pattern

```typescript
import { renderMinimal } from '@sygnum/sygnum-testing/utils';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('MyComponent', () => {
  it('renders correctly', () => {
    renderMinimal(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = jest.fn();
    renderMinimal(<Button onClick={handleClick}>Click</Button>);

    await userEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## Hook Testing

```typescript
import { renderHook } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

it('updates state', () => {
  const { result } = renderHook(() => useCounter());

  expect(result.current.count).toBe(0);

  act(() => {
    result.current.increment();
  });

  expect(result.current.count).toBe(1);
});
```
