import { execSync } from 'node:child_process';
import type { AnthropicAccessType } from '@nori/shared';

export interface AnthropicAccessResult {
  has_access: boolean;
  access_type: AnthropicAccessType;
  subscription_type?: string;
  email?: string;
}

interface ClaudeAuthStatus {
  loggedIn: boolean;
  authMethod?: string;
  apiProvider?: string;
  email?: string;
  orgId?: string;
  orgName?: string;
  subscriptionType?: string;
}

export async function checkAnthropicAccess(): Promise<AnthropicAccessResult> {
  // Path 1: Claude CLI auth (preferred — captures subscription type + email)
  const cliResult = checkCliAuth();
  if (cliResult.has_access) return cliResult;

  // Path 2: ANTHROPIC_API_KEY env var
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    const valid = await validateApiKey(apiKey);
    if (valid) return { has_access: true, access_type: 'api_key' };
  }

  return { has_access: false, access_type: 'none' };
}

function checkCliAuth(): AnthropicAccessResult {
  try {
    const raw = execSync('claude auth status', {
      encoding: 'utf-8',
      timeout: 8000,
    }).trim();

    // `claude auth status` outputs JSON in all recent versions
    try {
      const status = JSON.parse(raw) as ClaudeAuthStatus;
      if (status.loggedIn) {
        return {
          has_access: true,
          access_type: 'cli_auth',
          subscription_type: status.subscriptionType,
          email: status.email,
        };
      }
    } catch {
      // Not JSON — check text output for "logged in" indicators
      const lower = raw.toLowerCase();
      const notAuth =
        lower.includes('not logged in') ||
        lower.includes('unauthenticated') ||
        lower.includes('not authenticated');

      if (!notAuth && raw.length > 0) {
        return { has_access: true, access_type: 'cli_auth' };
      }
    }
  } catch {
    // claude command not found or timed out
  }

  return { has_access: false, access_type: 'none' };
}

async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    });
    return res.status === 200;
  } catch {
    return false;
  }
}
