import type { StepResult, FlowError, KnowledgeLlmAuditResult } from '@nori/shared';
import { resolveAuth, callAnthropicApi } from '../../../shared/utils/llm-client.js';

export interface VaultEntrySummary {
  title: string;
  category: string;
  tags: string[];
}

export async function callLlmAudit(
  fileContent: string,
  vaultEntries: VaultEntrySummary[]
): Promise<StepResult<KnowledgeLlmAuditResult> | FlowError> {
  const auth = resolveAuth();
  if (auth.type === 'none') {
    // Non-fatal: return a minimal result indicating LLM was unavailable
    return {
      success: true,
      data: buildUnavailableResult(fileContent),
    };
  }

  const tokenEstimate = Math.round(fileContent.length / 3.5);
  const tokenStatus: 'ok' | 'warn' | 'fail' =
    tokenEstimate < 2000 ? 'ok' : tokenEstimate < 2500 ? 'warn' : 'fail';

  const vaultEntriesJson = JSON.stringify(
    vaultEntries.map((e) => ({ title: e.title, category: e.category, tags: e.tags })),
    null,
    2
  );

  const system = `You are a knowledge quality auditor for an AI-assisted development tool called Nori.
You evaluate knowledge vault entries — markdown files with YAML frontmatter — for quality, accuracy, and LLM-friendliness.
You MUST respond with a single valid JSON object matching the schema below. No prose, no markdown, just JSON.

Schema:
{
  "overall_status": "pass" | "warn" | "fail",
  "overall_score": number (0-100),
  "summary": string,
  "findings": {
    "llm_friendly": { "status": "pass"|"warn"|"fail", "message": string },
    "has_real_knowledge": { "status": "pass"|"warn"|"fail", "message": string },
    "conciseness": { "status": "pass"|"warn"|"fail", "message": string },
    "tags": { "status": "pass"|"warn"|"fail", "message": string },
    "description": { "status": "pass"|"warn"|"fail", "message": string },
    "rules": { "status": "pass"|"warn"|"fail", "message": string },
    "required_knowledge": { "status": "pass"|"warn"|"fail", "message": string },
    "category": { "status": "pass"|"warn"|"fail", "message": string },
    "format": { "status": "pass"|"warn"|"fail", "message": string },
    "uniqueness": { "status": "pass"|"warn"|"fail", "message": string }
  },
  "suggestions": {
    "tags": string[],
    "description": string,
    "rules": string[],
    "required_knowledge": string[],
    "category": string,
    "split_recommended": boolean,
    "split_rationale": string | undefined,
    "similar_entries": Array<{ "title": string, "reason": string }>
  }
}

Scoring rubric:
- overall_score: weighted average. fail findings subtract 15 pts each, warn findings subtract 5 pts each. Start at 100.
- overall_status: fail if score < 60, warn if score < 80, pass otherwise.

Check definitions:
- llm_friendly: Is the content written for AI consumption? Clear headings, no ambiguous pronouns, structured writing?
- has_real_knowledge: Does this contain info an LLM would not know without this specific file?
- conciseness: No boilerplate, excessive examples, or filler. Good signal-to-noise ratio.
- tags: Specific to content, not generic catch-alls (not just "typescript", "component").
- description: Does the description field accurately summarize the content?
- rules: Are existing rules correct and actionable? Suggest additions if obvious gaps exist.
- required_knowledge: Are prerequisites correct? Suggest missing ones.
- category: Is the category appropriate given other vault entries' categories?
- format: Correct YAML frontmatter + valid markdown structure?
- uniqueness: Compare title and tags against other entries. Flag if this duplicates another entry.

For suggestions, provide concrete values the user could apply. Leave arrays empty if no changes needed.`;

  const userMessage = `Token estimate: ${tokenEstimate} (~${tokenStatus})

--- FILE CONTENT ---
${fileContent}

--- OTHER VAULT ENTRIES (title, category, tags only) ---
${vaultEntriesJson}

Audit this knowledge entry and return the JSON result.`;

  try {
    const raw = await callAnthropicApi(auth, {
      model: 'claude-sonnet-4-6-20250514',
      maxOutputTokens: 4096,
      system,
      messages: [{ role: 'user', content: userMessage }],
    });

    const parsed = JSON.parse(raw.trim()) as Omit<KnowledgeLlmAuditResult, 'token_estimate' | 'token_status'>;

    return {
      success: true,
      data: {
        token_estimate: tokenEstimate,
        token_status: tokenStatus,
        ...parsed,
      },
    };
  } catch (err) {
    // LLM call failed — return unavailable result (non-fatal)
    const result = buildUnavailableResult(fileContent);
    result.summary = `LLM analysis failed: ${err instanceof Error ? err.message : String(err)}`;
    return { success: true, data: result };
  }
}

function buildUnavailableResult(fileContent: string): KnowledgeLlmAuditResult {
  const tokenEstimate = Math.round(fileContent.length / 3.5);
  const tokenStatus: 'ok' | 'warn' | 'fail' =
    tokenEstimate < 2000 ? 'ok' : tokenEstimate < 2500 ? 'warn' : 'fail';

  const unavailable = { status: 'warn' as const, message: 'LLM unavailable — skipped' };
  return {
    token_estimate: tokenEstimate,
    token_status: tokenStatus,
    overall_status: 'warn',
    overall_score: 0,
    summary: 'LLM unavailable — structural checks only.',
    findings: {
      llm_friendly: unavailable,
      has_real_knowledge: unavailable,
      conciseness: unavailable,
      tags: unavailable,
      description: unavailable,
      rules: unavailable,
      required_knowledge: unavailable,
      category: unavailable,
      format: unavailable,
      uniqueness: unavailable,
    },
    suggestions: {
      tags: [],
      description: '',
      rules: [],
      required_knowledge: [],
      category: '',
      split_recommended: false,
      similar_entries: [],
    },
  };
}
