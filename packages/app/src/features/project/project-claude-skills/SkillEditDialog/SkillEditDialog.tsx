import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import type { SkillEditDialogProps } from './SkillEditDialog.type';
import { useSkillEditDialog } from './SkillEditDialog.hook';
import { CodeEditor } from '../../../../components/ui/CodeEditor/CodeEditor';
import { ChatPane } from './components/ChatPane/ChatPane';

export const SkillEditDialog: Component<SkillEditDialogProps> = (props) => {
  const { content, setContent, loading, loadError, saving, saveError, handleSave } =
    useSkillEditDialog(
      () => props.skill,
      () => props.projectPath,
      props.onSaved,
      props.onClose,
    );

  const allSkillsJson = () => JSON.stringify(props.allSkills);

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/60" onClick={props.onClose} />
      <div class="relative z-10 w-full max-w-3xl mx-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-xl flex flex-col"
           style={{ height: 'min(90vh, 700px)' }}>

        {/* Header */}
        <div class="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)] shrink-0">
          <div>
            <h2 class="text-sm font-semibold">{props.skill.name}</h2>
            <p class="text-xs text-[var(--color-text-muted)] font-mono mt-0.5">{props.skill.path}</p>
          </div>
          <button
            type="button"
            onClick={props.onClose}
            class="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <Show
          when={!loading()}
          fallback={
            <div class="flex-1 flex items-center justify-center text-sm text-[var(--color-text-muted)]">
              Loading...
            </div>
          }
        >
          <Show
            when={!loadError()}
            fallback={
              <div class="flex-1 flex items-center justify-center text-sm text-[var(--color-text-error)] px-6">
                {loadError()}
              </div>
            }
          >
            {/* Split: editor top, chat bottom */}
            <div class="flex flex-col flex-1 min-h-0">
              {/* Editor — top half */}
              <div class="flex-1 min-h-0 overflow-hidden border-b border-[var(--color-border)] p-3">
                <CodeEditor value={content()} onChange={setContent} language="markdown" />
              </div>

              {/* Chat pane — bottom half */}
              <div class="flex-1 min-h-0 overflow-hidden flex flex-col" style={{ 'max-height': '45%' }}>
                <div class="px-3 pt-2 pb-1 text-xs font-medium text-[var(--color-text-muted)] border-b border-[var(--color-border)] shrink-0">
                  AI Chat
                </div>
                <div class="flex-1 min-h-0 overflow-hidden">
                  <ChatPane
                    skillName={props.skill.name}
                    allSkillsJson={allSkillsJson()}
                    projectPath={props.projectPath}
                    editorContent={content}
                    onApplyContent={setContent}
                  />
                </div>
              </div>
            </div>
          </Show>
        </Show>

        {/* Footer */}
        <div class="flex items-center justify-between px-5 py-3 border-t border-[var(--color-border)] shrink-0">
          <Show when={saveError()}>
            <p class="text-xs text-[var(--color-text-error)]">{saveError()}</p>
          </Show>
          <div class="flex gap-2 ml-auto">
            <button
              type="button"
              onClick={props.onClose}
              class="px-3 py-1.5 text-sm rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving() || loading()}
              class="px-3 py-1.5 text-sm rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors"
            >
              {saving() ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
