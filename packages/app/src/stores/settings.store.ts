import { createSignal } from 'solid-js';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'nori:settings';

interface Settings {
  theme: Theme;
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Settings>;
      if (parsed.theme === 'dark' || parsed.theme === 'light') {
        return { theme: parsed.theme };
      }
    }
  } catch {
    // ignore parse errors
  }
  return { theme: 'dark' };
}

function applyTheme(t: Theme): void {
  if (t === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

const initial = loadSettings();
applyTheme(initial.theme);

export const [theme, _setTheme] = createSignal<Theme>(initial.theme);

export function setTheme(t: Theme): void {
  _setTheme(t);
  applyTheme(t);
  try {
    const settings: Settings = { theme: t };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage errors
  }
}
