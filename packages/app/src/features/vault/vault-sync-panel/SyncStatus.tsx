import { Show } from 'solid-js';
import type { Vault } from '@nori/shared';

interface Props {
  vault: Vault;
  onPull: () => void;
  onPush: () => void;
  onClose: () => void;
}

export function SyncStatus(props: Props) {
  const lastSynced = () => {
    if (!props.vault.last_synced_at) return 'Never';
    return new Date(props.vault.last_synced_at).toLocaleString();
  };

  return (
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="text-sm font-medium">Sync Status</h4>
        <button
          type="button"
          onClick={props.onClose}
          class="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          Close
        </button>
      </div>

      <div class="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-3 space-y-2">
        <div class="flex justify-between text-sm">
          <span class="text-[var(--color-text-muted)]">Branch</span>
          <span class="font-mono text-xs">{props.vault.branch}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-[var(--color-text-muted)]">Last synced</span>
          <span class="text-xs">{lastSynced()}</span>
        </div>
      </div>

      <div class="flex gap-2">
        <button
          type="button"
          onClick={props.onPull}
          class="flex-1 px-4 py-2 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          Pull
        </button>
        <button
          type="button"
          onClick={props.onPush}
          class="flex-1 px-4 py-2 rounded-md text-sm text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
        >
          Push
        </button>
      </div>
    </div>
  );
}
