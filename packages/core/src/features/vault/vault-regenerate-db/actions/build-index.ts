import { createHash } from 'node:crypto';
import { relative } from 'node:path';
import type { StepResult, KnowledgeEntry } from '@nori/shared';
import type { ValidatedEntry } from './validate-entries.js';

export interface IndexData {
  entries: KnowledgeEntry[];
  entry_count: number;
}

export function buildIndex(
  vaultId: string,
  vaultPath: string,
  validEntries: ValidatedEntry[]
): StepResult<IndexData> {
  const entries: KnowledgeEntry[] = validEntries.map((entry) => {
    const contentHash = createHash('sha256').update(entry.content).digest('hex').slice(0, 16);
    const now = new Date().toISOString();

    return {
      id: crypto.randomUUID(),
      vault_id: vaultId,
      file_path: relative(vaultPath, entry.file_path),
      title: entry.title,
      category: entry.category,
      tags: entry.tags,
      description: (entry.frontmatter.description as string) ?? '',
      required_knowledge: (entry.frontmatter.required_knowledge as string[]) ?? [],
      rules: (entry.frontmatter.rules as string[]) ?? [],
      content_hash: contentHash,
      created_at: (entry.frontmatter.created as string) ?? now,
      updated_at: (entry.frontmatter.updated as string) ?? now,
    };
  });

  return {
    success: true,
    data: {
      entries,
      entry_count: entries.length,
    },
  };
}
