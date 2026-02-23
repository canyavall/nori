import type { Component } from 'solid-js';
import { Show, For } from 'solid-js';
import { useRulesSection } from './RulesSection.hook';
import { RuleCard } from './components/RuleCard/RuleCard';
import { RuleEditor } from './RuleEditor';

export const RulesSection: Component = () => {
  const {
    rules,
    loading,
    error,
    selectedRule,
    editorContent,
    setEditorContent,
    saving,
    saveError,
    handleSelect,
    handleBack,
    handleSave,
  } = useRulesSection();

  return (
    <div class="p-6">
      <Show
        when={!selectedRule()}
        fallback={
          <RuleEditor
            rule={selectedRule()!}
            content={editorContent()}
            onChange={setEditorContent}
            onSave={handleSave}
            onCancel={handleBack}
            saving={saving()}
            error={saveError()}
          />
        }
      >
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-xl font-semibold">Rules</h2>
            <p class="text-sm text-[var(--color-text-muted)] mt-0.5">
              Claude Code rules from <code class="font-mono">.claude/rules/</code>
            </p>
          </div>
        </div>

        <Show when={!loading()} fallback={<p class="text-sm text-[var(--color-text-muted)]">Loading rules...</p>}>
          <Show when={!error()} fallback={<p class="text-sm text-[var(--color-text-error)]">{error()}</p>}>
            <Show
              when={rules().length > 0}
              fallback={
                <p class="text-sm text-[var(--color-text-muted)] italic">
                  No rules found. Create rules by adding <code class="font-mono">.claude/rules/*.md</code> files.
                </p>
              }
            >
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <For each={rules()}>
                  {(rule) => (
                    <RuleCard rule={rule} onSelect={() => handleSelect(rule)} />
                  )}
                </For>
              </div>
            </Show>
          </Show>
        </Show>
      </Show>
    </div>
  );
};
