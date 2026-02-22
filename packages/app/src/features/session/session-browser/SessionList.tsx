import { For, Show } from 'solid-js';
import type { Session } from '@nori/shared';

interface Props {
  sessions: Session[];
  onSelect: (session: Session) => void;
  onCreateNew: () => void;
  createDisabled?: boolean;
}

export function SessionList(props: Props) {
  return (
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <p class="text-sm text-[var(--color-text-muted)]">
          {props.sessions.length} session{props.sessions.length !== 1 ? 's' : ''}
        </p>
        <button
          type="button"
          disabled={props.createDisabled}
          onClick={props.onCreateNew}
          class="px-4 py-2 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          New Session
        </button>
      </div>

      <Show
        when={props.sessions.length > 0}
        fallback={
          <div class="text-center py-16 text-[var(--color-text-muted)]">
            <p class="text-lg mb-2">No sessions yet</p>
            <p class="text-sm">Create a new session to start working with a vault.</p>
          </div>
        }
      >
        <div class="space-y-2">
          <For each={props.sessions}>
            {(session) => (
              <button
                type="button"
                onClick={() => props.onSelect(session)}
                class="w-full text-left rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 hover:border-[var(--color-accent)]/40 transition-colors"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="font-medium">{session.title || 'Untitled Session'}</h3>
                    <p class="text-sm text-[var(--color-text-muted)] mt-0.5">
                      {new Date(session.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span
                    class="px-2 py-0.5 rounded text-xs"
                    classList={{
                      'bg-green-500/10 text-green-500': session.status === 'active',
                      'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]': session.status === 'archived',
                    }}
                  >
                    {session.status}
                  </span>
                </div>
              </button>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
