import { Show } from 'solid-js';
import type { Component } from 'solid-js';
import { A } from '@solidjs/router';
import { CategoryTree } from '../CategoryTree/CategoryTree';
import { KnowledgeDetailPanel } from '../../../knowledge/knowledge-detail/KnowledgeDetailPanel/KnowledgeDetailPanel';
import { KnowledgeCreateDialog } from '../../../knowledge/knowledge-create/KnowledgeCreateDialog/KnowledgeCreateDialog';
import { VaultLinkProjectDialog } from '../../vault-link-project/VaultLinkProjectDialog/VaultLinkProjectDialog';
import { VaultKnowledgeImportDialog } from '../../vault-knowledge-import/VaultKnowledgeImportDialog';
import { VaultKnowledgeExportDialog } from '../../vault-knowledge-export/VaultKnowledgeExportDialog';
import { VaultSettingsDialog } from '../../vault-settings/VaultSettingsDialog/VaultSettingsDialog';
import { useVaultDetailSection } from './VaultDetailSection.hook';
import type { VaultDetailSectionProps } from './VaultDetailSection.type';

export const VaultDetailSection: Component<VaultDetailSectionProps> = (props) => {
  const {
    vault,
    vaultLoading,
    vaultError,
    selectedEntryId,
    linkProjectOpen,
    setLinkProjectOpen,
    settingsOpen,
    setSettingsOpen,
    importOpen,
    setImportOpen,
    exportOpen,
    setExportOpen,
    createOpen,
    setCreateOpen,
    searchQuery,
    setSearchQuery,
    categorized,
    handleEntrySelected,
    handleEntrySaved,
  } = useVaultDetailSection(props);

  return (
    <div class="flex flex-col h-full">
      {/* Sub-header */}
      <div class="border-b border-[var(--color-border)] px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div class="flex items-center gap-3">
          <A
            href="/vaults"
            class="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
            title="Back to vaults"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </A>
          <Show when={vault()} keyed>
            {(v) => <h1 class="text-lg font-semibold">{v.name}</h1>}
          </Show>
          <Show when={vaultLoading()}>
            <span class="text-sm text-[var(--color-text-muted)]">Loading...</span>
          </Show>
          <Show when={vaultError()}>
            <span class="text-sm text-[var(--color-error)]">{vaultError()}</span>
          </Show>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLinkProjectOpen(true)}
            class="px-3 py-1.5 rounded-md border border-[var(--color-border)] text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
          >
            Link Projects
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            class="px-3 py-1.5 rounded-md border border-[var(--color-border)] text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
          >
            Vault Settings
          </button>
        </div>
      </div>

      {/* Body */}
      <div class="flex flex-1 min-h-0">
        {/* Left knowledge sidebar */}
        <aside class="w-72 border-r border-[var(--color-border)] flex flex-col flex-shrink-0">
          {/* Toolbar */}
          <div class="p-3 border-b border-[var(--color-border)] flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              class="px-2.5 py-1 rounded-md text-xs bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors flex-shrink-0"
            >
              + Create
            </button>
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              class="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
              title="Import Knowledge"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setExportOpen(true)}
              class="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
              title="Export Knowledge"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
              class="flex-1 px-2 py-1 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-xs text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] min-w-0"
            />
          </div>

          {/* Category tree */}
          <div class="flex-1 overflow-y-auto p-2">
            <CategoryTree
              categories={categorized()}
              onEditEntry={handleEntrySelected}
            />
          </div>
        </aside>

        {/* Main content */}
        <main class="flex-1 overflow-hidden">
          <Show
            when={selectedEntryId()}
            fallback={
              <div class="flex items-center justify-center h-full text-[var(--color-text-muted)]">
                <p class="text-sm">Select a knowledge entry from the sidebar</p>
              </div>
            }
          >
            <Show when={selectedEntryId()} keyed>
              {(entryId) => (
                <KnowledgeDetailPanel
                  entryId={entryId}
                  onSaved={handleEntrySaved}
                />
              )}
            </Show>
          </Show>
        </main>
      </div>

      {/* Dialogs */}
      <Show when={linkProjectOpen()}>
        <VaultLinkProjectDialog onClose={() => setLinkProjectOpen(false)} />
      </Show>

      <Show when={vault()} keyed>
        {(v) => (
          <>
            <Show when={createOpen()}>
              <KnowledgeCreateDialog vaultId={v.id} />
            </Show>
            <Show when={importOpen()}>
              <VaultKnowledgeImportDialog vault={v} onClose={() => setImportOpen(false)} />
            </Show>
            <Show when={exportOpen()}>
              <VaultKnowledgeExportDialog vault={v} onClose={() => setExportOpen(false)} />
            </Show>
            <Show when={settingsOpen()}>
              <VaultSettingsDialog vault={v} onClose={() => setSettingsOpen(false)} />
            </Show>
          </>
        )}
      </Show>
    </div>
  );
};
