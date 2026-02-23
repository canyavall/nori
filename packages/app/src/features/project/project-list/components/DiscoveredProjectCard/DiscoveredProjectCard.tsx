import { Show } from 'solid-js';
import type { Component } from 'solid-js';
import { GitBadge } from '../GitBadge/GitBadge';
import type { DiscoveredProjectCardProps } from './DiscoveredProjectCard.type';

export const DiscoveredProjectCard: Component<DiscoveredProjectCardProps> = (props) => {
  const p = props.project;

  return (
    <div class="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 transition-colors hover:border-[var(--color-accent)]/40">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 mb-1">
            <h3 class="font-medium truncate">{p.name}</h3>
            <Show when={p.is_git}>
              <GitBadge />
            </Show>
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-500/10 text-purple-400">
              Claude Code
            </span>
          </div>
          <p class="text-sm text-[var(--color-text-muted)] font-mono truncate">{p.path}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            props.onSetup();
          }}
          class="shrink-0 px-3 py-1.5 rounded-md text-sm bg-[var(--color-accent)] text-white font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          Setup Nori
        </button>
      </div>
    </div>
  );
};
