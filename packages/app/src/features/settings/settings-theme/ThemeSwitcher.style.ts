import type { Theme } from '../../../stores/settings.store';

export function useThemeSwitcherStyle(current: () => Theme, value: Theme) {
  const buttonClass = () =>
    `px-4 py-2 rounded-md text-sm border transition-colors ${
      current() === value
        ? 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent)] bg-[var(--color-bg-tertiary)] text-[var(--color-text)]'
        : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)]'
    }`;

  return { buttonClass };
}
