import { createSignal, createMemo, onMount } from 'solid-js';
import type { KnowledgeEntry } from '@nori/shared';
import { apiGet } from '../../../lib/api';
import { knowledgeEntries, setKnowledgeEntries, searchQuery, setSearchQuery, createOpen, setCreateOpen } from '../../../stores/knowledge.store';
import { vaults } from '../../../stores/vault.store';
import { activeVault, activeProject } from '../../../stores/navigation.store';
import type { SearchResultItem } from '../knowledge-search/SearchResults/SearchResults.type';

export const useKnowledgeListSection = () => {
  const [loading, setLoading] = createSignal(true);
  const [selectedVaultId, setSelectedVaultId] = createSignal('');
  const [editEntryId, setEditEntryId] = createSignal<string | null>(null);
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

  return {
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
  };
}
