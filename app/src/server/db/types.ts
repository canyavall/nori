// Database type definitions

export interface Role {
  id: number;
  active_role: string;
  updated_at: string;
}

export interface OAuthToken {
  id: number;
  provider: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  created_at: number;
  updated_at: number;
}

export interface ApiKey {
  id: number;
  provider: string;
  api_key: string;
  created_at: number;
  updated_at: number;
}

export interface Workspace {
  id: number;
  name: string;
  path: string;
  vault: string | null;
  vault_path: string | null;
  created_at: number;
  last_opened_at: number;
}

export interface AppState {
  id: number;
  active_workspace_id: number | null;
}

export interface Session {
  id: string;
  role: string;
  title: string;
  created_at: number;
  updated_at: number;
  total_tokens: number;
  message_count: number;
}

export interface Message {
  id: string;
  session_id: string;
  role: string;
  content: string;
  timestamp: number;
  tokens: number;
}
