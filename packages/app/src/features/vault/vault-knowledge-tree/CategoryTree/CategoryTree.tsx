import { For, Show } from 'solid-js';
import type { CategoryTreeProps } from './CategoryTree.type';
import { useCategoryTree } from './CategoryTree.hook';

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
                    {(entry) => (
                      <div class="flex items-center justify-between px-4 py-2.5 bg-[var(--color-bg)] hover:bg-[var(--color-bg-tertiary)]/40 transition-colors group">
                        <div class="min-w-0 flex-1">
                          <p class="text-sm font-medium truncate">{entry.title}</p>
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
                        </div>
                        <button
                          type="button"
                          onClick={() => props.onEditEntry(entry.id)}
                          class="ml-3 px-2.5 py-1 rounded text-xs border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] transition-colors opacity-0 group-hover:opacity-100"
                        >
                          Edit
                        </button>
                      </div>
                    )}
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
