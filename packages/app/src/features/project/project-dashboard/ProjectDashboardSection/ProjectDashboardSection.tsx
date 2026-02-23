import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import type { DiscoveredProject } from '@nori/shared';
import { clearContext } from '../../../../stores/navigation.store';
import { useProjectDashboardSection } from './ProjectDashboardSection.hook';
import { SkillsAccordion } from './components/SkillsAccordion/SkillsAccordion';
import { RulesAccordion } from './components/RulesAccordion/RulesAccordion';
import { HooksAccordion } from './components/HooksAccordion/HooksAccordion';
import { McpsAccordion } from './components/McpsAccordion/McpsAccordion';
import { ClaudeMdsAccordion } from './components/ClaudeMdsAccordion/ClaudeMdsAccordion';

interface ProjectDashboardSectionProps {
  project: DiscoveredProject;
}

export const ProjectDashboardSection: Component<ProjectDashboardSectionProps> = (props) => {
  const { skills, rules, hooksData, mcpServers, mcpRaw, claudeMds, loading, projectPath } =
    useProjectDashboardSection(() => props.project);

  return (
    <div class="p-6">
      <div class="flex items-start justify-between mb-6">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 mb-1">
            <h2 class="text-xl font-semibold">{props.project.name}</h2>
            <Show when={props.project.is_git}>
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)]">
                git
              </span>
            </Show>
            <Show when={props.project.source === 'both' || props.project.source === 'claude-code'}>
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-500/10 text-purple-400">
                Claude Code
              </span>
            </Show>
          </div>
          <p class="text-sm text-[var(--color-text-muted)] font-mono truncate">{props.project.path}</p>
        </div>
        <button
          type="button"
          onClick={clearContext}
          class="ml-4 px-3 py-1.5 text-sm rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors shrink-0"
        >
          ← Back
        </button>
      </div>

      <Show
        when={!loading()}
        fallback={<p class="text-sm text-[var(--color-text-muted)]">Loading project...</p>}
      >
        <div class="space-y-3">
          <SkillsAccordion skills={skills} projectPath={projectPath} />
          <RulesAccordion rules={rules} projectPath={projectPath} />
          <HooksAccordion hooksData={hooksData} projectPath={projectPath} />
          <McpsAccordion servers={mcpServers} rawContent={mcpRaw} projectPath={projectPath} />
          <ClaudeMdsAccordion files={claudeMds} projectPath={projectPath} />
        </div>
      </Show>
    </div>
  );
};
