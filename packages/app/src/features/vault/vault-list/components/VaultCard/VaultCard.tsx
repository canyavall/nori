import { Show } from 'solid-js';
import type { Component } from 'solid-js';
import { VaultTypeBadge } from '../VaultTypeBadge/VaultTypeBadge';
import type { VaultCardProps } from './VaultCard.type';

export const VaultCard: Component<VaultCardProps> = (props) => {
  const v = props.vault;

  return (
    <div
      onClick={props.onSelect}
      class="p-4 cursor-pointer transition-colors hover:bg-[var(--color-bg-tertiary)]/30"
    >
      <div class="flex items-start justify-between gap-4 mb-3">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 mb-1">
            <h3 class="font-medium truncate">{v.name}</h3>
            <VaultTypeBadge type={v.vault_type} />
          </div>
          <Show when={v.git_url}>
            <p class="text-sm text-[var(--color-text-muted)] font-mono truncate">{v.git_url}</p>
          </Show>
          <Show when={!v.git_url}>
            <p class="text-sm text-[var(--color-text-muted)] font-mono truncate">{v.local_path}</p>
          </Show>
        </div>
        <div class="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={props.onLinkProject}
            class="px-3 py-1.5 rounded-md text-xs text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
          >
            Link Project
          </button>
          <button
            type="button"
            onClick={props.onSync}
            class="px-3 py-1.5 rounded-md text-xs text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
          >
            {props.syncOpen ? 'Close' : 'Sync'}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div class="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
        <span>
          <span class="font-medium text-[var(--color-text)]">{v.project_count ?? 0}</span>
          {' '}project{(v.project_count ?? 0) !== 1 ? 's' : ''} connected
        </span>
        <span>
          <span class="font-medium text-[var(--color-text)]">{v.knowledge_count ?? 0}</span>
          {' '}knowledge {(v.knowledge_count ?? 0) !== 1 ? 'entries' : 'entry'}
        </span>
        <Show when={v.branch}>
          <span class="px-2 py-0.5 rounded bg-[var(--color-bg-tertiary)]">{v.branch}</span>
        </Show>
        <Show when={v.last_synced_at}>
          <span>Synced {new Date(v.last_synced_at ?? '').toLocaleDateString()}</span>
        </Show>
      </div>
    </div>
  );
};
