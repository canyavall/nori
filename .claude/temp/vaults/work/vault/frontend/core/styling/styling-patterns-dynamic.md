# Styling Patterns - Dynamic & Interactive

Interactive states, dynamic styles based on props, and common pitfalls.

## Interactive States

```typescript
// Hover/Active states
const buttonSx: SxProps = {
  backgroundColor: palette.primary.main,
  '&:hover': { backgroundColor: palette.primary.dark },
  '&:active': { backgroundColor: palette.primary.darker },
  '&:disabled': { backgroundColor: palette.action.disabled },
};

// Focus states
const inputSx: SxProps = {
  borderColor: palette.divider,
  '&:focus': {
    borderColor: palette.primary.main,
    outline: 'none',
  },
};
```

## Dynamic Styles

```typescript
// Based on props
export const useCardStyle = ({ isActive, variant }: StyleProps) => {
  const { palette, spacings } = useTheme();

  const cardSx: SxProps = {
    padding: spacings.spacing3,
    backgroundColor: isActive ? palette.primary.light : palette.background.paper,
    border: variant === 'outlined' ? `1px solid ${palette.divider}` : 'none',
  };

  return { cardSx };
};
```

## Common Pitfalls

❌ Hardcoded colors → Use `palette`
❌ Magic numbers for spacing → Use `spacings`
❌ Import `useTheme` from MUI → Use `@sygnum/sygnum-themes`
❌ Raw HTML elements → Use SUIL components
❌ `styled-components` or CSS files → Use SX props
❌ Complex SX objects in JSX → Use style hooks
❌ Hardcoded px values → Use `transformPxToRem()`
