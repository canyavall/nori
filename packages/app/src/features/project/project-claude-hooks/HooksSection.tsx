import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import { useHooksSection } from './HooksSection.hook';
import { CodeEditor } from '../../../components/ui/CodeEditor/CodeEditor';

export const HooksSection: Component = () => {
  const {
    loading,
    error,
    activeTab,
    setActiveTab,
    currentContent,
    setCurrentContent,
    saving,
    saveError,
    saveSuccess,
    handleSave,
  } = useHooksSection();

  return (
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-semibold">Hooks</h2>
          <p class="text-sm text-[var(--color-text-muted)] mt-0.5">
            Claude Code hook configuration from <code class="font-mono">.claude/settings.json</code>
          </p>
        </div>
        <div class="flex items-center gap-2">
          <Show when={saveSuccess()}>
            <span class="text-sm text-green-400">Saved</span>
          </Show>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving()}
            class="px-3 py-1.5 text-sm rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors"
          >
            {saving() ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <Show when={!loading()} fallback={<p class="text-sm text-[var(--color-text-muted)]">Loading hooks...</p>}>
        <Show when={!error()} fallback={<p class="text-sm text-[var(--color-text-error)]">{error()}</p>}>
          <div class="mb-4">
            <div class="flex border-b border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => setActiveTab('shared')}
                class={`px-4 py-2 text-sm border-b-2 transition-colors ${
                  activeTab() === 'shared'
                    ? 'border-[var(--color-accent)] text-[var(--color-text)]'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                Shared
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('local')}
                class={`px-4 py-2 text-sm border-b-2 transition-colors ${
                  activeTab() === 'local'
                    ? 'border-[var(--color-accent)] text-[var(--color-text)]'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                Local
              </button>
            </div>
            <p class="text-xs text-[var(--color-text-muted)] mt-2">
              {activeTab() === 'shared'
                ? 'Shared hooks are committed to git (settings.json)'
                : 'Local hooks are personal and not committed (settings.local.json)'}
            </p>
          </div>

          <Show when={saveError()}>
            <p class="text-sm text-[var(--color-text-error)] mb-3">{saveError()}</p>
          </Show>

          <CodeEditor
            value={currentContent()}
            onChange={setCurrentContent}
            language="json"
          />
        </Show>
      </Show>
    </div>
  );
};
