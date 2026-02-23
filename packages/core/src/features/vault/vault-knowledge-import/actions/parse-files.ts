import { readFileSync } from 'node:fs';
import matter from 'gray-matter';
import type { StepResult, FlowError } from '@nori/shared';

export interface ParsedEntry {
  file_path: string;
  title: string;
  category: string;
  tags: string[];
  content: string;
  created?: string;
  updated?: string;
}

export interface ParseResult {
  parsed: ParsedEntry[];
  skipped: Array<{ file_path: string; reason: string }>;
}

export function parseFiles(
  filePaths: string[]
): StepResult<ParseResult> | FlowError {
  const parsed: ParsedEntry[] = [];
  const skipped: Array<{ file_path: string; reason: string }> = [];

  for (const filePath of filePaths) {
    try {
      const raw = readFileSync(filePath, 'utf-8');
      const { data, content } = matter(raw);

      if (!data.title || typeof data.title !== 'string') {
        skipped.push({ file_path: filePath, reason: 'Missing or invalid title in frontmatter' });
        continue;
      }
      if (!data.category || typeof data.category !== 'string') {
        skipped.push({ file_path: filePath, reason: 'Missing or invalid category in frontmatter' });
        continue;
      }

      const tags = Array.isArray(data.tags)
        ? (data.tags as unknown[]).filter((t): t is string => typeof t === 'string')
        : [];

      parsed.push({
        file_path: filePath,
        title: data.title as string,
        category: data.category as string,
        tags,
        content: content.trim(),
        created: typeof data.created === 'string' ? data.created : undefined,
        updated: typeof data.updated === 'string' ? data.updated : undefined,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      skipped.push({ file_path: filePath, reason: `Read error: ${message}` });
    }
  }

  return { success: true, data: { parsed, skipped } };
}
