import { Show } from 'solid-js';
import type { VaultRegistrationResponse } from '@nori/shared';
import type { VaultRegistrationResultProps } from './VaultRegistrationResult.type';


export function VaultRegistrationResult(props: VaultRegistrationResultProps) {
  const isLocal = () => props.result.vault.vault_type === 'local';

  return (
    <div class="space-y-4">
      <div class="flex items-center gap-2 text-[var(--color-success)]">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span class="font-medium">Vault registered successfully</span>
      </div>

      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-[var(--color-text-muted)]">Name</span>
          <span>{props.result.vault.name}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-[var(--color-text-muted)]">Type</span>
          <span class="capitalize">{isLocal() ? 'Local' : 'Git'}</span>
        </div>
        <Show when={!isLocal()}>
          <div class="flex justify-between">
            <span class="text-[var(--color-text-muted)]">Branch</span>
            <span>{props.result.vault.branch}</span>
          </div>
        </Show>
        <Show when={isLocal()}>
          <div class="flex justify-between gap-4">
            <span class="text-[var(--color-text-muted)] shrink-0">Path</span>
            <span class="font-mono text-xs text-right break-all">{props.result.vault.local_path}</span>
          </div>
        </Show>
        <div class="flex justify-between">
          <span class="text-[var(--color-text-muted)]">Knowledge entries</span>
          <span>{props.result.knowledge_count}</span>
        </div>
      </div>

      <div class="flex justify-end pt-2">
        <button
          onClick={props.onClose}
          class="px-4 py-2 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}
