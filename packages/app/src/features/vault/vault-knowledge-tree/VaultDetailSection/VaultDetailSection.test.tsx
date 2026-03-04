import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@solidjs/testing-library';
import type { KnowledgeEntry, Vault } from '@nori/shared';

// ── Captured callbacks (set by mock panel, used by tests) ──────────────────────

let capturedOnDeleteSuccess: (() => void) | undefined;
let capturedOnDeleted: (() => void) | undefined;

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../../../lib/api', () => ({
  apiGet: vi.fn(),
}));

vi.mock('@solidjs/router', () => ({
  A: (props: { href: string; children: unknown; class?: string; title?: string }) => (
    <a href={props.href}>{props.children}</a>
  ),
}));

vi.mock('../CategoryTree/CategoryTree', () => ({
  CategoryTree: (props: { categories: Record<string, KnowledgeEntry[]>; onEditEntry: (id: string) => void }) => (
    <div data-testid="category-tree">
      {Object.values(props.categories).flat().map((e) => (
        <button
          key={e.id}
          data-testid={`entry-btn-${e.id}`}
          onClick={() => props.onEditEntry(e.id)}
        >
          {e.title}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../../../knowledge/knowledge-detail/KnowledgeDetailPanel/KnowledgeDetailPanel', () => ({
  KnowledgeDetailPanel: (props: {
    entryId: string;
    onSaved?: () => void;
    onDeleteSuccess?: () => void;
    onDeleted?: () => void;
  }) => {
    capturedOnDeleteSuccess = props.onDeleteSuccess;
    capturedOnDeleted = props.onDeleted;
    return <div data-testid="knowledge-panel" data-entry-id={props.entryId} />;
  },
}));

vi.mock('../../../knowledge/knowledge-create/KnowledgeCreateDialog/KnowledgeCreateDialog', () => ({
  KnowledgeCreateDialog: () => <div data-testid="create-dialog" />,
}));

vi.mock('../../vault-link-project/VaultLinkProjectDialog/VaultLinkProjectDialog', () => ({
  VaultLinkProjectDialog: () => <div data-testid="link-dialog" />,
}));

vi.mock('../../vault-knowledge-import/VaultKnowledgeImportDialog', () => ({
  VaultKnowledgeImportDialog: () => <div data-testid="import-dialog" />,
}));

vi.mock('../../vault-knowledge-export/VaultKnowledgeExportDialog', () => ({
  VaultKnowledgeExportDialog: () => <div data-testid="export-dialog" />,
}));

vi.mock('../../vault-settings/VaultSettingsDialog/VaultSettingsDialog', () => ({
  VaultSettingsDialog: () => <div data-testid="settings-dialog" />,
}));

import { apiGet } from '../../../../lib/api';
import { VaultDetailSection } from './VaultDetailSection';

const mockApiGet = vi.mocked(apiGet);

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeVault(overrides: Partial<Vault> = {}): Vault {
  return {
    id: 'vault-1',
    name: 'Test Vault',
    vault_type: 'local',
    local_path: '/test/vault',
    git_url: null,
    branch: null,
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
    file_path: 'docs/entry.md',
    title: 'Entry One',
    category: 'General',
    tags: [],
    description: '',
    required_knowledge: [],
    rules: [],
    content_hash: 'abc',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function setupApiMock(entries: KnowledgeEntry[]): void {
  mockApiGet.mockImplementation((url: string) => {
    if (url === '/api/vault') return Promise.resolve({ data: [makeVault()] });
    if (url.startsWith('/api/knowledge')) return Promise.resolve({ data: entries });
    return Promise.resolve({ data: [] });
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('VaultDetailSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    capturedOnDeleteSuccess = undefined;
    capturedOnDeleted = undefined;
  });

  // ── Basic rendering ────────────────────────────────────────────────────────

  it('renders vault name in sub-header after load', async () => {
    setupApiMock([]);
    render(() => <VaultDetailSection vaultId="vault-1" />);
    await waitFor(() => expect(screen.getByText('Test Vault')).toBeDefined());
  });

  it('renders entries in the category tree', async () => {
    const entries = [
      makeEntry({ id: 'e1', title: 'Alpha' }),
      makeEntry({ id: 'e2', title: 'Beta' }),
    ];
    setupApiMock(entries);
    render(() => <VaultDetailSection vaultId="vault-1" />);
    await waitFor(() => expect(screen.getByText('Alpha')).toBeDefined());
    expect(screen.getByText('Beta')).toBeDefined();
  });

  it('shows placeholder when no entry is selected', async () => {
    setupApiMock([]);
    render(() => <VaultDetailSection vaultId="vault-1" />);
    await waitFor(() => expect(screen.getByText(/select a knowledge entry/i)).toBeDefined());
    expect(screen.queryByTestId('knowledge-panel')).toBeNull();
  });

  it('shows the knowledge panel when an entry is selected', async () => {
    const entries = [makeEntry({ id: 'e1', title: 'Alpha' })];
    setupApiMock(entries);
    render(() => <VaultDetailSection vaultId="vault-1" />);
    await waitFor(() => expect(screen.getByTestId('entry-btn-e1')).toBeDefined());
    fireEvent.click(screen.getByTestId('entry-btn-e1'));
    expect(screen.getByTestId('knowledge-panel')).toBeDefined();
    expect(screen.getByTestId('knowledge-panel').getAttribute('data-entry-id')).toBe('e1');
  });

  it('passes onDeleteSuccess prop to KnowledgeDetailPanel', async () => {
    const entries = [makeEntry({ id: 'e1', title: 'Alpha' })];
    setupApiMock(entries);
    render(() => <VaultDetailSection vaultId="vault-1" />);
    await waitFor(() => expect(screen.getByTestId('entry-btn-e1')).toBeDefined());
    fireEvent.click(screen.getByTestId('entry-btn-e1'));
    expect(capturedOnDeleteSuccess).toBeDefined();
  });

  // ── Delete: sidebar refresh ────────────────────────────────────────────────

  it('reloads sidebar entries immediately when onDeleteSuccess fires', async () => {
    const entry = makeEntry({ id: 'e1', title: 'To Delete' });
    let knowledgeCallCount = 0;
    mockApiGet.mockImplementation((url: string) => {
      if (url === '/api/vault') return Promise.resolve({ data: [makeVault()] });
      if (url.startsWith('/api/knowledge')) {
        knowledgeCallCount++;
        // First load: entry present; subsequent loads: entry gone
        return Promise.resolve({ data: knowledgeCallCount <= 1 ? [entry] : [] });
      }
      return Promise.resolve({ data: [] });
    });

    render(() => <VaultDetailSection vaultId="vault-1" />);
    await waitFor(() => expect(screen.getByTestId('entry-btn-e1')).toBeDefined());

    fireEvent.click(screen.getByTestId('entry-btn-e1'));
    expect(capturedOnDeleteSuccess).toBeDefined();

    // Simulate the panel reporting successful deletion
    capturedOnDeleteSuccess!();

    // Sidebar must reload and hide the deleted entry — without waiting for user to click Done
    await waitFor(() => expect(screen.queryByTestId('entry-btn-e1')).toBeNull());
  });

  it('keeps panel visible while onDeleteSuccess fires (user still sees DeleteResult)', async () => {
    const entries = [makeEntry({ id: 'e1', title: 'To Delete' })];
    mockApiGet.mockImplementation((url: string) => {
      if (url === '/api/vault') return Promise.resolve({ data: [makeVault()] });
      if (url.startsWith('/api/knowledge')) return Promise.resolve({ data: entries });
      return Promise.resolve({ data: [] });
    });

    render(() => <VaultDetailSection vaultId="vault-1" />);
    await waitFor(() => expect(screen.getByTestId('entry-btn-e1')).toBeDefined());
    fireEvent.click(screen.getByTestId('entry-btn-e1'));

    // Panel is visible
    expect(screen.getByTestId('knowledge-panel')).toBeDefined();

    capturedOnDeleteSuccess!();

    // Panel must remain visible (selectedEntryId NOT cleared by onDeleteSuccess)
    expect(screen.getByTestId('knowledge-panel')).toBeDefined();
  });

  // ── Delete: panel dismissal ────────────────────────────────────────────────

  it('clears the panel when onDeleted fires', async () => {
    const entries = [makeEntry({ id: 'e1', title: 'Done Entry' })];
    setupApiMock(entries);

    render(() => <VaultDetailSection vaultId="vault-1" />);
    await waitFor(() => expect(screen.getByTestId('entry-btn-e1')).toBeDefined());
    fireEvent.click(screen.getByTestId('entry-btn-e1'));
    expect(screen.getByTestId('knowledge-panel')).toBeDefined();

    capturedOnDeleted!();

    // Panel cleared — back to placeholder
    expect(screen.queryByTestId('knowledge-panel')).toBeNull();
    expect(screen.getByText(/select a knowledge entry/i)).toBeDefined();
  });

  it('passes onDeleted prop to KnowledgeDetailPanel', async () => {
    const entries = [makeEntry({ id: 'e1', title: 'Alpha' })];
    setupApiMock(entries);
    render(() => <VaultDetailSection vaultId="vault-1" />);
    await waitFor(() => expect(screen.getByTestId('entry-btn-e1')).toBeDefined());
    fireEvent.click(screen.getByTestId('entry-btn-e1'));
    expect(capturedOnDeleted).toBeDefined();
  });
});
