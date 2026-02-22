import { For, Show } from 'solid-js';
import type { Vault } from '@nori/shared';

interface Props {
  vaults: Vault[];
  onSelect: (vaultId: string) => void;
  onCancel: () => void;
}

export function VaultPicker(props: Props) {
  return (
    <div class="space-y-4">
      <p class="text-sm text-[var(--color-text-muted)]">Select a vault to link:</p>

      <Show
        when={props.vaults.length > 0}
        fallback={
          <p class="text-sm text-[var(--color-text-muted)] py-4 text-center">
            No vaults registered yet. Register a vault first.
          </p>
        }
      >
        <div class="space-y-2 max-h-64 overflow-auto">
          <For each={props.vaults}>
            {(vault) => (
              <button
                onClick={() => props.onSelect(vault.id)}
                class="w-full text-left p-3 rounded-md border border-[var(--color-border)] hover:border-[var(--color-accent)] bg-[var(--color-bg)] transition-colors"
              >
                <div class="font-medium text-sm">{vault.name}</div>
                <div class="text-xs text-[var(--color-text-muted)] truncate mt-0.5">{vault.git_url}</div>
              </button>
            )}
          </For>
        </div>
      </Show>

      <div class="flex justify-end">
        <button
          onClick={props.onCancel}
          class="px-4 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
