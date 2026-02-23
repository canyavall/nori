import type { Database } from 'sql.js';
import type { StepResult, FlowError } from '@nori/shared';
import { queryOne, queryAll } from '../../../shared/utils/database.js';

export interface VaultContext {
  vault_name: string;
  vault_type: string;
  existing_categories: string[];
  sample_titles: string[];
}

export function gatherContext(
  db: Database,
  vault_id: string
): StepResult<VaultContext> | FlowError {
  const vault = queryOne(db, 'SELECT name, vault_type FROM vaults WHERE id = ?', [vault_id]);
  if (!vault) {
    return {
      success: false,
      error: { code: 'VAULT_NOT_FOUND', message: `Vault ${vault_id} not found`, severity: 'fatal', recoverable: false },
    };
  }

  const entries = queryAll(
    db,
    'SELECT title, category FROM knowledge_entries WHERE vault_id = ? ORDER BY updated_at DESC LIMIT 20',
    [vault_id]
  );

  const categories = [...new Set(entries.map((e) => e.category as string))].slice(0, 10);
  const sampleTitles = entries.slice(0, 5).map((e) => e.title as string);

  return {
    success: true,
    data: {
      vault_name: vault.name as string,
      vault_type: vault.vault_type as string,
      existing_categories: categories,
      sample_titles: sampleTitles,
    },
  };
}
