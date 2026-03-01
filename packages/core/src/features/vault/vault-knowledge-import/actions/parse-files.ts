import { readFileSync } from 'node:fs';
import { basename, dirname } from 'node:path';
import matter from 'gray-matter';
import type { StepResult, FlowError } from '@nori/shared';

export interface ParsedEntry {
  file_path: string;
  parent_folder: string;        // basename of parent dir, slugified
  title: string | null;         // null if absent from frontmatter AND body heading
  category: string | null;      // null if absent from frontmatter
  tags: string[];
  description: string | null;
  rules: string[];
  required_knowledge: string[];
  content: string;
  created?: string;
  updated?: string;
}

export interface ParseResult {
  parsed: ParsedEntry[];
  skipped: Array<{ file_path: string; reason: string }>;
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function extractTitleFromContent(content: string): string | null {
  const match = /^#\s+(.+)$/m.exec(content);
  return match ? match[1].trim() : null;
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
      const trimmedContent = content.trim();

      const title =
        (typeof data.title === 'string' && data.title)
          ? data.title
          : extractTitleFromContent(trimmedContent);

      const category =
        (typeof data.category === 'string' && data.category) ? data.category : null;

      const tags = Array.isArray(data.tags)
        ? (data.tags as unknown[]).filter((t): t is string => typeof t === 'string')
        : [];

      const description =
        typeof data.description === 'string' ? data.description : null;

      const rules = Array.isArray(data.rules)
        ? (data.rules as unknown[]).filter((r): r is string => typeof r === 'string')
        : [];

      const required_knowledge = Array.isArray(data.required_knowledge)
        ? (data.required_knowledge as unknown[]).filter((r): r is string => typeof r === 'string')
        : [];

      const parent_folder = slugify(basename(dirname(filePath)));

      parsed.push({
        file_path: filePath,
        parent_folder,
        title,
        category,
        tags,
        description,
        rules,
        required_knowledge,
        content: trimmedContent,
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
