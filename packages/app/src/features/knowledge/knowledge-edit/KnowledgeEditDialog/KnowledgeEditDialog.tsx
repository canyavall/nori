import { Show } from 'solid-js';
import { EditForm } from '../EditForm/EditForm';
import type { KnowledgeEditDialogProps } from './KnowledgeEditDialog.type';
import { useKnowledgeEditDialog } from './KnowledgeEditDialog.hook';

export const KnowledgeEditDialog = (props: KnowledgeEditDialogProps) => {
  const {
    step,
    error,
    saveError,
    progressMessage,
    entry,
    content,
    frontmatter,
    handleSave,
    onClose,
  } = useKnowledgeEditDialog(props.entryId, props.onClose);

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/60" onClick={onClose} />
      <div class="relative z-10 w-full max-w-2xl mx-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-xl max-h-[90vh] flex flex-col">

        <div class="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
          <h2 class="text-base font-semibold">Edit Knowledge Entry</h2>
          <button type="button" onClick={onClose}
            class="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors text-lg leading-none">
            ✕
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-5">
          <Show when={step() === 'loading'}>
            <div class="py-12 text-center space-y-4">
              <div class="inline-block w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
              <p class="text-sm text-[var(--color-text-muted)]">Loading entry...</p>
            </div>
          </Show>

          <Show when={step() === 'error'}>
            <div class="p-3 rounded-md bg-[var(--color-error)]/10 border border-[var(--color-error)]/20">
              <p class="text-sm text-[var(--color-error)]">{error()}</p>
            </div>
          </Show>

          <Show when={step() === 'editing' && entry()}>
            <EditForm
              initialTitle={entry()?.title ?? ''}
              initialCategory={entry()?.category ?? ''}
              initialTags={entry()?.tags ?? []}
              initialDescription={entry()?.description ?? ''}
              initialRequiredKnowledge={entry()?.required_knowledge ?? []}
              initialRules={entry()?.rules ?? []}
              initialOptionalKnowledge={frontmatter()?.optional_knowledge}
              initialContent={content()}
              error={saveError()}
              onSave={handleSave}
              onCancel={onClose}
            />
          </Show>

          <Show when={step() === 'saving'}>
            <div class="py-12 text-center space-y-4">
              <div class="inline-block w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
              <p class="text-sm text-[var(--color-text-muted)]">{progressMessage()}</p>
            </div>
          </Show>

          <Show when={step() === 'done'}>
            <div class="py-10 text-center space-y-3">
              <p class="text-base font-medium">Entry updated</p>
              <button type="button" onClick={onClose}
                class="mt-2 px-4 py-2 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors">
                Done
              </button>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
}
