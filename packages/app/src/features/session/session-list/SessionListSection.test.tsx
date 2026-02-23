import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@solidjs/testing-library';
import type { Session, Vault } from '@nori/shared';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('./SessionListSection.hook', () => ({
  useSessionListSection: vi.fn(),
}));

vi.mock('../session-browser/SessionList/SessionList', () => ({
  SessionList: (props: { sessions: Session[]; onCreateNew: () => void; createDisabled: boolean }) => (
    <div data-testid="session-list">
      {props.sessions.map((s) => (
        <div data-testid="session-item">{s.title ?? s.id}</div>
      ))}
      <button onClick={props.onCreateNew} disabled={props.createDisabled}>New Session</button>
    </div>
  ),
}));

vi.mock('../session-browser/SessionDetail/SessionDetail', () => ({
  SessionDetail: (props: { session: Session }) => (
    <div data-testid="session-detail">{props.session.title ?? props.session.id}</div>
  ),
}));

import { useSessionListSection } from './SessionListSection.hook';
import { SessionListSection } from './SessionListSection';

const mockUse = vi.mocked(useSessionListSection);

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'session-1',
    vault_id: 'vault-1',
    title: 'My Session',
    status: 'active',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeVault(overrides: Partial<Vault> = {}): Vault {
  return {
    id: 'vault-1',
    name: 'test-vault',
    vault_type: 'local',
    local_path: '/home/user/.nori/vaults/test',
    git_url: null,
    branch: null,
    last_synced_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeDefaultHook(overrides: Record<string, unknown> = {}) {
  return {
    step: () => 'list' as const,
    setStep: vi.fn(),
    selectedSession: () => null,
    error: () => '',
    actionLoading: () => false,
    selectedVaultId: () => '',
    setSelectedVaultId: vi.fn(),
    sessionTitle: () => '',
    setSessionTitle: vi.fn(),
    effectiveVaultId: () => '',
    sessions: () => [],
    vaults: () => [],
    handleSelect: vi.fn(),
    handleBack: vi.fn(),
    handleCreateNew: vi.fn(),
    handleCreateWithVault: vi.fn(),
    handleCancelCreate: vi.fn(),
    handleResume: vi.fn(),
    handleArchive: vi.fn(),
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SessionListSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    mockUse.mockReturnValue(makeDefaultHook());
  });

  it('shows loading state', () => {
    mockUse.mockReturnValue(makeDefaultHook({ step: () => 'loading' }));
    render(() => <SessionListSection />);
    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('renders session list in list step', () => {
    const sessions = [
      makeSession({ id: 's1', title: 'Alpha Session' }),
      makeSession({ id: 's2', title: 'Beta Session' }),
    ];
    mockUse.mockReturnValue(makeDefaultHook({ sessions: () => sessions }));
    render(() => <SessionListSection />);
    expect(screen.getByTestId('session-list')).toBeDefined();
    expect(screen.getByText('Alpha Session')).toBeDefined();
    expect(screen.getByText('Beta Session')).toBeDefined();
  });

  it('calls handleCreateNew when New Session button is clicked', () => {
    const handleCreateNew = vi.fn();
    mockUse.mockReturnValue(makeDefaultHook({
      handleCreateNew,
      vaults: () => [makeVault()],
    }));
    render(() => <SessionListSection />);
    fireEvent.click(screen.getByRole('button', { name: 'New Session' }));
    expect(handleCreateNew).toHaveBeenCalledOnce();
  });

  it('shows vault picker step when step is create-vault-pick', () => {
    const vaults = [makeVault({ id: 'v1', name: 'Vault A' }), makeVault({ id: 'v2', name: 'Vault B' })];
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'create-vault-pick',
      vaults: () => vaults,
    }));
    render(() => <SessionListSection />);
    expect(screen.getByText('New Session')).toBeDefined();
    expect(screen.getByLabelText('Vault')).toBeDefined();
  });

  it('calls handleCancelCreate when Cancel button is clicked in create-vault-pick', () => {
    const handleCancelCreate = vi.fn();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'create-vault-pick',
      handleCancelCreate,
    }));
    render(() => <SessionListSection />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(handleCancelCreate).toHaveBeenCalledOnce();
  });

  it('calls handleCancelCreate when Back to Sessions button is clicked', () => {
    const handleCancelCreate = vi.fn();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'create-vault-pick',
      handleCancelCreate,
    }));
    render(() => <SessionListSection />);
    fireEvent.click(screen.getByRole('button', { name: /back to sessions/i }));
    expect(handleCancelCreate).toHaveBeenCalledOnce();
  });

  it('shows session detail when step is detail', () => {
    const session = makeSession({ id: 's1', title: 'Detail Session' });
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'detail',
      selectedSession: () => session,
    }));
    render(() => <SessionListSection />);
    expect(screen.getByTestId('session-detail')).toBeDefined();
    expect(screen.getByText('Detail Session')).toBeDefined();
  });

  it('shows creating spinner during creation', () => {
    mockUse.mockReturnValue(makeDefaultHook({ step: () => 'creating' }));
    render(() => <SessionListSection />);
    expect(screen.getByText('Creating session...')).toBeDefined();
  });
});
