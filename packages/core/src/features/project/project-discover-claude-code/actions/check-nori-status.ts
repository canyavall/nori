import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import type { DiscoveredProject, StepResult } from '@nori/shared';
import type { ClaudeCodeProject } from './read-claude-config.js';

function deterministicId(path: string): string {
  return createHash('sha256').update(path).digest('hex');
}

export function checkNoriStatus(
  projects: ClaudeCodeProject[],
): StepResult<{ discovered: DiscoveredProject[] }> {
  const discovered: DiscoveredProject[] = [];

  for (const project of projects) {
    if (!existsSync(project.path)) continue;

    const hasNori = existsSync(join(project.path, '.nori'));
    const isGit = existsSync(join(project.path, '.git'));

    discovered.push({
      id: deterministicId(project.path),
      name: basename(project.path),
      path: project.path,
      is_git: isGit,
      connected_vaults: [],
      created_at: '',
      source: 'claude-code',
      has_nori: hasNori,
      claude_code: {
        last_session_id: project.lastSessionId,
        has_trust_dialog_accepted: project.hasTrustDialogAccepted,
      },
    });
  }

  return { success: true, data: { discovered } };
}
