import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@solidjs/testing-library';
import type { KnowledgeEntry, KnowledgeFrontmatter } from '@nori/shared';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('./KnowledgeDetailSection.hook', () => ({
  useKnowledgeDetailSection: vi.fn(),
}));

vi.mock('../../../components/ui/MarkdownContent/MarkdownContent', () => ({
  MarkdownContent: (props: { content: string; viewMode: string }) => (
    <div data-testid="markdown-content" data-view-mode={props.viewMode}>{props.content}</div>
  ),
}));

vi.mock('../knowledge-edit/EditForm/EditForm', () => ({
  EditForm: () => <div data-testid="edit-form" />,
}));

vi.mock('../knowledge-edit/EditAuditResults/EditAuditResults', () => ({
  EditAuditResults: () => <div data-testid="audit-results" />,
}));

vi.mock('../knowledge-delete/DeleteConfirmation/DeleteConfirmation', () => ({
  DeleteConfirmation: () => <div data-testid="delete-confirmation" />,
}));

vi.mock('../knowledge-delete/DeleteResult/DeleteResult', () => ({
  DeleteResult: () => <div data-testid="delete-result" />,
}));

vi.mock('./AuditResults/AuditResults', () => ({
  AuditResults: () => <div data-testid="audit-results-panel" />,
}));

import { useKnowledgeDetailSection } from './KnowledgeDetailSection.hook';
import { KnowledgeDetailSection } from './KnowledgeDetailSection';

const mockUse = vi.mocked(useKnowledgeDetailSection);

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function makeFrontmatter(): KnowledgeFrontmatter {
  return {
    title: 'Test Entry',
    category: 'General',
    tags: ['tag-one', 'tag-two', 'tag-three'],
    description: 'Test description',
    required_knowledge: [],
    rules: [],
    created: '2026-01-01T00:00:00Z',
    updated: '2026-01-01T00:00:00Z',
  };
}

