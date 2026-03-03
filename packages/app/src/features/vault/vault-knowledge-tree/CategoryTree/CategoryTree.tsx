import { For, Show } from 'solid-js';
import type { KnowledgeEntry } from '@nori/shared';
import type { CategoryTreeProps } from './CategoryTree.type';
import { useCategoryTree } from './CategoryTree.hook';

// ── Quality check ──────────────────────────────────────────────────────────────

export function getKnowledgeQualityIssues(entry: KnowledgeEntry): string[] {
  const issues: string[] = [];
  if (!entry.category || entry.category.trim() === '') {
    issues.push('Missing category');
  }
  if (!entry.description || entry.description.trim() === '') {
    issues.push('Missing description');
  }
  const tags = Array.isArray(entry.tags) ? entry.tags : [];
  if (tags.length < 3) {
    issues.push(`Tags: ${tags.length}/3 minimum`);
  }
  return issues;
}

// ── Component ──────────────────────────────────────────────────────────────────

export const CategoryTree = (props: CategoryTreeProps) => {
  const { categoryNames, toggleCategory, isCategoryCollapsed } = useCategoryTree(props);

  return (
    <div class="space-y-2">
      <For each={categoryNames()}>
        {(cat) => {
          const entries = () => props.categories[cat] ?? [];

          return (
            <div class="rounded-lg border border-[var(--color-border)] overflow-hidden">
              <button
                type="button"
                onClick={() => toggleCategory(cat)}
                class="w-full flex items-center justify-between px-4 py-2.5 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors text-left"
              >
                <div class="flex items-center gap-2">
                  <span class="text-[var(--color-text-muted)] text-xs select-none w-3">
                    {isCategoryCollapsed(cat) ? '▶' : '▼'}
                  </span>
                  <span class="font-medium text-sm">{cat}</span>
                  <span class="px-1.5 py-0.5 rounded text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">
                    {entries().length}
                  </span>
                </div>
              </button>

              <Show when={!isCategoryCollapsed(cat)}>
                <div class="divide-y divide-[var(--color-border)]/50">
                  <For each={entries()}>
                    {(entry) => {
                      const issues = getKnowledgeQualityIssues(entry);

                      return (
                        <button
                          type="button"
                          onClick={() => props.onEditEntry(entry.id)}
                          class="w-full px-4 py-2.5 bg-[var(--color-bg)] hover:bg-[var(--color-bg-tertiary)]/40 transition-colors text-left"
                        >
                          <div class="flex items-start gap-1.5">
                            <p class="text-sm font-medium truncate flex-1 min-w-0">{entry.title}</p>
                            <Show when={issues.length > 0}>
                              <span
                                class="relative group/warn flex-shrink-0 mt-0.5"
                                aria-hidden="true"
                                data-testid="quality-warning"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  class="w-3.5 h-3.5 text-[var(--color-warning)]"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="2"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                >
                                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                                  <path d="M12 9v4" />
                                  <path d="M12 17h.01" />
                                </svg>
                                <div class="pointer-events-none absolute right-0 bottom-full mb-1 z-20 hidden group-hover/warn:block bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md shadow-lg p-2 w-44">
                                  <p class="text-[10px] font-semibold text-[var(--color-warning)] mb-1">Quality issues</p>
                                  <ul class="text-[10px] text-[var(--color-text-muted)] space-y-0.5">
                                    <For each={issues}>{(issue) => <li>· {issue}</li>}</For>
                                  </ul>
                                </div>
                              </span>
                            </Show>
                          </div>
                          <Show when={Array.isArray(entry.tags) && entry.tags.length > 0}>
                            <div class="flex flex-wrap gap-1 mt-0.5">
                              <For each={entry.tags.slice(0, 3)}>
                                {(tag) => (
                                  <span class="px-1 rounded text-[10px] bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                                    {tag}
                                  </span>
                                )}
                              </For>
                              <Show when={entry.tags.length > 3}>
                                <span class="text-[10px] text-[var(--color-text-muted)]">
                                  +{entry.tags.length - 3}
                                </span>
                              </Show>
                            </div>
                          </Show>
                        </button>
                      );
                    }}
                  </For>
                </div>
              </Show>
            </div>
          );
        }}
      </For>
    </div>
  );
};
