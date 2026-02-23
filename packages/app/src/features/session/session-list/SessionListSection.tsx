import { For, Match, Show, Switch } from 'solid-js';
import type { Component } from 'solid-js';
import { SessionList } from '../session-browser/SessionList/SessionList';
import { SessionDetail } from '../session-browser/SessionDetail/SessionDetail';
import { useSessionListSection } from './SessionListSection.hook';

export const SessionListSection: Component = () => {
  const {
    step,
    selectedSession,
    error,
    actionLoading,
    selectedVaultId,
    setSelectedVaultId,
    sessionTitle,
    setSessionTitle,
    effectiveVaultId,
    sessions,
    vaults,
    handleSelect,
    handleBack,
    handleCreateNew,
    handleCreateWithVault,
    handleCancelCreate,
    handleResume,
    handleArchive,
  } = useSessionListSection();

  return (
    <div class="p-6 max-w-3xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold">Sessions</h2>
      </div>

      <Switch>
        {/* Loading */}
        <Match when={step() === 'loading'}>
          <div class="text-center py-16 text-[var(--color-text-muted)]">Loading...</div>
        </Match>

        {/* Session list */}
        <Match when={step() === 'list'}>
          <Show when={error()}>
            <div class="p-3 rounded-md bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 mb-4">
              <p class="text-sm text-[var(--color-error)]">{error()}</p>
            </div>
          </Show>
          <SessionList
            sessions={sessions()}
            onSelect={handleSelect}
            onCreateNew={handleCreateNew}
            createDisabled={vaults().length === 0}
          />
        </Match>

        {/* Vault picker for create (multi-vault) */}
        <Match when={step() === 'create-vault-pick'}>
          <div class="space-y-4">
            <button
              type="button"
              onClick={handleCancelCreate}
              class="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              &larr; Back to Sessions
            </button>

            <h3 class="text-lg font-semibold">New Session</h3>

            <div>
              <label class="block text-sm font-medium mb-1" for="sc-vault">Vault</label>
              <select
                id="sc-vault"
                value={selectedVaultId()}
                onChange={(e) => setSelectedVaultId(e.currentTarget.value)}
                class="w-full px-3 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
              >
                <option value="">Select vault...</option>
                <For each={vaults()}>
                  {(vault) => <option value={vault.id}>{vault.name}</option>}
                </For>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1" for="sc-title">Title (optional)</label>
              <input
                id="sc-title"
                type="text"
                value={sessionTitle()}
                onInput={(e) => setSessionTitle(e.currentTarget.value)}
                placeholder="Session title"
                class="w-full px-3 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancelCreate}
                class="px-4 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!effectiveVaultId()}
                onClick={handleCreateWithVault}
                class="px-4 py-2 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Session
              </button>
            </div>
          </div>
        </Match>

        {/* Creating spinner */}
        <Match when={step() === 'creating'}>
          <div class="py-12 text-center space-y-4">
            <div class="inline-block w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
            <p class="text-sm text-[var(--color-text-muted)]">Creating session...</p>
          </div>
        </Match>

        {/* Session detail */}
        <Match when={step() === 'detail' && selectedSession()}>
          <Show when={selectedSession()} keyed>
            {(session) => (
              <SessionDetail
                session={session}
                error={error()}
                actionLoading={actionLoading()}
                onResume={handleResume}
                onArchive={handleArchive}
                onBack={handleBack}
              />
            )}
          </Show>
        </Match>
      </Switch>
    </div>
  );
}
