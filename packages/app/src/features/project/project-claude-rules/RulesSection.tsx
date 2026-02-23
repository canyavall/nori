import type { Component } from 'solid-js';
import { Show, For } from 'solid-js';
import { useRulesSection } from './RulesSection.hook';
import { RuleCard } from './components/RuleCard/RuleCard';
import { RuleEditor } from './RuleEditor';

export const RulesSection: Component = () => {
  const {
    rootRules,
    projectRules,
    modularRules,
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

  const hasRules = () =>
    rootRules().length > 0 || projectRules().length > 0 || modularRules().length > 0;

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
              Claude Code rules from <code class="font-mono">CLAUDE.md</code> and <code class="font-mono">.claude/rules/</code>
            </p>
          </div>
        </div>

        <Show when={!loading()} fallback={<p class="text-sm text-[var(--color-text-muted)]">Loading rules...</p>}>
          <Show when={!error()} fallback={<p class="text-sm text-[var(--color-text-error)]">{error()}</p>}>
            <Show
              when={hasRules()}
              fallback={
                <p class="text-sm text-[var(--color-text-muted)] italic">
                  No rules found. Create rules by adding a <code class="font-mono">CLAUDE.md</code> or <code class="font-mono">.claude/rules/*.md</code> files.
                </p>
              }
            >
              <Show when={rootRules().length > 0}>
                <div class="mb-6">
                  <h3 class="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-3">Root</h3>
                  <div class="space-y-2">
                    <For each={rootRules()}>
                      {(rule) => <RuleCard rule={rule} onSelect={() => handleSelect(rule)} />}
                    </For>
                  </div>
                </div>
              </Show>

              <Show when={projectRules().length > 0}>
                <div class="mb-6">
                  <h3 class="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-3">Project</h3>
                  <div class="space-y-2">
                    <For each={projectRules()}>
                      {(rule) => <RuleCard rule={rule} onSelect={() => handleSelect(rule)} />}
                    </For>
                  </div>
                </div>
              </Show>

              <Show when={modularRules().length > 0}>
                <div class="mb-6">
                  <h3 class="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-3">Modular Rules</h3>
                  <div class="space-y-2">
                    <For each={modularRules()}>
                      {(rule) => <RuleCard rule={rule} onSelect={() => handleSelect(rule)} />}
                    </For>
                  </div>
                </div>
              </Show>
            </Show>
          </Show>
        </Show>
      </Show>
    </div>
  );
};
