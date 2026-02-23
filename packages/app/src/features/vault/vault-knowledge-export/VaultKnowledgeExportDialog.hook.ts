import { createSignal } from 'solid-js';
import { open } from '@tauri-apps/plugin-dialog';
import { connectSSE } from '../../../lib/sse';
import type { ExportStep, VaultKnowledgeExportDialogProps } from './VaultKnowledgeExportDialog.type';

export const useVaultKnowledgeExportDialog = (props: VaultKnowledgeExportDialogProps) => {
  const [step, setStep] = createSignal<ExportStep>('pick');
  const [progress, setProgress] = createSignal('');
  const [exportedCount, setExportedCount] = createSignal(0);
  const [destPath, setDestPath] = createSignal('');
  const [errorMsg, setErrorMsg] = createSignal('');

  let sseController: AbortController | undefined;

  const cleanup = () => {
    sseController?.abort();
  };

  const startExport = (destinationPath: string) => {
    setStep('exporting');
    setProgress('Starting export...');
    setExportedCount(0);
    setDestPath(destinationPath);

    sseController = connectSSE(
      `/api/vault/${props.vault.id}/knowledge/export`,
      { destination_path: destinationPath },
      {
        onEvent: (event, data) => {
          const messages: Record<string, string> = {
            'vault:knowledge-export:loading-entries': 'Loading knowledge entries...',
          };
          if (event === 'vault:knowledge-export:exporting') {
            setProgress(`Exporting ${(data as { entry_count?: number }).entry_count ?? 0} entries...`);
          } else if (event === 'vault:knowledge-export:entry-exported') {
            setProgress(`Exporting: ${(data as { title?: string }).title ?? ''}`);
          } else if (messages[event]) {
            setProgress(messages[event]);
          }
        },
        onResult: (result) => {
          const r = result as { success: boolean; data?: { exported_count: number; destination_path: string }; error?: { message: string } };
          if (r.success && r.data) {
            setExportedCount(r.data.exported_count);
            setDestPath(r.data.destination_path);
            setStep('done');
          } else {
            setErrorMsg(r.error?.message ?? 'Export failed');
            setStep('error');
          }
        },
        onError: (msg) => {
          setErrorMsg(msg);
          setStep('error');
        },
      }
    );
  };

  const handlePickFolder = async () => {
    const selected = await open({ directory: true }).catch(() => null);
    if (!selected || typeof selected !== 'string') {
      return;
    }
    startExport(selected);
  };

  const handleClose = () => {
    cleanup();
    props.onClose();
  };

  const handleRetry = () => {
    setStep('pick');
  };

  return { step, progress, exportedCount, destPath, errorMsg, handlePickFolder, handleClose, handleRetry };
};
