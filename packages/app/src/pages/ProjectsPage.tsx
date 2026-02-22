import { createSignal, For, Show, onMount } from 'solid-js';
import type { Project } from '@nori/shared';
import { apiGet } from '../lib/api';
import { projects, setProjects, registerOpen, setRegisterOpen } from '../stores/project.store';
import { ProjectRegisterDialog } from '../features/project/project-register/ProjectRegisterDialog';
import { selectProject, activeProject } from '../stores/navigation.store';

function GitBadge() {
  return (
    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">
      <span>git</span>
    </span>
  );
}

function ProjectCard(props: { project: Project; onSelect: () => void; isSelected: boolean }) {
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
}

export function ProjectsPage() {
  const [loading, setLoading] = createSignal(true);

  onMount(async () => {
    try {
      const res = await apiGet<{ data: Project[] }>('/api/project');
      setProjects(res.data);
    } catch {
      // Will show empty state
    }
    setLoading(false);
  });

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
          onClick={() => setRegisterOpen(true)}
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
                onClick={() => setRegisterOpen(true)}
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
}
