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
                          <Show when={
                            (Array.isArray(entry.tags) && entry.tags.length > 0) ||
                            (Array.isArray(entry.rules) && entry.rules.length > 0) ||
                            (Array.isArray(entry.required_knowledge) && entry.required_knowledge.length > 0)
                          }>
                            <div class="flex items-center gap-2 mt-0.5">
                              <Show when={Array.isArray(entry.tags) && entry.tags.length > 0}>
                                <span class="flex items-center gap-0.5 text-[10px] text-[var(--color-text-muted)]" data-testid="tag-count">
                                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/>
                                    <path d="M7 7h.01"/>
                                  </svg>
                                  {entry.tags.length}
                                </span>
                              </Show>
                              <Show when={Array.isArray(entry.rules) && entry.rules.length > 0}>
                                <span class="flex items-center gap-0.5 text-[10px] text-[var(--color-text-muted)]" data-testid="rules-count">
                                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="16 18 22 12 16 6"/>
                                    <polyline points="8 6 2 12 8 18"/>
                                  </svg>
                                  {entry.rules.length}
                                </span>
                              </Show>
                              <Show when={Array.isArray(entry.required_knowledge) && entry.required_knowledge.length > 0}>
                                <span class="flex items-center gap-0.5 text-[10px] text-[var(--color-text-muted)]" data-testid="links-count">
                                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                                  </svg>
                                  {entry.required_knowledge.length}
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
