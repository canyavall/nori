import { For, Show } from 'solid-js';
import type { Component } from 'solid-js';
import { EditForm } from '../../knowledge-edit/EditForm/EditForm';
import { MarkdownContent } from '../../../../components/ui/MarkdownContent/MarkdownContent';
import type { KnowledgeDetailPanelProps } from './KnowledgeDetailPanel.type';
import { useKnowledgeDetailPanel } from './KnowledgeDetailPanel.hook';

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
    handleContentViewModeChange,
    handleEdit,
    handleCancelEdit,
    handleSave,
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

      {/* View mode */}
      <Show when={step() === 'view' && entry()} keyed>
        {(e) => (
          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Top action bar */}
            <div class="flex items-start justify-between gap-4">
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
                  disabled
                  class="px-3 py-1.5 rounded-md border border-[var(--color-border)] text-sm text-[var(--color-text-muted)] opacity-40 cursor-not-allowed"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Category */}
            <div>
              <p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-1">Category</p>
              <p class="text-sm text-[var(--color-text)]">{e.category || '—'}</p>
            </div>

            {/* Description */}
            <Show when={e.description}>
              <div>
                <p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-1">Description</p>
                <p class="text-sm text-[var(--color-text)]">{e.description}</p>
              </div>
            </Show>

            {/* Tags */}
            <Show when={Array.isArray(e.tags) && e.tags.length > 0}>
              <div>
                <p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-2">Tags</p>
                <div class="flex flex-wrap gap-1.5">
                  <For each={e.tags}>
                    {(tag) => (
                      <span class="px-2 py-0.5 rounded text-xs bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                        {tag}
                      </span>
                    )}
                  </For>
                </div>
              </div>
            </Show>

            {/* Rules */}
            <Show when={Array.isArray(e.rules) && e.rules.length > 0}>
              <div>
                <p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-2">Rules</p>
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
              </div>
            </Show>

            {/* Required Knowledge */}
            <Show when={Array.isArray(e.required_knowledge) && e.required_knowledge.length > 0}>
              <div>
                <p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-2">Required Knowledge</p>
                <div class="flex flex-wrap gap-1.5">
                  <For each={e.required_knowledge}>
                    {(rk) => (
                      <span class="px-2 py-0.5 rounded text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text)]">
                        {rk}
                      </span>
                    )}
                  </For>
                </div>
              </div>
            </Show>

            {/* Content */}
            <Show when={content()}>
              <div>
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
            </Show>
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