function makeDefaultHook(overrides: Record<string, unknown> = {}) {
  return {
    params: { id: 'entry-1' },
    step: () => 'loading' as const,
    entryData: () => null,
    error: () => '',
    saveError: () => '',
    progressMessage: () => '',
    auditWarnings: () => [],
    savedFilePath: () => '',
    deleteError: () => '',
    deleteProgressMessage: () => '',
    contentViewMode: () => 'markdown' as const,
    mainFieldsOpen: () => true,
    additionalFieldsOpen: () => false,
    auditResult: () => null,
    auditProgressMessage: () => '',
    auditInitialValues: () => null,
    handleContentViewModeChange: vi.fn(),
    toggleMainFields: vi.fn(),
    toggleAdditionalFields: vi.fn(),
    handleEdit: vi.fn(),
    handleCancelEdit: vi.fn(),
    handleSave: vi.fn(),
    handleAuditDone: vi.fn(),
    handleAudit: vi.fn(),
    handleApplySuggestions: vi.fn(),
    handleAuditDismiss: vi.fn(),
    handleDeleteRequest: vi.fn(),
    handleDeleteCancel: vi.fn(),
    handleDeleteConfirm: vi.fn(),
    navigateToKnowledge: vi.fn(),
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('KnowledgeDetailSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    mockUse.mockReturnValue(makeDefaultHook());
  });

  it('shows loading state', () => {
    render(() => <KnowledgeDetailSection />);
    expect(screen.getByText('Loading entry...')).toBeDefined();
  });

  it('shows error state when step is error', () => {
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'error',
      error: () => 'Entry not found',
    }));
    render(() => <KnowledgeDetailSection />);
    expect(screen.getByText('Entry not found')).toBeDefined();
  });

  it('renders entry title in view mode', () => {
    const entry = makeEntry({ title: 'My Knowledge' });
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entryData: () => ({ entry, content: '# Hello', frontmatter: makeFrontmatter() }),
    }));
    render(() => <KnowledgeDetailSection />);
    expect(screen.getByText('My Knowledge')).toBeDefined();
  });

  it('calls handleEdit when Edit button is clicked in view mode', () => {
    const handleEdit = vi.fn();
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entryData: () => ({ entry, content: 'content', frontmatter: makeFrontmatter() }),
      handleEdit,
    }));
    render(() => <KnowledgeDetailSection />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(handleEdit).toHaveBeenCalledOnce();
  });

  it('calls handleDeleteRequest when Delete button is clicked in view mode', () => {
    const handleDeleteRequest = vi.fn();
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entryData: () => ({ entry, content: 'content', frontmatter: makeFrontmatter() }),
      handleDeleteRequest,
    }));
    render(() => <KnowledgeDetailSection />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(handleDeleteRequest).toHaveBeenCalledOnce();
  });

  // ── Details accordion ──────────────────────────────────────────────────────

  it('shows Details toggle in view mode', () => {
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entryData: () => ({ entry, content: '', frontmatter: makeFrontmatter() }),
    }));
    render(() => <KnowledgeDetailSection />);
    expect(screen.getByTestId('details-toggle')).toBeDefined();
  });

  it('shows details body when mainFieldsOpen is true', () => {
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entryData: () => ({ entry, content: '', frontmatter: makeFrontmatter() }),
      mainFieldsOpen: () => true,
    }));
    render(() => <KnowledgeDetailSection />);
    expect(screen.getByTestId('details-body')).toBeDefined();
  });

  it('hides details body when mainFieldsOpen is false', () => {
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entryData: () => ({ entry, content: '', frontmatter: makeFrontmatter() }),
      mainFieldsOpen: () => false,
    }));
    render(() => <KnowledgeDetailSection />);
    expect(screen.queryByTestId('details-body')).toBeNull();
  });

  it('calls toggleMainFields when Details toggle clicked', () => {
    const toggleMainFields = vi.fn();
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entryData: () => ({ entry, content: '', frontmatter: makeFrontmatter() }),
      toggleMainFields,
    }));
    render(() => <KnowledgeDetailSection />);
    fireEvent.click(screen.getByTestId('details-toggle'));
    expect(toggleMainFields).toHaveBeenCalledOnce();
  });

  it('shows category value in details body', () => {
    const entry = makeEntry({ category: 'Guides' });
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entryData: () => ({ entry, content: '', frontmatter: makeFrontmatter() }),
      mainFieldsOpen: () => true,
    }));
    render(() => <KnowledgeDetailSection />);
    expect(screen.getByText('Guides')).toBeDefined();
  });

  it('shows placeholder when category is empty', () => {
    const entry = makeEntry({ category: '' });
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entryData: () => ({ entry, content: '', frontmatter: makeFrontmatter() }),
      mainFieldsOpen: () => true,
    }));
    render(() => <KnowledgeDetailSection />);
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThan(0);
  });

  it('shows placeholder when description is empty', () => {
    const entry = makeEntry({ description: '' });
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entryData: () => ({ entry, content: '', frontmatter: makeFrontmatter() }),
      mainFieldsOpen: () => true,
    }));
    render(() => <KnowledgeDetailSection />);
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThan(0);
  });

  it('shows placeholder when tags are empty', () => {
    const entry = makeEntry({ tags: [] });
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entryData: () => ({ entry, content: '', frontmatter: makeFrontmatter() }),
      mainFieldsOpen: () => true,
    }));
    render(() => <KnowledgeDetailSection />);
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThan(0);
  });

  it('renders tag chips when tags present', () => {
    const entry = makeEntry({ tags: ['alpha', 'beta'] });
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entryData: () => ({ entry, content: '', frontmatter: makeFrontmatter() }),
      mainFieldsOpen: () => true,
    }));
    render(() => <KnowledgeDetailSection />);
    expect(screen.getByText('alpha')).toBeDefined();
    expect(screen.getByText('beta')).toBeDefined();
  });

  // ── Additional accordion ──────────────────────────────────────────────────

  it('shows Additional toggle in view mode', () => {
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entryData: () => ({ entry, content: '', frontmatter: makeFrontmatter() }),
    }));
    render(() => <KnowledgeDetailSection />);
    expect(screen.getByTestId('additional-toggle')).toBeDefined();
  });

  it('hides additional body by default (additionalFieldsOpen false)', () => {
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entryData: () => ({ entry, content: '', frontmatter: makeFrontmatter() }),
      additionalFieldsOpen: () => false,
    }));
    render(() => <KnowledgeDetailSection />);
    expect(screen.queryByTestId('additional-body')).toBeNull();
  });

  it('shows additional body when additionalFieldsOpen is true', () => {
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entryData: () => ({ entry, content: '', frontmatter: makeFrontmatter() }),
      additionalFieldsOpen: () => true,
    }));
    render(() => <KnowledgeDetailSection />);
    expect(screen.getByTestId('additional-body')).toBeDefined();
  });

  it('calls toggleAdditionalFields when Additional toggle clicked', () => {
    const toggleAdditionalFields = vi.fn();
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entryData: () => ({ entry, content: '', frontmatter: makeFrontmatter() }),
      toggleAdditionalFields,
    }));
    render(() => <KnowledgeDetailSection />);
    fireEvent.click(screen.getByTestId('additional-toggle'));
    expect(toggleAdditionalFields).toHaveBeenCalledOnce();
  });

  it('shows placeholder for rules when empty (additional expanded)', () => {
    const entry = makeEntry({ rules: [] });
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entryData: () => ({ entry, content: '', frontmatter: makeFrontmatter() }),
      additionalFieldsOpen: () => true,
    }));
    render(() => <KnowledgeDetailSection />);
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThan(0);
  });

  it('shows rules when present and additional expanded', () => {
    const entry = makeEntry({ rules: ['Use bun', 'No any types'] });
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entryData: () => ({ entry, content: '', frontmatter: makeFrontmatter() }),
      additionalFieldsOpen: () => true,
    }));
    render(() => <KnowledgeDetailSection />);
    expect(screen.getByText('Use bun')).toBeDefined();
    expect(screen.getByText('No any types')).toBeDefined();
  });

  // ── Content section ────────────────────────────────────────────────────────

  it('always shows Markdown and Plain text toggle buttons in view mode', () => {
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entryData: () => ({ entry, content: '', frontmatter: makeFrontmatter() }),
    }));
    render(() => <KnowledgeDetailSection />);
    expect(screen.getByRole('button', { name: 'Markdown' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Plain text' })).toBeDefined();
  });

  it('always shows MarkdownContent in view mode even with empty content', () => {
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entryData: () => ({ entry, content: '', frontmatter: makeFrontmatter() }),
    }));
    render(() => <KnowledgeDetailSection />);
    expect(screen.getByTestId('markdown-content')).toBeDefined();
  });

  it('calls handleContentViewModeChange with markdown when Markdown button clicked', () => {
    const handleContentViewModeChange = vi.fn();
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entryData: () => ({ entry, content: '# Hello', frontmatter: makeFrontmatter() }),
      contentViewMode: () => 'text' as const,
      handleContentViewModeChange,
    }));
    render(() => <KnowledgeDetailSection />);
    fireEvent.click(screen.getByRole('button', { name: 'Markdown' }));
    expect(handleContentViewModeChange).toHaveBeenCalledWith('markdown');
  });

  it('calls handleContentViewModeChange with text when Plain text button clicked', () => {
    const handleContentViewModeChange = vi.fn();
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entryData: () => ({ entry, content: '# Hello', frontmatter: makeFrontmatter() }),
      contentViewMode: () => 'markdown' as const,
      handleContentViewModeChange,
    }));
    render(() => <KnowledgeDetailSection />);
    fireEvent.click(screen.getByRole('button', { name: 'Plain text' }));
    expect(handleContentViewModeChange).toHaveBeenCalledWith('text');
  });

  it('passes current contentViewMode to MarkdownContent', () => {
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entryData: () => ({ entry, content: '# Heading', frontmatter: makeFrontmatter() }),
      contentViewMode: () => 'text' as const,
    }));
    render(() => <KnowledgeDetailSection />);
    expect(screen.getByTestId('markdown-content').getAttribute('data-view-mode')).toBe('text');
  });

  // ── Other states ──────────────────────────────────────────────────────────

  it('shows edit form in editing step', () => {
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'editing',
      entryData: () => ({ entry, content: 'content', frontmatter: makeFrontmatter() }),
    }));
    render(() => <KnowledgeDetailSection />);
    expect(screen.getByTestId('edit-form')).toBeDefined();
  });

  it('shows delete confirmation in confirm-delete step', () => {
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'confirm-delete',
      entryData: () => ({ entry, content: 'content', frontmatter: makeFrontmatter() }),
    }));
    render(() => <KnowledgeDetailSection />);
    expect(screen.getByTestId('delete-confirmation')).toBeDefined();
  });
});
