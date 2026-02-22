# Settings Theme Flow

Frontend-only flow for switching the app-wide colour theme (Dark / Light).
No backend contract — theme is a pure UI preference stored in `localStorage`.

**Store**: `stores/settings.store.ts`
**Host**: `pages/SettingsPage.tsx` — Appearance section

## Steps

1. **Show theme switcher** — Render Dark/Light segmented buttons → [steps/01-show-theme-switcher.json](steps/01-show-theme-switcher.json)
2. **Apply theme** — Synchronous DOM update + localStorage persist → [steps/02-apply-theme.json](steps/02-apply-theme.json)

## Storage

`localStorage` key: `nori:settings`
Value: `{ "theme": "dark" | "light" }`

Dark is the default (`:root` CSS vars). Light overrides via `[data-theme="light"]` on `<html>`.

## Adding future global settings

Extend the `Settings` interface in `settings.store.ts` and the `nori:settings` JSON object.
No schema migration needed — unknown keys are ignored on load.
