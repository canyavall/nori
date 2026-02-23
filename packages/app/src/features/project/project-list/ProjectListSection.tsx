import { For, Show } from 'solid-js';
import type { Component } from 'solid-js';
import { projects, registerOpen } from '../../../stores/project.store';
import { selectProject, activeProject } from '../../../stores/navigation.store';
import { ProjectRegisterDialog } from '../project-register/ProjectRegisterDialog';
import { ProjectCard } from './components/ProjectCard/ProjectCard';
import { useProjectListSection } from './ProjectListSection.hook';

export const ProjectListSection: Component = () => {
  const { loading, handleAddProject } = useProjectListSection();

  return (
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-semibold">Projects</h2>
          <p class="text-sm text-[var(--color-text-muted)] mt-0.5">
            Local directories with a <code class="font-mono">.nori/</code> configuration folder
          </p>
        </div>
        <button
          onClick={handleAddProject}
          class="px-4 py-2 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          Add Project
        </button>
      </div>

      <Show
        when={!loading()}
        fallback={
          <div class="text-center py-16 text-[var(--color-text-muted)]">Loading...</div>
        }
      >
        <Show
          when={projects().length > 0}
          fallback={
            <div class="text-center py-16 text-[var(--color-text-muted)]">
              <p class="text-lg mb-2">No projects registered</p>
              <p class="text-sm mb-4">
                A project is a local folder with a <code class="font-mono">.nori/</code> config inside.
              </p>
              <button
                onClick={handleAddProject}
                class="px-4 py-2 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
              >
                Add your first project
              </button>
            </div>
          }
        >
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <For each={projects()}>
              {(project) => (
                <ProjectCard
                  project={project}
                  onSelect={() => selectProject(project)}
                  isSelected={activeProject()?.id === project.id}
                />
              )}
            </For>
          </div>
        </Show>
      </Show>

      <Show when={registerOpen()}>
        <ProjectRegisterDialog />
      </Show>
    </div>
  );
};
