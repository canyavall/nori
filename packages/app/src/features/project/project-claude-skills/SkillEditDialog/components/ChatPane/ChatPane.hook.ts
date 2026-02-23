import { createSignal } from 'solid-js';
import { connectSSE } from '../../../../../../lib/sse';
import type { ChatMessage } from './ChatPane.type';

function extractCodeBlock(text: string): string | null {
  const match = text.match(/```(?:markdown|md)?\n([\s\S]*?)```/);
  return match ? match[1].trim() : null;
}

export const useChatPane = (
  skillName: () => string,
  projectPath: () => string,
  allSkillsJson: () => string,
  editorContent: () => string,
  onApplyContent: (content: string) => void,
) => {
  const [messages, setMessages] = createSignal<ChatMessage[]>([]);
  const [input, setInput] = createSignal('');
  const [streaming, setStreaming] = createSignal(false);
  const [pendingSuggestion, setPendingSuggestion] = createSignal<string | null>(null);
  const [chatError, setChatError] = createSignal('');

  let abortController: AbortController | null = null;

  const handleSend = () => {
    const text = input().trim();
    if (!text || streaming()) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setPendingSuggestion(null);
    setChatError('');

    const allMessages = [...messages()];

    const allSkills = (() => {
      try { return JSON.parse(allSkillsJson()); } catch { return []; }
    })();

    const assistantIdx = messages().length; // index after adding user msg
    setMessages((prev) => [...prev, { role: 'assistant', content: '', streaming: true }]);
    setStreaming(true);

    let accumulated = '';

    abortController = connectSSE(
      `/api/project/claude/skills/${encodeURIComponent(skillName())}/chat?projectPath=${projectPath()}`,
      {
        messages: [...allMessages, userMsg].map((m) => ({ role: m.role, content: m.content })),
        allSkills,
      },
      {
        onEvent: (event: string, data: Record<string, unknown>) => {
          if (event === 'skill:chat:token') {
            const token = (data as { token: string }).token ?? '';
            accumulated += token;
            setMessages((prev) =>
              prev.map((m, idx) =>
                idx === assistantIdx ? { ...m, content: accumulated } : m
              )
            );
          } else if (event === 'skill:chat:completed') {
            const response = (data as { response: string }).response ?? accumulated;
            accumulated = response;
            setMessages((prev) =>
              prev.map((m, idx) =>
                idx === assistantIdx ? { ...m, content: response, streaming: false } : m
              )
            );
            setStreaming(false);
            const suggestion = extractCodeBlock(response);
            if (suggestion) {
              setPendingSuggestion(suggestion);
            }
          }
        },
        onResult: () => {
          setStreaming(false);
        },
        onError: (err: string) => {
          setChatError(err);
          setStreaming(false);
          setMessages((prev) =>
            prev.map((m, idx) =>
              idx === assistantIdx ? { ...m, streaming: false } : m
            )
          );
        },
      },
    );
  };

  const handleApply = () => {
    const suggestion = pendingSuggestion();
    if (!suggestion) return;
    onApplyContent(suggestion);
    setPendingSuggestion(null);
  };

  const handleDismiss = () => {
    setPendingSuggestion(null);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return {
    messages,
    input,
    setInput,
    streaming,
    pendingSuggestion,
    chatError,
    editorContent,
    handleSend,
    handleApply,
    handleDismiss,
    handleKeyDown,
  };
};
