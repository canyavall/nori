# Plan 09 — Resolve the .style.ts Gap

**Phase**: 4
**Status**: pending
**Convention violated**: styling-conventions skill mandates `.style.ts` files; only one exists

## Problem

The styling conventions skill mandates `.style.ts` files for dynamic/theme-dependent styles. One file exists in the codebase. The skill either needs to be followed or updated.

## Tasks

### Decision required

**Option A — Adopt `.style.ts` fully**
- Add style hooks to all components with dynamic classes (anything with `classList`, conditional Tailwind strings, theme-dependent values)
- Update the simplify skill to flag missing style files

**Option B — Update the skill to a narrower rule**
- Tailwind-only is acceptable for components with fewer than 5 dynamic style conditions
- Reserve `.style.ts` for components using theme tokens or complex dynamic logic

### After decision

- Update the styling-conventions skill to reflect the chosen rule
- Either add `.style.ts` files to all qualifying components (Option A) or update skill to match current practice (Option B)

## Definition of Done

- The skill and the codebase agree
- No gap between documented convention and actual practice
