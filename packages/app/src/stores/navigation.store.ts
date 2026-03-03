import { createSignal, createMemo } from 'solid-js';
import type { DiscoveredProject } from '@nori/shared';

export type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated';

export const [activeProject, setActiveProject] = createSignal<DiscoveredProject | null>(null);
export const [authStatus, setAuthStatus] = createSignal<AuthStatus>('unknown');

export const sidebarContext = createMemo<'project' | null>(() => {
  if (activeProject()) return 'project';
  return null;
});

export const activeContextName = createMemo<string | null>(() => {
  const proj = activeProject();
  if (proj) return proj.name;
  return null;
});

export function selectProject(project: DiscoveredProject) {
  setActiveProject(project);
}

export function clearContext() {
  setActiveProject(null);
}
