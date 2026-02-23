import type { StepResult } from '@nori/shared';
import type { ScannedFile, ScannedRepository } from './scan-repository.js';

export interface FileGroup {
  category: string;
  files: Array<{ relative_path: string; content: string; size: number }>;
  total_chars: number;
}

export interface CategorizedFiles {
  categories: Record<string, FileGroup>;
  total_chars: number;
  file_count: number;
}

// Max total chars to include in LLM context (~100K chars)
const MAX_TOTAL_CHARS = 100_000;

// Priority order for categories (higher priority = included first)
const CATEGORY_PRIORITY: Record<string, number> = {
  documentation: 1,
  config: 2,
  cicd: 3,
  dependencies: 4,
  source: 5,
};

function prioritize(files: ScannedFile[]): ScannedFile[] {
  return [...files].sort((a, b) => {
    const pa = CATEGORY_PRIORITY[a.category_hint] ?? 99;
    const pb = CATEGORY_PRIORITY[b.category_hint] ?? 99;
    if (pa !== pb) return pa - pb;
    // Within same category, smaller files first (more likely to be config/docs)
    return a.size - b.size;
  });
}

export function categorizeFiles(
  scanned: ScannedRepository
): StepResult<CategorizedFiles> {
  const sorted = prioritize(scanned.files);
  const categories: Record<string, FileGroup> = {};
  let totalChars = 0;

  for (const file of sorted) {
    if (totalChars >= MAX_TOTAL_CHARS) break;

    const remaining = MAX_TOTAL_CHARS - totalChars;
    const content = file.content.length > remaining
      ? file.content.slice(0, remaining) + '\n... [truncated]'
      : file.content;

    if (!categories[file.category_hint]) {
      categories[file.category_hint] = {
        category: file.category_hint,
        files: [],
        total_chars: 0,
      };
    }

    const group = categories[file.category_hint];
    group.files.push({
      relative_path: file.relative_path,
      content,
      size: file.size,
    });
    group.total_chars += content.length;
    totalChars += content.length;
  }

  return {
    success: true,
    data: {
      categories,
      total_chars: totalChars,
      file_count: Object.values(categories).reduce((sum, g) => sum + g.files.length, 0),
    },
  };
}
