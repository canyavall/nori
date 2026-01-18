import { useState, useEffect, useCallback } from 'react';
import { invokeCommand } from '../lib/api';
import type { ChatMessage, ChatContext } from '../types/chat';
import type { SessionMessage } from '../types/session';
import { useRole } from './useRole';
import { useKnowledge } from './useKnowledge';
import { useWebSocket } from '../contexts/WebSocketContext';

export function useChat(sessionId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId || null);
  const { personalityText, activeRole } = useRole();
  const { getAllPackages } = useKnowledge();
  const [knowledgeContent, setKnowledgeContent] = useState<string>('');
  const { ws, isConnected, error: wsError } = useWebSocket();

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

  // Set up message handlers on context WebSocket
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
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

    ws.addEventListener('message', handleMessage);

    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, [ws]);

  // Sync WebSocket error to local error state
  useEffect(() => {
    if (wsError) {
      setError(wsError);
      setIsStreaming(false);
    }
  }, [wsError]);

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
        if (ws && isConnected) {
          ws.send(
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
    [messages, currentSessionId, ws, isConnected]
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
