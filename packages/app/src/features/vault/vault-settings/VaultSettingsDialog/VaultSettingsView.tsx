import { Show } from 'solid-js';
import type { VaultSettingsViewProps } from './VaultSettingsView.type';

export const VaultSettingsView = (props: VaultSettingsViewProps) => {
  return (
    <div class="space-y-6">
      {/* Vault info */}
      <div class="space-y-1">
        <p class="text-sm text-[var(--color-text-muted)]">Type</p>
        <p class="text-sm font-medium">{props.vault.vault_type === 'local' ? 'Local' : 'Git'}</p>
      </div>
      <Show when={props.vault.local_path}>
        <div class="space-y-1">
          <p class="text-sm text-[var(--color-text-muted)]">Path</p>
          <p class="text-sm font-mono break-all">{props.vault.local_path}</p>
        </div>
      </Show>

      {/* Danger zone */}
      <div class="rounded-md border border-red-500/40 p-4 space-y-3">
        <h4 class="text-sm font-semibold text-red-500">Danger Zone</h4>
        <div class="space-y-1">
          <p class="text-sm text-[var(--color-text-muted)]">This action cannot be undone.</p>
          <Show
            when={props.vault.vault_type === 'local'}
            fallback={
              <p class="text-sm text-[var(--color-text-muted)]">
                The vault will only be removed from Nori. Your git repository will not be deleted.
              </p>
            }
          >
            <p class="text-sm text-[var(--color-text-muted)]">
              All files in <span class="font-mono">{props.vault.local_path}</span> will be permanently deleted from your filesystem.
            </p>
          </Show>
        </div>
        <button
          type="button"
          onClick={props.onDeleteClick}
          class="px-3 py-1.5 rounded-md text-sm bg-red-600 text-white hover:bg-red-700 transition-colors"
        >
          Delete Vault
        </button>
      </div>

      <div class="flex justify-end">
        <button
          type="button"
          onClick={props.onClose}
          class="px-4 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
