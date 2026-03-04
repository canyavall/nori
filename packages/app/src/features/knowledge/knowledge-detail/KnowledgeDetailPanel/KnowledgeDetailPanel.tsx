import { For, Show } from 'solid-js';
import type { Component } from 'solid-js';
import { EditForm } from '../../knowledge-edit/EditForm/EditForm';
import { DeleteConfirmation } from '../../knowledge-delete/DeleteConfirmation/DeleteConfirmation';
import { DeleteResult } from '../../knowledge-delete/DeleteResult/DeleteResult';
import { MarkdownContent } from '../../../../components/ui/MarkdownContent/MarkdownContent';
import type { KnowledgeDetailPanelProps } from './KnowledgeDetailPanel.type';
import { useKnowledgeDetailPanel } from './KnowledgeDetailPanel.hook';

const Chevron: Component<{ open: boolean }> = (props) => (
  <svg
    class={`w-3.5 h-3.5 text-[var(--color-text-muted)] transition-transform ${props.open ? 'rotate-180' : ''}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    aria-hidden="true"
  >
    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

export const KnowledgeDetailPanel: Component<KnowledgeDetailPanelProps> = (props) => {
  const {
    step,
    error,
    saveError,
    progressMessage,
    entry,
    content,
    frontmatter,
    contentViewMode,
    mainFieldsOpen,
    additionalFieldsOpen,
    deleteError,
    deleteProgressMessage,
    handleContentViewModeChange,
    toggleMainFields,
    toggleAdditionalFields,
    handleEdit,
    handleCancelEdit,
    handleSave,
    handleDeleteRequest,
    handleDeleteCancel,
    handleDeleteConfirm,
  } = useKnowledgeDetailPanel(props);

  return (
    <div class="h-full flex flex-col">
      {/* Loading */}
      <Show when={step() === 'loading'}>
        <div class="flex-1 flex items-center justify-center">
          <div class="text-center space-y-4">
            <div class="inline-block w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
            <p class="text-sm text-[var(--color-text-muted)]">Loading entry...</p>
          </div>
        </div>
      </Show>

      {/* Error */}
      <Show when={step() === 'error'}>
        <div class="flex-1 flex items-center justify-center p-8">
          <div class="p-3 rounded-md bg-[var(--color-error)]/10 border border-[var(--color-error)]/20">
            <p class="text-sm text-[var(--color-error)]">{error()}</p>
          </div>
        </div>
      </Show>

      {/* Saving */}
      <Show when={step() === 'saving'}>
        <div class="flex-1 flex items-center justify-center">
          <div class="text-center space-y-4">
            <div class="inline-block w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
            <p class="text-sm text-[var(--color-text-muted)]">{progressMessage()}</p>
          </div>
        </div>
      </Show>

      {/* Deleting */}
      <Show when={step() === 'deleting'}>
        <div class="flex-1 flex items-center justify-center">
          <div class="text-center space-y-4">
            <div class="inline-block w-8 h-8 border-2 border-[var(--color-error)] border-t-transparent rounded-full animate-spin" />
            <p class="text-sm text-[var(--color-text-muted)]">{deleteProgressMessage()}</p>
          </div>
        </div>
      </Show>

      {/* Delete confirmation */}
      <Show when={step() === 'confirm-delete' && entry()} keyed>
        {(e) => (
          <div class="flex-1 overflow-y-auto p-6">
            <DeleteConfirmation
              entryTitle={e.title}
              error={deleteError()}
              onConfirm={handleDeleteConfirm}
              onCancel={handleDeleteCancel}
            />
          </div>
        )}
      </Show>

      {/* Deleted */}
      <Show when={step() === 'deleted' && entry()} keyed>
        {(e) => (
          <div class="flex-1 overflow-y-auto p-6">
            <DeleteResult
              entryTitle={e.title}
              onDone={() => props.onDeleted?.()}
            />
          </div>
        )}
      </Show>

      {/* View mode */}
      <Show when={step() === 'view' && entry()} keyed>
        {(e) => (
          <div class="flex-1 min-h-0 flex flex-col overflow-y-auto">
            {/* Title + actions */}
            <div class="flex-shrink-0 flex items-start justify-between gap-4 p-6 pb-4">
              <h2 class="text-2xl font-semibold leading-tight">{e.title}</h2>
              <div class="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleEdit}
                  class="px-3 py-1.5 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleDeleteRequest}
                  class="px-3 py-1.5 rounded-md border border-[var(--color-error)]/30 text-sm text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Details accordion (category, description, tags — always rendered, expanded by default) */}
            <div class="flex-shrink-0 px-6 pb-3">
              <div class="border border-[var(--color-border)] rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={toggleMainFields}
                  data-testid="details-toggle"
                  class="w-full flex items-center justify-between px-4 py-2.5 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors text-left"
                >
                  <span class="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Details</span>
                  <Chevron open={mainFieldsOpen()} />
                </button>
                <Show when={mainFieldsOpen()}>
                  <div class="px-4 py-3 space-y-3 border-t border-[var(--color-border)]" data-testid="details-body">
                    <div>
                      <p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-1">Category</p>
                      <p class="text-sm text-[var(--color-text)]">{e.category || '—'}</p>
                    </div>
                    <div>
                      <p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-1">Description</p>
                      <p class="text-sm text-[var(--color-text)]">{e.description || '—'}</p>
                    </div>
                    <div>
                      <p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">Tags</p>
                      <Show
                        when={Array.isArray(e.tags) && e.tags.length > 0}
                        fallback={<p class="text-sm text-[var(--color-text-muted)]">—</p>}
                      >
                        <div class="flex flex-wrap gap-1.5">
                          <For each={e.tags}>
                            {(tag) => (
                              <span class="px-2 py-0.5 rounded text-xs bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                                {tag}
                              </span>
                            )}
                          </For>
                        </div>
                      </Show>
                    </div>
                  </div>
                </Show>
              </div>
            </div>

            {/* Additional accordion (rules, required knowledge — collapsed by default) */}
            <div class="flex-shrink-0 px-6 pb-3">
              <div class="border border-[var(--color-border)] rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={toggleAdditionalFields}
                  data-testid="additional-toggle"
                  class="w-full flex items-center justify-between px-4 py-2.5 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors text-left"
                >
                  <span class="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Additional</span>
                  <Chevron open={additionalFieldsOpen()} />
                </button>
                <Show when={additionalFieldsOpen()}>
                  <div class="px-4 py-3 space-y-3 border-t border-[var(--color-border)]" data-testid="additional-body">
                    <div>
                      <p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-2">Rules</p>
                      <Show
                        when={Array.isArray(e.rules) && e.rules.length > 0}
                        fallback={<p class="text-sm text-[var(--color-text-muted)]">—</p>}
                      >
                        <ul class="space-y-1">
                          <For each={e.rules}>
                            {(rule) => (
                              <li class="text-sm text-[var(--color-text)] flex gap-2">
                                <span class="text-[var(--color-text-muted)] flex-shrink-0">·</span>
                                <span>{rule}</span>
                              </li>
                            )}
                          </For>
                        </ul>
                      </Show>
                    </div>
                    <div>
                      <p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-2">Required Knowledge</p>
                      <Show
                        when={Array.isArray(e.required_knowledge) && e.required_knowledge.length > 0}
                        fallback={<p class="text-sm text-[var(--color-text-muted)]">—</p>}
                      >
                        <div class="flex flex-wrap gap-1.5">
                          <For each={e.required_knowledge}>
                            {(rk) => (
                              <span class="px-2 py-0.5 rounded text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text)]">
                                {rk}
                              </span>
                            )}
                          </For>
                        </div>
                      </Show>
                    </div>
                  </div>
                </Show>
              </div>
            </div>

            {/* Content — always shown, fills remaining height */}
            <div class="flex-1 min-h-[200px] flex flex-col px-6 pb-6">
              <div class="flex items-center justify-between mb-2">
                <p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">Content</p>
                <div class="flex rounded-md border border-[var(--color-border)] overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => handleContentViewModeChange('markdown')}
                    class={contentViewMode() === 'markdown'
                      ? 'px-2 py-1 bg-[var(--color-accent)] text-white transition-colors'
                      : 'px-2 py-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors'}
                  >
                    Markdown
                  </button>
                  <button
                    type="button"
                    onClick={() => handleContentViewModeChange('text')}
                    class={contentViewMode() === 'text'
                      ? 'px-2 py-1 bg-[var(--color-accent)] text-white transition-colors'
                      : 'px-2 py-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors'}
                  >
                    Plain text
                  </button>
                </div>
              </div>
              <MarkdownContent content={content()} viewMode={contentViewMode()} />
            </div>
          </div>
        )}
      </Show>

      {/* Edit mode */}
      <Show when={step() === 'editing' && entry()} keyed>
        {(e) => (
          <div class="flex-1 overflow-y-auto p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold">Edit Entry</h2>
              <button
                type="button"
                onClick={handleDeleteRequest}
                class="px-3 py-1.5 rounded-md border border-[var(--color-error)]/50 text-[var(--color-error)] text-sm hover:bg-[var(--color-error)]/10 transition-colors"
              >
                Delete
              </button>
            </div>
            <EditForm
              initialTitle={e.title}
              initialCategory={e.category ?? ''}
              initialTags={e.tags ?? []}
              initialDescription={e.description ?? ''}
              initialRequiredKnowledge={e.required_knowledge ?? []}
              initialRules={e.rules ?? []}
              initialContent={content()}
              error={saveError()}
              onSave={handleSave}
              onCancel={handleCancelEdit}
            />
          </div>
        )}
      </Show>
    </div>
  );
};
