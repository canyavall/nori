import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@solidjs/testing-library';
import type { KnowledgeEntry } from '@nori/shared';
import { CategoryTree, getKnowledgeQualityIssues } from './CategoryTree';

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

function makeCompleteEntry(overrides: Partial<KnowledgeEntry> = {}): KnowledgeEntry {
  return makeEntry({
    category: 'General',
    description: 'A proper description',
    tags: ['tag-one', 'tag-two', 'tag-three'],
    ...overrides,
  });
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

  it('calls onEditEntry with the entry id when entry row is clicked', () => {
    const onEdit = vi.fn();
    const cats = {
      General: [makeEntry({ id: 'entry-99', title: 'Editable' })],
    };
    render(() => <CategoryTree categories={cats} onEditEntry={onEdit} />);

    fireEvent.click(screen.getByRole('button', { name: /Editable/ }));
    expect(onEdit).toHaveBeenCalledWith('entry-99');
  });

  it('does not render a separate Edit button for entries', () => {
    const cats = {
      General: [makeEntry({ id: 'entry-1', title: 'Some Entry' })],
    };
    render(() => <CategoryTree categories={cats} onEditEntry={noop} />);
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
  });

  it('shows tag count indicator when entry has tags', () => {
    const cats = {
      General: [makeEntry({ tags: ['a', 'b', 'c', 'd', 'e'] })],
    };
    render(() => <CategoryTree categories={cats} onEditEntry={noop} />);
    const tagCount = screen.getByTestId('tag-count');
    expect(tagCount).toBeDefined();
    expect(tagCount.textContent).toContain('5');
  });

  it('does not show individual tag names', () => {
    const cats = {
      General: [makeEntry({ tags: ['alpha', 'beta', 'gamma'] })],
    };
    render(() => <CategoryTree categories={cats} onEditEntry={noop} />);
    expect(screen.queryByText('alpha')).toBeNull();
    expect(screen.queryByText('beta')).toBeNull();
  });

  it('shows rules count indicator when entry has rules', () => {
    const cats = {
      General: [makeEntry({ rules: ['rule one', 'rule two'] })],
    };
    render(() => <CategoryTree categories={cats} onEditEntry={noop} />);
    const rulesCount = screen.getByTestId('rules-count');
    expect(rulesCount).toBeDefined();
    expect(rulesCount.textContent).toContain('2');
  });

  it('does not show rules indicator when entry has no rules', () => {
    const cats = {
      General: [makeEntry({ rules: [] })],
    };
    render(() => <CategoryTree categories={cats} onEditEntry={noop} />);
    expect(screen.queryByTestId('rules-count')).toBeNull();
  });

  it('shows required_knowledge count indicator when entry has required_knowledge', () => {
    const cats = {
      General: [makeEntry({ required_knowledge: ['entry-a', 'entry-b', 'entry-c'] })],
    };
    render(() => <CategoryTree categories={cats} onEditEntry={noop} />);
    const linksCount = screen.getByTestId('links-count');
    expect(linksCount).toBeDefined();
    expect(linksCount.textContent).toContain('3');
  });

  it('does not show links indicator when entry has no required_knowledge', () => {
    const cats = {
      General: [makeEntry({ required_knowledge: [] })],
    };
    render(() => <CategoryTree categories={cats} onEditEntry={noop} />);
    expect(screen.queryByTestId('links-count')).toBeNull();
  });

  it('does not show metadata row when entry has no tags, rules, or required_knowledge', () => {
    const cats = {
      General: [makeEntry({ tags: [], rules: [], required_knowledge: [] })],
    };
    render(() => <CategoryTree categories={cats} onEditEntry={noop} />);
    expect(screen.queryByTestId('tag-count')).toBeNull();
    expect(screen.queryByTestId('rules-count')).toBeNull();
    expect(screen.queryByTestId('links-count')).toBeNull();
  });

  it('renders empty categories object without crashing', () => {
    render(() => <CategoryTree categories={{}} onEditEntry={noop} />);
    // No crash — renders an empty list
    expect(screen.queryByRole('button')).toBeNull();
  });
});

// ── Quality warning icon tests ─────────────────────────────────────────────────

