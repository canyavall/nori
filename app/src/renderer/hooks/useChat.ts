import { useState, useEffect, useCallback, useRef } from 'react';
import { invokeCommand, createWebSocket } from '../lib/api';
import type { ChatMessage, ChatContext } from '../types/chat';
import type { SessionMessage } from '../types/session';
import { useRole } from './useRole';
import { useKnowledge } from './useKnowledge';

export function useChat(sessionId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId || null);
  const { personalityText, activeRole } = useRole();
  const { getAllPackages } = useKnowledge();
  const [knowledgeContent, setKnowledgeContent] = useState<string>('');
  const wsRef = useRef<WebSocket | null>(null);

  // Load knowledge content on mount
  useEffect(() => {
    const loadKnowledge = async () => {
      const packages = await getAllPackages();
      const content = packages
        .map(
          (pkg) =>
            `## ${pkg.name}\n${pkg.description}\n\nCategory: ${pkg.category}\nTags: ${pkg.tags.join(', ')}\n\n${pkg.content.slice(0, 500)}...`
        )
        .join('\n\n---\n\n');
      setKnowledgeContent(content);
    };

    loadKnowledge();
  }, [getAllPackages]);

  // Load session on mount if sessionId provided
  useEffect(() => {
    if (sessionId) {
      const loadSession = async () => {
        try {
          const { messages: sessionMessages } = await invokeCommand<{
            session: unknown;
            messages: SessionMessage[];
          }>(`/sessions/${sessionId}`);

          const chatMessages: ChatMessage[] = sessionMessages.map((msg) => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: msg.timestamp,
          }));

          setMessages(chatMessages);
          setCurrentSessionId(sessionId);
        } catch (err) {
          console.error('Failed to load session:', err);
        }
      };

      loadSession();
    }
  }, [sessionId]);

  // WebSocket connection for chat streaming
  useEffect(() => {
    const ws = createWebSocket('/chat');
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const chunk = JSON.parse(event.data) as {
          type: 'chunk' | 'done' | 'error';
          content?: string;
          error?: string;
          tokens?: number;
        };

        if (chunk.type === 'error') {
          setError(chunk.error || 'Unknown error');
          setIsStreaming(false);
          return;
        }

        if (chunk.type === 'done') {
          setIsStreaming(false);
          // Mark the streaming message as complete
          setMessages((prev) =>
            prev.map((msg) => (msg.streaming ? { ...msg, streaming: false } : msg))
          );
        } else if (chunk.type === 'chunk' && chunk.content) {
          // Append content to the streaming message
          setMessages((prev) => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.streaming) {
              return [
                ...prev.slice(0, -1),
                { ...lastMsg, content: lastMsg.content + chunk.content },
              ];
            }
            return prev;
          });
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('WebSocket connection error');
      setIsStreaming(false);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      ws.close();
    };
  }, []);

  // Auto-save session helper
  const saveCurrentSession = useCallback(async () => {
    if (!currentSessionId || messages.length === 0) return;

    try {
      const sessionMessages: SessionMessage[] = messages
        .filter((msg) => !msg.streaming)
        .map((msg) => ({
          id: msg.id,
          session_id: currentSessionId,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          tokens: 0, // TODO: implement token counting
        }));

      const title = messages[0]?.content.slice(0, 50) || 'Untitled Session';

      await invokeCommand('/sessions', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: currentSessionId,
          role: activeRole,
          title,
          messages: sessionMessages,
        }),
      });
    } catch (err) {
      console.error('Failed to save session:', err);
    }
  }, [currentSessionId, messages, activeRole]);

  // Auto-save when streaming finishes
  useEffect(() => {
    if (!isStreaming && messages.length > 0) {
      saveCurrentSession();
    }
  }, [isStreaming, saveCurrentSession, messages.length]);

  const sendMessage = useCallback(
    async (content: string) => {
      try {
        setError(null);
        setIsStreaming(true);

        // Generate session ID on first message
        if (!currentSessionId) {
          setCurrentSessionId(crypto.randomUUID());
        }

        // Add user message
        const userMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'user',
          content,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMessage]);

        // Build message history for API
        const messageHistory = [...messages, userMessage].map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        // Send via WebSocket
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              messages: messageHistory,
              model: 'claude-sonnet-4-20250514',
            })
          );

          // Add placeholder for assistant response
          const assistantMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
            streaming: true,
          };

          setMessages((prev) => [...prev, assistantMessage]);
        } else {
          throw new Error('WebSocket not connected');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        setIsStreaming(false);
      }
    },
    [messages, currentSessionId]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setCurrentSessionId(null);
  }, []);

  return {
    messages,
    isStreaming,
    error,
    sessionId: currentSessionId,
    sendMessage,
    clearMessages,
  };
}
