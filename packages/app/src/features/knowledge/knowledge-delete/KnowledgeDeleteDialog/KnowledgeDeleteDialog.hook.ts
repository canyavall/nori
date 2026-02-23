import { createSignal } from 'solid-js';
import { removeKnowledgeEntry } from '../../../../stores/knowledge.store';
import { connectSSE } from '../../../../lib/sse';
import type { WizardStep, KnowledgeDeleteDialogProps } from './KnowledgeDeleteDialog.type';

export const useKnowledgeDeleteDialog = (props: KnowledgeDeleteDialogProps) => {
  const [step, setStep] = createSignal<WizardStep>('confirmation');
  const [progressMessage, setProgressMessage] = createSignal('');
  const [error, setError] = createSignal('');

  const handleConfirm = () => {
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
  };

  return { step, progressMessage, error, handleConfirm };
};
