import { createSignal } from 'solid-js';
import type { DiscoveredProject, Project } from '@nori/shared';

export const [projects, setProjects] = createSignal<DiscoveredProject[]>([]);
export const [registerOpen, setRegisterOpen] = createSignal(false);
export const [registerPrefilledPath, setRegisterPrefilledPath] = createSignal('');

export function addProject(project: Project) {
  setProjects((prev) => [
    { ...project, source: 'nori', has_nori: true },
    ...prev,
  ]);
}
