import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import type { McpServerCardProps } from './McpServerCard.type';

const typeBadge: Record<string, { label: string; color: string }> = {
  stdio: { label: 'stdio', color: 'bg-green-500/10 text-green-400' },
  http: { label: 'http', color: 'bg-blue-500/10 text-blue-400' },
  sse: { label: 'sse', color: 'bg-purple-500/10 text-purple-400' },
};

export const McpServerCard: Component<McpServerCardProps> = (props) => {
  const s = props.server;
  const badge = () => typeBadge[s.type] ?? typeBadge.stdio;

  return (
    <div
      onClick={props.onEdit}
      class="rounded-lg border border-[var(--color-border)] p-4 cursor-pointer hover:border-[var(--color-accent)] hover:bg-[var(--color-bg-secondary)] transition-colors"
    >
      <div class="flex items-center gap-2 mb-1">
        <h3 class="font-medium truncate">{s.name}</h3>
        <span class={`inline-flex items-center px-2 py-0.5 rounded text-xs ${badge().color}`}>
          {badge().label}
        </span>
      </div>
      <Show when={s.url}>
        <p class="text-sm text-[var(--color-text-muted)] font-mono truncate">{s.url}</p>
      </Show>
      <Show when={s.command}>
        <p class="text-sm text-[var(--color-text-muted)] font-mono truncate">
          {s.command}{s.args ? ` ${s.args.join(' ')}` : ''}
        </p>
      </Show>
      <Show when={s.env && Object.keys(s.env).length > 0}>
        <p class="text-xs text-[var(--color-text-muted)] mt-1">
          {Object.keys(s.env!).length} env variable{Object.keys(s.env!).length !== 1 ? 's' : ''}
        </p>
      </Show>
    </div>
  );
};
