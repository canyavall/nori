import { createSignal, onMount } from 'solid-js';
import type { Vault, KnowledgeEntry } from '@nori/shared';
import { apiGet } from '../../../../lib/api';
import { createOpen, setCreateOpen } from '../../../../stores/knowledge.store';
import type { VaultDetailSectionProps } from './VaultDetailSection.type';

export const useVaultDetailSection = (props: VaultDetailSectionProps) => {
  const [vault, setVault] = createSignal<Vault | null>(null);
  const [vaultLoading, setVaultLoading] = createSignal(true);
  const [vaultError, setVaultError] = createSignal('');

  const [entries, setEntries] = createSignal<KnowledgeEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = createSignal(false);

  const [selectedEntryId, setSelectedEntryId] = createSignal<string | null>(null);
  const [linkProjectOpen, setLinkProjectOpen] = createSignal(false);
  const [settingsOpen, setSettingsOpen] = createSignal(false);
  const [importOpen, setImportOpen] = createSignal(false);
  const [exportOpen, setExportOpen] = createSignal(false);
  const [searchQuery, setSearchQuery] = createSignal('');

  const loadVault = async () => {
    setVaultLoading(true);
    setVaultError('');
    try {
      const res = await apiGet<{ data: Vault[] }>('/api/vault');
      const found = res.data.find((v) => v.id === props.vaultId);
      if (!found) {
        setVaultError('Vault not found');
      } else {
        setVault(found);
        await loadEntries(found.id);
      }
    } catch (err) {
      setVaultError(err instanceof Error ? err.message : 'Failed to load vault');
    }
    setVaultLoading(false);
  };

  const loadEntries = async (vaultId: string) => {
    setEntriesLoading(true);
    try {
      const res = await apiGet<{ data: KnowledgeEntry[] }>(`/api/knowledge?vault_id=${vaultId}`);
      setEntries(res.data);
    } catch {
      // silently ignore — tree will be empty
    }
    setEntriesLoading(false);
  };

  onMount(() => {
    loadVault();
  });

  const categorized = () => {
    const query = searchQuery().toLowerCase().trim();
    const filtered = query
      ? entries().filter((e) => e.title.toLowerCase().includes(query) || (e.category ?? '').toLowerCase().includes(query))
      : entries();

    const map: Record<string, KnowledgeEntry[]> = {};
    for (const entry of filtered) {
      const cat = entry.category || 'Uncategorized';
      if (!map[cat]) map[cat] = [];
      map[cat].push(entry);
    }
    return map;
  };

  function handleRefresh() {
    const v = vault();
    if (v) loadEntries(v.id);
  }

  function handleEntrySelected(entryId: string) {
    setSelectedEntryId(entryId);
  }

  function handleEntrySaved() {
    const v = vault();
    if (v) loadEntries(v.id);
  }

  function handleDeleteSuccess() {
    const v = vault();
    if (v) loadEntries(v.id);
  }

  function handleEntryDeleted() {
    setSelectedEntryId(null);
  }

  return {
    vault,
    vaultLoading,
    vaultError,
    entries,
    entriesLoading,
    selectedEntryId,
    setSelectedEntryId,
    linkProjectOpen,
    setLinkProjectOpen,
    settingsOpen,
    setSettingsOpen,
    importOpen,
    setImportOpen,
    exportOpen,
    setExportOpen,
    createOpen,
    setCreateOpen,
    searchQuery,
    setSearchQuery,
    categorized,
    handleRefresh,
    handleEntrySelected,
    handleEntrySaved,
    handleDeleteSuccess,
    handleEntryDeleted,
  };
};
