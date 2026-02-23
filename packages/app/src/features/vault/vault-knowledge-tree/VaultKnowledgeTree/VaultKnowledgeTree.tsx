import { createSignal, createEffect, Show } from 'solid-js';
import type { KnowledgeEntry } from '@nori/shared';
import { apiGet } from '../../../../lib/api';
import { KnowledgeEditDialog } from '../../../knowledge/knowledge-edit/KnowledgeEditDialog/KnowledgeEditDialog';
import { CategoryTree } from '../CategoryTree/CategoryTree';
import type { VaultKnowledgeTreeProps } from './VaultKnowledgeTree.type';


export function VaultKnowledgeTree(props: VaultKnowledgeTreeProps) {
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal('');
  const [entries, setEntries] = createSignal<KnowledgeEntry[]>([]);
  const [editEntryId, setEditEntryId] = createSignal<string | null>(null);

  createEffect(() => {
    loadEntries(props.vault.id);
  });

  async function loadEntries(vaultId: string) {
    setLoading(true);
    setError('');
    try {
      const res = await apiGet<{ data: KnowledgeEntry[] }>(`/api/knowledge?vault_id=${vaultId}`);
      const normalized = res.data.map((e) => {
        if (typeof e.tags === 'string') {
          try { return { ...e, tags: JSON.parse(e.tags as unknown as string) }; }
          catch { return { ...e, tags: [] }; }
        }
        return e;
      });
      setEntries(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load knowledge entries');
    }
    setLoading(false);
  }

  const categorized = () => {
    const map: Record<string, KnowledgeEntry[]> = {};
    for (const entry of entries()) {
      const cat = entry.category || 'Uncategorized';
      if (!map[cat]) map[cat] = [];
      map[cat].push(entry);
    }
    return map;
  };

  return (
    <div>
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-lg font-semibold">{props.vault.name}</h3>
          <p class="text-sm text-[var(--color-text-muted)] mt-0.5">
            <Show when={!loading()}>
              {entries().length} knowledge {entries().length !== 1 ? 'entries' : 'entry'}
            </Show>
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadEntries(props.vault.id)}
          disabled={loading()}
          class="px-3 py-1.5 rounded-md text-xs border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Refresh
        </button>
      </div>

      <Show when={loading()}>
        <div class="py-12 text-center">
          <div class="inline-block w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
          <p class="text-sm text-[var(--color-text-muted)] mt-3">Loading knowledge...</p>
        </div>
      </Show>

      <Show when={!loading() && error()}>
        <div class="p-3 rounded-md bg-[var(--color-error)]/10 border border-[var(--color-error)]/20">
          <p class="text-sm text-[var(--color-error)]">{error()}</p>
          <button
            type="button"
            onClick={() => loadEntries(props.vault.id)}
            class="mt-2 text-xs text-[var(--color-accent)] hover:underline"
          >
            Retry
          </button>
        </div>
      </Show>

      <Show when={!loading() && !error() && entries().length === 0}>
        <div class="py-16 text-center text-[var(--color-text-muted)]">
          <p class="text-base mb-1">No knowledge entries</p>
          <p class="text-sm">Import or create knowledge entries to populate this vault.</p>
        </div>
      </Show>

      <Show when={!loading() && !error() && entries().length > 0}>
        <CategoryTree categories={categorized()} onEditEntry={setEditEntryId} />
      </Show>

      <Show when={editEntryId()} keyed>
        {(entryId) => (
          <KnowledgeEditDialog
            entryId={entryId}
            onClose={() => {
              setEditEntryId(null);
              loadEntries(props.vault.id);
            }}
          />
        )}
      </Show>
    </div>
  );
}
