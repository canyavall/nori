export interface Project {
  id: string;
  name: string;
  path: string;
  is_git: boolean;
  connected_vaults: string[];
  created_at: string;
}

export interface ProjectSettings {
  version: string;
  project_id: string;
  connected_vaults: string[];
  created_at: string;
}
