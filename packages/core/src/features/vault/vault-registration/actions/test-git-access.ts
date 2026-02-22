import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import type { StepResult, FlowError } from '@nori/shared';

export interface GitAccessResult {
  url: string;
  ref_count: number;
  response_time_ms: number;
}

export async function testGitAccess(gitUrl: string): Promise<StepResult<GitAccessResult> | FlowError> {
  const start = Date.now();

  try {
    const refs = await git.listServerRefs({
      http,
      url: gitUrl,
      prefix: 'HEAD',
    });

    return {
      success: true,
      data: {
        url: gitUrl,
        ref_count: refs.length,
        response_time_ms: Date.now() - start,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    if (message.includes('401') || message.includes('403') || message.includes('Authentication')) {
      return {
        success: false,
        error: {
          code: 'AUTH_FAILED',
          message: `Authentication failed for repository: ${gitUrl}`,
          step: '02-test-git-access',
          severity: 'error',
          recoverable: true,
          details: { url: gitUrl, error_output: message },
        },
      };
    }

    if (message.includes('404') || message.includes('not found')) {
      return {
        success: false,
        error: {
          code: 'REPO_NOT_FOUND',
          message: `Repository not found: ${gitUrl}`,
          step: '02-test-git-access',
          severity: 'error',
          recoverable: true,
          details: { url: gitUrl, error_output: message },
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'GIT_ACCESS_ERROR',
        message: `Failed to access repository: ${message}`,
        step: '02-test-git-access',
        severity: 'error',
        recoverable: true,
        details: { url: gitUrl, error_output: message },
      },
    };
  }
}
