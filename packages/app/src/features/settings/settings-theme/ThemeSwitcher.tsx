import { For } from 'solid-js';
import { theme, setTheme } from '../../../stores/settings.store';
import type { Theme } from '../../../stores/settings.store';

const THEMES: { label: string; value: Theme }[] = [
  { label: 'Dark', value: 'dark' },
  { label: 'Light', value: 'light' },
];

export function ThemeSwitcher() {
  return (
    <div class="flex gap-2">
      <For each={THEMES}>
        {({ label, value }) => (
          <button
            type="button"
            onClick={() => setTheme(value)}
            aria-pressed={theme() === value}
            class={`px-4 py-2 rounded-md text-sm border transition-colors ${
              theme() === value
                ? 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent)] bg-[var(--color-bg-tertiary)] text-[var(--color-text)]'
                : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)]'
            }`}
          >
            {label}
          </button>
        )}
      </For>
    </div>
  );
}
