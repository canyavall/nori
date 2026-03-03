import { createSignal } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { connectSSE } from '../../../../lib/sse';
import { removeVault } from '../../../../stores/vault.store';
import type { VaultSettingsDialogProps, SettingsStep } from './VaultSettingsDialog.type';

const PROGRESS_MESSAGES: Record<string, string> = {
  'vault:delete:validating-vault': 'Validating vault...',
  'vault:delete:deleting-knowledge-entries': 'Deleting knowledge entries...',
  'vault:delete:deleting-vault-links': 'Deleting vault links...',
  'vault:delete:deleting-vault-record': 'Deleting vault record...',
  'vault:delete:deleting-local-files': 'Deleting local files...',
  'vault:delete:completed': 'Done.',
};

export const useVaultSettingsDialog = (props: VaultSettingsDialogProps) => {
  const navigate = useNavigate();
  const [step, setStep] = createSignal<SettingsStep>('settings');
  const [progressMessage, setProgressMessage] = createSignal('Starting...');
  const [error, setError] = createSignal('');

  let sseController: AbortController | undefined;

  const cleanup = () => {
    sseController?.abort();
  };

  const handleDeleteClick = () => {
    setStep('enter-name');
  };

  const handleNameConfirmed = () => {
    setStep('confirm');
  };

  const handleConfirm = () => {
    setStep('progress');
    setProgressMessage('Starting...');
    setError('');

    sseController = connectSSE(
      `/api/vault/${props.vault.id}`,
      {},
      {
        onEvent: (event) => {
          setProgressMessage(PROGRESS_MESSAGES[event] ?? event);
        },
        onResult: (data) => {
          const result = data as { success: boolean; data?: unknown; error?: { message: string } };
          if (result.success) {
            removeVault(props.vault.id);
            navigate('/vaults');
          } else {
            setError(result.error?.message ?? 'Deletion failed');
            setStep('settings');
          }
        },
        onError: (err) => {
          setError(err);
          setStep('settings');
        },
      },
      'DELETE'
    );
  };

  const handleCancel = () => {
    setStep('settings');
  };

  const handleClose = () => {
    cleanup();
    props.onClose();
  };

  return {
    step,
    progressMessage,
    error,
    handleDeleteClick,
    handleNameConfirmed,
    handleConfirm,
    handleCancel,
    handleClose,
  };
};
