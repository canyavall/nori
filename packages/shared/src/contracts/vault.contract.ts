import type { Vault, VaultLink } from '../types/vault.js';

// Re-export request schemas and types from schemas
export { vaultRegistrationSchema, type VaultRegistrationInput } from '../schemas/vault.schema.js';
export { vaultLocalRegistrationSchema, type VaultLocalRegistrationInput } from '../schemas/vault.schema.js';
export { vaultLinkProjectSchema, type VaultLinkProjectInput } from '../schemas/vault.schema.js';
export { vaultKnowledgeImportSchema, type VaultKnowledgeImportInput } from '../schemas/vault.schema.js';
export { vaultKnowledgeExportSchema, type VaultKnowledgeExportInput } from '../schemas/vault.schema.js';

// ─── Response types ───────────────────────────────────────────────

export interface VaultRegistrationResponse {
  vault: Vault;
  knowledge_count: number;
}

export interface VaultLinkProjectResponse {
  link: VaultLink;
  vault_name: string;
}

export interface VaultListLinksResponse {
  links: import('../types/vault.js').VaultLink[];
}

export interface VaultUnlinkProjectResponse {
  link_id: string;
  vault_id: string;
  project_path: string;
}

export interface VaultKnowledgeImportResponse {
  imported_count: number;
  skipped_count: number;
}

export interface VaultKnowledgeExportResponse {
  exported_count: number;
  destination_path: string;
}

export interface VaultPullResponse {
  files_changed: number;
  has_conflicts: boolean;
}

export interface VaultPushResponse {
  commit_hash: string;
  files_pushed: number;
}

// ─── SSE event interfaces ─────────────────────────────────────────

export interface VaultRegistrationEvents {
  'vault:registration:started': { vault_name: string };
  'vault:registration:validating-url': { url: string };
  'vault:registration:testing-access': { url: string };
  'vault:registration:cloning': { url: string };
  'vault:registration:writing-config': { vault_name: string };
  'vault:registration:building-index': { vault_name: string };
  'vault:registration:completed': { vault_id: string; vault_name: string; knowledge_count: number };
  'vault:registration:error': { error: string; step: string };
}

export interface VaultLocalRegistrationEvents {
  'vault:local-registration:started': { vault_name: string };
  'vault:local-registration:creating-directory': { vault_name: string };
  'vault:local-registration:writing-config': { vault_name: string };
  'vault:local-registration:building-index': { vault_name: string };
  'vault:local-registration:completed': { vault_id: string; vault_name: string; local_path: string; knowledge_count: number };
  'vault:local-registration:error': { error: string; step: string };
}

export interface VaultLinkProjectEvents {
  'vault:link-project:started': { vault_id: string; project_path: string };
  'vault:link-project:validating-vault': { vault_id: string };
  'vault:link-project:validating-project': { project_path: string };
  'vault:link-project:writing-link': { vault_id: string };
  'vault:link-project:completed': { vault_id: string; vault_name: string; project_path: string };
}

export interface VaultPullEvents {
  'vault:pull:started': { vault_id: string };
  'vault:pull:validating-config': { vault_id: string };
  'vault:pull:checking-local-changes': { vault_id: string };
  'vault:pull:local-changes-detected': { vault_id: string; changed_files: string[]; change_count: number };
  'vault:pull:fetching': { vault_id: string; url: string };
  'vault:pull:detecting-conflicts': { vault_id: string };
  'vault:pull:conflicts-detected': { vault_id: string; conflict_count: number; local_head: string; remote_head: string };
  'vault:pull:merging': { vault_id: string };
  'vault:pull:merge-warning': { vault_id: string; error: string };
  'vault:pull:updating-index': { vault_id: string };
  'vault:pull:index-warning': { vault_id: string; error: string };
  'vault:pull:logging-event': { vault_id: string };
  'vault:pull:log-warning': { vault_id: string; error: string };
  'vault:pull:completed': { vault_id: string; vault_name: string; files_changed: number; has_conflicts: boolean };
}

export interface VaultPushEvents {
  'vault:push:started': { vault_id: string };
  'vault:push:validating-config': { vault_id: string };
  'vault:push:checking-changes': { vault_id: string };
  'vault:push:no-changes': { vault_id: string; vault_name: string };
  'vault:push:changes-detected': { vault_id: string; changed_files: string[]; change_count: number };
  'vault:push:staging': { vault_id: string };
  'vault:push:committing': { vault_id: string };
  'vault:push:committed': { vault_id: string; commit_hash: string; commit_message: string };
  'vault:push:pushing': { vault_id: string; url: string };
  'vault:push:completed': { vault_id: string; vault_name: string; commit_hash: string; files_pushed: number };
}

export interface VaultUnlinkProjectEvents {
  'vault:unlink-project:started': { vault_id: string; link_id: string };
  'vault:unlink-project:validating-vault': { vault_id: string };
  'vault:unlink-project:validating-link': { link_id: string };
  'vault:unlink-project:deleting-link': { link_id: string };
  'vault:unlink-project:completed': { vault_id: string; link_id: string; project_path: string };
}

