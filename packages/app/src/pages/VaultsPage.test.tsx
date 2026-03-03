import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@solidjs/testing-library';
import type { Vault } from '@nori/shared';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
}));

vi.mock('../lib/sse', () => ({
  connectSSE: vi.fn(() => new AbortController()),
}));

// Router mock: capture navigate calls
const mockNavigate = vi.fn();
vi.mock('@solidjs/router', () => ({
  useNavigate: () => mockNavigate,
}));

const {
  getVaults,
  setVaultsMock,
  getRegistrationOpen,
  setRegistrationOpenMock,
  updateVaultMock,
} = vi.hoisted(() => {
  let _vaults: Vault[] = [];
  let _open = false;
  return {
    getVaults: () => _vaults,
    setVaultsMock: vi.fn((v: Vault[]) => { _vaults = v; }),
    getRegistrationOpen: () => _open,
    setRegistrationOpenMock: vi.fn((v: boolean) => { _open = v; }),
    updateVaultMock: vi.fn(),
  };
});

vi.mock('../stores/vault.store', () => ({
  vaults: getVaults,
  setVaults: setVaultsMock,
  registrationOpen: getRegistrationOpen,
  setRegistrationOpen: setRegistrationOpenMock,
  updateVault: updateVaultMock,
}));

vi.mock('../features/vault/vault-registration/VaultRegistrationDialog/VaultRegistrationDialog', () => ({
  VaultRegistrationDialog: () => <div data-testid="registration-dialog" />,
}));

vi.mock('../features/vault/vault-link-project/VaultLinkProjectDialog/VaultLinkProjectDialog', () => ({
  VaultLinkProjectDialog: () => <div data-testid="link-project-dialog" />,
}));

vi.mock('../features/vault/vault-sync-panel/SyncStatus/SyncStatus', () => ({
  SyncStatus: () => <div data-testid="sync-status" />,
}));

vi.mock('../features/vault/vault-sync-panel/PullResults/PullResults', () => ({
  PullResults: () => <div data-testid="pull-results" />,
}));

vi.mock('../features/vault/vault-sync-panel/PushResults/PushResults', () => ({
  PushResults: () => <div data-testid="push-results" />,
}));

vi.mock('../features/vault/vault-sync-panel/ConflictResolver/ConflictResolver', () => ({
  ConflictResolver: () => <div data-testid="conflict-resolver" />,
}));

import { apiGet } from '../lib/api';
import { VaultsPage } from './VaultsPage';

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeVault(overrides: Partial<Vault> = {}): Vault {
  return {
    id: 'vault-1',
    name: 'hytale',
    git_url: 'https://github.com/user/hytale-vault.git',
    local_path: '/home/user/.nori/vaults/hytale',
    branch: 'main',
    vault_type: 'git',
    last_synced_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('VaultsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('shows loading state initially', () => {
    vi.mocked(apiGet).mockReturnValue(new Promise(() => {}));
    render(() => <VaultsPage />);
    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('shows empty state when no vaults exist', async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: [] });
    render(() => <VaultsPage />);
    await waitFor(() => expect(screen.getByText('No vaults registered')).toBeDefined());
  });

  it('shows a card for each vault', async () => {
    const v1 = makeVault({ id: 'v1', name: 'vault-alpha' });
    const v2 = makeVault({ id: 'v2', name: 'vault-beta' });
    vi.mocked(apiGet).mockResolvedValue({ data: [v1, v2] });
    render(() => <VaultsPage />);
    await waitFor(() => {
      expect(screen.getByText('vault-alpha')).toBeDefined();
      expect(screen.getByText('vault-beta')).toBeDefined();
    });
  });

  it('clicking a vault card navigates to /vaults/:id', async () => {
    const vault = makeVault({ id: 'vault-42' });
    vi.mocked(apiGet).mockResolvedValue({ data: [vault] });
    render(() => <VaultsPage />);
    await waitFor(() => expect(screen.getByText('hytale')).toBeDefined());
    fireEvent.click(screen.getByText('hytale'));
    expect(mockNavigate).toHaveBeenCalledWith('/vaults/vault-42');
  });

  it('shows Register Vault button', async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: [] });
    render(() => <VaultsPage />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Register Vault' })).toBeDefined());
  });

  it('shows registration dialog when Register Vault is clicked', async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: [] });
    render(() => <VaultsPage />);
    await waitFor(() => screen.getByRole('button', { name: 'Register Vault' }));
    screen.getByRole('button', { name: 'Register Vault' }).click();
    expect(setRegistrationOpenMock).toHaveBeenCalledWith(true);
  });

  it('vault card shows branch badge', async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: [makeVault({ branch: 'develop' })] });
    render(() => <VaultsPage />);
    await waitFor(() => expect(screen.getByText('develop')).toBeDefined());
  });

  it('always shows Vaults heading and Register Vault button', async () => {
    const vault = makeVault();
    vi.mocked(apiGet).mockResolvedValue({ data: [vault] });
    render(() => <VaultsPage />);
    await waitFor(() => expect(screen.getByText('hytale')).toBeDefined());
    expect(screen.getByRole('heading', { name: 'Vaults' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Register Vault' })).toBeDefined();
  });
});
