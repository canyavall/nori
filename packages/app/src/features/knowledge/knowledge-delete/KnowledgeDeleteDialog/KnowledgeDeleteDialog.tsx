import { Match, Switch } from 'solid-js';
import { DeleteConfirmation } from '../DeleteConfirmation/DeleteConfirmation';
import { DeleteResult } from '../DeleteResult/DeleteResult';
import type { KnowledgeDeleteDialogProps } from './KnowledgeDeleteDialog.type';
import { useKnowledgeDeleteDialog } from './KnowledgeDeleteDialog.hook';

export const KnowledgeDeleteDialog = (props: KnowledgeDeleteDialogProps) => {
  const { step, progressMessage, error, handleConfirm } = useKnowledgeDeleteDialog(props);

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" onClick={props.onClose} />

      <div class="relative w-full max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-xl">
        <div class="p-4 border-b border-[var(--color-border)]">
          <h3 class="text-lg font-semibold">Delete Knowledge Entry</h3>
        </div>

        <div class="p-4">
          <Switch>
            <Match when={step() === 'confirmation'}>
              <DeleteConfirmation
                entryTitle={props.entry.title}
                error={error()}
                onConfirm={handleConfirm}
                onCancel={props.onClose}
              />
            </Match>

            <Match when={step() === 'progress'}>
              <div class="py-8 text-center space-y-4">
                <div class="inline-block w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                <p class="text-sm text-[var(--color-text-muted)]">{progressMessage()}</p>
              </div>
            </Match>

            <Match when={step() === 'result'}>
              <DeleteResult
                entryTitle={props.entry.title}
                onDone={props.onClose}
              />
            </Match>
          </Switch>
        </div>
      </div>
    </div>
  );
};
