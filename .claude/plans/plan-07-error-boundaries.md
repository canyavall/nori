# Plan 07 — Add SolidJS Error Boundaries

**Phase**: 3
**Status**: pending

## Problem

SolidJS supports `<ErrorBoundary>`. None exist in the codebase. An uncaught component error propagates to a blank screen with no recovery path.

## Tasks

### 7a. Wrap each page in `<ErrorBoundary>`

```tsx
<ErrorBoundary fallback={(err) => <PageError message={err.message} />}>
  <KnowledgeDetailSection />
</ErrorBoundary>
```

Apply to all page-level components (find all pages/routes in `packages/app/src`).

### 7b. Create a reusable `<PageError>` component

Simple component that shows the error message and a "Go back" button.
Place in `packages/app/src/components/PageError/` following component-patterns skill.

## Definition of Done

- Every page-level component is wrapped in an `<ErrorBoundary>`
- `<PageError>` component exists and is reusable
