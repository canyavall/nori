import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import type { RuleCardProps } from './RuleCard.type';

const typeBadge: Record<string, { label: string; color: string }> = {
  root: { label: 'Root', color: 'bg-green-500/10 text-green-400' },
  project: { label: 'Project', color: 'bg-blue-500/10 text-blue-400' },
  modular: { label: 'Modular', color: 'bg-purple-500/10 text-purple-400' },
};

export const RuleCard: Component<RuleCardProps> = (props) => {
  const r = props.rule;
  const badge = () => typeBadge[r.type] ?? typeBadge.modular;

  return (
    <div
      onClick={props.onSelect}
      class="rounded-lg border border-[var(--color-border)] p-3 cursor-pointer hover:border-[var(--color-accent)] hover:bg-[var(--color-bg-secondary)] transition-colors"
    >
      <div class="flex items-center gap-2">
        <h3 class="font-medium truncate">{r.name}</h3>
        <span class={`inline-flex items-center px-2 py-0.5 rounded text-xs ${badge().color}`}>
          {badge().label}
        </span>
        <Show when={r.parseError}>
          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-red-500/10 text-red-400">
            Parse Error
          </span>
        </Show>
      </div>
      <p class="text-xs text-[var(--color-text-muted)] font-mono mt-1">{r.relativePath}</p>
      <Show when={r.globs && r.globs.length > 0}>
        <div class="flex flex-wrap gap-1 mt-2">
          {r.globs!.map((g) => (
            <span class="text-xs font-mono px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">
              {g}
            </span>
          ))}
        </div>
      </Show>
    </div>
  );
};
