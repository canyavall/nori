import { join } from 'node:path';
import { homedir } from 'node:os';
import { readFileSync, existsSync } from 'node:fs';
import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import type { StepResult, FlowError, KnowledgeProposal } from '@nori/shared';
import type { VaultContext } from './gather-context.js';

interface ClaudeCredentials {
  claudeAiOauth?: { accessToken: string };
}

type AuthSource =
  | { type: 'api_key'; key: string }
  | { type: 'oauth'; token: string }
  | { type: 'none' };

function resolveAuth(): AuthSource {
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

async function callAnthropicApi(
  auth: AuthSource,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  if (auth.type === 'api_key') {
    const anthropic = createAnthropic({ apiKey: auth.key });
    const result = await generateText({
      model: anthropic('claude-haiku-4-5-20251001'),
      system: systemPrompt,
      prompt: userMessage,
      maxTokens: 4096,
    });
    return result.text;
  }

  // OAuth subscription: use Bearer token with beta header
  const body = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
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

function extractJsonArray(text: string): KnowledgeProposal[] {
  // Find outermost [ ... ] to handle any preamble/postamble from the model
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON array found in LLM response');
  }
  return JSON.parse(text.slice(start, end + 1)) as KnowledgeProposal[];
}

export async function callLlm(
  context: VaultContext,
  prompt: string
): Promise<StepResult<{ proposals: KnowledgeProposal[] }> | FlowError> {
  const auth = resolveAuth();
  if (auth.type === 'none') {
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

  const categoryHint = context.existing_categories.length > 0
    ? `Existing categories in this vault: ${context.existing_categories.join(', ')}.`
    : 'No existing categories yet — suggest appropriate ones.';

  const titlesHint = context.sample_titles.length > 0
    ? `Some existing entry titles for style reference: ${context.sample_titles.join('; ')}.`
    : '';

  const systemPrompt = `You are a knowledge base assistant for a software development project called "${context.vault_name}".
Your job is to generate structured knowledge entries based on user requests.
${categoryHint}
${titlesHint}

Always respond with a valid JSON array (no markdown, no explanation — raw JSON only).
Each entry must have: title (string), category (string, lowercase slug like "guide" or "reference"), tags (string array), content (markdown string).
Generate 1 to 3 focused entries. Each entry should be self-contained and useful.`;

  const userMessage = `User request: ${prompt}

Return a JSON array of knowledge proposals. Example format:
[
  {
    "title": "How to do X",
    "category": "guide",
    "tags": ["x", "howto"],
    "content": "# How to do X\\n\\nExplanation..."
  }
]`;

  try {
    const text = await callAnthropicApi(auth, systemPrompt, userMessage);
    const parsed = extractJsonArray(text);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return {
        success: false,
        error: { code: 'INVALID_LLM_RESPONSE', message: 'LLM returned empty or non-array response', severity: 'fatal', recoverable: false },
      };
    }

    const proposals: KnowledgeProposal[] = parsed.map((p) => ({
      title: String(p.title ?? 'Untitled'),
      category: String(p.category ?? 'general').toLowerCase().replace(/\s+/g, '-'),
      tags: Array.isArray(p.tags) ? p.tags.map(String) : [],
      content: String(p.content ?? ''),
    }));

    return { success: true, data: { proposals } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: { code: 'LLM_ERROR', message: `LLM call failed: ${msg}`, severity: 'fatal', recoverable: false },
    };
  }
}