export interface VaultKnowledgeImportEvents {
  'vault:knowledge-import:started': { vault_id: string; source_count: number };
  'vault:knowledge-import:scanning': { source_count: number };
  'vault:knowledge-import:found': { file_count: number };
  'vault:knowledge-import:parsing': { file_path: string };
  'vault:knowledge-import:importing': { title: string };
  'vault:knowledge-import:entry-imported': { title: string };
  'vault:knowledge-import:entry-skipped': { file_path: string; reason: string };
  'vault:knowledge-import:rebuilding-index': { vault_id: string };
  'vault:knowledge-import:completed': { vault_id: string; imported_count: number; skipped_count: number };
  'vault:knowledge-import:error': { error: string; step: string };
}

export interface VaultKnowledgeExportEvents {
  'vault:knowledge-export:started': { vault_id: string };
  'vault:knowledge-export:loading-entries': { vault_id: string };
  'vault:knowledge-export:exporting': { entry_count: number };
  'vault:knowledge-export:entry-exported': { title: string };
  'vault:knowledge-export:completed': { vault_id: string; exported_count: number; destination_path: string };
  'vault:knowledge-export:error': { error: string; step: string };
}

export interface VaultAuditEvents {
  'vault:audit:started': { vault_id: string };
  'vault:audit:loading-entries': { vault_id: string };
  'vault:audit:validating-frontmatter': { entry_count: number };
  'vault:audit:validating-content': { entry_count: number };
  'vault:audit:checking-consistency': { vault_id: string };
  'vault:audit:generating-report': { vault_id: string };
  'vault:audit:completed': { vault_id: string; status: string };
}

export interface VaultReconciliationEvents {
  'vault:reconciliation:started': { vault_id: string };
  'vault:reconciliation:loading-local': { vault_path: string };
  'vault:reconciliation:loading-remote': { vault_id: string };
  'vault:reconciliation:loading-cache': { vault_path: string };
  'vault:reconciliation:comparing': { vault_id: string };
  'vault:reconciliation:generating-report': { vault_id: string };
  'vault:reconciliation:saving-cache': { vault_path: string };
  'vault:reconciliation:completed': { vault_id: string; has_changes: boolean; has_conflicts: boolean };
}

export interface VaultRegenerateDbEvents {
  'vault:regenerate-db:started': { vault_id: string };
  'vault:regenerate-db:scanning': { vault_path: string };
  'vault:regenerate-db:parsing': { file_count: number };
  'vault:regenerate-db:validating': { parsed_count: number };
  'vault:regenerate-db:building': { valid_count: number };
  'vault:regenerate-db:writing': { entry_count: number };
  'vault:regenerate-db:completed': { entry_count: number; skipped_count?: number; build_duration_ms?: number };
}

export interface VaultEmbeddingEvents {
  'vault:embedding:started': { vault_id: string };
  'vault:embedding:loading-entries': { vault_id: string };
  'vault:embedding:generating': { entry_count: number };
  'vault:embedding:storing': { embedded_count: number };
  'vault:embedding:validating': { vault_id: string };
  'vault:embedding:completed': { vault_id: string; embedded_count: number };
}

// ─── API route constants ──────────────────────────────────────────

export const VAULT_REGISTRATION_API = {
  method: 'POST' as const,
  path: '/api/vault',
} as const;

export const VAULT_LOCAL_REGISTRATION_API = {
  method: 'POST' as const,
  path: '/api/vault',
} as const;

export const VAULT_LIST_API = {
  method: 'GET' as const,
  path: '/api/vault',
} as const;

export const VAULT_LINK_PROJECT_API = {
  method: 'POST' as const,
  path: '/api/vault/:id/link',
} as const;

export const VAULT_PULL_API = {
  method: 'POST' as const,
  path: '/api/vault/:id/pull',
} as const;

export const VAULT_PUSH_API = {
  method: 'POST' as const,
  path: '/api/vault/:id/push',
} as const;

export const VAULT_RECONCILIATION_API = {
  method: 'POST' as const,
  path: '/api/vault/:id/reconcile',
} as const;

export const VAULT_REGENERATE_DB_API = {
  method: 'POST' as const,
  path: '/api/vault/:id/regenerate-db',
} as const;

export const VAULT_VECTOR_EMBEDDING_API = {
  method: 'POST' as const,
  path: '/api/vault/:id/embed',
} as const;

export const VAULT_AUDIT_API = {
  method: 'POST' as const,
  path: '/api/vault/:id/audit',
} as const;

export const VAULT_LIST_LINKS_API = {
  method: 'GET' as const,
  path: '/api/vault/:id/links',
} as const;

export const VAULT_UNLINK_PROJECT_API = {
  method: 'DELETE' as const,
  path: '/api/vault/:id/links/:linkId',
} as const;

export const VAULT_KNOWLEDGE_IMPORT_API = {
  method: 'POST' as const,
  path: '/api/vault/:id/knowledge/import',
} as const;

export const VAULT_KNOWLEDGE_EXPORT_API = {
  method: 'POST' as const,
  path: '/api/vault/:id/knowledge/export',
} as const;
