import { readFileSync } from 'node:fs';
import matter from 'gray-matter';
import type { StepResult } from '@nori/shared';

export interface ParsedEntry {
  file_path: string;
  frontmatter: Record<string, unknown>;
  content: string;
}

export interface ParseResult {
  entries: ParsedEntry[];
  parsed_count: number;
  skipped_count: number;
  parse_duration_ms: number;
}

export function parseFrontmatter(filePaths: string[]): StepResult<ParseResult> {
  const start = Date.now();
  const entries: ParsedEntry[] = [];
  let skipped = 0;

  for (const filePath of filePaths) {
    try {
      const raw = readFileSync(filePath, 'utf-8');
      const { data, content } = matter(raw);
      entries.push({ file_path: filePath, frontmatter: data, content });
    } catch {
      skipped++;
    }
  }

  return {
    success: true,
    data: {
      entries,
      parsed_count: entries.length,
      skipped_count: skipped,
      parse_duration_ms: Date.now() - start,
    },
  };
}
