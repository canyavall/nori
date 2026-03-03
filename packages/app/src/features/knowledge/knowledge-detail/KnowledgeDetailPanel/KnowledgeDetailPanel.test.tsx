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
    handleContentViewModeChange: vi.fn(),
    handleEdit: vi.fn(),
    handleCancelEdit: vi.fn(),
    handleSave: vi.fn(),
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

  it('shows Markdown and Plain text toggle buttons when content is present', () => {
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entry: () => entry,
      content: () => '## Hello',
    }));
    render(() => <KnowledgeDetailPanel entryId="entry-1" />);
    expect(screen.getByRole('button', { name: 'Markdown' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Plain text' })).toBeDefined();
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
    const mc = screen.getByTestId('markdown-content');
    expect(mc.getAttribute('data-view-mode')).toBe('text');
  });

  it('does not show toggle when content is empty', () => {
    const entry = makeEntry();
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entry: () => entry,
      content: () => '',
    }));
    render(() => <KnowledgeDetailPanel entryId="entry-1" />);
    expect(screen.queryByRole('button', { name: 'Markdown' })).toBeNull();
  });

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
});
