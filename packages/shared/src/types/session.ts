export interface Session {
  id: string;
  vault_id: string;
  title: string;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}
