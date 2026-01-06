export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  streaming?: boolean;
}

export interface ChatContext {
  system_prompt: string;
  messages: { role: string; content: string }[];
  max_tokens: number;
  temperature: number;
}
