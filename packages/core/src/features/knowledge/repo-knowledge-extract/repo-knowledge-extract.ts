import type { Database } from 'sql.js';
import type { FlowEmitter, FlowResult } from '@nori/shared';
import { createNoopEmitter } from '../../shared/utils/flow-emitter.js';
import { queryAll } from '../../shared/utils/database.js';
import type { LlmMessage } from '../../shared/utils/llm-client.js';
import { scanRepository } from './actions/scan-repository.js';
import type { ScannedRepository } from './actions/scan-repository.js';
import { categorizeFiles } from './actions/categorize-files.js';
import type { CategorizedFiles } from './actions/categorize-files.js';
import { buildAnalysisPrompt } from './actions/build-analysis-prompt.js';
import type { VaultContext } from './actions/build-analysis-prompt.js';
import { callLlmAnalyze } from './actions/call-llm-analyze.js';
import type { LlmAnalysisResult } from './actions/call-llm-analyze.js';
import { validateProposals } from './actions/validate-proposals.js';

export interface RepoKnowledgeExtractInput {
  project_path: string;
  vault_id: string;
  db: Database;
  // For multi-turn conversation: cached data from previous runs
  cached_scan?: ScannedRepository;
  cached_categories?: CategorizedFiles;
  cached_vault_context?: VaultContext;
  cached_initial_user_message?: string;
  // Conversation history for multi-turn
  messages?: LlmMessage[];
}

export type { LlmAnalysisResult } from './actions/call-llm-analyze.js';
export type { ScannedRepository } from './actions/scan-repository.js';
export type { CategorizedFiles } from './actions/categorize-files.js';
export type { VaultContext } from './actions/build-analysis-prompt.js';

function loadVaultContext(db: Database, vaultId: string): VaultContext {
  const entries = queryAll(db, 'SELECT title, category FROM knowledge_entries WHERE vault_id = ?', [vaultId]);
  const existing_categories = [...new Set(entries.map((e) => String(e.category)))];
  const sample_titles = entries.slice(0, 10).map((e) => String(e.title));
  return { existing_categories, sample_titles };
}

export async function runRepoKnowledgeExtract(
  input: RepoKnowledgeExtractInput,
  emitter?: FlowEmitter
): Promise<FlowResult<LlmAnalysisResult>> {
  const emit = emitter ?? createNoopEmitter();

  emit.emit('repo-extract:started', { project_path: input.project_path });

  // Determine if this is a follow-up conversation turn
  const isFollowUp = input.messages && input.messages.length > 0;

  let scanned: ScannedRepository;
  let categorized: CategorizedFiles;
  let vaultContext: VaultContext;
  let initialUserMessage: string | undefined;

  if (isFollowUp && input.cached_scan && input.cached_categories && input.cached_vault_context) {
    // Use cached data for follow-up turns
    scanned = input.cached_scan;
    categorized = input.cached_categories;
    vaultContext = input.cached_vault_context;
    initialUserMessage = input.cached_initial_user_message;
  } else {
    // Step 01: Scan repository
    emit.emit('repo-extract:scanning', { project_path: input.project_path });
    const scanResult = scanRepository(input.project_path);
    if (!scanResult.success) return scanResult;
    scanned = scanResult.data;
    emit.emit('repo-extract:scan-complete', {
      file_count: scanned.files.length,
      categories_found: [...new Set(scanned.files.map((f) => f.category_hint))],
    });

    // Step 02: Categorize files
    const catResult = categorizeFiles(scanned);
    categorized = catResult.data;

    // Load vault context
    vaultContext = loadVaultContext(input.db, input.vault_id);
  }

  // Step 03: Build analysis prompt
  emit.emit('repo-extract:analyzing', { batch: 1, total_batches: 1 });
  const promptResult = buildAnalysisPrompt(
    categorized,
    scanned.structure_summary,
    scanned.detected_patterns,
    vaultContext,
    input.messages
  );
  // If follow-up, rebuild messages with initial context + conversation history
  const messages = isFollowUp && input.messages
    ? input.messages
    : promptResult.data.messages;

  // Step 04: Call LLM
  emit.emit('repo-extract:llm-thinking', { message: 'Analyzing repository...' });
  const llmResult = await callLlmAnalyze(
    promptResult.data.system_prompt,
    messages
  );
  if (!llmResult.success) return llmResult;

  const analysis = llmResult.data;

  // If LLM asked questions, return early
  if (analysis.status === 'questions') {
    emit.emit('repo-extract:questions', {
      questions: analysis.questions ?? [],
      message: analysis.message ?? '',
    });
    emit.emit('repo-extract:completed', {
      session_id: '',
      status: 'questions',
    });
    return { success: true, data: analysis };
  }

  // Step 05: Validate proposals
  if (analysis.proposals && analysis.proposals.length > 0) {
    const existingTitles = queryAll(
      input.db,
      'SELECT title FROM knowledge_entries WHERE vault_id = ?',
      [input.vault_id]
    ).map((e) => String(e.title));

    const validateResult = validateProposals(analysis.proposals, existingTitles);

    analysis.proposals = validateResult.data.proposals;

    emit.emit('repo-extract:proposals-ready', {
      proposal_count: analysis.proposals.length,
    });
  }

  emit.emit('repo-extract:completed', {
    session_id: '',
    status: 'proposals',
  });

  return { success: true, data: analysis };
}
