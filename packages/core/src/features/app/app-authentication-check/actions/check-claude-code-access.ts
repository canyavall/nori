import { execSync } from 'node:child_process';
import type { StepResult, FlowError } from '@nori/shared';

export interface ClaudeCodeAccessResult {
  installed: boolean;
  cli_version?: string;
  cli_path?: string;
}

export function checkClaudeCodeAccess(): StepResult<ClaudeCodeAccessResult> | FlowError {
  let cli_path: string | undefined;
  try {
    const lookupCmd = process.platform === 'win32' ? 'where claude' : 'which claude';
    cli_path = execSync(lookupCmd, { encoding: 'utf-8' }).trim().split('\n')[0].trim();
  } catch {
    return { success: true, data: { installed: false } };
  }

  let cli_version: string | undefined;
  try {
    cli_version = execSync('claude --version', { encoding: 'utf-8' }).trim();
  } catch {
    // CLI found but version check failed — still report as installed
    return { success: true, data: { installed: true, cli_path } };
  }

  return { success: true, data: { installed: true, cli_version, cli_path } };
}
