import { createSignal, createMemo, onMount } from 'solid-js';
import type { Session } from '@nori/shared';
import { apiGet, apiPost } from '../../../lib/api';
import { sessions, setSessions, addSession, updateSession } from '../../../stores/session.store';
import { vaults } from '../../../stores/vault.store';
import { activeProject } from '../../../stores/navigation.store';

export type PageStep = 'loading' | 'list' | 'detail' | 'creating' | 'create-vault-pick';

export const useSessionListSection = () => {
  const [step, setStep] = createSignal<PageStep>('loading');
  const [selectedSession, setSelectedSession] = createSignal<Session | null>(null);
  const [error, setError] = createSignal('');
  const [actionLoading, setActionLoading] = createSignal(false);
  const [selectedVaultId, setSelectedVaultId] = createSignal('');
  const [sessionTitle, setSessionTitle] = createSignal('');

  const effectiveVaultId = createMemo(() => {
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
      await apiPost<{ data: { id: string; title: string; status: string } }>(
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

  function handleCancelCreate() {
    setStep('list');
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

  return {
    step,
    setStep,
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
  };
}
