import { For, Show } from 'solid-js';
import type { Component } from 'solid-js';
import type { Vault } from '@nori/shared';
import { VaultRegistrationDialog } from '../vault-registration/VaultRegistrationDialog/VaultRegistrationDialog';
import { VaultLinkProjectDialog } from '../vault-link-project/VaultLinkProjectDialog/VaultLinkProjectDialog';
import { VaultKnowledgeTree } from '../vault-knowledge-tree/VaultKnowledgeTree/VaultKnowledgeTree';
import { SyncStatus } from '../vault-sync-panel/SyncStatus/SyncStatus';
import { PullResults } from '../vault-sync-panel/PullResults/PullResults';
import { PushResults } from '../vault-sync-panel/PushResults/PushResults';
import { ConflictResolver } from '../vault-sync-panel/ConflictResolver/ConflictResolver';
import { VaultCard } from './components/VaultCard/VaultCard';
import { useVaultListSection } from './VaultListSection.hook';

export const VaultListSection: Component = () => {
  const {
    loading,
    linkProjectOpen,
    setLinkProjectOpen,
    syncVaultId,
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
    activeVault,
    closeSync,
    handlePull,
    handlePush,
    handleSyncDone,
    handleLinkProject,
    handleSyncToggle,
    selectVault,
  } = useVaultListSection();

  function renderVaultRow(vault: Vault) {
    return (
      <div class={`rounded-lg border bg-[var(--color-bg-secondary)] overflow-hidden ${
        activeVault()?.id === vault.id
          ? 'border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]'
          : 'border-[var(--color-border)]'
      }`}>
        <VaultCard
          vault={vault}
          isSelected={activeVault()?.id === vault.id}
          onSelect={() => selectVault(vault)}
          onLinkProject={handleLinkProject}
          onSync={(e) => handleSyncToggle(e, vault)}
          syncOpen={syncVaultId() === vault.id}
        />

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
    );
  }

  return (
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-semibold">Vaults</h2>
          <p class="text-sm text-[var(--color-text-muted)] mt-0.5">
            All registered vaults — register, sync, and link to projects
          </p>
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
          when={vaults().length > 0}
          fallback={
            <div class="text-center py-16 text-[var(--color-text-muted)]">
              <p class="text-lg mb-2">No vaults registered</p>
              <p class="text-sm">Register a vault to get started with knowledge management.</p>
            </div>
          }
        >
          {/* Vault selected → show knowledge tree only */}
          <Show when={activeVault()} keyed>
            {(vault) => <VaultKnowledgeTree vault={vault} />}
          </Show>

          {/* Grid view: no vault selected */}
          <Show when={!activeVault()}>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <For each={vaults()}>
                {(vault) => renderVaultRow(vault)}
              </For>
            </div>
          </Show>
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
};
