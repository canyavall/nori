import { createSignal, Match, Switch } from 'solid-js';
import type { KnowledgeEntry } from '@nori/shared';
import { removeKnowledgeEntry } from '../../../../stores/knowledge.store';
import { connectSSE } from '../../../../lib/sse';
import { DeleteConfirmation } from '../DeleteConfirmation/DeleteConfirmation';
import { DeleteResult } from '../DeleteResult/DeleteResult';
import type { WizardStep, KnowledgeDeleteDialogProps } from './KnowledgeDeleteDialog.type';


export function KnowledgeDeleteDialog(props: KnowledgeDeleteDialogProps) {
  const [step, setStep] = createSignal<WizardStep>('confirmation');
  const [progressMessage, setProgressMessage] = createSignal('');
  const [error, setError] = createSignal('');

  function handleConfirm() {
    setStep('progress');
    setProgressMessage('Deleting entry...');
    setError('');

    connectSSE(`/api/knowledge/${props.entry.id}`, {}, {
      onEvent: (event) => {
        const messages: Record<string, string> = {
          'knowledge:delete:started': 'Starting deletion...',
          'knowledge:delete:validating-exists': 'Validating entry...',
          'knowledge:delete:checking-dependencies': 'Checking dependencies...',
          'knowledge:delete:deleting-file': 'Deleting file...',
          'knowledge:delete:regenerating-index': 'Rebuilding search index...',
          'knowledge:delete:completed': 'Deletion complete!',
        };
        setProgressMessage(messages[event] ?? event);
      },
      onResult: (data) => {
        const flowResult = data as { success: boolean; error?: { message: string } };
        if (flowResult.success) {
          removeKnowledgeEntry(props.entry.id);
          setStep('result');
        } else {
          setError(flowResult.error?.message ?? 'Deletion failed');
          setStep('confirmation');
        }
      },
      onError: (errMsg) => {
        setError(errMsg);
        setStep('confirmation');
      },
    }, 'DELETE');
  }

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
}
