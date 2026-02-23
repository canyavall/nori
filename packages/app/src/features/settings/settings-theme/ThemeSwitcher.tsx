import { For } from 'solid-js';
import type { Theme } from '../../../stores/settings.store';
import { useThemeSwitcherStyle } from './ThemeSwitcher.style';
import { useThemeSwitcher } from './ThemeSwitcher.hook';

const THEMES: { label: string; value: Theme }[] = [
  { label: 'Dark', value: 'dark' },
  { label: 'Light', value: 'light' },
];

export const ThemeSwitcher = () => {
  const { theme, handleSelectTheme } = useThemeSwitcher();

  return (
    <div class="flex gap-2">
      <For each={THEMES}>
        {({ label, value }) => {
          const { buttonClass } = useThemeSwitcherStyle(theme, value);
          return (
            <button
              type="button"
              onClick={() => handleSelectTheme(value)}
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
};
