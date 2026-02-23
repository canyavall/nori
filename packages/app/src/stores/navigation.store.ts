import { createSignal, createMemo } from 'solid-js';
import type { DiscoveredProject, Vault } from '@nori/shared';

export type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated';

export const [activeProject, setActiveProject] = createSignal<DiscoveredProject | null>(null);
export const [activeVault, setActiveVault] = createSignal<Vault | null>(null);
export const [authStatus, setAuthStatus] = createSignal<AuthStatus>('unknown');

export const sidebarContext = createMemo<'project' | 'vault' | null>(() => {
  if (activeProject()) return 'project';
  if (activeVault()) return 'vault';
  return null;
});

export const activeContextName = createMemo<string | null>(() => {
  const proj = activeProject();
  if (proj) return proj.name;
  const vault = activeVault();
  if (vault) return vault.name;
  return null;
});

export function selectProject(project: DiscoveredProject) {
  setActiveProject(project);
  setActiveVault(null);
}

export function selectVault(vault: Vault) {
  setActiveVault(vault);
  setActiveProject(null);
}

export function clearContext() {
  setActiveProject(null);
  setActiveVault(null);
}

export function clearVaultContext() {
  setActiveVault(null);
}
