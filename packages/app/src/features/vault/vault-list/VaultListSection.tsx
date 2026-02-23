import { For, Show } from 'solid-js';
import type { Component } from 'solid-js';
import { VaultRegistrationDialog } from '../vault-registration/VaultRegistrationDialog/VaultRegistrationDialog';
import { VaultLinkProjectDialog } from '../vault-link-project/VaultLinkProjectDialog/VaultLinkProjectDialog';
import { VaultKnowledgeTree } from '../vault-knowledge-tree/VaultKnowledgeTree/VaultKnowledgeTree';
import { VaultRow } from './components/VaultRow/VaultRow';
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
                {(vault) => (
                  <VaultRow
                    vault={vault}
                    activeVault={activeVault}
                    syncVaultId={syncVaultId}
                    syncStep={syncStep}
                    setSyncStep={setSyncStep}
                    syncError={syncError}
                    progressMessage={progressMessage}
                    pullFilesChanged={pullFilesChanged}
                    pullHasConflicts={pullHasConflicts}
                    pullWarnings={pullWarnings}
                    pullConflictFiles={pullConflictFiles}
                    pushFilesPushed={pushFilesPushed}
                    pushCommitHash={pushCommitHash}
                    closeSync={closeSync}
                    handlePull={handlePull}
                    handlePush={handlePush}
                    handleSyncDone={handleSyncDone}
                    handleLinkProject={handleLinkProject}
                    handleSyncToggle={handleSyncToggle}
                    selectVault={selectVault}
                  />
                )}
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
