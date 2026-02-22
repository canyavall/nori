import { createSignal, onMount, onCleanup, Show, For, Match, Switch } from 'solid-js';
import { useParams, useNavigate } from '@solidjs/router';
import type { KnowledgeEntry, KnowledgeFrontmatter } from '@nori/shared';
import { apiGet } from '../lib/api';
import { connectSSE } from '../lib/sse';
import { updateKnowledgeEntry, removeKnowledgeEntry } from '../stores/knowledge.store';
import { EditForm } from '../features/knowledge/knowledge-edit/EditForm';
import { EditAuditResults } from '../features/knowledge/knowledge-edit/EditAuditResults';
import { DeleteConfirmation } from '../features/knowledge/knowledge-delete/DeleteConfirmation';
import { DeleteResult } from '../features/knowledge/knowledge-delete/DeleteResult';

type PageStep = 'loading' | 'view' | 'editing' | 'saving' | 'audit' | 'confirm-delete' | 'deleting' | 'deleted' | 'error';

interface EntryData {
  entry: KnowledgeEntry;
  content: string;
  frontmatter: KnowledgeFrontmatter;
}

export function KnowledgeDetailPage() {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [step, setStep] = createSignal<PageStep>('loading');
  const [entryData, setEntryData] = createSignal<EntryData | null>(null);
  const [error, setError] = createSignal('');
  const [saveError, setSaveError] = createSignal('');
  const [progressMessage, setProgressMessage] = createSignal('');
  const [auditWarnings, setAuditWarnings] = createSignal<string[]>([]);
  const [savedFilePath, setSavedFilePath] = createSignal('');
  const [deleteError, setDeleteError] = createSignal('');
  const [deleteProgressMessage, setDeleteProgressMessage] = createSignal('');

  let sseController: AbortController | undefined;

  onCleanup(() => {
    sseController?.abort();
  });

  onMount(async () => {
    try {
      const entryRes = await apiGet<{ data: KnowledgeEntry }>(`/api/knowledge/${params.id}`);
      const entry = entryRes.data;

      // Parse tags if stored as JSON string
      if (typeof entry.tags === 'string') {
        try {
          entry.tags = JSON.parse(entry.tags);
        } catch {
          entry.tags = [];
        }
      }

      const contentRes = await apiGet<{ data: { content: string; frontmatter: KnowledgeFrontmatter } }>(
        `/api/knowledge/${params.id}/content`
      );

      setEntryData({
        entry,
        content: contentRes.data.content,
        frontmatter: contentRes.data.frontmatter,
      });
      setStep('view');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entry');
      setStep('error');
    }
  });

  function handleEdit() {
    setSaveError('');
    setStep('editing');
  }

  function handleCancelEdit() {
    setSaveError('');
    setStep('view');
  }

  function handleSave(data: { title: string; category: string; tags: string[]; content: string }) {
    setStep('saving');
    setProgressMessage('Starting update...');
    setSaveError('');
    setAuditWarnings([]);

    const body = {
      title: data.title,
      category: data.category,
      tags: data.tags,
      content: data.content,
    };

    sseController = connectSSE(`/api/knowledge/${params.id}`, body, {
      onEvent: (event, eventData) => {
        const messages: Record<string, string> = {
          'knowledge:edit:started': 'Starting update...',
          'knowledge:edit:loading': 'Loading existing entry...',
          'knowledge:edit:validating-changes': 'Validating changes...',
          'knowledge:edit:writing-changes': 'Writing changes to vault...',
          'knowledge:edit:auditing': 'Running quality audit...',
          'knowledge:edit:regenerating-index': 'Rebuilding search index...',
          'knowledge:edit:completed': 'Update complete!',
        };
        setProgressMessage(messages[event] ?? event);

        if (event === 'knowledge:edit:audit-warning' || event === 'knowledge:edit:index-warning') {
          const msg = (eventData as { message?: string }).message;
          if (msg) {
            setAuditWarnings((prev) => [...prev, msg]);
          }
        }

        if (event === 'knowledge:edit:completed') {
          const d = eventData as { file_path?: string };
          if (d.file_path) setSavedFilePath(d.file_path);
        }
      },
      onResult: (resultData) => {
        const flowResult = resultData as {
          success: boolean;
          data?: { entry_id: string; file_path: string; title: string };
          error?: { message: string };
        };

        if (flowResult.success && flowResult.data) {
          const resp = flowResult.data;
          setSavedFilePath(resp.file_path);

          // Update the local entry data to reflect changes
          const current = entryData();
          if (current) {
            const updatedEntry: KnowledgeEntry = {
              ...current.entry,
              title: body.title,
              category: body.category,
              tags: body.tags,
              updated_at: new Date().toISOString(),
            };
            setEntryData({
              entry: updatedEntry,
              content: body.content,
              frontmatter: {
                ...current.frontmatter,
                title: body.title,
                category: body.category,
                tags: body.tags,
                updated: new Date().toISOString(),
              },
            });
            updateKnowledgeEntry(params.id, {
              title: body.title,
              category: body.category,
              tags: body.tags,
              updated_at: new Date().toISOString(),
            });
          }

          setStep('audit');
        } else {
          setSaveError(flowResult.error?.message ?? 'Update failed');
          setStep('editing');
        }
      },
      onError: (errMsg) => {
        setSaveError(errMsg);
        setStep('editing');
      },
    }, 'PUT');
  }

  function handleAuditDone() {
    setStep('view');
  }

  function handleDeleteRequest() {
    setDeleteError('');
    setStep('confirm-delete');
  }

  function handleDeleteCancel() {
    setDeleteError('');
    setStep('view');
  }

  function handleDeleteConfirm() {
    setStep('deleting');
    setDeleteProgressMessage('Starting deletion...');
    setDeleteError('');

    sseController = connectSSE(`/api/knowledge/${params.id}`, {}, {
      onEvent: (event) => {
        const messages: Record<string, string> = {
          'knowledge:delete:started': 'Starting deletion...',
          'knowledge:delete:validating-exists': 'Validating entry...',
          'knowledge:delete:checking-dependencies': 'Checking dependencies...',
          'knowledge:delete:deleting-file': 'Deleting file from vault...',
          'knowledge:delete:regenerating-index': 'Rebuilding search index...',
          'knowledge:delete:completed': 'Deletion complete!',
        };
        setDeleteProgressMessage(messages[event] ?? event);
      },
      onResult: (resultData) => {
        const flowResult = resultData as {
          success: boolean;
          data?: { deleted_file_path: string };
          error?: { message: string };
        };

        if (flowResult.success) {
          removeKnowledgeEntry(params.id);
          setStep('deleted');
        } else {
          setDeleteError(flowResult.error?.message ?? 'Deletion failed');
          setStep('confirm-delete');
        }
      },
      onError: (errMsg) => {
        setDeleteError(errMsg);
        setStep('confirm-delete');
      },
    }, 'DELETE');
  }

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
              onClick={() => navigate('/knowledge')}
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
                onClick={() => navigate('/knowledge')}
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
                <h2 class="text-xl font-semibold">{entryData()!.entry.title}</h2>
                <span class="px-2 py-0.5 rounded text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">
                  {entryData()!.entry.category}
                </span>
              </div>

              <Show when={entryData()!.entry.tags.length > 0}>
                <div class="flex flex-wrap gap-1.5">
                  <For each={entryData()!.entry.tags}>
                    {(tag) => (
                      <span class="px-1.5 py-0.5 rounded text-xs bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                        {tag}
                      </span>
                    )}
                  </For>
                </div>
              </Show>

              <div class="text-xs text-[var(--color-text-muted)]">
                <span>Created: {new Date(entryData()!.entry.created_at).toLocaleDateString()}</span>
                <span class="mx-2">|</span>
                <span>Updated: {new Date(entryData()!.entry.updated_at).toLocaleDateString()}</span>
              </div>

              <pre class="whitespace-pre-wrap font-mono text-sm rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-4 max-h-96 overflow-y-auto">
                {entryData()!.content}
              </pre>
            </div>
          </div>
        </Match>

        {/* Edit mode */}
        <Match when={step() === 'editing' && entryData()}>
          <div class="space-y-4">
            <h2 class="text-lg font-semibold">Edit Knowledge Entry</h2>
            <EditForm
              initialTitle={entryData()!.entry.title}
              initialCategory={entryData()!.entry.category}
              initialTags={entryData()!.entry.tags}
              initialContent={entryData()!.content}
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
              entryTitle={entryData()!.entry.title}
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
              onDone={() => navigate('/knowledge')}
            />
          </div>
        </Match>
      </Switch>
    </div>
  );
}
