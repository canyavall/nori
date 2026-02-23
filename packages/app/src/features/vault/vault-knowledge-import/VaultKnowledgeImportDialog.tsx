import { createSignal, Show, Match, Switch } from 'solid-js';
import { open } from '@tauri-apps/plugin-dialog';
import { connectSSE } from '../../../lib/sse';
import type { ImportStep, VaultKnowledgeImportDialogProps } from './VaultKnowledgeImportDialog.type';


export function VaultKnowledgeImportDialog(props: VaultKnowledgeImportDialogProps) {
  const [step, setStep] = createSignal<ImportStep>('pick');
  const [progress, setProgress] = createSignal('');
  const [importedCount, setImportedCount] = createSignal(0);
  const [skippedCount, setSkippedCount] = createSignal(0);
  const [errorMsg, setErrorMsg] = createSignal('');

  let sseController: AbortController | undefined;

  function cleanup() {
    sseController?.abort();
  }

  async function handlePickFiles() {
    const selected = await open({
      multiple: true,
      filters: [{ name: 'Markdown', extensions: ['md'] }],
    }).catch(() => null);

    if (!selected || (Array.isArray(selected) && !selected.length)) return;
    const paths = Array.isArray(selected) ? selected : [selected];
    startImport(paths);
  }

  async function handlePickFolder() {
    const selected = await open({ directory: true }).catch(() => null);
    if (!selected || typeof selected !== 'string') return;
    startImport([selected]);
  }

  function startImport(sourcePaths: string[]) {
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
  }

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" onClick={() => { cleanup(); props.onClose(); }} />

      <div class="relative w-full max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-xl">
        <div class="p-4 border-b border-[var(--color-border)]">
          <h3 class="text-lg font-semibold">Import Knowledge</h3>
          <p class="text-sm text-[var(--color-text-muted)] mt-0.5">Import Markdown files into <span class="font-medium">{props.vault.name}</span></p>
        </div>

        <div class="p-4">
          <Switch>
            <Match when={step() === 'pick'}>
              <p class="text-sm text-[var(--color-text-muted)] mb-4">
                Select individual .md files or a folder containing Markdown files.
              </p>
              <div class="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handlePickFiles}
                  class="w-full px-4 py-2.5 rounded-md border border-[var(--color-border)] text-sm text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors text-left"
                >
                  Select files (.md)
                </button>
                <button
                  type="button"
                  onClick={handlePickFolder}
                  class="w-full px-4 py-2.5 rounded-md border border-[var(--color-border)] text-sm text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors text-left"
                >
                  Select folder
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

            <Match when={step() === 'importing'}>
              <div class="py-8 text-center space-y-4">
                <div class="inline-block w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                <p class="text-sm text-[var(--color-text-muted)]">{progress()}</p>
              </div>
            </Match>

            <Match when={step() === 'done'}>
              <div class="py-6 text-center space-y-2">
                <p class="text-[var(--color-text)]">Import complete</p>
                <p class="text-sm text-[var(--color-text-muted)]">
                  {importedCount()} imported · {skippedCount()} skipped
                </p>
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
                    onClick={() => setStep('pick')}
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
}
