import type { ConfirmDeleteStepProps } from './ConfirmDeleteStep.type';

export const ConfirmDeleteStep = (props: ConfirmDeleteStepProps) => {
  return (
    <div class="space-y-4">
      <p class="text-sm text-[var(--color-text-muted)]">
        Are you sure you want to permanently delete <span class="font-semibold text-[var(--color-text)]">{props.vaultName}</span>?
        This action cannot be undone.
      </p>
      <div class="flex justify-end gap-2">
        <button
          type="button"
          onClick={props.onCancel}
          class="px-4 py-2 rounded-md text-sm border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={props.onConfirm}
          class="px-4 py-2 rounded-md text-sm bg-red-600 text-white hover:bg-red-700 transition-colors"
        >
          Yes, delete
        </button>
      </div>
    </div>
  );
};
