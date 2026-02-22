import { createSignal, Match, Switch } from 'solid-js';
import type { Vault, VaultPullResponse } from '@nori/shared';
import { connectSSE } from '../../../lib/sse';
import { SyncStatus } from './SyncStatus';
import { PullResults } from './PullResults';
import { ConflictResolver } from './ConflictResolver';

type PanelStep = 'status' | 'pulling' | 'results' | 'conflicts';

interface Props {
  vault: Vault;
  onClose: () => void;
}

export function VaultSyncPanel(props: Props) {
  const [step, setStep] = createSignal<PanelStep>('status');
  const [progressMessage, setProgressMessage] = createSignal('');
  const [filesChanged, setFilesChanged] = createSignal(0);
  const [hasConflicts, setHasConflicts] = createSignal(false);
  const [conflictFiles, setConflictFiles] = createSignal<string[]>([]);
  const [warnings, setWarnings] = createSignal<string[]>([]);
  const [error, setError] = createSignal('');

  function handlePull() {
    setStep('pulling');
    setProgressMessage('Starting pull...');
    setError('');
    setWarnings([]);

    connectSSE(`/api/vault/${props.vault.id}/pull`, {}, {
      onEvent: (event, eventData) => {
        const messages: Record<string, string> = {
          'vault:pull:started': 'Starting pull...',
          'vault:pull:validating-config': 'Validating configuration...',
          'vault:pull:checking-local-changes': 'Checking local changes...',
          'vault:pull:fetching': 'Fetching from remote...',
          'vault:pull:detecting-conflicts': 'Detecting conflicts...',
          'vault:pull:merging': 'Merging changes...',
          'vault:pull:updating-index': 'Updating search index...',
          'vault:pull:logging-event': 'Logging event...',
          'vault:pull:completed': 'Pull complete!',
        };
        setProgressMessage(messages[event] ?? event);

        if (event === 'vault:pull:conflicts-detected') {
          const data = eventData as { conflict_count?: number };
          if (data.conflict_count && data.conflict_count > 0) {
            setHasConflicts(true);
          }
        }

        if (event === 'vault:pull:merge-warning' || event === 'vault:pull:index-warning' || event === 'vault:pull:log-warning') {
          const data = eventData as { error?: string };
          if (data.error) {
            setWarnings((prev) => [...prev, data.error!]);
          }
        }
      },
      onResult: (data) => {
        const flowResult = data as { success: boolean; data?: VaultPullResponse; error?: { message: string } };
        if (flowResult.success && flowResult.data) {
          setFilesChanged(flowResult.data.files_changed ?? 0);
          setHasConflicts(flowResult.data.has_conflicts ?? false);
          setStep('results');
        } else {
          setError(flowResult.error?.message ?? 'Pull failed');
          setStep('status');
        }
      },
      onError: (errMsg) => {
        setError(errMsg);
        setStep('status');
      },
    });
  }

  function handlePush() {
    // Push is triggered via connectSSE to /api/vault/:id/push
    // For now, this is a placeholder — push flow follows a similar pattern
    connectSSE(`/api/vault/${props.vault.id}/push`, {}, {
      onEvent: () => {},
      onResult: () => { setStep('status'); },
      onError: (errMsg) => { setError(errMsg); setStep('status'); },
    });
  }

  return (
    <div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
      {error() && (
        <div class="mb-4 p-3 rounded-md bg-[var(--color-error)]/10 border border-[var(--color-error)]/20">
          <p class="text-sm text-[var(--color-error)]">{error()}</p>
        </div>
      )}

      <Switch>
        <Match when={step() === 'status'}>
          <SyncStatus
            vault={props.vault}
            onPull={handlePull}
            onPush={handlePush}
            onClose={props.onClose}
          />
        </Match>

        <Match when={step() === 'pulling'}>
          <div class="py-8 text-center space-y-4">
            <div class="inline-block w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
            <p class="text-sm text-[var(--color-text-muted)]">{progressMessage()}</p>
          </div>
        </Match>

        <Match when={step() === 'results'}>
          <PullResults
            filesChanged={filesChanged()}
            hasConflicts={hasConflicts()}
            warnings={warnings()}
            onDone={() => setStep('status')}
            onViewConflicts={() => setStep('conflicts')}
          />
        </Match>

        <Match when={step() === 'conflicts'}>
          <ConflictResolver
            conflictFiles={conflictFiles()}
            vaultPath={props.vault.local_path}
            onDone={() => setStep('results')}
          />
        </Match>
      </Switch>
    </div>
  );
}
