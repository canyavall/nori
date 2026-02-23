export interface Vault {
  id: string;
  name: string;
  vault_type: 'git' | 'local';
  git_url: string | null;
  branch: string | null;
  local_path: string;
  created_at: string;
  updated_at: string;
  last_synced_at: string | null;
  project_count?: number;
  knowledge_count?: number;
}

export interface VaultLink {
  id: string;
  vault_id: string;
  project_path: string;
  created_at: string;
}

export type VaultSyncStatus = 'idle' | 'syncing' | 'error' | 'conflict';
