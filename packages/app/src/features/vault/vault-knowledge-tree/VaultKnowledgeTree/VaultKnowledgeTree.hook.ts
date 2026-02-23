import { createSignal, createEffect } from 'solid-js';
import type { KnowledgeEntry } from '@nori/shared';
import { apiGet } from '../../../../lib/api';
import type { VaultKnowledgeTreeProps } from './VaultKnowledgeTree.type';

export const useVaultKnowledgeTree = (props: VaultKnowledgeTreeProps) => {
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal('');
  const [entries, setEntries] = createSignal<KnowledgeEntry[]>([]);
  const [editEntryId, setEditEntryId] = createSignal<string | null>(null);

  const loadEntries = async (vaultId: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGet<{ data: KnowledgeEntry[] }>(`/api/knowledge?vault_id=${vaultId}`);
      const normalized = res.data.map((e) => {
        if (typeof e.tags === 'string') {
          try {
            return { ...e, tags: JSON.parse(e.tags as unknown as string) };
          } catch {
            return { ...e, tags: [] };
          }
        }
        return e;
      });
      setEntries(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load knowledge entries');
    }
    setLoading(false);
  };

  createEffect(() => {
    loadEntries(props.vault.id);
  });

  const categorized = () => {
    const map: Record<string, KnowledgeEntry[]> = {};
    for (const entry of entries()) {
      const cat = entry.category || 'Uncategorized';
      if (!map[cat]) {
        map[cat] = [];
      }
      map[cat].push(entry);
    }
    return map;
  };

  const handleRefresh = () => {
    loadEntries(props.vault.id);
  };

  const handleEditClose = () => {
    setEditEntryId(null);
    loadEntries(props.vault.id);
  };

  return { loading, error, entries, editEntryId, setEditEntryId, categorized, handleRefresh, handleEditClose };
};
