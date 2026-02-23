---
tags:
  - section-pattern
  - implementation
  - code-examples
  - hooks
  - styling
  - testing
description: >-
  Section implementation patterns: file structure, component/hook/style
  templates, .hook.ts vs .hook.tsx rules, testing patterns
required_knowledge:
  - section-pattern
  - component-file-structure
  - component-implementation-patterns
rules:
  - "**/sections/**/*.tsx"
  - "**/sections/**/*.ts"
  - "!**/sections/**/*.test.tsx"
---
# Section Pattern Implementation

## File Structure

```
FeatureSection/
├── FeatureSection.tsx              # Component (pure presentation)
├── FeatureSection.hook.ts          # Business logic (no JSX)
├── FeatureSection.hook.tsx         # Business logic (with JSX) — use when needed
├── FeatureSection.style.ts         # Styling (SxProps)
├── FeatureSection.type.ts          # Types (if needed)
└── tests/FeatureSection.spec.tsx   # Tests
```

**Hook extension rule**: `.hook.tsx` when hook returns JSX elements, `.hook.ts` otherwise.

## Component Template (.tsx)

```typescript
import { FC } from 'react';
import { Box } from '@sygnum/suil/components/layout/Box';
import { Typography } from '@sygnum/suil/components/atoms/Typography';
import { useSectionName } from './SectionName.hook';
import { useSectionNameStyle } from './SectionName.style';

export const SectionName: FC = () => {
  const { data, isLoading, handleAction } = useSectionName();
  const { containerSx, titleStyles } = useSectionNameStyle();

  return (
    <Box sx={containerSx}>
      <Typography variant="h2" sx={titleStyles}>{data.title}</Typography>
    </Box>
  );
};
```

**Rules**: Named export with `FC` type, no inline logic, no inline handlers, direct SUIL imports.

## Hook Template (.hook.ts)

```typescript
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export const useSectionName = () => {
  const { t } = useTranslation();

  // ALL handlers MUST use useCallback
  const handleAction = useCallback(() => {
    // Business logic
  }, []);

  const translations = {
    title: t('section.title'),
    description: t('section.description'),
  };

  return { translations, handleAction };
};
```

**Responsibilities**: State (useState/useReducer), API calls (useSygnumQuery), handlers (useCallback mandatory), translations, navigation, computed values (useMemo), side effects.

## Style Template (.style.ts)

```typescript
import { SxProps } from '@sygnum/suil';
import { useTheme } from '@sygnum/sygnum-themes';
import { useScreenSize } from '@sygnum/suil/hooks/useScreenSize';

export const useSectionNameStyle = () => {
  const { colors, spacings } = useTheme();
  const { isMobile } = useScreenSize();

  const containerSx: SxProps = { width: 1, overflow: 'auto' };
  const titleStyles: SxProps = {
    mt: { xs: spacings.spacing6, sm: spacings.spacing12 },
    color: colors.primary,
  };

  return { isMobile, containerSx, titleStyles };
};
```

## Testing Template (.spec.tsx)

```typescript
import { render, screen } from '@testing-library/react';
import { SectionName } from '../SectionName';
import { useSectionName } from '../SectionName.hook';

jest.mock('../SectionName.hook');
const mockUse = useSectionName as jest.MockedFunction<typeof useSectionName>;

describe('SectionName', () => {
  beforeEach(() => {
    mockUse.mockReturnValue({
      translations: { title: 'Title' },
      handleAction: jest.fn(),
    });
  });

  it('renders title', () => {
    render(<SectionName />);
    expect(screen.getByText('Title')).toBeInTheDocument();
  });
});
```

**Principles**: Mock the hook (not individual deps), test behavior (not implementation), use `data-testid`, don't mock SUIL components.

## CRITICAL: Integration Completeness

**Creating files is NOT enough. ANY implementation is only complete when:**
1. New code is created AND imported/used
2. Old code imports replaced
3. Old code deleted
4. Tests pass

```bash
# Verify new code is used (must find imports)
grep -r "YourSection" apps/
# Verify old code is gone (must find nothing)
grep -r "from.*pages/YourOldPage" libs/ apps/
```

## Anti-Patterns

- ❌ Business logic in component (use hook)
- ❌ Inline handlers (`onClick={() => ...}`) — use `useCallback` in hook
- ❌ Missing `FC` type annotation
- ❌ Barrel imports (`from '@sygnum/suil'`)
- ❌ Creating section without integrating (dead code)
