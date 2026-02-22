import git from 'isomorphic-git';
import * as fs from 'node:fs';
import type { StepResult, FlowError } from '@nori/shared';

export interface ConflictDetectionResult {
  has_conflicts: boolean;
  conflict_count: number;
  local_head: string;
  remote_head: string;
}

export async function detectConflicts(
  dir: string,
  ref: string
): Promise<StepResult<ConflictDetectionResult> | FlowError> {
  try {
    // Get local HEAD
    const localLog = await git.log({ fs, dir, depth: 1, ref });
    const localHead = localLog[0]?.oid ?? 'unknown';

    // Get remote HEAD
    const remoteRef = `origin/${ref}`;
    let remoteHead: string;
    try {
      const remoteLog = await git.log({ fs, dir, depth: 1, ref: remoteRef });
      remoteHead = remoteLog[0]?.oid ?? 'unknown';
    } catch {
      // Remote ref might not exist yet (first fetch)
      remoteHead = localHead;
    }

    // If heads are the same, no conflicts possible
    if (localHead === remoteHead) {
      return {
        success: true,
        data: {
          has_conflicts: false,
          conflict_count: 0,
          local_head: localHead,
          remote_head: remoteHead,
        },
      };
    }

    // Heads differ -- potential conflicts exist.
    // A full 3-way merge detection would require comparing file trees,
    // but for now we report that divergence exists and let merge-changes
    // handle the actual resolution.
    return {
      success: true,
      data: {
        has_conflicts: true,
        conflict_count: 1, // Conservative: at least one divergence detected
        local_head: localHead,
        remote_head: remoteHead,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: {
        code: 'CONFLICT_DETECTION_FAILED',
        message: `Failed to detect conflicts: ${message}`,
        step: '04-detect-conflicts',
        severity: 'warning',
        recoverable: true,
        details: { dir, ref, error: message },
      },
    };
  }
}
