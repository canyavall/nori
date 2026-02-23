import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@solidjs/testing-library';
import type { KnowledgeEntry } from '@nori/shared';
import type { JSX } from 'solid-js';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('./KnowledgeListSection.hook', () => ({
  useKnowledgeListSection: vi.fn(),
}));

vi.mock('@solidjs/router', () => ({
  A: (props: { href: string; class?: string; children: JSX.Element }) => (
    <a href={props.href} class={props.class}>{props.children}</a>
  ),
}));

vi.mock('../knowledge-create/KnowledgeCreateDialog/KnowledgeCreateDialog', () => ({
  KnowledgeCreateDialog: () => <div data-testid="create-dialog" />,
}));

vi.mock('../knowledge-edit/KnowledgeEditDialog/KnowledgeEditDialog', () => ({
  KnowledgeEditDialog: () => <div data-testid="edit-dialog" />,
}));

vi.mock('../repo-knowledge-extract/RepoExtractDialog/RepoExtractDialog', () => ({
  RepoExtractDialog: () => <div data-testid="extract-dialog" />,
}));

vi.mock('../knowledge-search/SearchForm/SearchForm', () => ({
  SearchForm: () => <div data-testid="search-form" />,
}));

vi.mock('../knowledge-search/SearchResults/SearchResults', () => ({
  SearchResults: () => <div data-testid="search-results" />,
}));

import { useKnowledgeListSection } from './KnowledgeListSection.hook';
import { KnowledgeListSection } from './KnowledgeListSection';

const mockUse = vi.mocked(useKnowledgeListSection);

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeDefaultHook(overrides: Record<string, unknown> = {}) {
  return {
    loading: () => false,
    selectedVaultId: () => '',
    setSelectedVaultId: vi.fn(),
    editEntryId: () => null,
    setEditEntryId: vi.fn(),
    searching: () => false,
    searchResultItems: () => [],
    searchTotalCount: () => 0,
    searchError: () => '',
    activeQuery: () => '',
    effectiveVaultId: () => '',
    knowledgeEntries: () => [],
    searchQuery: () => '',
    createOpen: () => false,
    setCreateOpen: vi.fn(),
    vaults: () => [],
    activeVault: () => null,
    activeProject: () => null,
    handleSearch: vi.fn(),
    handleClearSearch: vi.fn(),
    extractOpen: () => false,
    setExtractOpen: vi.fn(),
    ...overrides,
  };
}

function makeEntry(overrides: Partial<KnowledgeEntry> = {}): KnowledgeEntry {
  return {
    id: 'entry-1',
    vault_id: 'vault-1',
    file_path: 'docs/test.md',
    title: 'Test Entry',
    category: 'General',
    tags: ['tag-one', 'tag-two', 'tag-three'],
    description: 'Test description',
    required_knowledge: [],
    rules: [],
    content_hash: 'abc123',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('KnowledgeListSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    mockUse.mockReturnValue(makeDefaultHook());
  });

  it('shows loading state', () => {
    mockUse.mockReturnValue(makeDefaultHook({ loading: () => true }));
    render(() => <KnowledgeListSection />);
    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('shows empty state when no entries exist', () => {
    render(() => <KnowledgeListSection />);
    expect(screen.getByText('No knowledge entries found')).toBeDefined();
  });

  it('renders a list item for each knowledge entry', () => {
    const entries = [
      makeEntry({ id: 'e1', title: 'Alpha Entry' }),
      makeEntry({ id: 'e2', title: 'Beta Entry' }),
    ];
    mockUse.mockReturnValue(makeDefaultHook({ knowledgeEntries: () => entries }));
    render(() => <KnowledgeListSection />);
    expect(screen.getByText('Alpha Entry')).toBeDefined();
    expect(screen.getByText('Beta Entry')).toBeDefined();
  });

  it('renders the search form', () => {
    render(() => <KnowledgeListSection />);
    expect(screen.getByTestId('search-form')).toBeDefined();
  });

  it('calls setCreateOpen(true) when Create Knowledge button is clicked', () => {
    const setCreateOpen = vi.fn();
    mockUse.mockReturnValue(makeDefaultHook({
      effectiveVaultId: () => 'vault-1',
      setCreateOpen,
    }));
    render(() => <KnowledgeListSection />);
    fireEvent.click(screen.getByRole('button', { name: /create knowledge/i }));
    expect(setCreateOpen).toHaveBeenCalledWith(true);
  });

  it('shows create dialog when createOpen is true', () => {
    mockUse.mockReturnValue(makeDefaultHook({ createOpen: () => true }));
    render(() => <KnowledgeListSection />);
    expect(screen.getByTestId('create-dialog')).toBeDefined();
  });

  it('shows search results when activeQuery is set', () => {
    mockUse.mockReturnValue(makeDefaultHook({
      activeQuery: () => 'my query',
      searching: () => false,
    }));
    render(() => <KnowledgeListSection />);
    expect(screen.getByTestId('search-results')).toBeDefined();
  });

  it('renders the Knowledge heading', () => {
    render(() => <KnowledgeListSection />);
    expect(screen.getByText('Knowledge')).toBeDefined();
  });
});
