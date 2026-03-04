import { createSignal, createEffect } from 'solid-js';
import type { KnowledgeEntry } from '@nori/shared';
import { apiGet } from '../../../../lib/api';
import type { VaultKnowledgeTreeProps } from './VaultKnowledgeTree.type';

export const useVaultKnowledgeTree = (props: VaultKnowledgeTreeProps) => {
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal('');
  const [entries, setEntries] = createSignal<KnowledgeEntry[]>([]);
  const [editEntryId, setEditEntryId] = createSignal<string | null>(null);

  const normalizeTags = (tags: unknown): string[] => {
    if (Array.isArray(tags)) return tags as string[];
    if (typeof tags === 'string') {
      try { return JSON.parse(tags); } catch { return []; }
    }
    return [];
  };

  const loadEntries = async (vaultId: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGet<{ data: KnowledgeEntry[] }>(`/api/knowledge?vault_id=${vaultId}`);
      setEntries(res.data.map((e) => ({ ...e, tags: normalizeTags(e.tags) })));
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
