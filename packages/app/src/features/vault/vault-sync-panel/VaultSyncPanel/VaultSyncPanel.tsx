import { createSignal } from 'solid-js';
import { Match, Switch } from 'solid-js';
import { apiPost } from '../../../../lib/api';
import { SyncStatus } from '../SyncStatus/SyncStatus';
import { PullResults } from '../PullResults/PullResults';
import { PushResults } from '../PushResults/PushResults';
import { ConflictResolver } from '../ConflictResolver/ConflictResolver';
import type { VaultSyncPanelProps, PanelStep } from './VaultSyncPanel.type';

export const VaultSyncPanel = (props: VaultSyncPanelProps) => {
  const [step, setStep] = createSignal<PanelStep>('status');
  const [pulling, setPulling] = createSignal(false);
  const [pullResult, setPullResult] = createSignal<{
    filesChanged: number;
    hasConflicts: boolean;
    warnings: string[];
    conflictFiles: string[];
  } | null>(null);
  const [pushResult, setPushResult] = createSignal<{
    filesPushed: number;
    commitHash: string;
  } | null>(null);

  const handlePull = async () => {
    setPulling(true);
    setStep('pulling');
    try {
      const result = await apiPost<{
        data: {
          files_changed: number;
          has_conflicts: boolean;
          warnings: string[];
          conflict_files: string[];
        };
      }>(`/api/vault/${props.vault.id}/pull`, {});
      setPullResult({
        filesChanged: result.data.files_changed,
        hasConflicts: result.data.has_conflicts,
        warnings: result.data.warnings ?? [],
        conflictFiles: result.data.conflict_files ?? [],
      });
      setStep('results');
    } catch {
      setStep('status');
    } finally {
      setPulling(false);
    }
  };

  const handlePush = async () => {
    try {
      const result = await apiPost<{
        data: { files_pushed: number; commit_hash: string };
      }>(`/api/vault/${props.vault.id}/push`, {});
      setPushResult({
        filesPushed: result.data.files_pushed,
        commitHash: result.data.commit_hash,
      });
      setStep('push_results');
    } catch {
      setStep('status');
    }
  };

  return (
    <div class="p-4">
      <Switch>
        <Match when={step() === 'status' || step() === 'pulling'}>
          <SyncStatus
            vault={props.vault}
            onPull={handlePull}
            onPush={handlePush}
            onClose={props.onClose}
          />
        </Match>
        <Match when={step() === 'results'}>
          <PullResults
            filesChanged={pullResult()?.filesChanged ?? 0}
            hasConflicts={pullResult()?.hasConflicts ?? false}
            warnings={pullResult()?.warnings ?? []}
            onDone={() => setStep('status')}
            onViewConflicts={() => setStep('conflicts')}
          />
        </Match>
        <Match when={step() === 'conflicts'}>
          <ConflictResolver
            conflictFiles={pullResult()?.conflictFiles ?? []}
            vaultPath={props.vault.local_path}
            onDone={() => setStep('results')}
          />
        </Match>
        <Match when={step() === 'push_results'}>
          <PushResults
            filesPushed={pushResult()?.filesPushed ?? 0}
            commitHash={pushResult()?.commitHash ?? ''}
            onDone={() => setStep('status')}
          />
        </Match>
      </Switch>
    </div>
  );
};
