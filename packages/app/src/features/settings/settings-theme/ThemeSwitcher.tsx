import { For } from 'solid-js';
import { theme, setTheme } from '../../../stores/settings.store';
import type { Theme } from '../../../stores/settings.store';
import { useThemeSwitcherStyle } from './ThemeSwitcher.style';

const THEMES: { label: string; value: Theme }[] = [
  { label: 'Dark', value: 'dark' },
  { label: 'Light', value: 'light' },
];

export function ThemeSwitcher() {
  return (
    <div class="flex gap-2">
      <For each={THEMES}>
        {({ label, value }) => {
          const { buttonClass } = useThemeSwitcherStyle(theme, value);
          return (
            <button
              type="button"
              onClick={() => setTheme(value)}
              aria-pressed={theme() === value}
              class={buttonClass()}
            >
              {label}
            </button>
          );
        }}
      </For>
    </div>
  );
}
