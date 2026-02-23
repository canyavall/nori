import type { Component } from 'solid-js';
import { For, Show } from 'solid-js';
import type { Accessor } from 'solid-js';
import type { ClaudeSkill } from '@nori/shared';
import { SkillEditDialog } from '../../../../project-claude-skills/SkillEditDialog/SkillEditDialog';
import { useSkillsAccordion } from './SkillsAccordion.hook';

const MAX_VISIBLE = 5;

interface SkillsAccordionProps {
  skills: Accessor<ClaudeSkill[]>;
  projectPath: Accessor<string>;
  onSkillUpdated?: (updated: ClaudeSkill) => void;
}

export const SkillsAccordion: Component<SkillsAccordionProps> = (props) => {
  const { open, setOpen, editingSkill, setEditingSkill } = useSkillsAccordion(
    props.skills,
    props.projectPath,
  );

  const visible = () => props.skills().slice(0, MAX_VISIBLE);
  const overflow = () => Math.max(0, props.skills().length - MAX_VISIBLE);

  return (
    <div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
      <button
        type="button"
        onClick={() => setOpen(!open())}
        class="w-full flex items-center justify-between px-4 py-3 text-left transition-colors rounded-lg"
      >
        <div class="flex items-center gap-2">
          <span class="font-medium">Skills</span>
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
            {props.skills().length}
          </span>
        </div>
        <span
          class="text-[var(--color-text-muted)] text-xs transition-transform"
          style={{ transform: open() ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ▾
        </span>
      </button>

      <Show when={open()}>
        <div class="border-t border-[var(--color-border)] px-4 py-3">
          <Show
            when={props.skills().length > 0}
            fallback={
              <p class="text-sm text-[var(--color-text-muted)] italic">No skills configured.</p>
            }
          >
            <div class="grid grid-cols-2 gap-2">
              <For each={visible()}>
                {(skill) => (
                  <div class="flex items-center justify-between rounded-md border border-[var(--color-border)] px-3 py-2">
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-medium truncate">{skill.name}</p>
                      <p class="text-xs text-[var(--color-text-muted)] truncate">{skill.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingSkill(skill)}
                      class="ml-2 px-2 py-0.5 text-xs rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors shrink-0"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </For>
            </div>
            <Show when={overflow() > 0}>
              <p class="text-xs text-[var(--color-text-muted)] mt-2">
                +{overflow()} more {overflow() === 1 ? 'skill' : 'skills'} not shown
              </p>
            </Show>
          </Show>
        </div>
      </Show>

      <Show when={editingSkill()}>
        <SkillEditDialog
          skill={editingSkill()!}
          allSkills={props.skills()}
          projectPath={props.projectPath()}
          onClose={() => setEditingSkill(null)}
          onSaved={(updated) => {
            props.onSkillUpdated?.(updated);
            setEditingSkill(null);
          }}
        />
      </Show>
    </div>
  );
};
