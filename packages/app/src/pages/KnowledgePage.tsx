import { createSignal, createMemo, For, Show, onMount } from 'solid-js';
import type { KnowledgeEntry } from '@nori/shared';
import { A } from '@solidjs/router';
import { apiGet } from '../lib/api';
import { knowledgeEntries, setKnowledgeEntries, searchQuery, setSearchQuery, createOpen, setCreateOpen } from '../stores/knowledge.store';
import { vaults } from '../stores/vault.store';
import { activeVault, activeProject } from '../stores/navigation.store';
import { KnowledgeCreateDialog } from '../features/knowledge/knowledge-create/KnowledgeCreateDialog';
import { SearchForm } from '../features/knowledge/knowledge-search/SearchForm';
import { SearchResults, type SearchResultItem } from '../features/knowledge/knowledge-search/SearchResults';

export function KnowledgePage() {
  const [loading, setLoading] = createSignal(true);
  const [selectedVaultId, setSelectedVaultId] = createSignal('');
  const [searching, setSearching] = createSignal(false);
  const [searchResultItems, setSearchResultItems] = createSignal<SearchResultItem[]>([]);
  const [searchTotalCount, setSearchTotalCount] = createSignal(0);
  const [searchError, setSearchError] = createSignal('');
  const [activeQuery, setActiveQuery] = createSignal('');

  const effectiveVaultId = createMemo(() => {
    const navVault = activeVault();
    if (navVault) return navVault.id;
    const proj = activeProject();
    if (proj?.connected_vaults.length) return proj.connected_vaults[0];
    const v = vaults();
    if (v.length === 1) return v[0].id;
    return selectedVaultId();
  });

  onMount(async () => {
    try {
      const res = await apiGet<{ data: KnowledgeEntry[] }>('/api/knowledge');
      setKnowledgeEntries(res.data);
    } catch {
      // Will show empty state
    }
    setLoading(false);
  });

  async function handleSearch(query: string) {
    setSearchQuery(query);
    setActiveQuery(query);
    setSearching(true);
    setSearchError('');

    try {
      const params = new URLSearchParams({ q: query });
      if (effectiveVaultId()) {
        params.set('vault_id', effectiveVaultId());
      }
      const res = await apiGet<{ data: { results: SearchResultItem[]; total_count: number } }>(
        `/api/knowledge/search?${params.toString()}`
      );
      setSearchResultItems(res.data.results);
      setSearchTotalCount(res.data.total_count);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed');
      setSearchResultItems([]);
      setSearchTotalCount(0);
    }
    setSearching(false);
  }

  function handleClearSearch() {
    setSearchQuery('');
    setActiveQuery('');
    setSearchResultItems([]);
    setSearchTotalCount(0);
    setSearchError('');
  }

  return (
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold">Knowledge</h2>
        <div class="flex items-center gap-3">
          <Show when={vaults().length > 1 && !activeVault() && !activeProject()?.connected_vaults.length}>
            <select
              value={selectedVaultId()}
              onChange={(e) => setSelectedVaultId(e.currentTarget.value)}
              class="px-3 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
            >
              <option value="">Select vault...</option>
              <For each={vaults()}>
                {(vault) => <option value={vault.id}>{vault.name}</option>}
              </For>
            </select>
          </Show>
          <button
            type="button"
            disabled={!effectiveVaultId()}
            onClick={() => setCreateOpen(true)}
            class="px-4 py-2 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Entry
          </button>
        </div>
      </div>

      {/* Search */}
      <div class="mb-4">
        <SearchForm initialQuery={searchQuery()} onSearch={handleSearch} />
        <Show when={activeQuery()}>
          <button
            type="button"
            onClick={handleClearSearch}
            class="mt-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            Clear search — show all entries
          </button>
        </Show>
      </div>

      <Show
        when={!loading()}
        fallback={
          <div class="text-center py-16 text-[var(--color-text-muted)]">Loading...</div>
        }
      >
        {/* Search results mode */}
        <Show when={activeQuery()}>
          <Show
            when={!searching()}
            fallback={
              <div class="text-center py-12 space-y-4">
                <div class="inline-block w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                <p class="text-sm text-[var(--color-text-muted)]">Searching...</p>
              </div>
            }
          >
            <Show when={searchError()}>
              <div class="p-3 rounded-md bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 mb-4">
                <p class="text-sm text-[var(--color-error)]">{searchError()}</p>
              </div>
            </Show>
            <SearchResults
              results={searchResultItems()}
              totalCount={searchTotalCount()}
              query={activeQuery()}
            />
          </Show>
        </Show>

        {/* Browse mode (no active search) */}
        <Show when={!activeQuery()}>
          <Show
            when={knowledgeEntries().length > 0}
            fallback={
              <div class="text-center py-16 text-[var(--color-text-muted)]">
                <p class="text-lg mb-2">No knowledge entries found</p>
                <p class="text-sm">Register a vault with markdown files to populate knowledge entries.</p>
              </div>
            }
          >
            <div class="space-y-2">
              <For each={knowledgeEntries()}>
                {(entry) => (
                  <A
                    href={`/knowledge/${entry.id}`}
                    class="block rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 hover:border-[var(--color-accent)]/40 transition-colors"
                  >
                    <div class="flex items-start justify-between">
                      <div>
                        <h3 class="font-medium">{entry.title}</h3>
                        <p class="text-sm text-[var(--color-text-muted)] mt-0.5">{entry.file_path}</p>
                      </div>
                      <span class="px-2 py-0.5 rounded text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">
                        {entry.category}
                      </span>
                    </div>
                    <Show when={Array.isArray(entry.tags) && entry.tags.length > 0}>
                      <div class="flex gap-1.5 mt-2">
                        <For each={entry.tags}>
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
        </Show>
      </Show>

      <Show when={createOpen()}>
        <KnowledgeCreateDialog vaultId={effectiveVaultId()} />
      </Show>
    </div>
  );
}
