import type { StepResult } from '@nori/shared';
import type { ScoredEntry } from './score-relevance.js';

export interface SearchResult {
  entry_id: string;
  title: string;
  file_path: string;
  category: string;
  tags: string[];
  score: number;
}

export interface OutputResult {
  results: SearchResult[];
  total_count: number;
}

const MAX_RESULTS = 20;

export function outputResults(
  mergedEntries: ScoredEntry[]
): StepResult<OutputResult> {
  const limited = mergedEntries.slice(0, MAX_RESULTS);

  const results: SearchResult[] = limited.map((item) => ({
    entry_id: item.entry.id,
    title: item.entry.title,
    file_path: item.entry.file_path,
    category: item.entry.category,
    tags: item.entry.tags,
    score: item.score,
  }));

  return {
    success: true,
    data: {
      results,
      total_count: mergedEntries.length,
    },
  };
}
