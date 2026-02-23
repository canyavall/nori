---
tags:
  - conventions
  - accessibility
  - tsx
  - jsx
  - ts
description: >-
  Mandatory React conventions: useCallback for event handlers, skeleton loaders,
  useMemo, NEVER setState in effects, accessibility, and code rules
required_knowledge: []
rules:
  - "**/*.tsx"
  - "!**/*.test.tsx"
  - "!**/*.spec.tsx"
  - "!**/*.story.tsx"
---
# React Project Conventions

Sygnum-specific React conventions. All rules are MANDATORY.

## Event Handlers: Always useCallback

```typescript
// ✅ Define in hook
const handleSubmit = useCallback((e: MouseEvent<HTMLButtonElement>) => {
  e.preventDefault();
  onSubmit(new FormData());
}, [onSubmit]);

// ❌ NEVER inline: <Button onClick={() => handleClick(id)}>
```

## Skeleton Loaders (Prevent CLS)

NEVER generic "Loading..." — use skeleton loaders matching content layout.

**Core Web Vitals**: FP ≤ 1.0s | FCP ≤ 1.8s | LCP ≤ 2.5s | CLS ≤ 0.1

## useMemo for Expensive Calculations

```typescript
const filtered = useMemo(() => items.filter(i => i.category === selected), [items, selected]);
```

## CRITICAL: NEVER setState Synchronously in Effects

Setting state in effects causes extra renders. Calculate during render instead.

```typescript
// ❌ Anti-patterns
useEffect(() => { setItems(data); }, [data]);                    // Use initial state
useEffect(() => { setProcessed(rawData.map(transform)); }, [rawData]); // Derive during render

// ✅ Correct
const selected = items.find(i => i.id === selectedId);           // Calculate during render
const processed = useMemo(() => rawData.map(transform), [rawData]); // useMemo for expensive

// ✅ Exception: setState from ref values OK (DOM measurements with useLayoutEffect)
```

**Key Principle**: If data can be calculated from props/state, calculate during render. Don't put it in state.

## Component Rules

- Named exports only (no default exports)
- Always braces in conditionals
- `@sygnum/suil` components (NOT HTML elements)
- `BigNumber.js` for money (NOT native math)
- `YodaTextField` for form fields

## Hook Conventions

- Extract props with `Pick`/`Omit`
- Start with `use`, return objects
- See `react-hooks-architecture` for complexity guidelines

## Accessibility (MANDATORY)

- All user-facing text via i18n: `t('button.close')`
- Keyboard navigation: `onKeyPress` with Enter/Space + `tabIndex={0}` + `role`
- Form labels: `htmlFor` + `aria-required` + `aria-invalid` + `aria-describedby`

## Code Rules

- No JSDoc (TypeScript provides types)
- No type casting `as` (use type guards)
- No hardcoded strings (use i18n)
- No HTML elements (use @sygnum/suil)
- No native math for money (BigNumber.js)
