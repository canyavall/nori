import { A, useNavigate } from '@solidjs/router';
import { Avatar } from '../../ui/Avatar';

export function TopNav() {
  const navigate = useNavigate();

  return (
    <nav class="h-12 flex items-center px-4 gap-1 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex-shrink-0">
      <span class="text-[var(--color-accent)] font-semibold mr-3 text-sm">Nori</span>

      <A
        href="/vaults"
        class="px-3 py-1.5 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
        activeClass="!text-[var(--color-text)] bg-[var(--color-bg-tertiary)]"
      >
        Vaults
      </A>
      <A
        href="/projects"
        class="px-3 py-1.5 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
        activeClass="!text-[var(--color-text)] bg-[var(--color-bg-tertiary)]"
      >
        Projects
      </A>

      <div class="flex-1" />

      <button
        type="button"
        onClick={() => navigate('/settings')}
        class="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
        title="Settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      <div class="ml-1">
        <Avatar />
      </div>
    </nav>
  );
}
