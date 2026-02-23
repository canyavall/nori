import { For, Show } from 'solid-js';
import type { Component } from 'solid-js';
import { A } from '@solidjs/router';
import { KnowledgeCreateDialog } from '../knowledge-create/KnowledgeCreateDialog/KnowledgeCreateDialog';
import { KnowledgeEditDialog } from '../knowledge-edit/KnowledgeEditDialog/KnowledgeEditDialog';
import { RepoExtractDialog } from '../repo-knowledge-extract/RepoExtractDialog/RepoExtractDialog';
import { SearchForm } from '../knowledge-search/SearchForm/SearchForm';
import { SearchResults } from '../knowledge-search/SearchResults/SearchResults';
import { useKnowledgeListSection } from './KnowledgeListSection.hook';

export const KnowledgeListSection: Component = () => {
  const {
    loading,
    selectedVaultId,
    setSelectedVaultId,
    editEntryId,
    setEditEntryId,
    searching,
    searchResultItems,
    searchTotalCount,
    searchError,
    activeQuery,
    effectiveVaultId,
    knowledgeEntries,
    searchQuery,
    createOpen,
    setCreateOpen,
    vaults,
    activeVault,
    activeProject,
    handleSearch,
    handleClearSearch,
    extractOpen,
    setExtractOpen,
  } = useKnowledgeListSection();

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
          <Show when={activeProject()}>
            <button
              type="button"
              disabled={!effectiveVaultId()}
              onClick={() => setExtractOpen(true)}
              class="px-4 py-2 rounded-md border border-[var(--color-accent)] text-[var(--color-accent)] text-sm font-medium hover:bg-[var(--color-accent)]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Analyze Repository
            </button>
          </Show>
          <button
            type="button"
            disabled={!effectiveVaultId()}
            onClick={() => setCreateOpen(true)}
            class="px-4 py-2 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Knowledge
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
                  <div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 hover:border-[var(--color-accent)]/40 transition-colors">
                    <div class="flex items-start justify-between gap-3">
                      <A href={`/knowledge/${entry.id}`} class="flex-1 min-w-0">
                        <h3 class="font-medium">{entry.title}</h3>
                        <p class="text-sm text-[var(--color-text-muted)] mt-0.5 truncate">{entry.file_path}</p>
                      </A>
                      <div class="flex items-center gap-2 shrink-0">
                        <span class="px-2 py-0.5 rounded text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">
                          {entry.category}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditEntryId(entry.id)}
                          class="px-2.5 py-1 rounded text-xs border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                        >
                          Edit
                        </button>
                      </div>
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
                  </div>
                )}
              </For>
            </div>
          </Show>
        </Show>
      </Show>

      <Show when={createOpen()}>
        <KnowledgeCreateDialog vaultId={effectiveVaultId()} />
      </Show>

      <Show when={extractOpen() && activeProject()}>
        <RepoExtractDialog
          projectPath={activeProject()!.path}
          vaultId={effectiveVaultId()}
          onClose={() => setExtractOpen(false)}
        />
      </Show>

      <Show when={editEntryId()} keyed>
        {(entryId) => (
          <KnowledgeEditDialog
            entryId={entryId}
            onClose={() => setEditEntryId(null)}
          />
        )}
      </Show>
    </div>
  );
}
