---
name: styling-conventions
description: Style hook pattern, theme token usage, dynamic styles, and styling anti-patterns. Reference when creating or editing .style.ts files.
globs: '**/*.style.{ts,tsx}'
alwaysApply: false
---

# Styling Conventions

Style hook pattern, theme token usage, and dynamic styling patterns.

---

## MANDATORY: Style Hook Pattern

Every component with non-trivial styles should have a `.style.ts` file:

```
ComponentName/
├── ComponentName.tsx
├── ComponentName.style.ts    # Export useComponentNameStyle hook
├── ComponentName.type.ts
```

```typescript
// ComponentName.style.ts
export const useComponentNameStyle = () => {
  const wrapperStyle = {
    padding: '1rem',
    backgroundColor: 'var(--color-surface)',
  };

  const titleStyle = {
    fontSize: '1.5rem',
    color: 'var(--color-text-primary)',
    marginBottom: '0.5rem',
  };

  return { wrapperStyle, titleStyle };
};
```

---

## Dynamic Styles Based on Props

Pass style-relevant props to the style hook:

```typescript
export const useCardStyle = ({ isActive, variant }: StyleProps) => {
  const cardClass = [
    'card',
    isActive ? 'card--active' : '',
    variant === 'outlined' ? 'card--outlined' : '',
  ].filter(Boolean).join(' ');

  return { cardClass };
};
```

---

## Tailwind CSS Patterns (Nori uses Tailwind v4)

```typescript
// ✅ Use Tailwind utility classes
export const useButtonStyle = ({ isActive }: { isActive: boolean }) => {
  const buttonClass = isActive
    ? 'bg-primary-500 text-white'
    : 'bg-surface text-text-primary';

  return { buttonClass };
};

// ✅ Use CSS custom properties for theme tokens
const wrapperStyle = { padding: 'var(--spacing-4)' };
```

---

## Token Categories

Use design tokens instead of hardcoded values:

| Token Type | Example |
|------------|---------|
| Spacing | `var(--spacing-4)`, Tailwind: `p-4` |
| Colors | `var(--color-primary)`, Tailwind: `text-primary` |
| Border radius | `var(--radius-md)`, Tailwind: `rounded-md` |
| Typography | `var(--font-size-md)`, Tailwind: `text-base` |

---

## Style in Component vs Style Hook

**In component file** — Only for trivial, static, single-value styles:
```tsx
<div class="flex items-center gap-2">
```

**In style hook** — For dynamic styles, theme-dependent values, reused styles:
```tsx
// ComponentName.style.ts
export const useCardStyle = ({ variant }) => ({
  containerClass: variant === 'primary' ? 'bg-primary-500' : 'bg-surface',
});
```

---

## Common Pitfalls

- ❌ Hardcoded colors/spacing — use theme tokens
- ❌ Complex style logic in JSX — move to style hook
- ❌ Duplicate style logic across files — extract to style hook
- ❌ Pixel values without token reference — use `transformPxToRem()` or tokens
- ❌ Inline style objects for dynamic styles — use class names or CSS variables
