import type { StepResult, FlowError } from '@nori/shared';

export interface ParsedGitUrl {
  url: string;
  protocol: 'https' | 'ssh';
  host: string;
  repo_path: string;
}

const HTTPS_PATTERN = /^https:\/\/([^/]+)\/(.+?)(?:\.git)?$/;
const SSH_PATTERN = /^git@([^:]+):(.+?)(?:\.git)?$/;

export function validateUrl(gitUrl: string): StepResult<ParsedGitUrl> | FlowError {
  const httpsMatch = gitUrl.match(HTTPS_PATTERN);
  if (httpsMatch) {
    return {
      success: true,
      data: {
        url: gitUrl,
        protocol: 'https',
        host: httpsMatch[1],
        repo_path: httpsMatch[2],
      },
    };
  }

  const sshMatch = gitUrl.match(SSH_PATTERN);
  if (sshMatch) {
    return {
      success: true,
      data: {
        url: gitUrl,
        protocol: 'ssh',
        host: sshMatch[1],
        repo_path: sshMatch[2],
      },
    };
  }

  // Check if it's a known unsupported protocol
  if (/^(git|ftp|svn):\/\//.test(gitUrl)) {
    const protocol = gitUrl.split('://')[0];
    return {
      success: false,
      error: {
        code: 'UNSUPPORTED_PROTOCOL',
        message: `Unsupported git protocol: ${protocol}. Only HTTPS and SSH are supported.`,
        step: '01-validate-url',
        severity: 'error',
        recoverable: true,
        details: { url: gitUrl, protocol, supported_protocols: ['https', 'ssh'] },
      },
    };
  }

  return {
    success: false,
    error: {
      code: 'INVALID_URL',
      message: `Invalid git URL format: ${gitUrl}`,
      step: '01-validate-url',
      severity: 'error',
      recoverable: true,
      details: {
        url: gitUrl,
        expected_formats: [
          'https://github.com/owner/repo.git',
          'git@github.com:owner/repo.git',
        ],
      },
    },
  };
}
