# Button UX Patterns

## Usage Scenarios

**Forms**: Use primary for submit, outline for cancel/reset
**Dialogs**: Primary for confirm, outline for cancel
**Toolbars**: Ghost or icon buttons for space-constrained areas
**Marketing**: Large primary buttons for main CTAs

## Button States

### Disabled State

- Reduced opacity, "not-allowed" cursor
- Screen readers announce state
- Always explain WHY button is disabled

### Focus State

- 2px outline using colorPalette.500
- Triggered by Tab key or any focus mechanism
- Ensures keyboard/screen reader usability

### Loading State

- Spinner with 2-second delay (prevents flicker)
- Lasts duration of actual operation
- Use for: form submissions, uploads, API calls, prevents duplicate submissions

```tsx
<Button loading loadingText="Saving...">Save</Button>
```

### Hover State

- Background darkens/lightens for interactive feedback

## Accessibility

**Keyboard**: Tab (focus), Enter/Space (activate), visible focus ring
**Screen Readers**: Button role, disabled/loading states, aria-label for icon-only
**Touch Targets**: Min 44x44px, 8px spacing (WCAG 2.1 AAA)

## Common Mistakes to Avoid

1. **Multiple primary buttons**: Only ONE primary button per view
2. **Unclear labels**: Use action verbs (Save, Delete) not vague terms (OK, Yes)
3. **Inconsistent destructive actions**: Always use red/error palette
4. **Missing loading states**: Always show feedback during async operations
5. **Icon-only without labels**: Always include aria-label
6. **Disabled without reason**: Explain why button is disabled

## Best Practices

- Use variant system for clear hierarchy
- Action-oriented labels (verbs, not vague terms)
- Show loading for operations >2s
- Confirm destructive actions (DELETE, REMOVE)
- Consistent placement: right (forms), left (dialogs)
- Maximum ONE primary button per view

## Decision Guide

```
Is this the MOST important action?
  YES → Primary (solid)
  NO ↓

Is this a dangerous/irreversible action?
  YES → Destructive (solid, red) + confirmation
  NO ↓

Is this an important supporting action?
  YES → Secondary (outline)
  NO ↓

Is this a low-emphasis/in-context action?
  YES → Tertiary (ghost)
  NO ↓

Is this navigation or minimal action?
  YES → Link
```
