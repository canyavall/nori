import { createSignal, createMemo, Show, For, Match, Switch, onMount } from 'solid-js';
import type { Session } from '@nori/shared';
import { apiGet, apiPost } from '../lib/api';
import { sessions, setSessions, addSession, updateSession } from '../stores/session.store';
import { vaults } from '../stores/vault.store';
import { activeVault, activeProject } from '../stores/navigation.store';
import { SessionList } from '../features/session/session-browser/SessionList';
import { SessionDetail } from '../features/session/session-browser/SessionDetail';

type PageStep = 'loading' | 'list' | 'detail' | 'creating' | 'create-vault-pick';

export function SessionsPage() {
  const [step, setStep] = createSignal<PageStep>('loading');
  const [selectedSession, setSelectedSession] = createSignal<Session | null>(null);
  const [error, setError] = createSignal('');
  const [actionLoading, setActionLoading] = createSignal(false);
  const [selectedVaultId, setSelectedVaultId] = createSignal('');
  const [sessionTitle, setSessionTitle] = createSignal('');

  const effectiveVaultId = createMemo(() => {
    const navVault = activeVault();
    if (navVault) return navVault.id;
    const proj = activeProject();
    if (proj?.connected_vaults.length) return proj.connected_vaults[0];
    const v = vaults();
    if (v.length === 1) return v[0].id;
    return selectedVaultId();
  });

  onMount(async () => {
    try {
      const res = await apiGet<{ data: Session[] }>('/api/session');
      setSessions(res.data);
    } catch {
      // Will show empty state
    }
    setStep('list');
  });

  function handleSelect(session: Session) {
    setSelectedSession(session);
    setError('');
    setStep('detail');
  }

  function handleBack() {
    setSelectedSession(null);
    setError('');
    setStep('list');
  }

  function handleCreateNew() {
    setError('');
    setSessionTitle('');
    if (vaults().length > 1 && !effectiveVaultId()) {
      setStep('create-vault-pick');
    } else if (effectiveVaultId()) {
      doCreateSession(effectiveVaultId());
    }
  }

  function handleCreateWithVault() {
    if (effectiveVaultId()) {
      doCreateSession(effectiveVaultId());
    }
  }

  async function doCreateSession(vaultId: string) {
    setStep('creating');
    setError('');

    try {
      const res = await apiPost<{ data: { id: string; title: string } }>('/api/session', {
        vault_id: vaultId,
        title: sessionTitle() || undefined,
      });

      const newSession: Session = {
        id: res.data.id,
        vault_id: vaultId,
        title: res.data.title,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      addSession(newSession);
      setSelectedSession(newSession);
      setStep('detail');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
      setStep('list');
    }
  }

  async function handleResume() {
    const session = selectedSession();
    if (!session) return;

    setActionLoading(true);
    setError('');

    try {
      const res = await apiPost<{ data: { id: string; title: string; status: string } }>(
        `/api/session/${session.id}/resume`,
        {}
      );

      updateSession(session.id, { status: 'active', updated_at: new Date().toISOString() });
      setSelectedSession({ ...session, status: 'active', updated_at: new Date().toISOString() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume session');
    }
    setActionLoading(false);
  }

  async function handleArchive() {
    const session = selectedSession();
    if (!session) return;

    setActionLoading(true);
    setError('');

    try {
      await apiPost<{ data: { id: string; status: string } }>(
        `/api/session/${session.id}/archive`,
        {}
      );

      updateSession(session.id, { status: 'archived', updated_at: new Date().toISOString() });
      setSelectedSession({ ...session, status: 'archived', updated_at: new Date().toISOString() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive session');
    }
    setActionLoading(false);
  }

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
              onClick={() => setStep('list')}
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
                onClick={() => setStep('list')}
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
          <SessionDetail
            session={selectedSession()!}
            error={error()}
            actionLoading={actionLoading()}
            onResume={handleResume}
            onArchive={handleArchive}
            onBack={handleBack}
          />
        </Match>
      </Switch>
    </div>
  );
}
