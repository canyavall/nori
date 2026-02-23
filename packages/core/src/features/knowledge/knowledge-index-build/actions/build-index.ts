import { createHash } from 'node:crypto';
import { relative } from 'node:path';
import type { StepResult, KnowledgeEntry } from '@nori/shared';
import type { ValidatedEntry } from './validate-metadata.js';

export interface IndexData {
  entries: KnowledgeEntry[];
  entry_count: number;
  category_count: number;
  tag_count: number;
  build_duration_ms: number;
}

export function buildIndex(
  vaultId: string,
  vaultPath: string,
  validEntries: ValidatedEntry[]
): StepResult<IndexData> {
  const start = Date.now();
  const categories = new Set<string>();
  const tags = new Set<string>();

  const entries: KnowledgeEntry[] = validEntries.map((entry) => {
    categories.add(entry.category);
    entry.tags.forEach((t) => tags.add(t));

    const contentHash = createHash('sha256').update(entry.content).digest('hex').slice(0, 16);
    const now = new Date().toISOString();

    return {
      id: crypto.randomUUID(),
      vault_id: vaultId,
      file_path: relative(vaultPath, entry.file_path),
      title: entry.title,
      category: entry.category,
      tags: entry.tags,
      description: entry.description,
      required_knowledge: entry.required_knowledge,
      rules: entry.rules,
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
      category_count: categories.size,
      tag_count: tags.size,
      build_duration_ms: Date.now() - start,
    },
  };
}
