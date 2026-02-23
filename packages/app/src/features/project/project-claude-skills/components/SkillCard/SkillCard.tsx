import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import type { SkillCardProps } from './SkillCard.type';

export const SkillCard: Component<SkillCardProps> = (props) => {
  const s = props.skill;

  return (
    <div
      onClick={props.onSelect}
      class="rounded-lg border border-[var(--color-border)] p-4 cursor-pointer hover:border-[var(--color-accent)] hover:bg-[var(--color-bg-secondary)] transition-colors"
    >
      <div class="flex items-center gap-2 mb-1">
        <h3 class="font-medium truncate">{s.name}</h3>
        <Show when={s.alwaysApply}>
          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-500/10 text-blue-400">
            Always
          </span>
        </Show>
        <Show when={s.parseError}>
          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-red-500/10 text-red-400">
            Parse Error
          </span>
        </Show>
      </div>
      <Show when={s.description}>
        <p class="text-sm text-[var(--color-text-muted)] mb-2">{s.description}</p>
      </Show>
      <Show when={s.globs && s.globs.length > 0}>
        <div class="flex flex-wrap gap-1">
          {s.globs!.map((g) => (
            <span class="text-xs font-mono px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">
              {g}
            </span>
          ))}
        </div>
      </Show>
    </div>
  );
};
