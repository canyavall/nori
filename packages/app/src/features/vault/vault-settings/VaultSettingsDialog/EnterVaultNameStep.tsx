import { createSignal } from 'solid-js';
import type { EnterVaultNameStepProps } from './EnterVaultNameStep.type';

export const EnterVaultNameStep = (props: EnterVaultNameStepProps) => {
  const [input, setInput] = createSignal('');

  return (
    <div class="space-y-4">
      <p class="text-sm text-[var(--color-text-muted)]">
        To confirm deletion, type <span class="font-mono font-semibold text-[var(--color-text)]">{props.vaultName}</span> below.
      </p>
      <input
        type="text"
        value={input()}
        onInput={(e) => setInput(e.currentTarget.value)}
        placeholder={props.vaultName}
        class="w-full px-3 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
      />
      <div class="flex justify-end gap-2">
        <button
          type="button"
          onClick={props.onCancel}
          class="px-4 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={props.onConfirm}
          disabled={input() !== props.vaultName}
          class="px-4 py-2 rounded-md text-sm bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
