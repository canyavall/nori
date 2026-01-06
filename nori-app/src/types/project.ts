export interface Workspace {
  id: number;
  name: string;
  path: string;
  vault: string | null;
  vault_path: string | null;
  created_at: number;
  last_opened_at: number;
}

export interface CreateWorkspaceInput {
  path: string;
  vault?: string;
}

export interface UpdateWorkspaceVaultInput {
  workspace_id: number;
  vault: string;
  vault_path: string;
}
