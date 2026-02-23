import { Show } from 'solid-js';
import type { Component } from 'solid-js';
import { SyncStatus } from '../../../vault-sync-panel/SyncStatus/SyncStatus';
import { PullResults } from '../../../vault-sync-panel/PullResults/PullResults';
import { PushResults } from '../../../vault-sync-panel/PushResults/PushResults';
import { ConflictResolver } from '../../../vault-sync-panel/ConflictResolver/ConflictResolver';
import { VaultCard } from '../VaultCard/VaultCard';
import type { VaultRowProps } from './VaultRow.type';

export const VaultRow: Component<VaultRowProps> = (props) => {
  const vault = props.vault;

  return (
    <div class={`rounded-lg border bg-[var(--color-bg-secondary)] overflow-hidden ${
      props.activeVault()?.id === vault.id
        ? 'border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]'
        : 'border-[var(--color-border)]'
    }`}>
      <VaultCard
        vault={vault}
        isSelected={!!(props.activeVault()?.id === vault.id)}
        onSelect={() => props.selectVault(vault)}
        onLinkProject={props.handleLinkProject}
        onSync={(e) => props.handleSyncToggle(e, vault)}
        syncOpen={props.syncVaultId() === vault.id}
      />

      {/* Sync panel */}
      <Show when={props.syncVaultId() === vault.id}>
        <div class="border-t border-[var(--color-border)] p-4">
          <Show when={props.syncError()}>
            <div class="p-3 rounded-md bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 mb-4">
              <p class="text-sm text-[var(--color-error)]">{props.syncError()}</p>
            </div>
          </Show>

          <Show when={props.syncStep() === 'status'}>
            <SyncStatus
              vault={vault}
              onPull={() => props.handlePull(vault)}
              onPush={() => props.handlePush(vault)}
              onClose={props.closeSync}
            />
          </Show>

          <Show when={props.syncStep() === 'pulling' || props.syncStep() === 'pushing'}>
            <div class="py-8 text-center space-y-4">
              <div class="inline-block w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
              <p class="text-sm text-[var(--color-text-muted)]">{props.progressMessage()}</p>
            </div>
          </Show>

          <Show when={props.syncStep() === 'pull-results'}>
            <PullResults
              filesChanged={props.pullFilesChanged()}
              hasConflicts={props.pullHasConflicts()}
              warnings={props.pullWarnings()}
              onDone={props.handleSyncDone}
              onViewConflicts={props.pullHasConflicts() ? () => props.setSyncStep('conflicts') : undefined}
            />
          </Show>

          <Show when={props.syncStep() === 'push-results'}>
            <PushResults
              filesPushed={props.pushFilesPushed()}
              commitHash={props.pushCommitHash()}
              onDone={props.handleSyncDone}
            />
          </Show>

          <Show when={props.syncStep() === 'conflicts'}>
            <ConflictResolver
              conflictFiles={props.pullConflictFiles()}
              vaultPath={vault.local_path}
              onDone={props.handleSyncDone}
            />
          </Show>
        </div>
      </Show>
    </div>
  );
};
