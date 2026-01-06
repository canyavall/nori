export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  maxTokens?: number;
}

export interface StreamChunk {
  type: 'chunk' | 'done' | 'error';
  content?: string;
  error?: string;
  tokens?: number;
}
