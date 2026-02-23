import { Show } from 'solid-js';
import type { DeleteConfirmationProps } from './DeleteConfirmation.type';


export const DeleteConfirmation = (props: DeleteConfirmationProps) => {
  return (
    <div class="space-y-4">
      <div class="p-4 rounded-md bg-[var(--color-error)]/10 border border-[var(--color-error)]/20">
        <p class="text-sm font-medium text-[var(--color-error)]">Delete knowledge entry?</p>
        <p class="text-sm text-[var(--color-text-muted)] mt-1">
          This will permanently delete <strong>"{props.entryTitle}"</strong> from the vault. This action cannot be undone.
        </p>
      </div>

      <Show when={props.error}>
        <div class="p-3 rounded-md bg-[var(--color-error)]/10 border border-[var(--color-error)]/20">
          <p class="text-sm text-[var(--color-error)]">{props.error}</p>
        </div>
      </Show>

      <div class="flex justify-end gap-3 pt-2">
        <button type="button" onClick={props.onCancel}
          class="px-4 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
          Cancel
        </button>
        <button type="button" onClick={props.onConfirm}
          class="px-4 py-2 rounded-md bg-[var(--color-error)] text-white text-sm font-medium hover:bg-[var(--color-error)]/80 transition-colors">
          Delete Entry
        </button>
      </div>
    </div>
  );
}
