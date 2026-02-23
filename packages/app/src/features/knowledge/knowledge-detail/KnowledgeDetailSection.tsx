import { For, Match, Show, Switch } from 'solid-js';
import type { Component } from 'solid-js';
import { EditForm } from '../knowledge-edit/EditForm/EditForm';
import { EditAuditResults } from '../knowledge-edit/EditAuditResults/EditAuditResults';
import { DeleteConfirmation } from '../knowledge-delete/DeleteConfirmation/DeleteConfirmation';
import { DeleteResult } from '../knowledge-delete/DeleteResult/DeleteResult';
import { useKnowledgeDetailSection } from './KnowledgeDetailSection.hook';

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
    handleEdit,
    handleCancelEdit,
    handleSave,
    handleAuditDone,
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
          <div class="space-y-6">
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
                  onClick={handleEdit}
                  class="px-4 py-2 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>

            <div class="space-y-4">
              <div class="flex items-start justify-between">
                <h2 class="text-xl font-semibold">{entryData()?.entry.title ?? ''}</h2>
                <span class="px-2 py-0.5 rounded text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">
                  {entryData()?.entry.category ?? ''}
                </span>
              </div>

              <Show when={(entryData()?.entry.tags.length ?? 0) > 0}>
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

              <div class="text-xs text-[var(--color-text-muted)]">
                <span>Created: {new Date(entryData()?.entry.created_at ?? '').toLocaleDateString()}</span>
                <span class="mx-2">|</span>
                <span>Updated: {new Date(entryData()?.entry.updated_at ?? '').toLocaleDateString()}</span>
              </div>

              <pre class="whitespace-pre-wrap font-mono text-sm rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-4 max-h-96 overflow-y-auto">
                {entryData()?.content ?? ''}
              </pre>
            </div>
          </div>
        </Match>

        {/* Edit mode */}
        <Match when={step() === 'editing' && entryData()}>
          <div class="space-y-4">
            <h2 class="text-lg font-semibold">Edit Knowledge Entry</h2>
            <EditForm
              initialTitle={entryData()?.entry.title ?? ''}
              initialCategory={entryData()?.entry.category ?? ''}
              initialTags={entryData()?.entry.tags ?? []}
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

        {/* Audit results */}
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
}
