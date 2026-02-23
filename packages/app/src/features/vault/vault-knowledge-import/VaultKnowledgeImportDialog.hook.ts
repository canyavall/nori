import { createSignal } from 'solid-js';
import { open } from '@tauri-apps/plugin-dialog';
import { connectSSE } from '../../../lib/sse';
import type { ImportStep, VaultKnowledgeImportDialogProps } from './VaultKnowledgeImportDialog.type';

export const useVaultKnowledgeImportDialog = (props: VaultKnowledgeImportDialogProps) => {
  const [step, setStep] = createSignal<ImportStep>('pick');
  const [progress, setProgress] = createSignal('');
  const [importedCount, setImportedCount] = createSignal(0);
  const [skippedCount, setSkippedCount] = createSignal(0);
  const [errorMsg, setErrorMsg] = createSignal('');

  let sseController: AbortController | undefined;

  const cleanup = () => {
    sseController?.abort();
  };

  const startImport = (sourcePaths: string[]) => {
    setStep('importing');
    setProgress('Starting import...');
    setImportedCount(0);
    setSkippedCount(0);

    sseController = connectSSE(
      `/api/vault/${props.vault.id}/knowledge/import`,
      { source_paths: sourcePaths },
      {
        onEvent: (event, data) => {
          const messages: Record<string, string> = {
            'vault:knowledge-import:scanning': 'Scanning files...',
            'vault:knowledge-import:found': `Found ${(data as { file_count?: number }).file_count ?? 0} file(s)`,
            'vault:knowledge-import:rebuilding-index': 'Rebuilding index...',
          };
          if (event === 'vault:knowledge-import:importing') {
            setProgress(`Importing: ${(data as { title?: string }).title ?? ''}`);
          } else if (messages[event]) {
            setProgress(messages[event]);
          }
        },
        onResult: (result) => {
          const r = result as { success: boolean; data?: { imported_count: number; skipped_count: number }; error?: { message: string } };
          if (r.success && r.data) {
            setImportedCount(r.data.imported_count);
            setSkippedCount(r.data.skipped_count);
            setStep('done');
          } else {
            setErrorMsg(r.error?.message ?? 'Import failed');
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

  const handlePickFiles = async () => {
    const selected = await open({
      multiple: true,
      filters: [{ name: 'Markdown', extensions: ['md'] }],
    }).catch(() => null);

    if (!selected || (Array.isArray(selected) && !selected.length)) {
      return;
    }
    const paths = Array.isArray(selected) ? selected : [selected];
    startImport(paths);
  };

  const handlePickFolder = async () => {
    const selected = await open({ directory: true }).catch(() => null);
    if (!selected || typeof selected !== 'string') {
      return;
    }
    startImport([selected]);
  };

  const handleClose = () => {
    cleanup();
    props.onClose();
  };

  const handleRetry = () => {
    setStep('pick');
  };

  return { step, progress, importedCount, skippedCount, errorMsg, handlePickFiles, handlePickFolder, handleClose, handleRetry };
};
