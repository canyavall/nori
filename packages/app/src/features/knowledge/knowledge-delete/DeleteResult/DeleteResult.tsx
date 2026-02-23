import type { DeleteResultProps } from './DeleteResult.type';

export function DeleteResult(props: DeleteResultProps) {
  return (
    <div class="space-y-4">
      <div class="text-center py-2">
        <div class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-500/10 text-green-500 mb-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p class="font-medium">Entry deleted</p>
        <p class="text-sm text-[var(--color-text-muted)] mt-1">
          "{props.entryTitle}" has been permanently removed from the vault.
        </p>
      </div>

      <div class="flex justify-end pt-2">
        <button type="button" onClick={props.onDone}
          class="px-4 py-2 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors">
          Back to Knowledge
        </button>
      </div>
    </div>
  );
}
