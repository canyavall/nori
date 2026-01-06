/**
 * Command mappings from Tauri to HTTP endpoints
 * This file maps old Tauri invoke() commands to new HTTP/WebSocket API
 */

import { invokeCommand } from './api.js';
import type { Workspace, Vault, Package, SearchResult, HookInfo, HookResult } from '../types/index.js';

// Workspace commands
export async function listWorkspaces(): Promise<Workspace[]> {
  return invokeCommand<Workspace[]>('/workspaces');
}

export async function getActiveWorkspace(): Promise<Workspace | null> {
  return invokeCommand<Workspace | null>('/workspaces/active');
}

export async function getWorkspaceByPath(path: string): Promise<Workspace | null> {
  const workspaces = await listWorkspaces();
  return workspaces.find(w => w.path === path) || null;
}

export async function createWorkspace(path: string, vault?: string): Promise<Workspace> {
  return invokeCommand<Workspace>('/workspaces', {
    method: 'POST',
    body: JSON.stringify({ path, vault }),
  });
}

export async function updateWorkspaceVault(workspaceId: number, vaultPath: string | null): Promise<void> {
  await invokeCommand(`/workspaces/${workspaceId}`, {
    method: 'PATCH',
    body: JSON.stringify({ vault_path: vaultPath }),
  });
}

// Role/Personality commands
export async function loadPersonality(role: string): Promise<string> {
  const response = await invokeCommand<{ content: string }>(`/roles/personality/${role}`);
  return response.content;
}

export async function getActiveRole(): Promise<string> {
  const response = await invokeCommand<{ role: string }>('/roles/active');
  return response.role;
}

export async function setActiveRole(role: string): Promise<void> {
  await invokeCommand('/roles/active', {
    method: 'POST',
    body: JSON.stringify({ role }),
  });
}

// Vault commands (stubbed - not implemented in backend)
export async function listVaults(): Promise<Vault[]> {
  // TODO: Backend endpoint not implemented
  return [];
}

export async function getVault(path: string): Promise<Vault | null> {
  // TODO: Backend endpoint not implemented
  return null;
}

export async function createVault(name: string, path: string): Promise<Vault> {
  // TODO: Backend endpoint not implemented
  throw new Error('Vault creation not implemented in backend');
}

// Knowledge commands (stubbed - not fully implemented)
export async function getAllPackages(vaultPath?: string): Promise<Package[]> {
  const response = await invokeCommand<{ packages: Package[] }>('/knowledge/packages', {
    method: 'POST',
    body: JSON.stringify({ vault_path: vaultPath }),
  });
  return response.packages;
}

export async function getPackage(name: string, vaultPath?: string): Promise<Package> {
  const response = await invokeCommand<Package>('/knowledge/package', {
    method: 'POST',
    body: JSON.stringify({ name, vault_path: vaultPath }),
  });
  return response;
}

export async function searchKnowledge(query: string, vaultPath?: string): Promise<SearchResult[]> {
  const response = await invokeCommand<{ results: SearchResult[] }>('/knowledge/search', {
    method: 'POST',
    body: JSON.stringify({ query, vault_path: vaultPath }),
  });
  return response.results;
}

export async function getCategories(vaultPath?: string): Promise<string[]> {
  const response = await invokeCommand<{ categories: string[] }>('/knowledge/categories', {
    method: 'POST',
    body: JSON.stringify({ vault_path: vaultPath }),
  });
  return response.categories;
}

export async function getTags(vaultPath?: string): Promise<string[]> {
  const response = await invokeCommand<{ tags: string[] }>('/knowledge/tags', {
    method: 'POST',
    body: JSON.stringify({ vault_path: vaultPath }),
  });
  return response.tags;
}

export async function validatePackage(content: string): Promise<boolean> {
  const response = await invokeCommand<{ valid: boolean }>('/knowledge/validate', {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
  return response.valid;
}

export async function savePackage(name: string, content: string, vaultPath?: string): Promise<void> {
  await invokeCommand('/knowledge/package', {
    method: 'PUT',
    body: JSON.stringify({ name, content, vault_path: vaultPath }),
  });
}

export async function indexKnowledge(vaultPath: string): Promise<void> {
  await invokeCommand('/knowledge/index', {
    method: 'POST',
    body: JSON.stringify({ vault_path: vaultPath }),
  });
}

// Hook commands (stubbed - security risk)
export async function listHooks(): Promise<HookInfo[]> {
  // Backend returns 501 Not Implemented
  return [];
}

export async function executeHook(hookName: string, args: Record<string, unknown>): Promise<HookResult> {
  // Backend returns 501 Not Implemented
  throw new Error('Hook execution not implemented (security risk)');
}

// OAuth commands
export async function startOAuthFlow(mode: 'Organization' | 'Max'): Promise<string> {
  const response = await invokeCommand<{ authorization_url: string }>('/auth/start', {
    method: 'POST',
    body: JSON.stringify({ mode }),
  });
  return response.authorization_url;
}

export async function completeOAuthFlow(authorizationCode: string, mode: 'Organization' | 'Max'): Promise<string> {
  const response = await invokeCommand<{ success: boolean; message?: string }>('/auth/complete', {
    method: 'POST',
    body: JSON.stringify({ authorization_code: authorizationCode, mode }),
  });

  if (!response.success) {
    throw new Error(response.message || 'OAuth flow failed');
  }

  return 'Authentication successful';
}

export async function checkAuthStatus(): Promise<boolean> {
  const response = await invokeCommand<{ authenticated: boolean }>('/auth/status');
  return response.authenticated;
}

// Session commands
export async function saveSession(sessionId: string, role: string, title: string, messages: unknown[]): Promise<void> {
  await invokeCommand('/sessions', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId, role, title, messages }),
  });
}

export async function loadSession(sessionId: string): Promise<{ messages: unknown[] }> {
  return invokeCommand<{ messages: unknown[] }>(`/sessions/${sessionId}`);
}

// Chat streaming is handled separately via WebSocket in useChat hook
