import { existsSync, statSync } from 'node:fs';
import type { StepResult, FlowError } from '@nori/shared';

export interface ProjectPathResult {
  project_path: string;
  is_git_repo: boolean;
}

export function validateProjectPath(projectPath: string): StepResult<ProjectPathResult> | FlowError {
  if (!existsSync(projectPath)) {
    return {
      success: false,
      error: {
        code: 'PROJECT_NOT_FOUND',
        message: `Project directory does not exist: ${projectPath}`,
        step: '02-validate-project-path',
        severity: 'error',
        recoverable: true,
        details: { project_path: projectPath },
      },
    };
  }

  const stat = statSync(projectPath);
  if (!stat.isDirectory()) {
    return {
      success: false,
      error: {
        code: 'NOT_A_DIRECTORY',
        message: `Path is not a directory: ${projectPath}`,
        step: '02-validate-project-path',
        severity: 'error',
        recoverable: true,
        details: { project_path: projectPath },
      },
    };
  }

  const isGitRepo = existsSync(`${projectPath}/.git`);

  return {
    success: true,
    data: { project_path: projectPath, is_git_repo: isGitRepo },
  };
}
