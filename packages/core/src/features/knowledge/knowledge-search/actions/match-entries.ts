import type { StepResult, KnowledgeEntry } from '@nori/shared';
import type { ParsedQuery } from './parse-query.js';

export interface MatchResult {
  matched_entries: KnowledgeEntry[];
  matched_count: number;
  total_count: number;
  match_duration_ms: number;
}

export function matchEntries(
  entries: KnowledgeEntry[],
  query: ParsedQuery
): StepResult<MatchResult> {
  const start = Date.now();

  const matched = entries.filter((entry) => {
    // Filter by category if specified
    if (query.category) {
      if (entry.category.toLowerCase() !== query.category.toLowerCase()) {
        return false;
      }
    }

    // Filter by tags if specified (entry must have all queried tags)
    if (query.tags && query.tags.length > 0) {
      const entryTagsLower = entry.tags.map((t: string) => t.toLowerCase());
      const allTagsMatch = query.tags.every((qt) =>
        entryTagsLower.includes(qt.toLowerCase())
      );
      if (!allTagsMatch) return false;
    }

    // Filter by text (case-insensitive match on title or file_path)
    if (query.text) {
      const textLower = query.text.toLowerCase();
      const titleMatch = entry.title.toLowerCase().includes(textLower);
      const pathMatch = entry.file_path.toLowerCase().includes(textLower);
      if (!titleMatch && !pathMatch) return false;
    }

    return true;
  });

  return {
    success: true,
    data: {
      matched_entries: matched,
      matched_count: matched.length,
      total_count: entries.length,
      match_duration_ms: Date.now() - start,
    },
  };
}
