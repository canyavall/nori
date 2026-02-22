import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { knowledgeFrontmatterSchema } from '@nori/shared';
import type { StepResult, FlowError } from '@nori/shared';
import type { DbEntry } from './load-all-entries.js';

export interface FrontmatterValidationResult {
  valid: string[];
  invalid: string[];
}

export function validateFrontmatter(
  entries: DbEntry[],
  vaultPath: string
): StepResult<FrontmatterValidationResult> | FlowError {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const entry of entries) {
    try {
      const fullPath = join(vaultPath, entry.file_path);
      const raw = readFileSync(fullPath, 'utf-8');
      const { data } = matter(raw);
      const result = knowledgeFrontmatterSchema.safeParse(data);

      if (result.success) {
        valid.push(entry.file_path);
      } else {
        invalid.push(entry.file_path);
      }
    } catch {
      invalid.push(entry.file_path);
    }
  }

  return {
    success: true,
    data: { valid, invalid },
  };
}
