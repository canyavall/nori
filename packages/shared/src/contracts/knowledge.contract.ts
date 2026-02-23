export {
  knowledgeCreateSchema,
  type KnowledgeCreateInput,
  knowledgeEditSchema,
  type KnowledgeEditInput,
  knowledgeSearchSchema,
  type KnowledgeSearchInput,
} from '../schemas/knowledge.schema.js';

// ─── Request type aliases ─────────────────────────────────────────
// Frontend step JSONs reference these names

export type { KnowledgeCreateInput as KnowledgeCreateRequest } from '../schemas/knowledge.schema.js';
export type { KnowledgeEditInput as KnowledgeEditRequest } from '../schemas/knowledge.schema.js';
export type { KnowledgeSearchInput as KnowledgeSearchRequest } from '../schemas/knowledge.schema.js';

// ─── Response types ───────────────────────────────────────────────

export interface KnowledgeCreateResponse {
  entry_id: string;
  title: string;
  file_path: string;
}

export interface KnowledgeEditResponse {
  entry_id: string;
  title: string;
  file_path: string;
}

export interface KnowledgeDeleteResponse {
  deleted_file_path: string;
}

export interface KnowledgeSearchResult {
  id: string;
  title: string;
  file_path: string;
  score: number;
  snippet: string;
}

export interface KnowledgeSearchResponse {
  results: KnowledgeSearchResult[];
  total_count: number;
}

export interface KnowledgeAuditResponse {
  file_path: string;
  status: string;
}

export interface KnowledgeContentResponse {
  content: string;
  frontmatter: Record<string, unknown>;
}

// ─── SSE event interfaces ─────────────────────────────────────────

export interface KnowledgeCreateEvents {
  'knowledge:create:started': { vault_id: string; title: string };
  'knowledge:create:validating-frontmatter': { title: string };
  'knowledge:create:validating-content': { content_length: number };
  'knowledge:create:writing-file': { vault_path: string; title: string };
  'knowledge:create:auditing': { entry_id: string; file_path: string };
  'knowledge:create:audit-warning': { entry_id: string; message: string };
  'knowledge:create:regenerating-index': { vault_id: string };
  'knowledge:create:index-warning': { entry_id: string; message: string };
  'knowledge:create:completed': { entry_id: string; file_path: string; title: string };
}

export interface KnowledgeEditEvents {
  'knowledge:edit:started': { vault_id: string; file_path: string };
  'knowledge:edit:loading': { file_path: string };
  'knowledge:edit:validating-changes': { file_path: string };
  'knowledge:edit:writing-changes': { file_path: string };
  'knowledge:edit:auditing': { entry_id: string; file_path: string };
  'knowledge:edit:audit-warning': { entry_id: string; message: string };
  'knowledge:edit:regenerating-index': { vault_id: string };
  'knowledge:edit:index-warning': { entry_id: string; message: string };
  'knowledge:edit:completed': { entry_id: string; file_path: string; title: string };
}

export interface KnowledgeDeleteEvents {
  'knowledge:delete:started': { vault_id: string; file_path: string };
  'knowledge:delete:validating-exists': { file_path: string };
  'knowledge:delete:checking-dependencies': { file_path: string };
  'knowledge:delete:deleting-file': { file_path: string };
  'knowledge:delete:regenerating-index': { vault_id: string };
  'knowledge:delete:index-warning': { file_path: string; message: string };
  'knowledge:delete:completed': { deleted_file_path: string };
}

export interface KnowledgeSearchEvents {
  'knowledge:search:started': { query: string };
  'knowledge:search:loading-index': { vault_id: string | undefined };
  'knowledge:search:index-loaded': { entry_count: number };
  'knowledge:search:parsing-query': { query: string };
  'knowledge:search:query-parsed': { filter_count: number; text: string };
  'knowledge:search:matching': { total_count: number };
  'knowledge:search:matched': { matched_count: number; total_count: number };
  'knowledge:search:scoring': { matched_count: number };
  'knowledge:search:scored': { scored_count: number; top_score: number };
  'knowledge:search:semantic-searching': { query: string };
  'knowledge:search:semantic-complete': { result_count: number };
  'knowledge:search:merging': { keyword_count: number; semantic_count: number };
  'knowledge:search:merged': { merged_count: number; duplicates_removed: number };
  'knowledge:search:formatting': { merged_count: number };
  'knowledge:search:completed': { result_count: number; total_count: number };
}

export interface KnowledgeAuditEvents {
  'knowledge:audit:started': { file_path: string };
  'knowledge:audit:loading-entry': { file_path: string };
  'knowledge:audit:validating-frontmatter': { file_path: string };
  'knowledge:audit:validating-content': { file_path: string };
  'knowledge:audit:checking-originality': { file_path: string };
  'knowledge:audit:generating-result': { file_path: string };
  'knowledge:audit:completed': { file_path: string; status: string };
}

export interface KnowledgeIndexBuildEvents {
  'knowledge:index-build:started': { vault_id: string };
  'knowledge:index-build:checking-fast-path': { vault_id: string };
  'knowledge:index-build:skipped': { vault_id: string; reason: string };
  'knowledge:index-build:scanning': { vault_path: string };
  'knowledge:index-build:parsing': { file_count: number };
  'knowledge:index-build:validating': { parsed_count: number };
  'knowledge:index-build:building': { valid_count: number };
  'knowledge:index-build:writing': { entry_count: number };
  'knowledge:index-build:completed': {
    entry_count: number;
    category_count?: number;
    tag_count?: number;
    build_duration_ms?: number;
    skipped_count?: number;
    fast_path_used?: boolean;
  };
}

// ─── API route constants ──────────────────────────────────────────

export const KNOWLEDGE_CREATE_API = {
  method: 'POST' as const,
  path: '/api/knowledge',
} as const;

export const KNOWLEDGE_LIST_API = {
  method: 'GET' as const,
  path: '/api/knowledge',
} as const;

export const KNOWLEDGE_GET_API = {
  method: 'GET' as const,
  path: '/api/knowledge/:id',
} as const;

export const KNOWLEDGE_CONTENT_API = {
  method: 'GET' as const,
  path: '/api/knowledge/:id/content',
} as const;

export const KNOWLEDGE_SEARCH_API = {
  method: 'GET' as const,
  path: '/api/knowledge/search',
} as const;

export const KNOWLEDGE_EDIT_API = {
  method: 'PUT' as const,
  path: '/api/knowledge/:id',
} as const;

export const KNOWLEDGE_DELETE_API = {
  method: 'DELETE' as const,
  path: '/api/knowledge/:id',
} as const;

export const KNOWLEDGE_AUDIT_API = {
  method: 'POST' as const,
  path: '/api/knowledge/:id/audit',
} as const;

export const KNOWLEDGE_AI_GENERATE_API = {
  method: 'POST' as const,
  path: '/api/knowledge/ai-generate',
} as const;

export interface KnowledgeAiGenerateRequest {
  vault_id: string;
  prompt: string;
}

export interface KnowledgeAiGenerateResponse {
  proposals: import('../types/knowledge.js').KnowledgeProposal[];
}
