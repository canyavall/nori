import { Show } from 'solid-js';
import type { Component } from 'solid-js';
import { marked } from 'marked';
import type { MarkdownContentProps } from './MarkdownContent.type';

const sharedClass =
  'text-sm text-[var(--color-text)] bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)] p-4 overflow-x-auto max-h-96 overflow-y-auto';

export const MarkdownContent: Component<MarkdownContentProps> = (props) => {
  const html = () => marked.parse(props.content, { async: false });

  return (
    <Show
      when={props.viewMode === 'markdown'}
      fallback={
        <pre class={`font-mono whitespace-pre-wrap ${sharedClass}`}>
          {props.content}
        </pre>
      }
    >
      <div class={`md-content ${sharedClass}`} innerHTML={html()} />
    </Show>
  );
};
