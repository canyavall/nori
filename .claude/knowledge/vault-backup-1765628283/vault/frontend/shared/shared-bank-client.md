# Shared Bank Client

<!--
Migrated from: temp-FE-Mono/technical/shared-bank-client/shared-bank-client.md
Migration date: 2025-12-08
Original category: technical/shared-bank-client
New category: patterns/shared/shared-bank-client
Source repo: temp-FE-Mono
-->

# Shared Bank Client

Common components, state management, and API integrations for bank client applications.

## Layout Component

```typescript
import { Layout } from '@sygnum/shared-bank-client/components/Layout';

<Layout
  ClientFeedbackButton={ClientFeedbackButton}
  CustomerSurveyModal={CustomerSurveyModal}
>
  <YourApp />
</Layout>
```

## User & Client State Management

```typescript
import { userState } from '@sygnum/shared-bank-client/store/user/user.state';
import { clientState } from '@sygnum/shared-bank-client/store/client/client.state';

// Access user info
const { userId, userName, email } = userState;

// Access client info
const { clientId, clientName } = clientState;
```

## API Integrations

```typescript
import { useGetUserInfo } from '@sygnum/shared-bank-client/api/userInfo/getUserInfo.query';
import { useGetClients } from '@sygnum/shared-bank-client/api/clients/getClients.query';
import { usePostClientFeedback } from '@sygnum/shared-bank-client/api/clientFeedback/postClientFeedback.mutation';

// Fetch user info
const { data: userInfo, isLoading } = useGetUserInfo();

// Fetch clients
const { data: clients } = useGetClients();

// Submit feedback
const { mutate: submitFeedback } = usePostClientFeedback();
submitFeedback({ rating: 5, comment: 'Great service!' });
```

## PreferredCurrencySelector

```typescript
import { PreferredCurrencySelector } from '@sygnum/shared-bank-client/components/PreferredCurrencySelector';
import { usePreferredCurrency } from '@sygnum/shared-bank-client/store/preferredCurrency/preferredCurrency.state';

// Use selector component
<PreferredCurrencySelector />

// Access preferred currency
const { currency, setCurrency } = usePreferredCurrency();
```

## DynamicPageWrapper

```typescript
import { DynamicPageWrapper } from '@sygnum/shared-bank-client/components/DynamicPageWrapper';

// Wrap pages for dynamic content loading
<DynamicPageWrapper contentId="dashboard">
  <DashboardContent />
</DynamicPageWrapper>
```

## Client Feedback

```typescript
import { FeedbackSection } from '@sygnum/shared-bank-client/sections/FeedbackSection/FeedbackSection';

// Add feedback section
<FeedbackSection onSubmit={handleFeedbackSubmit} />
```

## Best Practices

- Always wrap bank client apps with `Layout` component
- Use `userState` and `clientState` for global user/client data
- Leverage API query hooks for data fetching
- Implement `PreferredCurrencySelector` for multi-currency support
- Use `DynamicPageWrapper` for CMS-driven content
