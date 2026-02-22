import { describe, it, expect, vi, beforeEach } from 'vitest';

const STORAGE_KEY = 'nori:settings';

describe('settings.store', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('defaults to dark theme when localStorage is empty', async () => {
    const { theme } = await import('./settings.store');
    expect(theme()).toBe('dark');
  });

  it('loads stored light theme from localStorage', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: 'light' }));
    const { theme } = await import('./settings.store');
    expect(theme()).toBe('light');
  });

  it('loads stored dark theme from localStorage', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: 'dark' }));
    const { theme } = await import('./settings.store');
    expect(theme()).toBe('dark');
  });

  it('falls back to dark when localStorage value is invalid', async () => {
    localStorage.setItem(STORAGE_KEY, 'not-json{{{');
    const { theme } = await import('./settings.store');
    expect(theme()).toBe('dark');
  });

  it('falls back to dark when stored theme value is unrecognised', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: 'solarized' }));
    const { theme } = await import('./settings.store');
    expect(theme()).toBe('dark');
  });

  it('applies data-theme="light" to <html> when stored theme is light', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: 'light' }));
    await import('./settings.store');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('does not set data-theme attribute when stored theme is dark', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: 'dark' }));
    await import('./settings.store');
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });

  it('setTheme updates the signal to light', async () => {
    const { theme, setTheme } = await import('./settings.store');
    expect(theme()).toBe('dark');
    setTheme('light');
    expect(theme()).toBe('light');
  });

  it('setTheme updates the signal back to dark', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: 'light' }));
    const { theme, setTheme } = await import('./settings.store');
    setTheme('dark');
    expect(theme()).toBe('dark');
  });

  it('setTheme sets data-theme="light" on <html>', async () => {
    const { setTheme } = await import('./settings.store');
    setTheme('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('setTheme removes data-theme when switching to dark', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: 'light' }));
    const { setTheme } = await import('./settings.store');
    setTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });

  it('setTheme persists the new theme to localStorage', async () => {
    const { setTheme } = await import('./settings.store');
    setTheme('light');
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.theme).toBe('light');
  });

  it('setTheme overwrites a previous localStorage value', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: 'light' }));
    const { setTheme } = await import('./settings.store');
    setTheme('dark');
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.theme).toBe('dark');
  });
});
