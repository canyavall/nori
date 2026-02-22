import { createSignal, createMemo, For, Show, onMount, onCleanup } from 'solid-js';
import type { Vault } from '@nori/shared';
import { apiGet } from '../lib/api';
import { vaults, setVaults, setRegistrationOpen, registrationOpen, updateVault } from '../stores/vault.store';
import { VaultRegistrationDialog } from '../features/vault/vault-registration/VaultRegistrationDialog';
import { VaultLinkProjectDialog } from '../features/vault/vault-link-project/VaultLinkProjectDialog';
import { connectSSE } from '../lib/sse';
import { SyncStatus } from '../features/vault/vault-sync-panel/SyncStatus';
import { PullResults } from '../features/vault/vault-sync-panel/PullResults';
import { PushResults } from '../features/vault/vault-sync-panel/PushResults';
import { ConflictResolver } from '../features/vault/vault-sync-panel/ConflictResolver';
import { selectVault, activeVault, activeProject } from '../stores/navigation.store';

type SyncStep = 'status' | 'pulling' | 'pushing' | 'pull-results' | 'push-results' | 'conflicts';

export function VaultsPage() {
  const [loading, setLoading] = createSignal(true);
  const [linkProjectOpen, setLinkProjectOpen] = createSignal(false);
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

  const displayVaults = createMemo(() => {
    const proj = activeProject();
    if (!proj) return vaults();
    return vaults().filter((v) => proj.connected_vaults.includes(v.id));
  });

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
          const d = eventData as { conflict_count?: number };
          setPullConflictFiles((prev) => [...prev, `${d.conflict_count ?? 0} conflicting file(s)`]);
        }

        if (event === 'vault:pull:merge-warning' || event === 'vault:pull:index-warning' || event === 'vault:pull:log-warning') {
          const msg = (eventData as { error?: string }).error;
          if (msg) setPullWarnings((prev) => [...prev, msg]);
        }
      },
      onResult: (resultData) => {
        const flowResult = resultData as {
          success: boolean;
          data?: { files_changed: number; has_conflicts: boolean };
          error?: { message: string };
        };

        if (flowResult.success && flowResult.data) {
          setPullFilesChanged(flowResult.data.files_changed);
          setPullHasConflicts(flowResult.data.has_conflicts);
          updateVault(vault.id, { last_synced_at: new Date().toISOString() });
          setSyncStep('pull-results');
        } else {
          setSyncError(flowResult.error?.message ?? 'Pull failed');
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
        const flowResult = resultData as {
          success: boolean;
          data?: { commit_hash: string; files_pushed: number };
          error?: { message: string };
        };

        if (flowResult.success && flowResult.data) {
          setPushFilesPushed(flowResult.data.files_pushed);
          setPushCommitHash(flowResult.data.commit_hash);
          updateVault(vault.id, { last_synced_at: new Date().toISOString() });
          setSyncStep('push-results');
        } else {
          setSyncError(flowResult.error?.message ?? 'Push failed');
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

  return (
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-semibold">Vaults</h2>
          <Show when={activeProject()}>
            {(proj) => (
              <p class="text-sm text-[var(--color-text-muted)] mt-0.5">
                Linked to <span class="font-medium text-[var(--color-text)]">{proj().name}</span>
                {' '}· {displayVaults().length} vault{displayVaults().length !== 1 ? 's' : ''}
              </p>
            )}
          </Show>
        </div>
        <button
          onClick={() => setRegistrationOpen(true)}
          class="px-4 py-2 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          Register Vault
        </button>
      </div>

      <Show
        when={!loading()}
        fallback={
          <div class="text-center py-16 text-[var(--color-text-muted)]">Loading...</div>
        }
      >
      <Show
        when={displayVaults().length > 0}
        fallback={
          <div class="text-center py-16 text-[var(--color-text-muted)]">
            <Show
              when={activeProject()}
              fallback={
                <>
                  <p class="text-lg mb-2">No vaults registered</p>
                  <p class="text-sm">Register a vault to get started with knowledge management.</p>
                </>
              }
            >
              <p class="text-lg mb-2">No vaults linked</p>
              <p class="text-sm">This project has no vaults connected yet.</p>
            </Show>
          </div>
        }
      >
        <div class="space-y-4">
          <For each={displayVaults()}>
            {(vault) => (
              <div
                class={`rounded-lg border bg-[var(--color-bg-secondary)] transition-colors ${
                  activeVault()?.id === vault.id
                    ? 'border-[var(--color-accent)]'
                    : 'border-[var(--color-border)]'
                }`}
              >
                <div
                  class="p-4 cursor-pointer"
                  onClick={() => selectVault(vault)}
                >
                  <div class="flex items-start justify-between">
                    <div>
                      <h3 class="font-medium mb-1">{vault.name}</h3>
                      <p class="text-sm text-[var(--color-text-muted)] truncate">{vault.git_url}</p>
                      <div class="mt-2 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                        <span class="px-2 py-0.5 rounded bg-[var(--color-bg-tertiary)]">{vault.branch}</span>
                        <Show when={vault.last_synced_at}>
                          <span>Synced {new Date(vault.last_synced_at!).toLocaleDateString()}</span>
                        </Show>
                      </div>
                    </div>
                    <div class="flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setLinkProjectOpen(true); }}
                        class="px-3 py-1.5 rounded-md text-xs text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                      >
                        Link Project
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); syncVaultId() === vault.id ? closeSync() : openSync(vault.id); }}
                        class="px-3 py-1.5 rounded-md text-xs text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                      >
                        {syncVaultId() === vault.id ? 'Close' : 'Sync'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sync panel */}
                <Show when={syncVaultId() === vault.id}>
                  <div class="border-t border-[var(--color-border)] p-4">
                    <Show when={syncError()}>
                      <div class="p-3 rounded-md bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 mb-4">
                        <p class="text-sm text-[var(--color-error)]">{syncError()}</p>
                      </div>
                    </Show>

                    <Show when={syncStep() === 'status'}>
                      <SyncStatus
                        vault={vault}
                        onPull={() => handlePull(vault)}
                        onPush={() => handlePush(vault)}
                        onClose={closeSync}
                      />
                    </Show>

                    <Show when={syncStep() === 'pulling' || syncStep() === 'pushing'}>
                      <div class="py-8 text-center space-y-4">
                        <div class="inline-block w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                        <p class="text-sm text-[var(--color-text-muted)]">{progressMessage()}</p>
                      </div>
                    </Show>

                    <Show when={syncStep() === 'pull-results'}>
                      <PullResults
                        filesChanged={pullFilesChanged()}
                        hasConflicts={pullHasConflicts()}
                        warnings={pullWarnings()}
                        onDone={handleSyncDone}
                        onViewConflicts={pullHasConflicts() ? () => setSyncStep('conflicts') : undefined}
                      />
                    </Show>

                    <Show when={syncStep() === 'push-results'}>
                      <PushResults
                        filesPushed={pushFilesPushed()}
                        commitHash={pushCommitHash()}
                        onDone={handleSyncDone}
                      />
                    </Show>

                    <Show when={syncStep() === 'conflicts'}>
                      <ConflictResolver
                        conflictFiles={pullConflictFiles()}
                        vaultPath={vault.local_path}
                        onDone={handleSyncDone}
                      />
                    </Show>
                  </div>
                </Show>
              </div>
            )}
          </For>
        </div>
      </Show>
      </Show>

      <Show when={registrationOpen()}>
        <VaultRegistrationDialog />
      </Show>

      <Show when={linkProjectOpen()}>
        <VaultLinkProjectDialog onClose={() => setLinkProjectOpen(false)} />
      </Show>
    </div>
  );
}
