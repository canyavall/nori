import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@solidjs/testing-library';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { getTheme, setMockTheme, setThemeMock } = vi.hoisted(() => {
  let _theme: 'dark' | 'light' = 'dark';
  return {
    getTheme: () => _theme,
    setMockTheme: (t: 'dark' | 'light') => {
      _theme = t;
    },
    setThemeMock: vi.fn((t: 'dark' | 'light') => {
      _theme = t;
    }),
  };
});

vi.mock('../../../stores/settings.store', () => ({
  theme: getTheme,
  setTheme: setThemeMock,
}));

import { ThemeSwitcher } from './ThemeSwitcher';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ThemeSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setMockTheme('dark');
    cleanup();
  });

  it('renders a Dark button', () => {
    render(() => <ThemeSwitcher />);
    expect(screen.getByRole('button', { name: 'Dark' })).toBeDefined();
  });

  it('renders a Light button', () => {
    render(() => <ThemeSwitcher />);
    expect(screen.getByRole('button', { name: 'Light' })).toBeDefined();
  });

  it('Dark button has aria-pressed="true" when theme is dark', () => {
    render(() => <ThemeSwitcher />);
    const btn = screen.getByRole('button', { name: 'Dark' }) as HTMLButtonElement;
    expect(btn.getAttribute('aria-pressed')).toBe('true');
  });

  it('Light button has aria-pressed="false" when theme is dark', () => {
    render(() => <ThemeSwitcher />);
    const btn = screen.getByRole('button', { name: 'Light' }) as HTMLButtonElement;
    expect(btn.getAttribute('aria-pressed')).toBe('false');
  });

  it('Light button has aria-pressed="true" when theme is light', () => {
    setMockTheme('light');
    render(() => <ThemeSwitcher />);
    const btn = screen.getByRole('button', { name: 'Light' }) as HTMLButtonElement;
    expect(btn.getAttribute('aria-pressed')).toBe('true');
  });

  it('Dark button has aria-pressed="false" when theme is light', () => {
    setMockTheme('light');
    render(() => <ThemeSwitcher />);
    const btn = screen.getByRole('button', { name: 'Dark' }) as HTMLButtonElement;
    expect(btn.getAttribute('aria-pressed')).toBe('false');
  });

  it('clicking Light calls setTheme("light")', () => {
    render(() => <ThemeSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: 'Light' }));
    expect(setThemeMock).toHaveBeenCalledWith('light');
  });

  it('clicking Dark calls setTheme("dark")', () => {
    setMockTheme('light');
    render(() => <ThemeSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: 'Dark' }));
    expect(setThemeMock).toHaveBeenCalledWith('dark');
  });

  it('active button has ring class applied', () => {
    render(() => <ThemeSwitcher />);
    const activeBtn = screen.getByRole('button', { name: 'Dark' });
    expect(activeBtn.className).toContain('ring-2');
  });

  it('inactive button does not have ring class', () => {
    render(() => <ThemeSwitcher />);
    const inactiveBtn = screen.getByRole('button', { name: 'Light' });
    expect(inactiveBtn.className).not.toContain('ring-2');
  });
});
