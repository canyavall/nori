import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import { activeProject } from '../stores/navigation.store';
import { ProjectListSection } from '../features/project/project-list/ProjectListSection';
import { ProjectDashboardSection } from '../features/project/project-dashboard/ProjectDashboardSection/ProjectDashboardSection';

export const ProjectsPage: Component = () => (
  <Show when={activeProject()} keyed fallback={<ProjectListSection />}>
    {(project) => <ProjectDashboardSection project={project} />}
  </Show>
);
