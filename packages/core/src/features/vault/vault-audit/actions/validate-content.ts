import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import type { StepResult, FlowError } from '@nori/shared';
import type { DbEntry } from './load-all-entries.js';

export interface ContentValidationResult {
  valid: string[];
  empty: string[];
}

export function validateContent(
  entries: DbEntry[],
  vaultPath: string
): StepResult<ContentValidationResult> | FlowError {
  const valid: string[] = [];
  const empty: string[] = [];

  for (const entry of entries) {
    try {
      const fullPath = join(vaultPath, entry.file_path);
      const raw = readFileSync(fullPath, 'utf-8');
      const { content } = matter(raw);

      if (content.trim().length > 0) {
        valid.push(entry.file_path);
      } else {
        empty.push(entry.file_path);
      }
    } catch {
      empty.push(entry.file_path);
    }
  }

  return {
    success: true,
    data: { valid, empty },
  };
}
