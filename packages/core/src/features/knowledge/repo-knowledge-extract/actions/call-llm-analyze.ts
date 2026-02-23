import type { StepResult, FlowError, KnowledgeProposal } from '@nori/shared';
import { resolveAuth, callAnthropicApi, noAuthError } from '../../../shared/utils/llm-client.js';
import type { LlmMessage } from '../../../shared/utils/llm-client.js';

export interface LlmAnalysisResult {
  status: 'questions' | 'proposals';
  questions?: string[];
  proposals?: KnowledgeProposal[];
  message?: string;
  raw_response?: string;
}

interface LlmJsonResponse {
  status: 'questions' | 'proposals';
  questions?: string[];
  proposals?: Array<Record<string, unknown>>;
  message?: string;
}

function extractJson(text: string): LlmJsonResponse {
  // Try to find a JSON object in the response
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object found in LLM response');
  }
  return JSON.parse(text.slice(start, end + 1)) as LlmJsonResponse;
}

function normalizeProposal(raw: Record<string, unknown>): KnowledgeProposal {
  return {
    title: String(raw.title ?? 'Untitled'),
    category: String(raw.category ?? 'general').toLowerCase().replace(/\s+/g, '-'),
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    description: String(raw.description ?? ''),
    required_knowledge: Array.isArray(raw.required_knowledge) ? raw.required_knowledge.map(String) : [],
    rules: Array.isArray(raw.rules) ? raw.rules.map(String) : [],
    optional_knowledge: Array.isArray(raw.optional_knowledge) ? raw.optional_knowledge.map(String) : undefined,
    content: String(raw.content ?? ''),
  };
}

export async function callLlmAnalyze(
  systemPrompt: string,
  messages: LlmMessage[]
): Promise<StepResult<LlmAnalysisResult> | FlowError> {
  const auth = resolveAuth();
  if (auth.type === 'none') return noAuthError();

  try {
    const text = await callAnthropicApi(auth, {
      model: 'claude-sonnet-4-6-20250514',
      maxOutputTokens: 8192,
      system: systemPrompt,
      messages,
    });

    const parsed = extractJson(text);

    if (parsed.status === 'questions') {
      const questions = Array.isArray(parsed.questions)
        ? parsed.questions.map(String)
        : [];
      return {
        success: true,
        data: {
          status: 'questions',
          questions,
          message: parsed.message ? String(parsed.message) : undefined,
          raw_response: text,
        },
      };
    }

    if (parsed.status === 'proposals') {
      const proposals = Array.isArray(parsed.proposals)
        ? parsed.proposals.map(normalizeProposal)
        : [];

      if (proposals.length === 0) {
        return {
          success: false,
          error: {
            code: 'EMPTY_PROPOSALS',
            message: 'LLM returned proposals status but no proposals',
            severity: 'fatal',
            recoverable: false,
          },
        };
      }

      return {
        success: true,
        data: {
          status: 'proposals',
          proposals,
          message: parsed.message ? String(parsed.message) : undefined,
          raw_response: text,
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'INVALID_LLM_RESPONSE',
        message: `LLM returned unknown status: ${String(parsed.status)}`,
        severity: 'fatal',
        recoverable: false,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: {
        code: 'LLM_ERROR',
        message: `LLM analysis failed: ${msg}`,
        severity: 'fatal',
        recoverable: false,
      },
    };
  }
}
