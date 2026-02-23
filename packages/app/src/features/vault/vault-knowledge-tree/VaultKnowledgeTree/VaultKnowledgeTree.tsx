import { Show } from 'solid-js';
import { KnowledgeEditDialog } from '../../../knowledge/knowledge-edit/KnowledgeEditDialog/KnowledgeEditDialog';
import { CategoryTree } from '../CategoryTree/CategoryTree';
import type { VaultKnowledgeTreeProps } from './VaultKnowledgeTree.type';
import { useVaultKnowledgeTree } from './VaultKnowledgeTree.hook';

export const VaultKnowledgeTree = (props: VaultKnowledgeTreeProps) => {
  const { loading, error, entries, editEntryId, setEditEntryId, categorized, handleRefresh, handleEditClose } = useVaultKnowledgeTree(props);

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
          onClick={handleRefresh}
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
            onClick={handleRefresh}
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
            onClose={handleEditClose}
          />
        )}
      </Show>
    </div>
  );
};
