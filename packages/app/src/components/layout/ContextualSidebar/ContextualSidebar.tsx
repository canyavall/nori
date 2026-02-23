import { Show, For } from 'solid-js';
import { A } from '@solidjs/router';
import { VaultKnowledgeImportDialog } from '../../../features/vault/vault-knowledge-import/VaultKnowledgeImportDialog';
import { VaultKnowledgeExportDialog } from '../../../features/vault/vault-knowledge-export/VaultKnowledgeExportDialog';
import { ProjectPicker } from '../../../features/vault/vault-link-project/ProjectPicker/ProjectPicker';
import { useContextualSidebar } from './ContextualSidebar.hook';

export const ContextualSidebar = () => {
  const {
    linkedVaults,
    links,
    linksLoading,
    handleUnlink,
    addProjectOpen,
    setAddProjectOpen,
    addProjectError,
    setAddProjectError,
    addProjectLoading,
    importOpen,
    setImportOpen,
    exportOpen,
    setExportOpen,
    handleAddProject,
    handleContextBack,
    sidebarContext,
    activeContextName,
    activeVault,
  } = useContextualSidebar();

  return (
    <aside class="w-52 flex-shrink-0 border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex flex-col">
      <header class="px-4 py-3 border-b border-[var(--color-border)]">
        <p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">
          {sidebarContext() === 'project' ? 'Project' : 'Vault'}
        </p>
        <button
          type="button"
          onClick={handleContextBack}
          class="text-sm font-medium truncate mt-0.5 text-left w-full hover:text-[var(--color-accent)] transition-colors"
          title="Back to list"
        >
          {activeContextName()}
        </button>
      </header>

      <nav class="p-2 space-y-1">
        <Show
          when={sidebarContext() === 'project'}
          fallback={
            <>
              <A
                href="/knowledge"
                class="block px-3 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                activeClass="!text-[var(--color-text)] bg-[var(--color-bg-tertiary)]"
              >
                Knowledge
              </A>

              <div class="px-3 pt-2 pb-1">
                <div class="flex items-center justify-between mb-1.5">
                  <p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">Linked Projects</p>
                  <button
                    type="button"
                    onClick={() => { setAddProjectError(''); setAddProjectOpen(true); }}
                    class="text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
                    title="Link a project"
                  >
                    + Add
                  </button>
                </div>

                <Show when={linksLoading()}>
                  <p class="text-xs text-[var(--color-text-muted)] italic">Loading...</p>
                </Show>

                <Show when={!linksLoading()}>
                  <Show
                    when={links().length > 0}
                    fallback={<p class="text-xs text-[var(--color-text-muted)] italic">None linked</p>}
                  >
                    <For each={links()}>
                      {(link) => (
                        <div class="flex items-center justify-between gap-1 py-0.5 group">
                          <p class="text-xs text-[var(--color-text)] truncate flex-1" title={link.project_path}>
                            · {link.project_path.split('/').pop() ?? link.project_path}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleUnlink(link.id)}
                            class="text-xs text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-error)] transition-all"
                            title={`Unlink ${link.project_path}`}
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </For>
                  </Show>
                </Show>

                <Show when={addProjectOpen()}>
                  <div class="mt-2 border-t border-[var(--color-border)] pt-2">
                    <ProjectPicker
                      vaultName={activeVault()?.name ?? ''}
                      onSelect={handleAddProject}
                      onBack={() => setAddProjectOpen(false)}
                    />
                    <Show when={addProjectError()}>
                      <p class="mt-1 text-xs text-[var(--color-error)]">{addProjectError()}</p>
                    </Show>
                    <Show when={addProjectLoading()}>
                      <p class="mt-1 text-xs text-[var(--color-text-muted)]">Linking...</p>
                    </Show>
                  </div>
                </Show>
              </div>

              <button
                type="button"
                onClick={() => setImportOpen(true)}
                class="block w-full text-left px-3 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
              >
                Import Knowledge
              </button>

              <button
                type="button"
                onClick={() => setExportOpen(true)}
                class="block w-full text-left px-3 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
              >
                Export Knowledge
              </button>
            </>
          }
        >
          <div class="px-3 pt-1 pb-2">
            <p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">Linked Vaults</p>
            <Show
              when={linkedVaults().length > 0}
              fallback={
                <p class="text-xs text-[var(--color-text-muted)] italic">None linked</p>
              }
            >
              <For each={linkedVaults()}>
                {(vault) => (
                  <p class="text-xs text-[var(--color-text)] truncate py-0.5">· {vault.name}</p>
                )}
              </For>
            </Show>
          </div>

          <A
            href="/sessions"
            class="block px-3 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
            activeClass="!text-[var(--color-text)] bg-[var(--color-bg-tertiary)]"
          >
            Sessions
          </A>
        </Show>
      </nav>

      <Show when={activeVault()} keyed>
        {(vault) => (
          <>
            <Show when={importOpen()}>
              <VaultKnowledgeImportDialog vault={vault} onClose={() => setImportOpen(false)} />
            </Show>
            <Show when={exportOpen()}>
              <VaultKnowledgeExportDialog vault={vault} onClose={() => setExportOpen(false)} />
            </Show>
          </>
        )}
      </Show>
    </aside>
  );
};
