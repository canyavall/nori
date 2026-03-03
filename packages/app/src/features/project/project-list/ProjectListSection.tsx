import { For, Show } from 'solid-js';
import type { Component } from 'solid-js';
import { ProjectRegisterDialog } from '../project-register/ProjectRegisterDialog';
import { ProjectCard } from './components/ProjectCard/ProjectCard';
import { DiscoveredProjectCard } from './components/DiscoveredProjectCard/DiscoveredProjectCard';
import { useProjectListSection } from './ProjectListSection.hook';

export const ProjectListSection: Component = () => {
  const {
    loading,
    noriProjects,
    discoveredProjects,
    registerOpen,
    activeProject,
    handleAddProject,
    handleSelectProject,
    handleSetupNori,
  } = useProjectListSection();

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
          when={noriProjects().length > 0 || discoveredProjects().length > 0}
          fallback={
            <div class="text-center py-16 text-[var(--color-text-muted)]">
              <p class="text-lg mb-2">No projects found</p>
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
          <Show when={noriProjects().length > 0}>
            <h3 class="text-base font-medium mb-3">Nori Project</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <For each={noriProjects()}>
                {(project) => (
                  <ProjectCard
                    project={project}
                    onSelect={() => handleSelectProject(project)}
                    isSelected={activeProject()?.id === project.id}
                  />
                )}
              </For>
            </div>
          </Show>

          <Show when={discoveredProjects().length > 0}>
            <div class={noriProjects().length > 0 ? 'mt-8' : ''}>
              <h3 class="text-base font-medium mb-1">Claude Code Discovery</h3>
              <p class="text-sm text-[var(--color-text-muted)] mb-4">
                Projects found in your Claude Code config that haven't been set up with Nori yet.
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <For each={discoveredProjects()}>
                  {(project) => (
                    <DiscoveredProjectCard
                      project={project}
                      onSetup={() => handleSetupNori(project)}
                    />
                  )}
                </For>
              </div>
            </div>
          </Show>
        </Show>
      </Show>

      <Show when={registerOpen()}>
        <ProjectRegisterDialog />
      </Show>
    </div>
  );
};
