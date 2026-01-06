# React Router Forms Actions

<!--
Migrated from: temp-FE-Mono/technical/react-router/react-router-forms-actions.md
Migration date: 2025-12-08
Original category: technical/react-router
New category: patterns/frontend/react-router
Source repo: temp-FE-Mono
-->

# React Router Forms & Actions

Actions handle form submissions and mutations.

## When to Use Actions

**Use actions when:**

- Form submissions that work without JS
- Need React Router form state management
- Redirect after submission

**Don't use actions when:**

- Complex custom validation UI needed
- Controlled inputs with real-time validation
- Simple button-triggered API calls (use event handlers)

## Simple Action Example

```typescript
import type { ActionFunctionArgs } from 'react-router';
import { redirect } from 'react-router';

export async function tradeAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const amount = formData.get('amount') as string;
  const assetId = formData.get('assetId') as string;

  await executeTrade({ amount, assetId });

  return redirect('/portfolio');
}
```

## Form Component

```typescript
import { Form } from 'react-router';

export function TradeForm() {
  return (
    <Form method="post">
      <input name="amount" type="number" required />
      <input name="assetId" type="hidden" value="BTC" />
      <button type="submit">Execute Trade</button>
    </Form>
  );
}
```

## Method Handling (v7)

```typescript
import { useNavigation } from 'react-router';

function MyComponent() {
  const navigation = useNavigation();

  // ✅ v7: Methods are UPPERCASE
  const isPosting = navigation.formMethod === 'POST';
  const isSubmitting = navigation.state === 'submitting';

  return <Button disabled={isSubmitting}>Submit</Button>;
}
```

## Using Fetcher for Non-Navigation Actions

```typescript
import { useFetcher } from 'react-router';

export function QuickTrade() {
  const fetcher = useFetcher();

  return (
    <fetcher.Form method="post" action="/api/trade">
      <input name="amount" />
      <button type="submit">
        {fetcher.state === 'submitting' ? 'Trading...' : 'Trade'}
      </button>
    </fetcher.Form>
  );
}
```

## ❌ Anti-Patterns

- ❌ Using actions for every button click
- ❌ Complex form state in actions
- ❌ Lowercase method checks: `formMethod === 'post'` (use `'POST'`)

**References**: `react-router-v7-basics`, `react-router-loaders`, `react-router-error-handling`
