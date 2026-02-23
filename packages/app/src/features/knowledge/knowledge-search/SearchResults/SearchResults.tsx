import { For, Show } from 'solid-js';
import { A } from '@solidjs/router';
import type { SearchResultItem, SearchResultsProps } from './SearchResults.type';


export function SearchResults(props: SearchResultsProps) {
  return (
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <p class="text-sm text-[var(--color-text-muted)]">
          {props.totalCount} result{props.totalCount !== 1 ? 's' : ''} for "{props.query}"
        </p>
      </div>

      <Show
        when={props.results.length > 0}
        fallback={
          <div class="text-center py-12 text-[var(--color-text-muted)]">
            <p class="text-lg mb-2">No results found</p>
            <p class="text-sm">Try a different search query or broader terms.</p>
          </div>
        }
      >
        <div class="space-y-2">
          <For each={props.results}>
            {(result) => (
              <A
                href={`/knowledge/${result.entry_id}`}
                class="block rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 hover:border-[var(--color-accent)]/40 transition-colors"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1 min-w-0">
                    <h3 class="font-medium">{result.title}</h3>
                    <p class="text-sm text-[var(--color-text-muted)] mt-0.5 truncate">{result.file_path}</p>
                  </div>
                  <div class="flex items-center gap-2 ml-3 flex-shrink-0">
                    <span class="px-2 py-0.5 rounded text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">
                      {result.category}
                    </span>
                    <span class="text-xs text-[var(--color-text-muted)] tabular-nums">
                      {Math.round(result.score * 100)}%
                    </span>
                  </div>
                </div>
                <Show when={result.tags.length > 0}>
                  <div class="flex flex-wrap gap-1.5 mt-2">
                    <For each={result.tags}>
                      {(tag) => (
                        <span class="px-1.5 py-0.5 rounded text-xs bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                          {tag}
                        </span>
                      )}
                    </For>
                  </div>
                </Show>
              </A>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
