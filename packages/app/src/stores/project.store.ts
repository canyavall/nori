import { createSignal } from 'solid-js';
import type { Project } from '@nori/shared';

export const [projects, setProjects] = createSignal<Project[]>([]);
export const [registerOpen, setRegisterOpen] = createSignal(false);

export function addProject(project: Project) {
  setProjects((prev) => [project, ...prev]);
}
