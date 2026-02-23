import type { Component } from 'solid-js';

export interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: 'json' | 'markdown';
  readonly?: boolean;
}

export const CodeEditor: Component<CodeEditorProps> = (props) => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Tab' && !props.readonly) {
      e.preventDefault();
      const target = e.currentTarget as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const value = target.value;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      props.onChange?.(newValue);
      // Restore cursor position after SolidJS re-renders the value
      requestAnimationFrame(() => {
        target.selectionStart = start + 2;
        target.selectionEnd = start + 2;
      });
    }
  };

  return (
    <div class="relative rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] overflow-hidden">
      <div class="flex items-center justify-between px-3 py-1.5 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
        <span class="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">
          {props.language ?? 'text'}
        </span>
        {props.readonly && (
          <span class="text-xs text-[var(--color-text-muted)]">Read-only</span>
        )}
      </div>
      <textarea
        value={props.value}
        onInput={(e) => props.onChange?.(e.currentTarget.value)}
        onKeyDown={handleKeyDown}
        readOnly={props.readonly}
        spellcheck={false}
        class="w-full min-h-[300px] p-3 font-mono text-sm leading-relaxed bg-transparent text-[var(--color-text)] resize-y outline-none"
        style={{ "tab-size": "2" }}
      />
    </div>
  );
};
