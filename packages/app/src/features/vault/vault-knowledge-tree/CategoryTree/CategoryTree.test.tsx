import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@solidjs/testing-library';
import type { KnowledgeEntry } from '@nori/shared';
import { CategoryTree } from './CategoryTree';

// ── Helpers ────────────────────────────────────────────────────────────────────

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

describe('CategoryTree', () => {
  const noop = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('renders a section for each category', () => {
    const cats = {
      Architecture: [makeEntry({ id: 'e1', category: 'Architecture' })],
      Onboarding: [makeEntry({ id: 'e2', category: 'Onboarding' })],
    };
    render(() => <CategoryTree categories={cats} onEditEntry={noop} />);
    expect(screen.getByText('Architecture')).toBeDefined();
    expect(screen.getByText('Onboarding')).toBeDefined();
  });

  it('renders category names in alphabetical order', () => {
    const cats = {
      Zebra: [makeEntry({ id: 'e1', category: 'Zebra' })],
      Apple: [makeEntry({ id: 'e2', category: 'Apple' })],
    };
    render(() => <CategoryTree categories={cats} onEditEntry={noop} />);
    const headers = screen.getAllByRole('button').map((b) => b.textContent?.trim());
    const catIndex = (name: string) => headers.findIndex((h) => h?.includes(name));
    expect(catIndex('Apple')).toBeLessThan(catIndex('Zebra'));
  });

  it('shows entry count badge in category header', () => {
    const cats = {
      Docs: [makeEntry({ id: 'e1' }), makeEntry({ id: 'e2', title: 'B' })],
    };
    render(() => <CategoryTree categories={cats} onEditEntry={noop} />);
    expect(screen.getByText('2')).toBeDefined();
  });

  it('shows entry titles when category is expanded (default)', () => {
    const cats = {
      General: [makeEntry({ id: 'e1', title: 'Hello World' })],
    };
    render(() => <CategoryTree categories={cats} onEditEntry={noop} />);
    expect(screen.getByText('Hello World')).toBeDefined();
  });

  it('hides entries when category header is clicked (collapse)', () => {
    const cats = {
      General: [makeEntry({ id: 'e1', title: 'Hello World' })],
    };
    render(() => <CategoryTree categories={cats} onEditEntry={noop} />);
    expect(screen.getByText('Hello World')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /General/ }));
    expect(screen.queryByText('Hello World')).toBeNull();
  });

  it('shows entries again when collapsed category is clicked a second time', () => {
    const cats = {
      General: [makeEntry({ id: 'e1', title: 'Hello World' })],
    };
    render(() => <CategoryTree categories={cats} onEditEntry={noop} />);

    // Collapse
    fireEvent.click(screen.getByRole('button', { name: /General/ }));
    expect(screen.queryByText('Hello World')).toBeNull();

    // Expand again
    fireEvent.click(screen.getByRole('button', { name: /General/ }));
    expect(screen.getByText('Hello World')).toBeDefined();
  });

  it('shows collapse arrow ▼ when category is expanded', () => {
    const cats = { General: [makeEntry()] };
    render(() => <CategoryTree categories={cats} onEditEntry={noop} />);
    const header = screen.getByRole('button', { name: /General/ });
    expect(header.textContent).toContain('▼');
  });

  it('shows expand arrow ▶ when category is collapsed', () => {
    const cats = { General: [makeEntry()] };
    render(() => <CategoryTree categories={cats} onEditEntry={noop} />);
    fireEvent.click(screen.getByRole('button', { name: /General/ }));
    const header = screen.getByRole('button', { name: /General/ });
    expect(header.textContent).toContain('▶');
  });

  it('collapsing one category does not affect others', () => {
    const cats = {
      Alpha: [makeEntry({ id: 'e1', title: 'Entry A', category: 'Alpha' })],
      Beta: [makeEntry({ id: 'e2', title: 'Entry B', category: 'Beta' })],
    };
    render(() => <CategoryTree categories={cats} onEditEntry={noop} />);

    // Collapse Alpha only
    fireEvent.click(screen.getByRole('button', { name: /Alpha/ }));

    expect(screen.queryByText('Entry A')).toBeNull();
    expect(screen.getByText('Entry B')).toBeDefined();
  });

  it('calls onEditEntry with the entry id when Edit button is clicked', () => {
    const onEdit = vi.fn();
    const cats = {
      General: [makeEntry({ id: 'entry-99', title: 'Editable' })],
    };
    render(() => <CategoryTree categories={cats} onEditEntry={onEdit} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledWith('entry-99');
  });

  it('shows up to 3 tags per entry', () => {
    const cats = {
      General: [makeEntry({ tags: ['a', 'b', 'c', 'd', 'e'] })],
    };
    render(() => <CategoryTree categories={cats} onEditEntry={noop} />);
    expect(screen.getByText('a')).toBeDefined();
    expect(screen.getByText('b')).toBeDefined();
    expect(screen.getByText('c')).toBeDefined();
    expect(screen.queryByText('d')).toBeNull();
    // overflow indicator
    expect(screen.getByText('+2')).toBeDefined();
  });

  it('does not show overflow indicator when entry has 3 or fewer tags', () => {
    const cats = {
      General: [makeEntry({ tags: ['x', 'y', 'z'] })],
    };
    render(() => <CategoryTree categories={cats} onEditEntry={noop} />);
    expect(screen.queryByText(/^\+/)).toBeNull();
  });

  it('renders empty categories object without crashing', () => {
    render(() => <CategoryTree categories={{}} onEditEntry={noop} />);
    // No crash — renders an empty list
    expect(screen.queryByRole('button')).toBeNull();
  });
});