describe('CategoryTree — quality warning icon', () => {
  const noop = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('shows warning icon for entry missing description', () => {
    const cats = {
      General: [makeEntry({ description: '' })],
    };
    render(() => <CategoryTree categories={cats} onEditEntry={noop} />);
    expect(screen.getByTestId('quality-warning')).toBeDefined();
  });

  it('shows warning icon for entry missing category', () => {
    const cats = {
      Uncategorized: [makeEntry({ category: '' })],
    };
    render(() => <CategoryTree categories={cats} onEditEntry={noop} />);
    expect(screen.getByTestId('quality-warning')).toBeDefined();
  });

  it('shows warning icon for entry with fewer than 3 tags', () => {
    const cats = {
      General: [makeEntry({ tags: ['only-one'] })],
    };
    render(() => <CategoryTree categories={cats} onEditEntry={noop} />);
    expect(screen.getByTestId('quality-warning')).toBeDefined();
  });

  it('shows warning icon for entry with no tags', () => {
    const cats = {
      General: [makeEntry({ tags: [] })],
    };
    render(() => <CategoryTree categories={cats} onEditEntry={noop} />);
    expect(screen.getByTestId('quality-warning')).toBeDefined();
  });

  it('does not show warning icon for complete entry', () => {
    const cats = {
      General: [makeCompleteEntry()],
    };
    render(() => <CategoryTree categories={cats} onEditEntry={noop} />);
    expect(screen.queryByTestId('quality-warning')).toBeNull();
  });

  it('shows warning popover content listing the missing fields', () => {
    const cats = {
      General: [makeEntry({ description: '', tags: [] })],
    };
    render(() => <CategoryTree categories={cats} onEditEntry={noop} />);
    // Popover content is in the DOM (CSS hides it visually)
    expect(screen.getByText('Quality issues')).toBeDefined();
    expect(screen.getByText('· Missing description')).toBeDefined();
    expect(screen.getByText('· Tags: 0/3 minimum')).toBeDefined();
  });

  it('shows multiple warnings when multiple fields are missing', () => {
    const cats = {
      Uncategorized: [makeEntry({ category: '', description: '', tags: [] })],
    };
    render(() => <CategoryTree categories={cats} onEditEntry={noop} />);
    expect(screen.getByText('· Missing category')).toBeDefined();
    expect(screen.getByText('· Missing description')).toBeDefined();
    expect(screen.getByText('· Tags: 0/3 minimum')).toBeDefined();
  });

  it('shows one warning per incomplete entry', () => {
    const cats = {
      General: [
        makeCompleteEntry({ id: 'e1' }),
        makeEntry({ id: 'e2', description: '' }),
      ],
    };
    render(() => <CategoryTree categories={cats} onEditEntry={noop} />);
    expect(screen.getAllByTestId('quality-warning')).toHaveLength(1);
  });

  it('clicking entry row still works when warning icon is present', () => {
    const onEdit = vi.fn();
    const cats = {
      General: [makeEntry({ id: 'entry-warn', title: 'Incomplete Entry', description: '' })],
    };
    render(() => <CategoryTree categories={cats} onEditEntry={onEdit} />);
    fireEvent.click(screen.getByRole('button', { name: /Incomplete Entry/ }));
    expect(onEdit).toHaveBeenCalledWith('entry-warn');
  });
});

// ── getKnowledgeQualityIssues unit tests ──────────────────────────────────────

describe('getKnowledgeQualityIssues', () => {
  it('returns empty array for a complete entry', () => {
    const entry = makeCompleteEntry();
    expect(getKnowledgeQualityIssues(entry)).toEqual([]);
  });

  it('reports missing description', () => {
    const entry = makeCompleteEntry({ description: '' });
    expect(getKnowledgeQualityIssues(entry)).toContain('Missing description');
  });

  it('reports missing category', () => {
    const entry = makeCompleteEntry({ category: '' });
    expect(getKnowledgeQualityIssues(entry)).toContain('Missing category');
  });

  it('reports insufficient tags when fewer than 3', () => {
    const entry = makeCompleteEntry({ tags: ['one', 'two'] });
    expect(getKnowledgeQualityIssues(entry)).toContain('Tags: 2/3 minimum');
  });

  it('reports insufficient tags when tags is empty', () => {
    const entry = makeCompleteEntry({ tags: [] });
    expect(getKnowledgeQualityIssues(entry)).toContain('Tags: 0/3 minimum');
  });

  it('does not report tag issue when entry has exactly 3 tags', () => {
    const entry = makeCompleteEntry({ tags: ['a', 'b', 'c'] });
    const issues = getKnowledgeQualityIssues(entry);
    expect(issues.some((i) => i.startsWith('Tags:'))).toBe(false);
  });

  it('does not report tag issue when entry has more than 3 tags', () => {
    const entry = makeCompleteEntry({ tags: ['a', 'b', 'c', 'd'] });
    const issues = getKnowledgeQualityIssues(entry);
    expect(issues.some((i) => i.startsWith('Tags:'))).toBe(false);
  });

  it('reports all three issues when all required fields are missing', () => {
    const entry = makeEntry({ category: '', description: '', tags: [] });
    const issues = getKnowledgeQualityIssues(entry);
    expect(issues).toHaveLength(3);
    expect(issues).toContain('Missing category');
    expect(issues).toContain('Missing description');
    expect(issues).toContain('Tags: 0/3 minimum');
  });

  it('treats whitespace-only description as missing', () => {
    const entry = makeCompleteEntry({ description: '   ' });
    expect(getKnowledgeQualityIssues(entry)).toContain('Missing description');
  });

  it('treats whitespace-only category as missing', () => {
    const entry = makeCompleteEntry({ category: '   ' });
    expect(getKnowledgeQualityIssues(entry)).toContain('Missing category');
  });

  it('does not report issues when rules and required_knowledge are empty (they are optional)', () => {
    const entry = makeCompleteEntry({ rules: [], required_knowledge: [] });
    expect(getKnowledgeQualityIssues(entry)).toEqual([]);
  });
});
