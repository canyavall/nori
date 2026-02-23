import type { Component } from 'solid-js';
import { For, Show } from 'solid-js';
import type { Accessor } from 'solid-js';
import type { ClaudeRule } from '@nori/shared';
import { RuleEditor } from '../../../../project-claude-rules/RuleEditor';
import { useRulesAccordion } from './RulesAccordion.hook';

const MAX_VISIBLE = 5;

interface RulesAccordionProps {
  rules: Accessor<ClaudeRule[]>;
  projectPath: Accessor<string>;
}

export const RulesAccordion: Component<RulesAccordionProps> = (props) => {
  const { open, setOpen, editing, content, setContent, saving, saveError, handleEdit, handleSave, handleCancel } =
    useRulesAccordion(props.rules, props.projectPath);

  const visible = () => props.rules().slice(0, MAX_VISIBLE);
  const overflow = () => Math.max(0, props.rules().length - MAX_VISIBLE);

  return (
    <div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
      <button
        type="button"
        onClick={() => setOpen(!open())}
        class="w-full flex items-center justify-between px-4 py-3 text-left transition-colors rounded-lg"
      >
        <div class="flex items-center gap-2">
          <span class="font-medium">Rules</span>
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
            {props.rules().length}
          </span>
        </div>
        <span
          class="text-[var(--color-text-muted)] text-xs transition-transform"
          style={{ transform: open() ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ▾
        </span>
      </button>

      <Show when={open()}>
        <div class="border-t border-[var(--color-border)] px-4 py-3">
          <Show
            when={props.rules().length > 0}
            fallback={
              <p class="text-sm text-[var(--color-text-muted)] italic">No rules configured in <code class="font-mono">.claude/rules/</code>.</p>
            }
          >
            <div class="grid grid-cols-2 gap-2">
              <For each={visible()}>
                {(rule) => (
                  <div class="flex items-center justify-between rounded-md border border-[var(--color-border)] px-3 py-2">
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-medium truncate">{rule.name}</p>
                      <p class="text-xs text-[var(--color-text-muted)] font-mono truncate">{rule.relativePath}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEdit(rule)}
                      class="ml-2 px-2 py-0.5 text-xs rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors shrink-0"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </For>
            </div>
            <Show when={overflow() > 0}>
              <p class="text-xs text-[var(--color-text-muted)] mt-2">
                +{overflow()} more {overflow() === 1 ? 'rule' : 'rules'} not shown
              </p>
            </Show>
          </Show>
        </div>
      </Show>

      <Show when={editing()}>
        <div class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50" onClick={handleCancel} />
          <div class="relative w-full max-w-2xl h-[80vh] flex flex-col rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-xl p-6 overflow-y-auto">
            <RuleEditor
              rule={editing()!}
              content={content()}
              onChange={setContent}
              onSave={handleSave}
              onCancel={handleCancel}
              saving={saving()}
              error={saveError()}
            />
          </div>
        </div>
      </Show>
    </div>
  );
};
