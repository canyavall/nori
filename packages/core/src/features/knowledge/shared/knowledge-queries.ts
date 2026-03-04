import type { Database } from 'sql.js';
import type { KnowledgeEntry } from '@nori/shared';
import { queryAll, queryOne, mapRow, mapRows } from '../../shared/utils/database.js';

const KNOWLEDGE_SPEC = { jsonFields: ['tags', 'required_knowledge', 'rules'] };

export function queryKnowledgeEntries(db: Database, vaultId?: string): KnowledgeEntry[] {
  const sql = vaultId
    ? 'SELECT * FROM knowledge_entries WHERE vault_id = ? ORDER BY updated_at DESC'
    : 'SELECT * FROM knowledge_entries ORDER BY updated_at DESC';
  const params = vaultId ? [vaultId] : [];
  return mapRows<KnowledgeEntry>(queryAll(db, sql, params), KNOWLEDGE_SPEC);
}

export function queryKnowledgeEntryById(db: Database, id: string): KnowledgeEntry | null {
  const row = queryOne(db, 'SELECT * FROM knowledge_entries WHERE id = ?', [id]);
  return row ? mapRow<KnowledgeEntry>(row, KNOWLEDGE_SPEC) : null;
}
