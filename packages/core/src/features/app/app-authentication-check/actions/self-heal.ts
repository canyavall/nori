import type { StepResult, FlowError } from '@nori/shared';

export interface SelfHealInput {
  cli_installed: boolean;
  has_ssh_key: boolean;
  has_credential_helper: boolean;
}

export interface SelfHealResult {
  issues: string[];
  instructions: string[];
}

export function selfHeal(input: SelfHealInput): StepResult<SelfHealResult> | FlowError {
  const issues: string[] = [];
  const instructions: string[] = [];

  if (!input.cli_installed) {
    issues.push('Claude Code CLI is not installed');
    instructions.push('Install Claude Code CLI: npm install -g @anthropic-ai/claude-code');
  }

  if (!input.has_ssh_key && !input.has_credential_helper) {
    issues.push('No git credentials configured (no SSH key and no credential helper)');
    instructions.push('Generate an SSH key: ssh-keygen -t ed25519 -C "your_email@example.com"');
    instructions.push('Or configure a git credential helper: git config --global credential.helper osxkeychain');
  } else if (!input.has_ssh_key) {
    issues.push('No SSH key found — using credential helper only');
    instructions.push('For SSH-based git access, generate a key: ssh-keygen -t ed25519 -C "your_email@example.com"');
  }

  return { success: true, data: { issues, instructions } };
}
