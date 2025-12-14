# Button UX Basics

**Source**: Figma Design System
**Component**: Button (Chakra UI)

## Properties

| Property | Values | Default |
|----------|--------|---------|
| variant | default / destructive / outline / ghost / link | default |
| size | xs / sm / md / lg / xl | md |
| state | default / disabled / focus / hover / loading | default |

## Anatomy

```
┌─────────────┐
│   [Label]   │  ← Text label centered (optionally with icon)
└─────────────┘
```

## Variant Hierarchy

1. **Primary (Solid)**: Most important action per screen (e.g., Submit, Save, Continue)
2. **Destructive (Solid, Red)**: Irreversible/dangerous actions (e.g., Delete, Remove)
3. **Secondary (Outline)**: Important supporting actions (e.g., Cancel, Back)
4. **Tertiary (Ghost)**: Low-emphasis, in-context actions
5. **Link**: Navigation or text-only actions with minimal visual weight

**Rules**:
- Only ONE primary button per view
- Use destructive variant with confirmation dialogs
- Outline for forms, ghost for inline actions

## Button Sizes

| Size | Usage |
|------|-------|
| xs | Very compact spaces, dense tables |
| sm | Compact forms, secondary actions |
| md | Default for most use cases |
| lg | Prominent CTAs, landing pages |
| xl | Hero sections, marketing pages |

## Sizing Behaviors

**Flexible Width**: Adapts to button text (max 400px, then ellipsis)
**Minimum Width**: 76px (ensures adequate touch targets)
**Touch Target**: Minimum 44x44px (WCAG 2.1)
**Spacing**: 8px minimum between buttons

## Destructive Buttons

**Use for**: DELETE, REMOVE (permanent actions)
**Visual**: Filled or outlined with red/error color
**Required**: Always pair with confirmation dialog
**Avoid**: Don't use for reversible actions like Cancel

## Icon Buttons

**Usage**: Actions where icon alone is sufficient
**Requirements**:
- Must have `aria-label` for accessibility
- Include tooltip on hover
- Use universally recognizable icons

## Implementation

```tsx
// Primary action
<Button colorPalette="primary" variant="solid">Save</Button>

// Destructive action
<Button colorPalette="red" variant="solid">Delete</Button>

// Secondary action
<Button colorPalette="gray" variant="outline">Cancel</Button>

// Tertiary action
<Button colorPalette="gray" variant="ghost">Skip</Button>

// Link action
<Button variant="link">Learn More</Button>

// Icon button
<IconButton aria-label="Delete item" colorPalette="red">
  <TrashIcon />
</IconButton>
```
