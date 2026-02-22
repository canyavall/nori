import { Show } from 'solid-js';
import { A } from '@solidjs/router';
import { sidebarContext, activeContextName } from '../../stores/navigation.store';

export function ContextualSidebar() {
  return (
    <aside class="w-52 flex-shrink-0 border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex flex-col">
      <header class="px-4 py-3 border-b border-[var(--color-border)]">
        <p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">
          {sidebarContext() === 'project' ? 'Project' : 'Vault'}
        </p>
        <p class="text-sm font-medium truncate mt-0.5">{activeContextName()}</p>
      </header>
      <nav class="p-2 space-y-1">
        <Show
          when={sidebarContext() === 'project'}
          fallback={
            <A
              href="/knowledge"
              class="block px-3 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
              activeClass="!text-[var(--color-text)] bg-[var(--color-bg-tertiary)]"
            >
              Knowledge
            </A>
          }
        >
          <A
            href="/vaults"
            class="block px-3 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
            activeClass="!text-[var(--color-text)] bg-[var(--color-bg-tertiary)]"
          >
            Vaults
          </A>
          <A
            href="/sessions"
            class="block px-3 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
            activeClass="!text-[var(--color-text)] bg-[var(--color-bg-tertiary)]"
          >
            Sessions
          </A>
        </Show>
      </nav>
    </aside>
  );
}
