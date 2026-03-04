import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@solidjs/testing-library';
import type { KnowledgeEntry } from '@nori/shared';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('./KnowledgeDetailPanel.hook', () => ({
  useKnowledgeDetailPanel: vi.fn(),
}));

vi.mock('../../knowledge-edit/EditForm/EditForm', () => ({
  EditForm: () => <div data-testid="edit-form" />,
}));

vi.mock('../../knowledge-delete/DeleteConfirmation/DeleteConfirmation', () => ({
  DeleteConfirmation: () => <div data-testid="delete-confirmation" />,
}));

vi.mock('../../knowledge-delete/DeleteResult/DeleteResult', () => ({
  DeleteResult: () => <div data-testid="delete-result" />,
}));

vi.mock('../../../../components/ui/MarkdownContent/MarkdownContent', () => ({
  MarkdownContent: (props: { content: string; viewMode: string }) => (
    <div data-testid="markdown-content" data-view-mode={props.viewMode}>{props.content}</div>
  ),
}));

import { useKnowledgeDetailPanel } from './KnowledgeDetailPanel.hook';
import { KnowledgeDetailPanel } from './KnowledgeDetailPanel';

const mockUse = vi.mocked(useKnowledgeDetailPanel);

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<KnowledgeEntry> = {}): KnowledgeEntry {
  return {
    id: 'entry-1',
    vault_id: 'vault-1',
    file_path: 'docs/test.md',
    title: 'Panel Entry',
    category: 'General',
    tags: ['a', 'b'],
    description: 'Description here',
    required_knowledge: [],
    rules: [],
    content_hash: 'hash123',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeDefaultHook(overrides: Record<string, unknown> = {}) {
  return {
    step: () => 'loading' as const,
    error: () => '',
    saveError: () => '',
    progressMessage: () => '',
    entry: () => null as KnowledgeEntry | null,
    content: () => '',
    frontmatter: () => null,
    contentViewMode: () => 'markdown' as const,
    mainFieldsOpen: () => true,
    additionalFieldsOpen: () => false,
    deleteError: () => '',
    deleteProgressMessage: () => '',
    handleContentViewModeChange: vi.fn(),
    toggleMainFields: vi.fn(),
    toggleAdditionalFields: vi.fn(),
    handleEdit: vi.fn(),
    handleCancelEdit: vi.fn(),
    handleSave: vi.fn(),
    handleDeleteRequest: vi.fn(),
    handleDeleteCancel: vi.fn(),
    handleDeleteConfirm: vi.fn(),
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('KnowledgeDetailPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    mockUse.mockReturnValue(makeDefaultHook());
  });

  it('shows loading state', () => {
    render(() => <KnowledgeDetailPanel entryId="entry-1" />);
    expect(screen.getByText('Loading entry...')).toBeDefined();
  });

  it('shows error state', () => {
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'error',
      error: () => 'Failed to load',
    }));
    render(() => <KnowledgeDetailPanel entryId="entry-1" />);
    expect(screen.getByText('Failed to load')).toBeDefined();
  });

  it('renders entry title in view mode', () => {
    const entry = makeEntry({ title: 'My Panel Entry' });
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entry: () => entry,
      content: () => '## Hello',
    }));
    render(() => <KnowledgeDetailPanel entryId="entry-1" />);
    expect(screen.getByText('My Panel Entry')).toBeDefined();
  });

  // ── Details accordion ──────────────────────────────────────────────────────

  it('shows Details toggle button in view mode', () => {
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entry: () => entry,
    }));
    render(() => <KnowledgeDetailPanel entryId="entry-1" />);
    expect(screen.getByTestId('details-toggle')).toBeDefined();
  });

  it('shows details body when mainFieldsOpen is true', () => {
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entry: () => entry,
      mainFieldsOpen: () => true,
    }));
    render(() => <KnowledgeDetailPanel entryId="entry-1" />);
    expect(screen.getByTestId('details-body')).toBeDefined();
  });

  it('hides details body when mainFieldsOpen is false', () => {
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entry: () => entry,
      mainFieldsOpen: () => false,
    }));
    render(() => <KnowledgeDetailPanel entryId="entry-1" />);
    expect(screen.queryByTestId('details-body')).toBeNull();
  });

  it('calls toggleMainFields when Details toggle clicked', () => {
    const toggleMainFields = vi.fn();
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entry: () => entry,
      toggleMainFields,
    }));
    render(() => <KnowledgeDetailPanel entryId="entry-1" />);
    fireEvent.click(screen.getByTestId('details-toggle'));
    expect(toggleMainFields).toHaveBeenCalledOnce();
  });

  it('shows category value when present', () => {
    const entry = makeEntry({ category: 'Guides' });
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entry: () => entry,
      mainFieldsOpen: () => true,
    }));
    render(() => <KnowledgeDetailPanel entryId="entry-1" />);
    expect(screen.getByText('Guides')).toBeDefined();
  });

  it('shows placeholder when category is empty', () => {
    const entry = makeEntry({ category: '' });
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entry: () => entry,
      mainFieldsOpen: () => true,
    }));
    render(() => <KnowledgeDetailPanel entryId="entry-1" />);
    // The category row should show a dash placeholder
    const allDashes = screen.getAllByText('—');
    expect(allDashes.length).toBeGreaterThan(0);
  });

  it('shows placeholder when description is empty', () => {
    const entry = makeEntry({ description: '' });
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entry: () => entry,
      mainFieldsOpen: () => true,
    }));
    render(() => <KnowledgeDetailPanel entryId="entry-1" />);
    const allDashes = screen.getAllByText('—');
    expect(allDashes.length).toBeGreaterThan(0);
  });

  it('shows placeholder when tags are empty', () => {
    const entry = makeEntry({ tags: [] });
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entry: () => entry,
      mainFieldsOpen: () => true,
    }));
    render(() => <KnowledgeDetailPanel entryId="entry-1" />);
    const allDashes = screen.getAllByText('—');
    expect(allDashes.length).toBeGreaterThan(0);
  });

  it('renders tag chips when tags present', () => {
    const entry = makeEntry({ tags: ['react', 'typescript'] });
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entry: () => entry,
      mainFieldsOpen: () => true,
    }));
    render(() => <KnowledgeDetailPanel entryId="entry-1" />);
    expect(screen.getByText('react')).toBeDefined();
    expect(screen.getByText('typescript')).toBeDefined();
  });

  // ── Additional accordion ──────────────────────────────────────────────────

  it('shows Additional toggle button in view mode', () => {
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entry: () => entry,
    }));
    render(() => <KnowledgeDetailPanel entryId="entry-1" />);
    expect(screen.getByTestId('additional-toggle')).toBeDefined();
  });

  it('hides additional body by default (additionalFieldsOpen false)', () => {
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entry: () => entry,
      additionalFieldsOpen: () => false,
    }));
    render(() => <KnowledgeDetailPanel entryId="entry-1" />);
    expect(screen.queryByTestId('additional-body')).toBeNull();
  });

  it('shows additional body when additionalFieldsOpen is true', () => {
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entry: () => entry,
      additionalFieldsOpen: () => true,
    }));
    render(() => <KnowledgeDetailPanel entryId="entry-1" />);
    expect(screen.getByTestId('additional-body')).toBeDefined();
  });

  it('calls toggleAdditionalFields when Additional toggle clicked', () => {
    const toggleAdditionalFields = vi.fn();
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entry: () => entry,
      toggleAdditionalFields,
    }));
    render(() => <KnowledgeDetailPanel entryId="entry-1" />);
    fireEvent.click(screen.getByTestId('additional-toggle'));
    expect(toggleAdditionalFields).toHaveBeenCalledOnce();
  });

  it('shows placeholder when rules are empty (additional expanded)', () => {
    const entry = makeEntry({ rules: [] });
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entry: () => entry,
      additionalFieldsOpen: () => true,
    }));
    render(() => <KnowledgeDetailPanel entryId="entry-1" />);
    const allDashes = screen.getAllByText('—');
    expect(allDashes.length).toBeGreaterThan(0);
  });

  it('shows rules when present and additional expanded', () => {
    const entry = makeEntry({ rules: ['No external deps', 'Pure functions only'] });
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entry: () => entry,
      additionalFieldsOpen: () => true,
    }));
    render(() => <KnowledgeDetailPanel entryId="entry-1" />);
    expect(screen.getByText('No external deps')).toBeDefined();
    expect(screen.getByText('Pure functions only')).toBeDefined();
  });

  // ── Content section ────────────────────────────────────────────────────────

  it('always shows content toggle buttons in view mode', () => {
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entry: () => entry,
      content: () => '',
    }));
    render(() => <KnowledgeDetailPanel entryId="entry-1" />);
    expect(screen.getByRole('button', { name: 'Markdown' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Plain text' })).toBeDefined();
  });

  it('always shows MarkdownContent in view mode (even with empty content)', () => {
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entry: () => entry,
      content: () => '',
    }));
    render(() => <KnowledgeDetailPanel entryId="entry-1" />);
    expect(screen.getByTestId('markdown-content')).toBeDefined();
  });

  it('calls handleContentViewModeChange with text when Plain text button clicked', () => {
    const handleContentViewModeChange = vi.fn();
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entry: () => entry,
      content: () => '## Hello',
      contentViewMode: () => 'markdown' as const,
      handleContentViewModeChange,
    }));
    render(() => <KnowledgeDetailPanel entryId="entry-1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Plain text' }));
    expect(handleContentViewModeChange).toHaveBeenCalledWith('text');
  });

  it('calls handleContentViewModeChange with markdown when Markdown button clicked', () => {
    const handleContentViewModeChange = vi.fn();
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entry: () => entry,
      content: () => '## Hello',
      contentViewMode: () => 'text' as const,
      handleContentViewModeChange,
    }));
    render(() => <KnowledgeDetailPanel entryId="entry-1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Markdown' }));
    expect(handleContentViewModeChange).toHaveBeenCalledWith('markdown');
  });

  it('passes contentViewMode to MarkdownContent', () => {
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entry: () => entry,
      content: () => '## Hello',
      contentViewMode: () => 'text' as const,
    }));
    render(() => <KnowledgeDetailPanel entryId="entry-1" />);
    expect(screen.getByTestId('markdown-content').getAttribute('data-view-mode')).toBe('text');
  });

  // ── Edit mode ──────────────────────────────────────────────────────────────

  it('shows edit form in editing step', () => {
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'editing',
      entry: () => entry,
      content: () => 'some content',
    }));
    render(() => <KnowledgeDetailPanel entryId="entry-1" />);
    expect(screen.getByTestId('edit-form')).toBeDefined();
  });

  it('calls handleEdit when Edit button clicked', () => {
    const handleEdit = vi.fn();
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entry: () => entry,
      content: () => '## Hello',
      handleEdit,
    }));
    render(() => <KnowledgeDetailPanel entryId="entry-1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(handleEdit).toHaveBeenCalledOnce();
  });

  // ── Delete flow ────────────────────────────────────────────────────────────

  it('shows Delete button in view mode', () => {
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entry: () => entry,
    }));
    render(() => <KnowledgeDetailPanel entryId="entry-1" />);
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDefined();
  });

  it('Delete button in view mode is not disabled', () => {
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entry: () => entry,
    }));
    render(() => <KnowledgeDetailPanel entryId="entry-1" />);
    const btn = screen.getByRole('button', { name: 'Delete' });
    expect((btn as HTMLButtonElement).disabled).toBe(false);
  });

  it('calls handleDeleteRequest when Delete button clicked in view mode', () => {
    const handleDeleteRequest = vi.fn();
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entry: () => entry,
      handleDeleteRequest,
    }));
    render(() => <KnowledgeDetailPanel entryId="entry-1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(handleDeleteRequest).toHaveBeenCalledOnce();
  });

  it('shows Delete button in edit mode', () => {
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'editing',
      entry: () => entry,
    }));
    render(() => <KnowledgeDetailPanel entryId="entry-1" />);
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDefined();
  });

  it('calls handleDeleteRequest when Delete button clicked in edit mode', () => {
    const handleDeleteRequest = vi.fn();
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'editing',
      entry: () => entry,
      handleDeleteRequest,
    }));
    render(() => <KnowledgeDetailPanel entryId="entry-1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(handleDeleteRequest).toHaveBeenCalledOnce();
  });

  it('shows delete-confirmation component in confirm-delete step', () => {
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'confirm-delete',
      entry: () => entry,
    }));
    render(() => <KnowledgeDetailPanel entryId="entry-1" />);
    expect(screen.getByTestId('delete-confirmation')).toBeDefined();
  });

  it('shows progress spinner in deleting step', () => {
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'deleting',
      deleteProgressMessage: () => 'Deleting file...',
    }));
    render(() => <KnowledgeDetailPanel entryId="entry-1" />);
    expect(screen.getByText('Deleting file...')).toBeDefined();
  });

  it('shows delete-result component in deleted step', () => {
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'deleted',
      entry: () => entry,
    }));
    render(() => <KnowledgeDetailPanel entryId="entry-1" />);
    expect(screen.getByTestId('delete-result')).toBeDefined();
  });
});
