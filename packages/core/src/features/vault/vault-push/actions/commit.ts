import { commit as gitCommit } from 'isomorphic-git';
import * as fs from 'node:fs';
import type { StepResult, FlowError } from '@nori/shared';

export interface CommitResult {
  commit_hash: string;
  commit_message: string;
  files_committed: number;
}

export async function commit(
  dir: string,
  filesCount: number,
  commitMessage?: string
): Promise<StepResult<CommitResult> | FlowError> {
  try {
    const message = commitMessage ?? `nori: update ${filesCount} knowledge file${filesCount !== 1 ? 's' : ''}`;

    const sha = await gitCommit({
      fs,
      dir,
      message,
      author: {
        name: 'Nori',
        email: 'nori@local',
      },
    });

    return {
      success: true,
      data: {
        commit_hash: sha as string,
        commit_message: message,
        files_committed: filesCount,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: {
        code: 'COMMIT_FAILED',
        message: `Failed to create commit: ${message}`,
        step: '04-commit',
        severity: 'fatal',
        recoverable: false,
        details: { dir, error: message },
      },
    };
  }
}
