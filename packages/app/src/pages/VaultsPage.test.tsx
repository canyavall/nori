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

// Navigation store: use a real SolidJS signal so reactive Show blocks update
// when selectVault / clearVaultContext are called during tests.
vi.mock('../stores/navigation.store', async () => {
  const { createSignal } = await import('solid-js');
  const [activeVault, setActiveVault] = createSignal<Vault | null>(null);
  return {
    activeVault,
    selectVault: vi.fn((v: Vault) => setActiveVault(v)),
    clearVaultContext: vi.fn(() => setActiveVault(null)),
    // Exposed so beforeEach can reset the signal between tests
    __setActiveVault: setActiveVault,
  };
});

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

vi.mock('../features/vault/vault-knowledge-tree/VaultKnowledgeTree/VaultKnowledgeTree', () => ({
  VaultKnowledgeTree: (props: { vault: Vault }) => (
    <div data-testid="knowledge-tree" data-vault-id={props.vault.id} />
  ),
}));

import { apiGet } from '../lib/api';
import * as navStore from '../stores/navigation.store';
import { selectVault, clearVaultContext, activeVault } from '../stores/navigation.store';
import { VaultsPage } from './VaultsPage';

// Helper to reset the reactive signal between tests
function resetActiveVault() {
  (navStore as unknown as { __setActiveVault: (v: Vault | null) => void }).__setActiveVault(null);
}

function setActiveVaultForTest(vault: Vault) {
  (navStore as unknown as { __setActiveVault: (v: Vault | null) => void }).__setActiveVault(vault);
}

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
    resetActiveVault();
    cleanup();
  });

  it('clears vault context on mount', () => {
    vi.mocked(apiGet).mockResolvedValue({ data: [] });
    render(() => <VaultsPage />);
    expect(vi.mocked(clearVaultContext)).toHaveBeenCalledOnce();
  });

  it('clears vault context even when a vault was previously selected', () => {
    const vault = makeVault({ id: 'vault-1', name: 'hytale' });
    setActiveVaultForTest(vault);
    vi.mocked(apiGet).mockResolvedValue({ data: [vault] });
    render(() => <VaultsPage />);
    expect(vi.mocked(clearVaultContext)).toHaveBeenCalledOnce();
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

  it('calls selectVault when a vault card is clicked', async () => {
    const vault = makeVault();
    vi.mocked(apiGet).mockResolvedValue({ data: [vault] });
    render(() => <VaultsPage />);
    await waitFor(() => expect(screen.getByText('hytale')).toBeDefined());
    fireEvent.click(screen.getByText('hytale'));
    expect(vi.mocked(selectVault)).toHaveBeenCalledWith(vault);
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

  it('vault card does not have accent border before any vault is selected', async () => {
    const vault = makeVault();
    vi.mocked(apiGet).mockResolvedValue({ data: [vault] });
    render(() => <VaultsPage />);
    await waitFor(() => {
      const card = screen.getByText('hytale').closest('[class*="rounded-lg"]');
      expect(card?.className).not.toContain('border-[var(--color-accent)]');
    });
  });

  // ── Knowledge tree panel ──────────────────────────────────────────────────────

  it('does not show knowledge tree when no vault is selected', async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: [makeVault()] });
    render(() => <VaultsPage />);
    await waitFor(() => expect(screen.getByText('hytale')).toBeDefined());
    expect(screen.queryByTestId('knowledge-tree')).toBeNull();
  });

  it('clicking a vault card switches from grid to master-detail and shows the knowledge tree', async () => {
    const vault = makeVault({ id: 'vault-42' });
    vi.mocked(apiGet).mockResolvedValue({ data: [vault] });
    render(() => <VaultsPage />);

    // Wait for grid to appear (no vault selected yet)
    await waitFor(() => expect(screen.getByText('hytale')).toBeDefined());
    expect(screen.queryByTestId('knowledge-tree')).toBeNull();

    // Click the vault card — selectVault updates the signal reactively
    fireEvent.click(screen.getByText('hytale'));

    // Knowledge tree should now be visible
    await waitFor(() => {
      const tree = screen.getByTestId('knowledge-tree');
      expect(tree).toBeDefined();
      expect(tree.getAttribute('data-vault-id')).toBe('vault-42');
    });
  });

  it('knowledge tree receives the correct vault after clicking a card', async () => {
    const vaultA = makeVault({ id: 'vault-a', name: 'alpha' });
    const vaultB = makeVault({ id: 'vault-b', name: 'beta' });
    vi.mocked(apiGet).mockResolvedValue({ data: [vaultA, vaultB] });
    render(() => <VaultsPage />);

    await waitFor(() => expect(screen.getByText('beta')).toBeDefined());
    fireEvent.click(screen.getByText('beta'));

    await waitFor(() => {
      const tree = screen.getByTestId('knowledge-tree');
      expect(tree.getAttribute('data-vault-id')).toBe('vault-b');
    });
  });

  it('shows knowledge tree for a pre-selected vault', async () => {
    const vault = makeVault({ id: 'vault-42' });
    vi.mocked(apiGet).mockResolvedValue({ data: [vault] });
    // Prevent onMount from clearing the pre-set vault
    vi.mocked(clearVaultContext).mockImplementationOnce(() => {});
    setActiveVaultForTest(vault);
    render(() => <VaultsPage />);
    await waitFor(() => {
      const tree = screen.getByTestId('knowledge-tree');
      expect(tree).toBeDefined();
      expect(tree.getAttribute('data-vault-id')).toBe('vault-42');
    });
  });

  it('vault cards are NOT shown alongside the knowledge tree when a vault is selected', async () => {
    const vault = makeVault({ name: 'my-vault' });
    vi.mocked(apiGet).mockResolvedValue({ data: [vault] });
    vi.mocked(clearVaultContext).mockImplementationOnce(() => {});
    setActiveVaultForTest(vault);
    render(() => <VaultsPage />);
    await waitFor(() => expect(screen.getByTestId('knowledge-tree')).toBeDefined());
    // Vault cards should not be rendered when the tree is active
    expect(screen.queryByText('my-vault')).toBeNull();
  });

  it('activeVault signal is set after clicking a vault card', async () => {
    const vault = makeVault();
    vi.mocked(apiGet).mockResolvedValue({ data: [vault] });
    render(() => <VaultsPage />);
    await waitFor(() => expect(screen.getByText('hytale')).toBeDefined());

    fireEvent.click(screen.getByText('hytale'));

    expect(activeVault()).toBe(vault);
  });
});
