import { readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { StepResult, FlowError } from '@nori/shared';

export interface GitCredentialsResult {
  has_ssh_key: boolean;
  ssh_key_type?: string;
  has_credential_helper: boolean;
  credential_helper?: string;
}

const SSH_KEY_PREFIXES = ['id_rsa', 'id_ed25519', 'id_ecdsa'];

export function checkGitCredentials(): StepResult<GitCredentialsResult> | FlowError {
  // Check for SSH keys
  let has_ssh_key = false;
  let ssh_key_type: string | undefined;

  try {
    const sshDir = join(homedir(), '.ssh');
    const files = readdirSync(sshDir);
    for (const prefix of SSH_KEY_PREFIXES) {
      if (files.includes(prefix)) {
        has_ssh_key = true;
        ssh_key_type = prefix.replace('id_', '');
        break;
      }
    }
  } catch {
    // ~/.ssh doesn't exist or isn't readable
  }

  // Check for credential helper
  let has_credential_helper = false;
  let credential_helper: string | undefined;

  try {
    const helper = execSync('git config --global credential.helper', { encoding: 'utf-8' }).trim();
    if (helper) {
      has_credential_helper = true;
      credential_helper = helper;
    }
  } catch {
    // No credential helper configured
  }

  return {
    success: true,
    data: { has_ssh_key, ssh_key_type, has_credential_helper, credential_helper },
  };
}
