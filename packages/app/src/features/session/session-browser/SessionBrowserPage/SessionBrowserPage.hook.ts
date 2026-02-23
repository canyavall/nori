import { createSignal, onMount } from 'solid-js';
import type { Session } from '@nori/shared';
import { sessions, setSessions, addSession, setActiveSession } from '../../../../stores/session.store';
import { apiGet, apiPost } from '../../../../lib/api';
import { useNavigate } from '@solidjs/router';

type PageStep = 'loading' | 'list' | 'detail';

export const useSessionBrowserPage = () => {
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

  const handleSelect = (session: Session) => {
    setSelectedSession(session);
    setError('');
    setStep('detail');
  };

  const handleCreateNew = async () => {
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
  };

  const handleResume = async () => {
    const session = selectedSession();
    if (!session) {
      return;
    }

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
  };

  const handleArchive = async () => {
    const session = selectedSession();
    if (!session) {
      return;
    }

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
  };

  const handleBack = () => {
    setStep('list');
    setError('');
  };

  return { step, sessions, selectedSession, error, actionLoading, handleSelect, handleCreateNew, handleResume, handleArchive, handleBack };
};
