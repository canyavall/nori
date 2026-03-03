import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@solidjs/testing-library';
import type { KnowledgeEntry, Vault } from '@nori/shared';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../../../lib/api', () => ({
  apiGet: vi.fn(),
}));

vi.mock('../../../knowledge/knowledge-edit/KnowledgeEditDialog/KnowledgeEditDialog', () => ({
  KnowledgeEditDialog: (props: { entryId: string; onClose: () => void }) => (
    <div data-testid="edit-dialog" data-entry-id={props.entryId}>
      <button type="button" onClick={props.onClose}>Close</button>
    </div>
  ),
}));

import { apiGet } from '../../../../lib/api';
import { VaultKnowledgeTree } from './VaultKnowledgeTree';

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeVault(overrides: Partial<Vault> = {}): Vault {
  return {
    id: 'vault-1',
    name: 'test-vault',
    vault_type: 'local',
    git_url: null,
    branch: null,
    local_path: '/home/.nori/vaults/test',
    last_synced_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeEntry(overrides: Partial<KnowledgeEntry> = {}): KnowledgeEntry {
  return {
    id: 'entry-1',
    vault_id: 'vault-1',
    file_path: '/path/entry.md',
    title: 'Test Entry',
    category: 'General',
    tags: [],
    description: '',
    required_knowledge: [],
    rules: [],
    content_hash: 'abc123',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('VaultKnowledgeTree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('shows loading spinner while fetching entries', () => {
    vi.mocked(apiGet).mockReturnValue(new Promise(() => {}));
    render(() => <VaultKnowledgeTree vault={makeVault()} />);
    expect(screen.getByText('Loading knowledge...')).toBeDefined();
  });

  it('shows vault name in header', async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: [] });
    render(() => <VaultKnowledgeTree vault={makeVault({ name: 'docs-vault' })} />);
    expect(screen.getByText('docs-vault')).toBeDefined();
  });

  it('shows error message when fetch fails', async () => {
    vi.mocked(apiGet).mockRejectedValue(new Error('Network error'));
    render(() => <VaultKnowledgeTree vault={makeVault()} />);
    await waitFor(() => expect(screen.getByText('Network error')).toBeDefined());
  });

  it('shows retry link on error', async () => {
    vi.mocked(apiGet).mockRejectedValue(new Error('Network error'));
    render(() => <VaultKnowledgeTree vault={makeVault()} />);
    await waitFor(() => expect(screen.getByText('Retry')).toBeDefined());
  });

  it('shows empty state when vault has no entries', async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: [] });
    render(() => <VaultKnowledgeTree vault={makeVault()} />);
    await waitFor(() => expect(screen.getByText('No knowledge entries')).toBeDefined());
  });

  it('shows entry count after loading', async () => {
    const entries = [makeEntry({ id: 'e1' }), makeEntry({ id: 'e2', title: 'Another' })];
    vi.mocked(apiGet).mockResolvedValue({ data: entries });
    render(() => <VaultKnowledgeTree vault={makeVault()} />);
    await waitFor(() => expect(screen.getByText('2 knowledge entries')).toBeDefined());
  });

  it('shows singular "entry" for a single result', async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: [makeEntry()] });
    render(() => <VaultKnowledgeTree vault={makeVault()} />);
    await waitFor(() => expect(screen.getByText('1 knowledge entry')).toBeDefined());
  });

  it('fetches entries using the vault_id query param', async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: [] });
    render(() => <VaultKnowledgeTree vault={makeVault({ id: 'vault-xyz' })} />);
    await waitFor(() =>
      expect(vi.mocked(apiGet)).toHaveBeenCalledWith('/api/knowledge?vault_id=vault-xyz')
    );
  });

  it('renders category names when entries are loaded', async () => {
    const entries = [
      makeEntry({ id: 'e1', category: 'Architecture' }),
      makeEntry({ id: 'e2', category: 'Onboarding' }),
    ];
    vi.mocked(apiGet).mockResolvedValue({ data: entries });
    render(() => <VaultKnowledgeTree vault={makeVault()} />);
    await waitFor(() => {
      expect(screen.getByText('Architecture')).toBeDefined();
      expect(screen.getByText('Onboarding')).toBeDefined();
    });
  });

  it('groups entries without a category under "Uncategorized"', async () => {
    const entry = makeEntry({ category: '' });
    vi.mocked(apiGet).mockResolvedValue({ data: [entry] });
    render(() => <VaultKnowledgeTree vault={makeVault()} />);
    await waitFor(() => expect(screen.getByText('Uncategorized')).toBeDefined());
  });

  it('opens edit dialog when entry row is clicked', async () => {
    const entry = makeEntry({ id: 'entry-42', title: 'My Entry', category: 'General' });
    vi.mocked(apiGet).mockResolvedValue({ data: [entry] });
    render(() => <VaultKnowledgeTree vault={makeVault()} />);
    await waitFor(() => expect(screen.getByText('My Entry')).toBeDefined());

    fireEvent.click(screen.getByRole('button', { name: /My Entry/ }));

    await waitFor(() => {
      const dialog = screen.getByTestId('edit-dialog');
      expect(dialog.getAttribute('data-entry-id')).toBe('entry-42');
    });
  });

  it('closes edit dialog when onClose is called', async () => {
    const entry = makeEntry({ id: 'e1', title: 'My Entry', category: 'General' });
    vi.mocked(apiGet).mockResolvedValue({ data: [entry] });
    render(() => <VaultKnowledgeTree vault={makeVault()} />);
    await waitFor(() => expect(screen.getByText('My Entry')).toBeDefined());

    fireEvent.click(screen.getByRole('button', { name: /My Entry/ }));
    await waitFor(() => screen.getByTestId('edit-dialog'));

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByTestId('edit-dialog')).toBeNull());
  });

  it('reloads entries after edit dialog is closed', async () => {
    const entry = makeEntry({ id: 'e1', title: 'My Entry', category: 'General' });
    vi.mocked(apiGet).mockResolvedValue({ data: [entry] });
    render(() => <VaultKnowledgeTree vault={makeVault()} />);
    await waitFor(() => expect(screen.getByText('My Entry')).toBeDefined());

    const callsBefore = vi.mocked(apiGet).mock.calls.length;

    fireEvent.click(screen.getByRole('button', { name: /My Entry/ }));
    await waitFor(() => screen.getByTestId('edit-dialog'));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() =>
      expect(vi.mocked(apiGet).mock.calls.length).toBeGreaterThan(callsBefore)
    );
  });

  it('normalizes tags from JSON string when entry arrives as string', async () => {
    const entry = { ...makeEntry({ id: 'e1', title: 'Tagged', category: 'General' }), tags: '["a","b"]' as unknown as string[] };
    vi.mocked(apiGet).mockResolvedValue({ data: [entry] });
    render(() => <VaultKnowledgeTree vault={makeVault()} />);
    await waitFor(() => {
      expect(screen.getByText('a')).toBeDefined();
      expect(screen.getByText('b')).toBeDefined();
    });
  });

  it('shows Refresh button', async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: [] });
    render(() => <VaultKnowledgeTree vault={makeVault()} />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Refresh' })).toBeDefined()
    );
  });

  it('clicking Refresh reloads entries', async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: [] });
    render(() => <VaultKnowledgeTree vault={makeVault()} />);
    await waitFor(() => screen.getByRole('button', { name: 'Refresh' }));

    const callsBefore = vi.mocked(apiGet).mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

    await waitFor(() =>
      expect(vi.mocked(apiGet).mock.calls.length).toBeGreaterThan(callsBefore)
    );
  });
});
