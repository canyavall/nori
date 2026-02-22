import type { StepResult, KnowledgeEntry } from '@nori/shared';
import type { ParsedQuery } from './parse-query.js';

export interface ScoredEntry {
  entry: KnowledgeEntry;
  score: number;
}

export interface ScoreResult {
  scored_entries: ScoredEntry[];
  scored_count: number;
  top_score: number;
  scoring_duration_ms: number;
}

export function scoreRelevance(
  entries: KnowledgeEntry[],
  query: ParsedQuery
): StepResult<ScoreResult> {
  const start = Date.now();

  const scored: ScoredEntry[] = entries.map((entry) => {
    let score = 0;

    if (query.text) {
      const textLower = query.text.toLowerCase();
      const titleLower = entry.title.toLowerCase();

      if (titleLower === textLower) {
        score += 10;
      } else if (titleLower.includes(textLower)) {
        score += 5;
      }
    }

    if (query.category && entry.category.toLowerCase() === query.category.toLowerCase()) {
      score += 3;
    }

    if (query.tags && query.tags.length > 0) {
      const entryTagsLower = entry.tags.map((t: string) => t.toLowerCase());
      for (const qt of query.tags) {
        if (entryTagsLower.includes(qt.toLowerCase())) {
          score += 2;
        }
      }
    }

    // Ensure a minimum score of 1 for matched entries
    if (score === 0) {
      score = 1;
    }

    return { entry, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const topScore = scored.length > 0 ? scored[0].score : 0;

  return {
    success: true,
    data: {
      scored_entries: scored,
      scored_count: scored.length,
      top_score: topScore,
      scoring_duration_ms: Date.now() - start,
    },
  };
}
