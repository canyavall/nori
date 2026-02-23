import type { Component } from 'solid-js';
import { Show, For } from 'solid-js';
import { useSkillsSection } from './SkillsSection.hook';
import { SkillCard } from './components/SkillCard/SkillCard';
import { SkillEditDialog } from './SkillEditDialog/SkillEditDialog';

export const SkillsSection: Component = () => {
  const { skills, loading, error, editingSkill, setEditingSkill, projectPath, handleSkillSaved } =
    useSkillsSection();

  return (
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-semibold">Skills</h2>
          <p class="text-sm text-[var(--color-text-muted)] mt-0.5">
            Claude Code skill definitions from <code class="font-mono">.claude/skills/</code>
          </p>
        </div>
      </div>

      <Show when={!loading()} fallback={<p class="text-sm text-[var(--color-text-muted)]">Loading skills...</p>}>
        <Show when={!error()} fallback={<p class="text-sm text-[var(--color-text-error)]">{error()}</p>}>
          <Show
            when={skills().length > 0}
            fallback={
              <p class="text-sm text-[var(--color-text-muted)] italic">
                No skills found. Create a skill by adding a <code class="font-mono">.claude/skills/&lt;name&gt;/SKILL.md</code> file.
              </p>
            }
          >
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <For each={skills()}>
                {(skill) => (
                  <SkillCard skill={skill} onSelect={() => setEditingSkill(skill)} />
                )}
              </For>
            </div>
          </Show>
        </Show>
      </Show>

      <Show when={editingSkill()}>
        <SkillEditDialog
          skill={editingSkill()!}
          allSkills={skills()}
          projectPath={projectPath()}
          onClose={() => setEditingSkill(null)}
          onSaved={handleSkillSaved}
        />
      </Show>
    </div>
  );
};
