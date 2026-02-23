import type { Database } from 'sql.js';
import type { FlowResult, KnowledgeProposal } from '@nori/shared';
import { gatherContext } from './actions/gather-context.js';
import { callLlm } from './actions/call-llm.js';

export interface KnowledgeAiGenerateInput {
  vault_id: string;
  prompt: string;
  db: Database;
}

export interface KnowledgeAiGenerateOutput {
  proposals: KnowledgeProposal[];
}

export async function runKnowledgeAiGenerate(
  input: KnowledgeAiGenerateInput
): Promise<FlowResult<KnowledgeAiGenerateOutput>> {
  const contextResult = gatherContext(input.db, input.vault_id);
  if (!contextResult.success) return contextResult;

  const llmResult = await callLlm(contextResult.data, input.prompt);
  if (!llmResult.success) return llmResult;

  return { success: true, data: { proposals: llmResult.data.proposals } };
}
