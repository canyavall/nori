import type { Database } from 'sql.js';
import type { FlowEmitter, FlowResult } from '@nori/shared';
import { createNoopEmitter } from '../../shared/utils/flow-emitter.js';
import { loadIndex } from './actions/load-index.js';
import { parseQuery } from './actions/parse-query.js';
import { matchEntries } from './actions/match-entries.js';
import { scoreRelevance } from './actions/score-relevance.js';
import { semanticSearch } from './actions/semantic-search.js';
import { mergeResults } from './actions/merge-results.js';
import { outputResults, type SearchResult } from './actions/output-results.js';

export interface KnowledgeSearchInput {
  query: string;
  vault_id?: string;
  db: Database;
}

export interface KnowledgeSearchResult {
  results: SearchResult[];
  total_count: number;
}

export async function runKnowledgeSearch(
  input: KnowledgeSearchInput,
  emitter?: FlowEmitter
): Promise<FlowResult<KnowledgeSearchResult>> {
  const emit = emitter ?? createNoopEmitter();

  emit.emit('knowledge:search:started', { query: input.query });

  // Step 01: Load index
  emit.emit('knowledge:search:loading-index', { vault_id: input.vault_id });
  const loadResult = loadIndex(input.db, input.vault_id);
  if (!loadResult.success) return loadResult;
  emit.emit('knowledge:search:index-loaded', { entry_count: loadResult.data.entry_count });

  // Step 02: Parse query
  emit.emit('knowledge:search:parsing-query', { query: input.query });
  const parseResult = parseQuery(input.query);
  emit.emit('knowledge:search:query-parsed', {
    filter_count: parseResult.data.filter_count,
    text: parseResult.data.text,
  });

  // Step 03: Match entries
  emit.emit('knowledge:search:matching', { total_count: loadResult.data.entry_count });
  const matchResult = matchEntries(loadResult.data.entries, parseResult.data);
  emit.emit('knowledge:search:matched', {
    matched_count: matchResult.data.matched_count,
    total_count: matchResult.data.total_count,
  });

  // Step 04: Score relevance
  emit.emit('knowledge:search:scoring', { matched_count: matchResult.data.matched_count });
  const scoreResult = scoreRelevance(matchResult.data.matched_entries, parseResult.data);
  emit.emit('knowledge:search:scored', {
    scored_count: scoreResult.data.scored_count,
    top_score: scoreResult.data.top_score,
  });

  // Step 05: Semantic search
  emit.emit('knowledge:search:semantic-searching', { query: parseResult.data.text });
  const semanticResult = semanticSearch(parseResult.data.text);
  emit.emit('knowledge:search:semantic-complete', {
    result_count: semanticResult.data.result_count,
  });

  // Step 06: Merge results
  emit.emit('knowledge:search:merging', {
    keyword_count: scoreResult.data.scored_count,
    semantic_count: semanticResult.data.result_count,
  });
  const mergeResult = mergeResults(scoreResult.data.scored_entries, semanticResult.data.results);
  emit.emit('knowledge:search:merged', {
    merged_count: mergeResult.data.merged_count,
    duplicates_removed: mergeResult.data.duplicates_removed,
  });

  // Step 07: Output results
  emit.emit('knowledge:search:formatting', { merged_count: mergeResult.data.merged_count });
  const outputResult = outputResults(mergeResult.data.merged_entries);
  emit.emit('knowledge:search:completed', {
    result_count: outputResult.data.results.length,
    total_count: outputResult.data.total_count,
  });

  return {
    success: true,
    data: {
      results: outputResult.data.results,
      total_count: outputResult.data.total_count,
    },
  };
}
