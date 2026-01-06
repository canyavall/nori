export interface Session {
  id: string;
  role: string;
  title: string;
  created_at: number;
  updated_at: number;
  total_tokens: number;
  message_count: number;
}

export interface SessionMessage {
  id: string;
  session_id: string;
  role: string;
  content: string;
  timestamp: number;
  tokens: number;
}

export interface SessionWithMessages {
  session: Session;
  messages: SessionMessage[];
}
