import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@solidjs/testing-library';
import type { AuthDetail } from './SettingsSection.type';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('./SettingsSection.hook', () => ({
  useSettingsSection: vi.fn(),
}));

vi.mock('../settings-theme/ThemeSwitcher', () => ({
  ThemeSwitcher: () => <div data-testid="theme-switcher" />,
}));

import { useSettingsSection } from './SettingsSection.hook';
import { SettingsSection } from './SettingsSection';

const mockUse = vi.mocked(useSettingsSection);

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeAuthDetail(overrides: Partial<AuthDetail> = {}): AuthDetail {
  return {
    has_anthropic_access: true,
    anthropic_access_type: 'cli_auth',
    subscription_type: 'pro',
    anthropic_email: 'user@example.com',
    cli_installed: true,
    cli_version: '1.0.0',
    issues: [],
    instructions: [],
    ...overrides,
  };
}

function makeDefaultHook(overrides: Record<string, unknown> = {}) {
  return {
    checking: () => false,
    detail: () => null,
    subscriptionLabel: () => '',
    runCheck: vi.fn(),
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SettingsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    mockUse.mockReturnValue(makeDefaultHook());
  });

  it('renders the Settings heading', () => {
    render(() => <SettingsSection />);
    expect(screen.getByText('Settings')).toBeDefined();
  });

  it('shows checking state while checking is true', () => {
    mockUse.mockReturnValue(makeDefaultHook({ checking: () => true }));
    render(() => <SettingsSection />);
    expect(screen.getByText('Checking Anthropic access…')).toBeDefined();
  });

  it('disables Re-check button while checking', () => {
    mockUse.mockReturnValue(makeDefaultHook({ checking: () => true }));
    render(() => <SettingsSection />);
    const btn = screen.getByRole('button', { name: /checking/i });
    expect(btn.hasAttribute('disabled')).toBe(true);
  });

  it('shows authenticated state when has_anthropic_access is true', () => {
    const detail = makeAuthDetail({ has_anthropic_access: true });
    mockUse.mockReturnValue(makeDefaultHook({
      checking: () => false,
      detail: () => detail,
      subscriptionLabel: () => 'Pro',
    }));
    render(() => <SettingsSection />);
    expect(screen.getByText('Access confirmed')).toBeDefined();
  });

  it('shows unauthenticated state when has_anthropic_access is false', () => {
    const detail = makeAuthDetail({ has_anthropic_access: false });
    mockUse.mockReturnValue(makeDefaultHook({
      checking: () => false,
      detail: () => detail,
    }));
    render(() => <SettingsSection />);
    expect(screen.getByText('No Anthropic access detected')).toBeDefined();
  });

  it('calls runCheck when Re-check button is clicked', () => {
    const runCheck = vi.fn();
    mockUse.mockReturnValue(makeDefaultHook({ runCheck }));
    render(() => <SettingsSection />);
    fireEvent.click(screen.getByRole('button', { name: /re-check/i }));
    expect(runCheck).toHaveBeenCalledOnce();
  });

  it('renders the ThemeSwitcher', () => {
    render(() => <SettingsSection />);
    expect(screen.getByTestId('theme-switcher')).toBeDefined();
  });

  it('shows CLI installed status when detail is available', () => {
    const detail = makeAuthDetail({ cli_installed: true, cli_version: '2.0.0' });
    mockUse.mockReturnValue(makeDefaultHook({
      checking: () => false,
      detail: () => detail,
    }));
    render(() => <SettingsSection />);
    expect(screen.getByText('Installed')).toBeDefined();
    expect(screen.getByText('2.0.0')).toBeDefined();
  });

  it('shows CLI not installed when cli_installed is false', () => {
    const detail = makeAuthDetail({ cli_installed: false });
    mockUse.mockReturnValue(makeDefaultHook({
      checking: () => false,
      detail: () => detail,
    }));
    render(() => <SettingsSection />);
    expect(screen.getByText('Not installed')).toBeDefined();
  });
});
