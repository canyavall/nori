# Testing: Provider Setup

React Context provider patterns for component testing.

## Why Providers Matter

Missing providers cause "Cannot read property of undefined" or "useContext must be used within Provider" errors.

## Identifying Required Providers

Component uses `useQuery`/`useMutation` → needs `QueryClientProvider`
Component uses `useSygnumStepper` → needs `SygnumStepperProvider`
Component uses `useRouter`/`useParams` → needs React Router providers
Component uses `useTheme` → needs `ThemeProvider`
Custom contexts → needs corresponding provider

## Recommended: renderWith Helper

Flexible provider composition via options:

```typescript
import { renderWith } from '@sygnum/sygnum-testing';

renderWith(<MyComponent />, {
  query: true,                    // QueryClientProvider
  router: '/dashboard',           // MemoryRouter
  toast: true,                    // ToastContainer
  localization: true,             // i18n provider
  theme: customTheme,             // ThemeProvider
});
```

## Usage Examples

```typescript
// API-dependent component
renderWith(<UserList />, { query: true });

// Component with routing
renderWith(<Navigation />, { router: '/home' });

// All providers
renderWith(<ComplexComponent />, {
  query: true,
  router: '/dashboard',
  toast: true,
  localization: true,
  theme: darkTheme,
});
```

## Alternative: Specialized Utilities

```typescript
import { renderWithQuery, renderMinimal } from '@sygnum/sygnum-testing';

renderWithQuery(<DataComponent />);  // API-dependent
renderMinimal(<Button />);            // Simple components
```

## Custom Render Utility

Create `renderWithX` for project-specific combinations (used in 5+ files). Otherwise use `renderWith` directly.

## Common Violations

```typescript
// ❌ Missing QueryClientProvider
render(<DataComponent />);  // useQuery error!

// ✅ Use renderWith
renderWith(<DataComponent />, { query: true });
```

## Detection

Run test to identify missing providers. Common errors:
- "useQuery must be used within QueryClientProvider" → `query: true`
- "useNavigate may be used only in context of Router" → `router: '/'`
- "Cannot read property 'useWatchStepper'" → custom provider needed

## Related Knowledge

- `testing-components` - Component testing patterns
- `testing-quick-checklist` - Provider setup validation
