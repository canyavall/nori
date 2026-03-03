import { readFileSync, existsSync } from 'node:fs';
import matter from 'gray-matter';
import type { StepResult, FlowError, KnowledgeFrontmatter } from '@nori/shared';

export interface LoadedEntry {
  file_path: string;
  frontmatter: KnowledgeFrontmatter;
  content: string;
  content_length: number;
}

export function loadExisting(filePath: string): StepResult<LoadedEntry> | FlowError {
  if (!existsSync(filePath)) {
    return {
      success: false,
      error: {
        code: 'ENTRY_NOT_FOUND',
        message: `Knowledge entry not found: ${filePath}`,
        step: '01-load-existing',
        severity: 'fatal',
        recoverable: false,
        details: { file_path: filePath },
      },
    };
  }

  try {
    const raw = readFileSync(filePath, 'utf-8');
    const parsed = matter(raw);

    const frontmatter: KnowledgeFrontmatter = {
      title: parsed.data.title ?? '',
      category: parsed.data.category ?? '',
      tags: Array.isArray(parsed.data.tags) ? parsed.data.tags : [],
      description: parsed.data.description ?? '',
      required_knowledge: Array.isArray(parsed.data.required_knowledge) ? parsed.data.required_knowledge : [],
      rules: Array.isArray(parsed.data.rules) ? parsed.data.rules : [],
      created: parsed.data.created,
      updated: parsed.data.updated,
    };

    return {
      success: true,
      data: {
        file_path: filePath,
        frontmatter,
        content: parsed.content,
        content_length: parsed.content.length,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    return {
      success: false,
      error: {
        code: 'PARSE_ERROR',
        message: `Failed to parse frontmatter in ${filePath}: ${message}`,
        step: '01-load-existing',
        severity: 'error',
        recoverable: true,
        details: { file_path: filePath, parse_error: message },
      },
    };
  }
}
