import type { VaultTypePickerProps } from './VaultTypePicker.type';

export function VaultTypePicker(props: VaultTypePickerProps) {
  return (
    <div class="space-y-3">
      <p class="text-sm text-[var(--color-text-muted)]">What kind of vault do you want to register?</p>

      <button
        type="button"
        onClick={() => props.onSelect('git')}
        class="w-full text-left p-4 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 transition-colors group"
      >
        <div class="flex items-start gap-3">
          <div class="mt-0.5 text-[var(--color-accent)]">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium">Git Repository</p>
            <p class="text-xs text-[var(--color-text-muted)] mt-0.5">Clone from a remote git repo (GitHub, GitLab, Bitbucket…)</p>
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => props.onSelect('local')}
        class="w-full text-left p-4 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 transition-colors group"
      >
        <div class="flex items-start gap-3">
          <div class="mt-0.5 text-[var(--color-accent)]">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium">Local Vault</p>
            <p class="text-xs text-[var(--color-text-muted)] mt-0.5">Create a new vault stored locally in ~/.nori/vaults/</p>
          </div>
        </div>
      </button>

      <div class="flex justify-end pt-1">
        <button
          type="button"
          onClick={props.onCancel}
          class="px-4 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
