import type { LinkConfirmationProps } from './LinkConfirmation.type';

export const LinkConfirmation = (props: LinkConfirmationProps) => {
  return (
    <div class="space-y-4">
      <div class="flex items-center gap-2 text-[var(--color-success)]">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span class="font-medium">Vault linked successfully</span>
      </div>

      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-[var(--color-text-muted)]">Vault</span>
          <span>{props.vaultName}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-[var(--color-text-muted)]">Project</span>
          <span class="truncate ml-4">{props.projectPath}</span>
        </div>
      </div>

      <div class="flex justify-end pt-2">
        <button
          onClick={props.onDismiss}
          class="px-4 py-2 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}
