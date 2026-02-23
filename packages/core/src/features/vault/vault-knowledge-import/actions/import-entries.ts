import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import type { Database } from 'sql.js';
import type { StepResult, FlowError } from '@nori/shared';
import type { ParsedEntry } from './parse-files.js';

export interface ImportResult {
  imported_count: number;
  skipped_count: number;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function importEntries(
  db: Database,
  vaultId: string,
  vaultPath: string,
  entries: ParsedEntry[],
  onProgress: (title: string) => void
): StepResult<ImportResult> | FlowError {
  let importedCount = 0;
  let skippedCount = 0;
  const now = new Date().toISOString();

  for (const entry of entries) {
    onProgress(entry.title);

    const slug = slugify(entry.title);
    const categoryDir = join(vaultPath, entry.category);
    const destPath = join(categoryDir, `${slug}.md`);

    if (existsSync(destPath)) {
      skippedCount++;
      continue;
    }

    try {
      mkdirSync(categoryDir, { recursive: true });

      const frontmatter = {
        title: entry.title,
        category: entry.category,
        tags: entry.tags,
        created: entry.created ?? now,
        updated: now,
      };
      const fileContent = matter.stringify(entry.content, frontmatter);
      writeFileSync(destPath, fileContent, 'utf-8');

      const entryId = crypto.randomUUID();
      const contentHash = Buffer.from(entry.content).toString('base64').slice(0, 32);

      db.run(
        `INSERT OR IGNORE INTO knowledge (id, vault_id, file_path, title, category, tags, content_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [entryId, vaultId, destPath, entry.title, entry.category, JSON.stringify(entry.tags), contentHash, now, now]
      );

      importedCount++;
    } catch {
      skippedCount++;
    }
  }

  return { success: true, data: { imported_count: importedCount, skipped_count: skippedCount } };
}
