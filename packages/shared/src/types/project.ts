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

export type ProjectSource = 'nori' | 'claude-code' | 'both';

export interface DiscoveredProject extends Project {
  source: ProjectSource;
  has_nori: boolean;
  claude_code?: {
    last_session_id?: string;
    has_trust_dialog_accepted?: boolean;
  };
}
