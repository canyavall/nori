import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import type { Accessor } from 'solid-js';
import { CodeEditor } from '../../../../../../components/ui/CodeEditor/CodeEditor';
import type { HooksData } from '../../ProjectDashboardSection.hook';
import { useHooksAccordion } from './HooksAccordion.hook';

interface HooksAccordionProps {
  hooksData: Accessor<HooksData>;
  projectPath: Accessor<string>;
}

export const HooksAccordion: Component<HooksAccordionProps> = (props) => {
  const {
    open,
    setOpen,
    editing,
    hookCount,
    activeTab,
    setActiveTab,
    currentContent,
    setCurrentContent,
    saving,
    saveError,
    saveSuccess,
    handleOpenEdit,
    handleSave,
    handleCancel,
  } = useHooksAccordion(props.hooksData, props.projectPath);

  return (
    <div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
      <button
        type="button"
        onClick={() => setOpen(!open())}
        class="w-full flex items-center justify-between px-4 py-3 text-left transition-colors rounded-lg"
      >
        <div class="flex items-center gap-2">
          <span class="font-medium">Hooks</span>
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
            {hookCount()}
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
          <div class="flex items-center justify-between">
            <p class="text-sm text-[var(--color-text-muted)]">
              Hook configuration from <code class="font-mono">.claude/settings.json</code>
            </p>
            <button
              type="button"
              onClick={handleOpenEdit}
              class="px-2.5 py-1 text-xs rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              Edit
            </button>
          </div>
        </div>
      </Show>

      <Show when={editing()}>
        <div class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50" onClick={handleCancel} />
          <div class="relative w-full max-w-2xl h-[80vh] flex flex-col rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-xl p-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="text-xl font-semibold">Edit Hooks</h2>
                <p class="text-sm text-[var(--color-text-muted)] font-mono">.claude/settings.json</p>
              </div>
              <div class="flex items-center gap-2">
                <Show when={saveSuccess()}>
                  <span class="text-sm text-green-400">Saved</span>
                </Show>
                <button
                  type="button"
                  onClick={handleCancel}
                  class="px-3 py-1.5 text-sm rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  Cancel
                </button>
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

            <div class="flex-1 min-h-0">
              <CodeEditor value={currentContent()} onChange={setCurrentContent} language="json" />
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};
