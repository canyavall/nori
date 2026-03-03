import { createSignal, onMount, onCleanup } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import type { Vault } from '@nori/shared';
import { apiGet } from '../../../lib/api';
import { vaults, setVaults, setRegistrationOpen, registrationOpen, updateVault } from '../../../stores/vault.store';
import { connectSSE } from '../../../lib/sse';

export type SyncStep = 'status' | 'pulling' | 'pushing' | 'pull-results' | 'push-results' | 'conflicts';

export const useVaultListSection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = createSignal(true);
  const [syncVaultId, setSyncVaultId] = createSignal<string | null>(null);
  const [syncStep, setSyncStep] = createSignal<SyncStep>('status');
  const [progressMessage, setProgressMessage] = createSignal('');
  const [syncError, setSyncError] = createSignal('');
  const [pullFilesChanged, setPullFilesChanged] = createSignal(0);
  const [pullHasConflicts, setPullHasConflicts] = createSignal(false);
  const [pullWarnings, setPullWarnings] = createSignal<string[]>([]);
  const [pullConflictFiles, setPullConflictFiles] = createSignal<string[]>([]);
  const [pushFilesPushed, setPushFilesPushed] = createSignal(0);
  const [pushCommitHash, setPushCommitHash] = createSignal('');

  let sseController: AbortController | undefined;

  onCleanup(() => {
    sseController?.abort();
  });

  onMount(async () => {
    try {
      const res = await apiGet<{ data: Vault[] }>('/api/vault');
      setVaults(res.data);
    } catch {
      // Will show empty state
    }
    setLoading(false);
  });

  function handleSelectVault(vault: Vault) {
    navigate(`/vaults/${vault.id}`);
  }

  function openSync(vaultId: string) {
    sseController?.abort();
    setSyncVaultId(vaultId);
    setSyncStep('status');
    setSyncError('');
  }

  function closeSync() {
    sseController?.abort();
    setSyncVaultId(null);
    setSyncStep('status');
    setSyncError('');
  }

  function handlePull(vault: Vault) {
    setSyncStep('pulling');
    setProgressMessage('Starting pull...');
    setSyncError('');
    setPullWarnings([]);
    setPullFilesChanged(0);
    setPullHasConflicts(false);
    setPullConflictFiles([]);

    sseController = connectSSE(`/api/vault/${vault.id}/pull`, {}, {
      onEvent: (event, eventData) => {
        const messages: Record<string, string> = {
          'vault:pull:started': 'Starting pull...',
          'vault:pull:validating-config': 'Validating configuration...',
          'vault:pull:checking-local-changes': 'Checking local changes...',
          'vault:pull:fetching': 'Fetching from remote...',
          'vault:pull:detecting-conflicts': 'Detecting conflicts...',
          'vault:pull:merging': 'Merging changes...',
          'vault:pull:updating-index': 'Updating index...',
          'vault:pull:completed': 'Pull complete!',
        };
        setProgressMessage(messages[event] ?? event);

        if (event === 'vault:pull:conflicts-detected') {
          const count = typeof eventData.conflict_count === 'number' ? eventData.conflict_count : 0;
          setPullConflictFiles((prev) => [...prev, `${count} conflicting file(s)`]);
        }

        if (event === 'vault:pull:merge-warning' || event === 'vault:pull:index-warning' || event === 'vault:pull:log-warning') {
          const msg = typeof eventData.error === 'string' ? eventData.error : undefined;
          if (msg) setPullWarnings((prev) => [...prev, msg]);
        }
      },
      onResult: (resultData) => {
        interface VaultPullResult {
          success: boolean;
          data?: { files_changed: number; has_conflicts: boolean };
          error?: { message: string };
        }
        const isPullResult = (d: unknown): d is VaultPullResult =>
          typeof d === 'object' && d !== null && 'success' in d;

        if (!isPullResult(resultData)) return;

        if (resultData.success && resultData.data) {
          setPullFilesChanged(resultData.data.files_changed);
          setPullHasConflicts(resultData.data.has_conflicts);
          updateVault(vault.id, { last_synced_at: new Date().toISOString() });
          setSyncStep('pull-results');
        } else {
          setSyncError(resultData.error?.message ?? 'Pull failed');
          setSyncStep('status');
        }
      },
      onError: (errMsg) => {
        setSyncError(errMsg);
        setSyncStep('status');
      },
    });
  }

  function handlePush(vault: Vault) {
    setSyncStep('pushing');
    setProgressMessage('Starting push...');
    setSyncError('');
    setPushFilesPushed(0);
    setPushCommitHash('');

    sseController = connectSSE(`/api/vault/${vault.id}/push`, {}, {
      onEvent: (event) => {
        const messages: Record<string, string> = {
          'vault:push:started': 'Starting push...',
          'vault:push:validating-config': 'Validating configuration...',
          'vault:push:checking-changes': 'Checking for changes...',
          'vault:push:no-changes': 'No changes to push.',
          'vault:push:staging': 'Staging changes...',
          'vault:push:committing': 'Creating commit...',
          'vault:push:pushing': 'Pushing to remote...',
          'vault:push:completed': 'Push complete!',
        };
        setProgressMessage(messages[event] ?? event);
      },
      onResult: (resultData) => {
        interface VaultPushResult {
          success: boolean;
          data?: { commit_hash: string; files_pushed: number };
          error?: { message: string };
        }
        const isPushResult = (d: unknown): d is VaultPushResult =>
          typeof d === 'object' && d !== null && 'success' in d;

        if (!isPushResult(resultData)) return;

        if (resultData.success && resultData.data) {
          setPushFilesPushed(resultData.data.files_pushed);
          setPushCommitHash(resultData.data.commit_hash);
          updateVault(vault.id, { last_synced_at: new Date().toISOString() });
          setSyncStep('push-results');
        } else {
          setSyncError(resultData.error?.message ?? 'Push failed');
          setSyncStep('status');
        }
      },
      onError: (errMsg) => {
        setSyncError(errMsg);
        setSyncStep('status');
      },
    });
  }

  function handleSyncDone() {
    setSyncStep('status');
  }

  function handleSyncToggle(e: MouseEvent, vault: Vault) {
    e.stopPropagation();
    if (syncVaultId() === vault.id) {
      closeSync();
    } else {
      openSync(vault.id);
    }
  }

  return {
    loading,
    syncVaultId,
    setSyncVaultId,
    syncStep,
    setSyncStep,
    progressMessage,
    syncError,
    pullFilesChanged,
    pullHasConflicts,
    pullWarnings,
    pullConflictFiles,
    pushFilesPushed,
    pushCommitHash,
    vaults,
    registrationOpen,
    setRegistrationOpen,
    openSync,
    closeSync,
    handlePull,
    handlePush,
    handleSyncDone,
    handleSyncToggle,
    handleSelectVault,
  };
};
