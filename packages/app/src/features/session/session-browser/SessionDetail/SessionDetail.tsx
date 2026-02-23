import { Show } from 'solid-js';
import type { SessionDetailProps } from './SessionDetail.type';


export function SessionDetail(props: SessionDetailProps) {
  return (
    <div class="space-y-6">
      <button
        type="button"
        onClick={props.onBack}
        class="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
      >
        &larr; Back to Sessions
      </button>

      <div class="space-y-4">
        <div class="flex items-start justify-between">
          <h2 class="text-xl font-semibold">{props.session.title || 'Untitled Session'}</h2>
          <span
            class="px-2 py-0.5 rounded text-xs"
            classList={{
              'bg-green-500/10 text-green-500': props.session.status === 'active',
              'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]': props.session.status === 'archived',
            }}
          >
            {props.session.status}
          </span>
        </div>

        <div class="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-4 space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-[var(--color-text-muted)]">Session ID</span>
            <span class="font-mono text-xs">{props.session.id}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-[var(--color-text-muted)]">Vault</span>
            <span class="font-mono text-xs">{props.session.vault_id}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-[var(--color-text-muted)]">Created</span>
            <span>{new Date(props.session.created_at).toLocaleString()}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-[var(--color-text-muted)]">Updated</span>
            <span>{new Date(props.session.updated_at).toLocaleString()}</span>
          </div>
        </div>

        <Show when={props.error}>
          <div class="p-3 rounded-md bg-[var(--color-error)]/10 border border-[var(--color-error)]/20">
            <p class="text-sm text-[var(--color-error)]">{props.error}</p>
          </div>
        </Show>

        <div class="flex justify-end gap-3 pt-2">
          <Show when={props.session.status === 'active'}>
            <button
              type="button"
              disabled={props.actionLoading}
              onClick={props.onArchive}
              class="px-4 py-2 rounded-md text-sm text-[var(--color-text-muted)] border border-[var(--color-border)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors disabled:opacity-50"
            >
              Archive
            </button>
          </Show>
          <Show when={props.session.status === 'archived'}>
            <button
              type="button"
              disabled={props.actionLoading}
              onClick={props.onResume}
              class="px-4 py-2 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50"
            >
              Resume
            </button>
          </Show>
          <Show when={props.session.status === 'active'}>
            <button
              type="button"
              disabled={props.actionLoading}
              onClick={props.onResume}
              class="px-4 py-2 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50"
            >
              Resume
            </button>
          </Show>
        </div>
      </div>
    </div>
  );
}
