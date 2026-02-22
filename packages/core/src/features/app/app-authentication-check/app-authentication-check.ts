import type { FlowEmitter, FlowResult } from '@nori/shared';
import { createNoopEmitter } from '../../shared/utils/flow-emitter.js';
import { checkClaudeCodeAccess } from './actions/check-claude-code-access.js';
import { checkGitCredentials } from './actions/check-git-credentials.js';
import { selfHeal, type SelfHealResult } from './actions/self-heal.js';
import { checkAnthropicAccess, type AnthropicAccessResult } from './actions/check-anthropic-access.js';

export interface AuthenticationCheckResult {
  cli_installed: boolean;
  cli_version?: string;
  cli_path?: string;
  has_ssh_key: boolean;
  ssh_key_type?: string;
  has_credential_helper: boolean;
  credential_helper?: string;
  self_heal: SelfHealResult;
  // Anthropic access
  has_anthropic_access: boolean;
  anthropic_access_type: AnthropicAccessResult['access_type'];
  subscription_type?: string;
  anthropic_email?: string;
}

export async function runAppAuthenticationCheck(
  emitter?: FlowEmitter
): Promise<FlowResult<AuthenticationCheckResult>> {
  const emit = emitter ?? createNoopEmitter();

  emit.emit('app:authentication-check:started', {});

  // Step 01: Check Claude Code access
  emit.emit('app:authentication-check:checking-claude-code-access', {});
  const cliResult = checkClaudeCodeAccess();
  if (!cliResult.success) return cliResult;

  // Step 02: Check git credentials
  emit.emit('app:authentication-check:checking-git-credentials', {});
  const gitResult = checkGitCredentials();
  if (!gitResult.success) return gitResult;

  // Step 03: Self-heal (only if issues found)
  const needsHeal =
    !cliResult.data.installed ||
    (!gitResult.data.has_ssh_key && !gitResult.data.has_credential_helper);
  let healResult: SelfHealResult = { issues: [], instructions: [] };

  if (needsHeal) {
    emit.emit('app:authentication-check:self-healing', {
      cli_installed: cliResult.data.installed,
      has_ssh_key: gitResult.data.has_ssh_key,
      has_credential_helper: gitResult.data.has_credential_helper,
    });
    const healStepResult = selfHeal({
      cli_installed: cliResult.data.installed,
      has_ssh_key: gitResult.data.has_ssh_key,
      has_credential_helper: gitResult.data.has_credential_helper,
    });
    if (!healStepResult.success) return healStepResult;
    healResult = healStepResult.data;
  }

  // Step 04: Check Anthropic access (API key or CLI subscription)
  emit.emit('app:authentication-check:checking-anthropic-access', {});
  const anthropicResult = await checkAnthropicAccess();

  emit.emit('app:authentication-check:completed', {
    cli_installed: cliResult.data.installed,
    has_ssh_key: gitResult.data.has_ssh_key,
    has_credential_helper: gitResult.data.has_credential_helper,
    has_anthropic_access: anthropicResult.has_access,
    issues_count: healResult.issues.length,
  });

  return {
    success: true,
    data: {
      cli_installed: cliResult.data.installed,
      cli_version: cliResult.data.cli_version,
      cli_path: cliResult.data.cli_path,
      has_ssh_key: gitResult.data.has_ssh_key,
      ssh_key_type: gitResult.data.ssh_key_type,
      has_credential_helper: gitResult.data.has_credential_helper,
      credential_helper: gitResult.data.credential_helper,
      self_heal: healResult,
      has_anthropic_access: anthropicResult.has_access,
      anthropic_access_type: anthropicResult.access_type,
      subscription_type: anthropicResult.subscription_type,
      anthropic_email: anthropicResult.email,
    },
  };
}
