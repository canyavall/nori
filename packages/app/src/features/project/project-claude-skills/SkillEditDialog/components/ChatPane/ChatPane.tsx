import type { Component } from 'solid-js';
import { For, Show } from 'solid-js';
import type { ChatPaneProps } from './ChatPane.type';
import { useChatPane } from './ChatPane.hook';
import { DiffView } from '../DiffView/DiffView';

export const ChatPane: Component<ChatPaneProps> = (props) => {
  const {
    messages,
    input,
    setInput,
    streaming,
    pendingSuggestion,
    chatError,
    handleSend,
    handleApply,
    handleDismiss,
    handleKeyDown,
  } = useChatPane(
    () => props.skillName,
    () => props.projectPath,
    () => props.allSkillsJson,
    props.editorContent,
    props.onApplyContent,
  );

  let messagesEndRef: HTMLDivElement | undefined;

  const scrollToBottom = () => {
    messagesEndRef?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div class="flex flex-col h-full min-h-0">
      {/* Message list */}
      <div class="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        <Show
          when={messages().length > 0}
          fallback={
            <p class="text-xs text-[var(--color-text-muted)] text-center italic pt-4">
              Ask the AI to help improve this skill...
            </p>
          }
        >
          <For each={messages()}>
            {(msg) => (
              <div class={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  class={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)]'
                  }`}
                >
                  <p class="whitespace-pre-wrap break-words">{msg.content}</p>
                  <Show when={msg.streaming}>
                    <span class="inline-block w-1.5 h-3 bg-current animate-pulse ml-0.5" />
                  </Show>
                </div>
              </div>
            )}
          </For>

          <Show when={pendingSuggestion()}>
            <DiffView
              original={props.editorContent()}
              suggested={pendingSuggestion()!}
              onApply={handleApply}
              onDismiss={handleDismiss}
            />
          </Show>
        </Show>

        <Show when={chatError()}>
          <p class="text-xs text-[var(--color-text-error)]">{chatError()}</p>
        </Show>

        <div ref={messagesEndRef} />
      </div>

      {/* Input row */}
      <div class="flex gap-2 p-2 border-t border-[var(--color-border)] shrink-0">
        <textarea
          value={input()}
          onInput={(e) => {
            setInput(e.currentTarget.value);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask AI to improve this skill... (Enter to send, Shift+Enter for newline)"
          rows={2}
          class="flex-1 text-sm resize-none rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-accent)] transition-colors"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={streaming() || !input().trim()}
          class="px-3 py-1.5 text-sm rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-40 transition-colors shrink-0 self-end"
        >
          {streaming() ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
};
