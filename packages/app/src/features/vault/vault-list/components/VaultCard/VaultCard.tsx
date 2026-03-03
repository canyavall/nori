import { Show } from 'solid-js';
import type { Component } from 'solid-js';
import { VaultTypeBadge } from '../VaultTypeBadge/VaultTypeBadge';
import type { VaultCardProps } from './VaultCard.type';

export const VaultCard: Component<VaultCardProps> = (props) => {
  const v = props.vault;

  return (
    <div
      onClick={props.onNavigate}
      class="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col gap-4"
    >
      {/* Header: name + badge */}
      <div class="flex items-start justify-between gap-2">
        <h3 class="text-lg font-medium truncate">{v.name}</h3>
        <VaultTypeBadge type={v.vault_type} />
      </div>

      {/* Path */}
      <div>
        <p class="text-sm text-[var(--color-text-muted)] mb-1">Path</p>
        <p class="text-sm font-mono text-[var(--color-text)] truncate">
          {v.git_url ?? v.local_path}
        </p>
      </div>

      {/* Stats */}
      <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--color-text-muted)]">
        <span>
          Projects:{' '}
          <span class="font-medium text-[var(--color-text)]">{v.project_count ?? 0}</span>
        </span>
        <span>·</span>
        <span>
          Knowledge:{' '}
          <span class="font-medium text-[var(--color-text)]">{v.knowledge_count ?? 0}</span>
        </span>
        <Show when={v.branch}>
          <span>·</span>
          <span class="px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)] text-xs">{v.branch}</span>
        </Show>
      </div>

      {/* Sync button */}
      <button
        type="button"
        onClick={props.onSync}
        class="mt-auto w-full border border-[var(--color-border)] rounded-md py-1.5 text-sm hover:bg-[var(--color-bg-tertiary)] transition-colors"
      >
        {props.syncOpen ? 'Close' : 'Sync'}
      </button>
    </div>
  );
};
