# SideHooks Structure

SideHooks pattern for splitting complex logic from Component.hook files.

## Purpose

When `ComponentName.hook.ts` becomes too complex, split logic into sideHooks for better organization and reusability.

## When to Use SideHooks

Use sideHooks to extract logic from Component.hook files when:

- Hook file exceeds reasonable complexity
- Logic is reusable across multiple components
- Logic groups into distinct concerns (API calls, state management, calculations)

**Do NOT use sideHooks for**:

- Form configurations (use `ComponentName.formConfig.ts`)
- Validation logic (use `ComponentName.validation.ts`)
- Table configurations (use `ComponentName.tableConfig.ts`)
- Field configurations (use `ComponentName.fieldsConfig.ts`)

These have dedicated file patterns.

## File Structure

```
ComponentName/
├── ComponentName.tsx              # UI
├── ComponentName.hook.ts          # Main hook (orchestrates sideHooks)
├── sideHooks/
│   ├── useSomeFeature.sideHook.ts
│   └── useAnotherFeature.sideHook.ts
└── tests/
    └── ComponentName.spec.tsx
```

## Naming Convention

**File naming**: `use[FeatureName].sideHook.ts` **Hook naming**: `export const use[FeatureName] = () => {}`

Examples:

- `useAddRelationshipManager.sideHook.ts`
- `usePinnedColumns.sideHook.ts`
- `useInformationNotifications.sideHook.ts`

## Usage Pattern

**Main hook orchestrates sideHooks**:

```typescript
// ComponentName.hook.ts
import { useSomeFeature } from './sideHooks/useSomeFeature.sideHook';
import { useAnotherFeature } from './sideHooks/useAnotherFeature.sideHook';

export const useComponentName = () => {
  const featureData = useSomeFeature();
  const { action, state } = useAnotherFeature(featureData.id);

  return {
    ...featureData,
    action,
    state,
  };
};
```

**SideHook encapsulates specific logic**:

```typescript
// sideHooks/useSomeFeature.sideHook.ts
export const useSomeFeature = () => {
  const [state, setState] = useState();
  const { data } = useQuery();

  // Focused logic for one concern

  return { state, data };
};
```

## Real Example

From `RelationshipManager` component:

- Main hook: `AddPrimaryRelationshipManager.hook.ts`
- SideHook: `useAddRelationshipManager.sideHook.ts`

SideHook provides shared logic (dialog state, autocomplete, API calls). Main hook adds specific payload building logic.
