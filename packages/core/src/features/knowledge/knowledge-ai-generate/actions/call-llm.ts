import type { StepResult, FlowError, KnowledgeProposal } from '@nori/shared';
import type { VaultContext } from './gather-context.js';
import { resolveAuth, callAnthropicApi, noAuthError } from '../../../shared/utils/llm-client.js';

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
  if (auth.type === 'none') return noAuthError();

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
Each entry must have: title (string), category (string, lowercase slug like "guide" or "reference"), tags (array of 3-12 lowercase kebab-case strings), description (string, max 300 chars), required_knowledge (string array of prerequisite topic names), rules (string array of rules this entry teaches), content (markdown string, max 10000 chars).
Generate 1 to 3 focused entries. Each entry should be self-contained and useful.`;

  const userMessage = `User request: ${prompt}

Return a JSON array of knowledge proposals. Example format:
[
  {
    "title": "How to do X",
    "category": "guide",
    "tags": ["my-topic", "how-to", "getting-started"],
    "description": "Explains how to do X step by step.",
    "required_knowledge": [],
    "rules": ["Always do Y before Z"],
    "content": "# How to do X\\n\\nExplanation..."
  }
]`;

  try {
    const text = await callAnthropicApi(auth, {
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });
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
      description: String(p.description ?? ''),
      required_knowledge: Array.isArray(p.required_knowledge) ? p.required_knowledge.map(String) : [],
      rules: Array.isArray(p.rules) ? p.rules.map(String) : [],
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
