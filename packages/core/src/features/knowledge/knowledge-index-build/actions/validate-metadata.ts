import { knowledgeFrontmatterSchema } from '@nori/shared';
import type { StepResult } from '@nori/shared';
import type { ParsedEntry } from './parse-frontmatter.js';

export interface ValidatedEntry extends ParsedEntry {
  title: string;
  category: string;
  tags: string[];
  description: string;
  required_knowledge: string[];
  rules: string[];
}

export interface ValidateResult {
  valid_entries: ValidatedEntry[];
  valid_count: number;
  invalid_count: number;
  validation_duration_ms: number;
}

export function validateMetadata(entries: ParsedEntry[]): StepResult<ValidateResult> {
  const start = Date.now();
  const validEntries: ValidatedEntry[] = [];
  let invalidCount = 0;

  for (const entry of entries) {
    const result = knowledgeFrontmatterSchema.safeParse(entry.frontmatter);
    if (result.success) {
      validEntries.push({
        ...entry,
        title: result.data.title,
        category: result.data.category,
        tags: result.data.tags,
        description: result.data.description,
        required_knowledge: result.data.required_knowledge,
        rules: result.data.rules,
      });
    } else {
      invalidCount++;
    }
  }

  return {
    success: true,
    data: {
      valid_entries: validEntries,
      valid_count: validEntries.length,
      invalid_count: invalidCount,
      validation_duration_ms: Date.now() - start,
    },
  };
}
