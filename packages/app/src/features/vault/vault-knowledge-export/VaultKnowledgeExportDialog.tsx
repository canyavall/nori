import { Match, Switch } from 'solid-js';
import type { VaultKnowledgeExportDialogProps } from './VaultKnowledgeExportDialog.type';
import { useVaultKnowledgeExportDialog } from './VaultKnowledgeExportDialog.hook';

export const VaultKnowledgeExportDialog = (props: VaultKnowledgeExportDialogProps) => {
  const { step, progress, exportedCount, destPath, errorMsg, handlePickFolder, handleClose, handleRetry } = useVaultKnowledgeExportDialog(props);

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" onClick={handleClose} />

      <div class="relative w-full max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-xl">
        <div class="p-4 border-b border-[var(--color-border)]">
          <h3 class="text-lg font-semibold">Export Knowledge</h3>
          <p class="text-sm text-[var(--color-text-muted)] mt-0.5">Export all entries from <span class="font-medium">{props.vault.name}</span> as Markdown files</p>
        </div>

        <div class="p-4">
          <Switch>
            <Match when={step() === 'pick'}>
              <p class="text-sm text-[var(--color-text-muted)] mb-4">
                Choose a destination folder. Knowledge entries will be exported as .md files, grouped by category.
              </p>
              <div class="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handlePickFolder}
                  class="w-full px-4 py-2.5 rounded-md border border-[var(--color-border)] text-sm text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors text-left"
                >
                  Choose destination folder
                </button>
              </div>
              <div class="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={props.onClose}
                  class="px-4 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </Match>

            <Match when={step() === 'exporting'}>
              <div class="py-8 text-center space-y-4">
                <div class="inline-block w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                <p class="text-sm text-[var(--color-text-muted)]">{progress()}</p>
              </div>
            </Match>

            <Match when={step() === 'done'}>
              <div class="py-6 space-y-2">
                <p class="text-[var(--color-text)] font-medium">Export complete</p>
                <p class="text-sm text-[var(--color-text-muted)]">{exportedCount()} entries exported</p>
                <p class="text-xs text-[var(--color-text-muted)] truncate">{destPath()}</p>
              </div>
              <div class="flex justify-end">
                <button
                  type="button"
                  onClick={props.onClose}
                  class="px-4 py-2 rounded-md text-sm bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors"
                >
                  Done
                </button>
              </div>
            </Match>

            <Match when={step() === 'error'}>
              <div class="py-4 space-y-3">
                <div class="p-3 rounded-md bg-[var(--color-error)]/10 border border-[var(--color-error)]/20">
                  <p class="text-sm text-[var(--color-error)]">{errorMsg()}</p>
                </div>
                <div class="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleRetry}
                    class="px-4 py-2 rounded-md text-sm border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                  >
                    Try again
                  </button>
                  <button
                    type="button"
                    onClick={props.onClose}
                    class="px-4 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </Match>
          </Switch>
        </div>
      </div>
    </div>
  );
};
