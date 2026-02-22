import { createSignal, Match, Switch, onMount } from 'solid-js';
import type { Session } from '@nori/shared';
import { sessions, setSessions, addSession, setActiveSession } from '../../../stores/session.store';
import { apiGet, apiPost } from '../../../lib/api';
import { useNavigate } from '@solidjs/router';
import { SessionList } from './SessionList';
import { SessionDetail } from './SessionDetail';

type PageStep = 'loading' | 'list' | 'detail';

export function SessionBrowserPage() {
  const navigate = useNavigate();
  const [step, setStep] = createSignal<PageStep>('loading');
  const [selectedSession, setSelectedSession] = createSignal<Session | null>(null);
  const [error, setError] = createSignal('');
  const [actionLoading, setActionLoading] = createSignal(false);

  onMount(async () => {
    try {
      const res = await apiGet<{ data: Session[] }>('/api/session');
      setSessions(res.data);
      setStep('list');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
      setStep('list');
    }
  });

  function handleSelect(session: Session) {
    setSelectedSession(session);
    setError('');
    setStep('detail');
  }

  async function handleCreateNew() {
    setActionLoading(true);
    setError('');

    try {
      const res = await apiPost<{ data: { id: string; title: string } }>('/api/session', {
        vault_id: '',
        title: '',
      });
      const newSession: Session = {
        id: res.data.id,
        vault_id: '',
        title: res.data.title,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      addSession(newSession);
      setActiveSession(newSession);
      navigate(`/chat/${newSession.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResume() {
    const session = selectedSession();
    if (!session) return;

    setActionLoading(true);
    setError('');

    try {
      await apiPost(`/api/session/${session.id}/resume`, {});
      setActiveSession(session);
      navigate(`/chat/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume session');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleArchive() {
    const session = selectedSession();
    if (!session) return;

    setActionLoading(true);
    setError('');

    try {
      await apiPost(`/api/session/${session.id}/archive`, {});
      const updated = { ...session, status: 'archived' as const };
      setSelectedSession(updated);
      setSessions((prev) =>
        prev.map((s) => (s.id === session.id ? updated : s))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive session');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div class="max-w-2xl mx-auto">
      <Switch>
        <Match when={step() === 'loading'}>
          <div class="py-16 text-center space-y-4">
            <div class="inline-block w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
            <p class="text-sm text-[var(--color-text-muted)]">Loading sessions...</p>
          </div>
        </Match>

        <Match when={step() === 'list'}>
          <h2 class="text-xl font-semibold mb-4">Sessions</h2>
          {error() && (
            <div class="mb-4 p-3 rounded-md bg-[var(--color-error)]/10 border border-[var(--color-error)]/20">
              <p class="text-sm text-[var(--color-error)]">{error()}</p>
            </div>
          )}
          <SessionList
            sessions={sessions()}
            onSelect={handleSelect}
            onCreateNew={handleCreateNew}
            createDisabled={actionLoading()}
          />
        </Match>

        <Match when={step() === 'detail'}>
          {selectedSession() && (
            <SessionDetail
              session={selectedSession()!}
              error={error()}
              actionLoading={actionLoading()}
              onResume={handleResume}
              onArchive={handleArchive}
              onBack={() => { setStep('list'); setError(''); }}
            />
          )}
        </Match>
      </Switch>
    </div>
  );
}
