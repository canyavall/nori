import { onMount, onCleanup } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { authStatus } from '../../stores/navigation.store';
import { runAuthCheck } from '../../lib/auth-check';

export function Avatar() {
  const navigate = useNavigate();
  let controller: AbortController | undefined;

  onMount(() => {
    controller = runAuthCheck();
  });

  onCleanup(() => {
    controller?.abort();
  });

  const dotClass = () => {
    const s = authStatus();
    if (s === 'authenticated') return 'bg-green-500';
    if (s === 'unauthenticated') return 'bg-red-500';
    return 'bg-gray-400 animate-pulse';
  };

  return (
    <button
      type="button"
      onClick={() => navigate('/settings')}
      class="relative flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors"
      title="Settings / Auth status"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-4 h-4 text-[var(--color-text-muted)]"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
      </svg>
      <span
        class={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[var(--color-bg-secondary)] ${dotClass()}`}
      />
    </button>
  );
}
