import { Match, Switch } from 'solid-js';
import { SessionList } from '../SessionList/SessionList';
import { SessionDetail } from '../SessionDetail/SessionDetail';
import { useSessionBrowserPage } from './SessionBrowserPage.hook';

export const SessionBrowserPage = () => {
  const { step, sessions, selectedSession, error, actionLoading, handleSelect, handleCreateNew, handleResume, handleArchive, handleBack } = useSessionBrowserPage();

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
              onBack={handleBack}
            />
          )}
        </Match>
      </Switch>
    </div>
  );
};
