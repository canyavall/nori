import { Show } from 'solid-js';
import type { Component } from 'solid-js';
import { GitBadge } from '../GitBadge/GitBadge';
import type { ProjectCardProps } from './ProjectCard.type';

export const ProjectCard: Component<ProjectCardProps> = (props) => {
  const p = props.project;

  return (
    <div
      onClick={props.onSelect}
      class={`rounded-lg border bg-[var(--color-bg-secondary)] p-4 cursor-pointer transition-colors hover:border-[var(--color-accent)]/40 ${
        props.isSelected
          ? 'border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]'
          : 'border-[var(--color-border)]'
      }`}
    >
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 mb-1">
            <h3 class="font-medium truncate">{p.name}</h3>
            <Show when={p.is_git}>
              <GitBadge />
            </Show>
            <Show when={p.source === 'both'}>
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-500/10 text-purple-400">
                Claude Code
              </span>
            </Show>
          </div>
          <p class="text-sm text-[var(--color-text-muted)] font-mono truncate">{p.path}</p>
          <div class="mt-2 flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
            <span class="font-mono">.nori/</span>
            <Show
              when={p.connected_vaults.length > 0}
              fallback={<span>No vaults connected</span>}
            >
              <span>{p.connected_vaults.length} vault{p.connected_vaults.length !== 1 ? 's' : ''} connected</span>
            </Show>
            <span>Added {new Date(p.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
