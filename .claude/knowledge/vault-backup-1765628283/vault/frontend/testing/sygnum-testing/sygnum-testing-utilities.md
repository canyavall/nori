# Sygnum Testing Utilities

<!--
Migrated from: temp-FE-Mono/technical/sygnum-testing/sygnum-testing-utilities.md
Migration date: 2025-12-08
Original category: technical/sygnum-testing
New category: patterns/sygnum/sygnum-testing
Source repo: temp-FE-Mono
-->

# Sygnum Testing - Utilities

Testing utilities and best practices.

## Authentication Mocking

```typescript
import { mockAuth } from '@sygnum/sygnum-testing/mocks';

const mockUser = {
  id: '123',
  email: 'user@example.com',
  roles: ['USER'],
};

renderWithAuth(<Component />, {
  user: mockUser,
  isAuthenticated: true,
});
```

## i18n Mocking

```typescript
import { mockI18n } from '@sygnum/sygnum-testing/mocks';

// Mock specific translations
mockI18n({
  'common.submit': 'Submit',
  'common.cancel': 'Cancel',
});

renderWithI18n(<Component />);
```

## Responsive Testing

```typescript
import { setViewport } from '@sygnum/sygnum-testing/utils';

it('renders mobile view', () => {
  setViewport('mobile');
  renderMinimal(<ResponsiveComponent />);
  expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
});

it('renders desktop view', () => {
  setViewport('desktop');
  renderMinimal(<ResponsiveComponent />);
  expect(screen.getByTestId('desktop-nav')).toBeInTheDocument();
});
```

## Best Practices

- Use `renderMinimal` for simple components
- Use `renderWithQuery` when testing API calls
- Use `renderWithI18n` when testing translated content
- Use `renderWithAuth` when testing protected components
- Mock API responses with MSW, not axios directly
- Use `screen` queries from `@testing-library/react`
- Prefer `getByRole` over `getByTestId` when possible
- Use `findBy` for async elements
- Clean up after each test with `afterEach`
