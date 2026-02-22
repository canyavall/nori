import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import * as fs from 'node:fs';
import { rmSync } from 'node:fs';
import type { StepResult, FlowError } from '@nori/shared';

export interface CloneResult {
  local_path: string;
  commit_hash: string;
  file_count: number;
  clone_time_ms: number;
}

export async function cloneRepo(
  gitUrl: string,
  localPath: string,
  branch: string
): Promise<StepResult<CloneResult> | FlowError> {
  const start = Date.now();

  try {
    fs.mkdirSync(localPath, { recursive: true });

    await git.clone({
      fs,
      http,
      dir: localPath,
      url: gitUrl,
      ref: branch,
      singleBranch: true,
      depth: 1,
    });

    const log = await git.log({ fs, dir: localPath, depth: 1 });
    const commitHash = log[0]?.oid ?? 'unknown';

    // Count files (excluding .git)
    let fileCount = 0;
    const countFiles = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === '.git') continue;
        const fullPath = `${dir}/${entry.name}`;
        if (entry.isDirectory()) {
          countFiles(fullPath);
        } else {
          fileCount++;
        }
      }
    };
    countFiles(localPath);

    return {
      success: true,
      data: {
        local_path: localPath,
        commit_hash: commitHash,
        file_count: fileCount,
        clone_time_ms: Date.now() - start,
      },
    };
  } catch (err) {
    // Clean up partial clone
    try {
      rmSync(localPath, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }

    const message = err instanceof Error ? err.message : String(err);

    if (message.includes('ENOSPC') || message.includes('No space left')) {
      return {
        success: false,
        error: {
          code: 'DISK_FULL',
          message: `Insufficient disk space to clone repository: ${message}`,
          step: '03-clone-repo',
          severity: 'fatal',
          recoverable: false,
          details: { url: gitUrl, local_path: localPath, error: message },
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'CLONE_FAILED',
        message: `Failed to clone repository: ${message}`,
        step: '03-clone-repo',
        severity: 'fatal',
        recoverable: false,
        details: { url: gitUrl, local_path: localPath, error: message },
      },
    };
  }
}
