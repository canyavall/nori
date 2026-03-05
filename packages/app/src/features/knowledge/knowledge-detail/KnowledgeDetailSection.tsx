import { For, Match, Show, Switch } from 'solid-js';
import type { Component } from 'solid-js';
import { EditForm } from '../knowledge-edit/EditForm/EditForm';
import { EditAuditResults } from '../knowledge-edit/EditAuditResults/EditAuditResults';
import { DeleteConfirmation } from '../knowledge-delete/DeleteConfirmation/DeleteConfirmation';
import { DeleteResult } from '../knowledge-delete/DeleteResult/DeleteResult';
import { MarkdownContent } from '../../../components/ui/MarkdownContent/MarkdownContent';
import { AuditResults } from './AuditResults/AuditResults';
import { useKnowledgeDetailSection } from './KnowledgeDetailSection.hook';

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

export const KnowledgeDetailSection: Component = () => {
  const {
    params,
    step,
    entryData,
    error,
    saveError,
    progressMessage,
    auditWarnings,
    savedFilePath,
    deleteError,
    deleteProgressMessage,
    contentViewMode,
    mainFieldsOpen,
    additionalFieldsOpen,
    auditResult,
    auditProgressMessage,
    auditInitialValues,
    handleContentViewModeChange,
    toggleMainFields,
    toggleAdditionalFields,
    handleEdit,
    handleCancelEdit,
    handleSave,
    handleAuditDone,
    handleAudit,
    handleApplySuggestions,
    handleAuditDismiss,
    handleDeleteRequest,
    handleDeleteCancel,
    handleDeleteConfirm,
    navigateToKnowledge,
  } = useKnowledgeDetailSection();

  return (
    <div class="p-6 max-w-3xl mx-auto">
      <Switch>
        {/* Loading */}
        <Match when={step() === 'loading'}>
          <div class="py-12 text-center space-y-4">
            <div class="inline-block w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
            <p class="text-sm text-[var(--color-text-muted)]">Loading entry...</p>
          </div>
        </Match>

        {/* Error */}
        <Match when={step() === 'error'}>
          <div class="space-y-4">
            <div class="p-4 rounded-md bg-[var(--color-error)]/10 border border-[var(--color-error)]/20">
              <p class="text-sm text-[var(--color-error)]">{error()}</p>
            </div>
            <button
              type="button"
              onClick={navigateToKnowledge}
              class="px-4 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              Back to Knowledge
            </button>
          </div>
        </Match>

        {/* View mode */}
        <Match when={step() === 'view' && entryData()}>
          <div class="space-y-4">
            {/* Nav + actions */}
            <div class="flex items-center justify-between">
              <button
                type="button"
                onClick={navigateToKnowledge}
                class="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                &larr; Back to Knowledge
              </button>
              <div class="flex gap-2">
                <button
                  type="button"
                  onClick={handleDeleteRequest}
                  class="px-4 py-2 rounded-md text-sm text-[var(--color-error)] border border-[var(--color-error)]/30 hover:bg-[var(--color-error)]/10 transition-colors"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={handleAudit}
                  class="px-4 py-2 rounded-md text-sm border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                >
                  Audit
                </button>
                <button
                  type="button"
                  onClick={() => handleEdit()}
                  class="px-4 py-2 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>

            {/* Title */}
            <h2 class="text-xl font-semibold">{entryData()?.entry.title ?? ''}</h2>

            {/* Details accordion (category, description, tags — always rendered, expanded by default) */}
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
                    <p class="text-sm text-[var(--color-text)]">{entryData()?.entry.category || '—'}</p>
                  </div>
                  <div>
                    <p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-1">Description</p>
                    <p class="text-sm text-[var(--color-text)]">{entryData()?.entry.description || '—'}</p>
                  </div>
                  <div>
                    <p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">Tags</p>
                    <Show
                      when={(entryData()?.entry.tags.length ?? 0) > 0}
                      fallback={<p class="text-sm text-[var(--color-text-muted)]">—</p>}
                    >
                      <div class="flex flex-wrap gap-1.5">
                        <For each={entryData()?.entry.tags ?? []}>
                          {(tag) => (
                            <span class="px-1.5 py-0.5 rounded text-xs bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                              {tag}
                            </span>
                          )}
                        </For>
                      </div>
                    </Show>
                  </div>
                  <div class="text-xs text-[var(--color-text-muted)]">
                    <span>Created: {new Date(entryData()?.entry.created_at ?? '').toLocaleDateString()}</span>
                    <span class="mx-2">|</span>
                    <span>Updated: {new Date(entryData()?.entry.updated_at ?? '').toLocaleDateString()}</span>
                  </div>
                </div>
              </Show>
            </div>

            {/* Additional accordion (rules, required knowledge — collapsed by default) */}
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
                    <p class="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-1">Rules</p>
                    <Show
                      when={(entryData()?.entry.rules?.length ?? 0) > 0}
                      fallback={<p class="text-sm text-[var(--color-text-muted)]">—</p>}
                    >
                      <ul class="text-xs text-[var(--color-text-muted)] list-disc list-inside">
                        <For each={entryData()?.entry.rules ?? []}>
                          {(rule) => <li>{rule}</li>}
                        </For>
                      </ul>
                    </Show>
                  </div>
                  <div>
                    <p class="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-1">Required Knowledge</p>
                    <Show
                      when={(entryData()?.entry.required_knowledge?.length ?? 0) > 0}
                      fallback={<p class="text-sm text-[var(--color-text-muted)]">—</p>}
                    >
                      <div class="flex flex-wrap gap-1.5">
                        <For each={entryData()?.entry.required_knowledge ?? []}>
                          {(item) => (
                            <span class="px-1.5 py-0.5 rounded text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">
                              {item}
                            </span>
                          )}
                        </For>
                      </div>
                    </Show>
                  </div>
                </div>
              </Show>
            </div>

            {/* Content — always visible, no height cap */}
            <div>
              <div class="flex items-center justify-between mb-2">
                <p class="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Content</p>
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
              <MarkdownContent content={entryData()?.content ?? ''} viewMode={contentViewMode()} />
            </div>
          </div>
        </Match>

        {/* Edit mode */}
        <Match when={step() === 'editing' && entryData()}>
          <div class="space-y-4">
            <h2 class="text-lg font-semibold">Edit Knowledge Entry</h2>
            <EditForm
              initialTitle={entryData()?.entry.title ?? ''}
              initialCategory={auditInitialValues()?.category ?? entryData()?.entry.category ?? ''}
              initialTags={auditInitialValues()?.tags ?? entryData()?.entry.tags ?? []}
              initialDescription={auditInitialValues()?.description ?? entryData()?.entry.description ?? ''}
              initialRequiredKnowledge={auditInitialValues()?.required_knowledge ?? entryData()?.entry.required_knowledge ?? []}
              initialRules={auditInitialValues()?.rules ?? entryData()?.entry.rules ?? []}
              initialContent={entryData()?.content ?? ''}
              error={saveError()}
              onSave={handleSave}
              onCancel={handleCancelEdit}
            />
          </div>
        </Match>

        {/* Saving (progress) */}
        <Match when={step() === 'saving'}>
          <div class="py-12 text-center space-y-4">
            <div class="inline-block w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
            <p class="text-sm text-[var(--color-text-muted)]">{progressMessage()}</p>
          </div>
        </Match>

        {/* Audit results (post-edit) */}
        <Match when={step() === 'audit'}>
          <div class="space-y-4">
            <h2 class="text-lg font-semibold">Update Results</h2>
            <EditAuditResults
              entryId={params.id}
              filePath={savedFilePath() || entryData()?.entry.file_path || ''}
              warnings={auditWarnings()}
              onDone={handleAuditDone}
            />
          </div>
        </Match>

        {/* Auditing (progress) */}
        <Match when={step() === 'auditing'}>
          <div class="py-12 text-center space-y-4">
            <div class="inline-block w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
            <p class="text-sm text-[var(--color-text-muted)]">{auditProgressMessage()}</p>
          </div>
        </Match>

        {/* Audit result (standalone LLM audit) */}
        <Match when={step() === 'audit-result'}>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold">Audit Results</h2>
              <p class="text-sm text-[var(--color-text-muted)]">{entryData()?.entry.title ?? ''}</p>
            </div>
            <Show
              when={auditResult()}
              fallback={
                <div class="py-8 text-center text-sm text-[var(--color-text-muted)]">
                  No LLM result available — structural checks only.
                  <button
                    type="button"
                    onClick={handleAuditDismiss}
                    class="block mx-auto mt-4 px-4 py-2 rounded-md text-sm border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              }
            >
              <AuditResults
                result={auditResult()!}
                onApplySuggestions={handleApplySuggestions}
                onDismiss={handleAuditDismiss}
              />
            </Show>
          </div>
        </Match>

        {/* Delete confirmation */}
        <Match when={step() === 'confirm-delete' && entryData()}>
          <div class="space-y-4">
            <h2 class="text-lg font-semibold">Delete Knowledge Entry</h2>
            <DeleteConfirmation
              entryTitle={entryData()?.entry.title ?? ''}
              error={deleteError()}
              onConfirm={handleDeleteConfirm}
              onCancel={handleDeleteCancel}
            />
          </div>
        </Match>

        {/* Deleting (progress) */}
        <Match when={step() === 'deleting'}>
          <div class="py-12 text-center space-y-4">
            <div class="inline-block w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
            <p class="text-sm text-[var(--color-text-muted)]">{deleteProgressMessage()}</p>
          </div>
        </Match>

        {/* Deleted result */}
        <Match when={step() === 'deleted'}>
          <div class="space-y-4">
            <DeleteResult
              entryTitle={entryData()?.entry.title ?? 'Unknown'}
              onDone={navigateToKnowledge}
            />
          </div>
        </Match>
      </Switch>
    </div>
  );
};
