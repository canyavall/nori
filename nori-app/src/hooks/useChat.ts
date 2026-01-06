import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
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
          const { messages: sessionMessages } = await invoke<{
            session: unknown;
            messages: SessionMessage[];
          }>('load_session', { sessionId });

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

  // Listen to streaming events
  useEffect(() => {
    const unlisten = listen<{ stream_id: string; content: string; finished: boolean; error?: string }>(
      'chat-stream',
      (event) => {
        const { content, finished, error: streamError } = event.payload;

        if (streamError) {
          setError(streamError);
          setIsStreaming(false);
          return;
        }

        if (finished) {
          setIsStreaming(false);
          // Mark the streaming message as complete
          setMessages((prev) =>
            prev.map((msg) => (msg.streaming ? { ...msg, streaming: false } : msg))
          );
        } else {
          // Append content to the streaming message
          setMessages((prev) => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.streaming) {
              return [
                ...prev.slice(0, -1),
                { ...lastMsg, content: lastMsg.content + content },
              ];
            }
            return prev;
          });
        }
      }
    );

    return () => {
      unlisten.then((fn) => fn());
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

      await invoke('save_session', {
        sessionId: currentSessionId,
        role: activeRole,
        title,
        messages: sessionMessages,
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

        // Build system prompt with personality + knowledge
        const systemPrompt = `${personalityText || 'You are a helpful assistant.'}\n\n# Knowledge Base\n\n${knowledgeContent}`;

        // Build context
        const context: ChatContext = {
          system_prompt: systemPrompt,
          messages: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          max_tokens: 4096,
          temperature: 1.0,
        };

        // Send to backend
        const streamId = await invoke<string>('send_message', {
          message: content,
          context,
        });

        // Add placeholder for assistant response
        const assistantMessage: ChatMessage = {
          id: streamId,
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          streaming: true,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        setIsStreaming(false);
      }
    },
    [messages, personalityText, knowledgeContent, currentSessionId]
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
