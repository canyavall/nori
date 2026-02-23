import { join } from 'node:path';
import { homedir } from 'node:os';
import { readFileSync, existsSync } from 'node:fs';
import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import type { FlowError } from '@nori/shared';

interface ClaudeCredentials {
  claudeAiOauth?: { accessToken: string };
}

export type AuthSource =
  | { type: 'api_key'; key: string }
  | { type: 'oauth'; token: string }
  | { type: 'none' };

export interface LlmMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LlmCallOptions {
  model?: string;
  maxOutputTokens?: number;
  system: string;
  messages: LlmMessage[];
}

export function resolveAuth(): AuthSource {
  // 1. Explicit API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) return { type: 'api_key', key: apiKey };

  // 2. Claude Code subscription OAuth token
  const credPath = join(homedir(), '.claude', '.credentials.json');
  if (existsSync(credPath)) {
    try {
      const creds = JSON.parse(readFileSync(credPath, 'utf-8')) as ClaudeCredentials;
      const token = creds.claudeAiOauth?.accessToken;
      if (token) return { type: 'oauth', token };
    } catch {
      // malformed credentials
    }
  }

  return { type: 'none' };
}

export function noAuthError(): FlowError {
  return {
    success: false,
    error: {
      code: 'NO_AUTH',
      message: 'No Anthropic credentials found. Set ANTHROPIC_API_KEY or log in with the Claude CLI (`claude login`).',
      severity: 'fatal',
      recoverable: false,
    },
  };
}

export async function callAnthropicApi(
  auth: AuthSource,
  options: LlmCallOptions
): Promise<string> {
  const model = options.model ?? 'claude-haiku-4-5-20251001';
  const maxOutputTokens = options.maxOutputTokens ?? 4096;

  if (auth.type === 'api_key') {
    const anthropic = createAnthropic({ apiKey: auth.key });
    const result = await generateText({
      model: anthropic(model),
      system: options.system,
      messages: options.messages.map((m: LlmMessage) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      maxOutputTokens,
    });
    return result.text;
  }

  // OAuth subscription: use Bearer token with beta header
  const body = {
    model,
    max_tokens: maxOutputTokens,
    system: options.system,
    messages: options.messages.map((m: LlmMessage) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'oauth-2025-04-20',
      'Authorization': `Bearer ${(auth as { type: 'oauth'; token: string }).token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err?.error?.message ?? `Anthropic API error ${res.status}`);
  }

  const data = await res.json() as { content: Array<{ type: string; text: string }> };
  return data.content.find((b) => b.type === 'text')?.text ?? '';
}
