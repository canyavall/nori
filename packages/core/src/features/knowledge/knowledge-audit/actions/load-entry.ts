import { readFileSync } from 'node:fs';
import matter from 'gray-matter';
import type { StepResult, FlowError } from '@nori/shared';

export interface LoadedEntry {
  file_path: string;
  frontmatter: Record<string, unknown>;
  content: string;
}

export function loadEntry(filePath: string): StepResult<LoadedEntry> | FlowError {
  try {
    const raw = readFileSync(filePath, 'utf-8');
    const { data, content } = matter(raw);

    return {
      success: true,
      data: {
        file_path: filePath,
        frontmatter: data,
        content,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: {
        code: 'FILE_READ_FAILED',
        message: `Failed to read knowledge entry: ${message}`,
        step: '01-load-entry',
        severity: 'error',
        recoverable: false,
        details: { file_path: filePath, error: message },
      },
    };
  }
}
