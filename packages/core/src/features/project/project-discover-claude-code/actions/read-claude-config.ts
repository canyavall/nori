import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { StepResult } from '@nori/shared';

export interface ClaudeCodeProject {
  path: string;
  lastSessionId?: string;
  hasTrustDialogAccepted?: boolean;
}

export function readClaudeConfig(
  configPath?: string,
): StepResult<{ projects: ClaudeCodeProject[] }> {
  const filePath = configPath ?? join(homedir(), '.claude.json');

  let raw: string;
  try {
    raw = readFileSync(filePath, 'utf-8');
  } catch {
    return { success: true, data: { projects: [] } };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { success: true, data: { projects: [] } };
  }

  if (typeof parsed !== 'object' || parsed === null || !('projects' in parsed)) {
    return { success: true, data: { projects: [] } };
  }

  const projectsObj = (parsed as Record<string, unknown>).projects;
  if (typeof projectsObj !== 'object' || projectsObj === null) {
    return { success: true, data: { projects: [] } };
  }

  const projects: ClaudeCodeProject[] = Object.entries(
    projectsObj as Record<string, unknown>,
  ).map(([absolutePath, meta]) => {
    const metaObj = typeof meta === 'object' && meta !== null ? (meta as Record<string, unknown>) : {};
    return {
      path: absolutePath,
      lastSessionId: typeof metaObj.lastSessionId === 'string' ? metaObj.lastSessionId : undefined,
      hasTrustDialogAccepted: typeof metaObj.hasTrustDialogAccepted === 'boolean' ? metaObj.hasTrustDialogAccepted : undefined,
    };
  });

  return { success: true, data: { projects } };
}
