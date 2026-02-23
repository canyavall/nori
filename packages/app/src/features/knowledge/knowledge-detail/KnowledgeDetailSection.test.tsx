import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@solidjs/testing-library';
import type { KnowledgeEntry, KnowledgeFrontmatter } from '@nori/shared';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('./KnowledgeDetailSection.hook', () => ({
  useKnowledgeDetailSection: vi.fn(),
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
    handleEdit: vi.fn(),
    handleCancelEdit: vi.fn(),
    handleSave: vi.fn(),
    handleAuditDone: vi.fn(),
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

  it('renders entry title and category in view mode', () => {
    const entry = makeEntry({ title: 'My Knowledge', category: 'Guides' });
    mockUse.mockReturnValue(makeDefaultHook({
      step: () => 'view',
      entryData: () => ({ entry, content: '# Hello', frontmatter: makeFrontmatter() }),
    }));
    render(() => <KnowledgeDetailSection />);
    expect(screen.getByText('My Knowledge')).toBeDefined();
    expect(screen.getByText('Guides')).toBeDefined();
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
