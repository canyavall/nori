import type { StepResult } from '@nori/shared';
import type { ScoredEntry } from './score-relevance.js';

export interface MergeResult {
  merged_entries: ScoredEntry[];
  merged_count: number;
  keyword_count: number;
  semantic_count: number;
  duplicates_removed: number;
}

export function mergeResults(
  keywordResults: ScoredEntry[],
  semanticResults: ScoredEntry[]
): StepResult<MergeResult> {
  const entryMap = new Map<string, ScoredEntry>();

  // Add keyword results first
  for (const item of keywordResults) {
    entryMap.set(item.entry.id, item);
  }

  // Merge semantic results, keeping highest score for duplicates
  let duplicatesRemoved = 0;
  for (const item of semanticResults) {
    const existing = entryMap.get(item.entry.id);
    if (existing) {
      duplicatesRemoved++;
      if (item.score > existing.score) {
        entryMap.set(item.entry.id, item);
      }
    } else {
      entryMap.set(item.entry.id, item);
    }
  }

  const merged = Array.from(entryMap.values());
  merged.sort((a, b) => b.score - a.score);

  return {
    success: true,
    data: {
      merged_entries: merged,
      merged_count: merged.length,
      keyword_count: keywordResults.length,
      semantic_count: semanticResults.length,
      duplicates_removed: duplicatesRemoved,
    },
  };
}
