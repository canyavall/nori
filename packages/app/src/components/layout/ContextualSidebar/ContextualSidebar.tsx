import { For, Show } from 'solid-js';
import { A } from '@solidjs/router';
import { useContextualSidebar } from './ContextualSidebar.hook';

export const ContextualSidebar = () => {
  const {
    linkedVaults,
    handleContextBack,
    activeContextName,
  } = useContextualSidebar();

  return (
    <aside class="w-52 flex-shrink-0 border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex flex-col">
      <header class="px-4 py-3 border-b border-[var(--color-border)]">
        <p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">Project</p>
        <button
          type="button"
          onClick={handleContextBack}
          class="text-sm font-medium truncate mt-0.5 text-left w-full hover:text-[var(--color-accent)] transition-colors"
          title="Back to projects"
        >
          {activeContextName()}
        </button>
      </header>

      <nav class="p-2 space-y-1">
        <div class="px-3 pt-1 pb-2">
          <p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">Linked Vaults</p>
          <Show
            when={linkedVaults().length > 0}
            fallback={
              <p class="text-xs text-[var(--color-text-muted)] italic">None linked</p>
            }
          >
            <For each={linkedVaults()}>
              {(vault) => (
                <p class="text-xs text-[var(--color-text)] truncate py-0.5">· {vault.name}</p>
              )}
            </For>
          </Show>
        </div>

        <A
          href="/sessions"
          class="block px-3 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
          activeClass="!text-[var(--color-text)] bg-[var(--color-bg-tertiary)]"
        >
          Sessions
        </A>

        <div class="px-3 pt-2 pb-1">
          <p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">Claude Code</p>
        </div>

        <A
          href="/project/skills"
          class="block px-3 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
          activeClass="!text-[var(--color-text)] bg-[var(--color-bg-tertiary)]"
        >
          Skills
        </A>
        <A
          href="/project/rules"
          class="block px-3 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
          activeClass="!text-[var(--color-text)] bg-[var(--color-bg-tertiary)]"
        >
          Rules
        </A>
        <A
          href="/project/hooks"
          class="block px-3 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
          activeClass="!text-[var(--color-text)] bg-[var(--color-bg-tertiary)]"
        >
          Hooks
        </A>
        <A
          href="/project/mcps"
          class="block px-3 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
          activeClass="!text-[var(--color-text)] bg-[var(--color-bg-tertiary)]"
        >
          MCPs
        </A>
      </nav>
    </aside>
  );
};
