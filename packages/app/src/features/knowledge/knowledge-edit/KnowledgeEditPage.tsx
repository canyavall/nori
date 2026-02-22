import { createSignal, Match, Switch, onMount } from 'solid-js';
import type { KnowledgeEntry, KnowledgeEditResponse } from '@nori/shared';
import { updateKnowledgeEntry } from '../../../stores/knowledge.store';
import { apiGet } from '../../../lib/api';
import { connectSSE } from '../../../lib/sse';
import { EditForm } from './EditForm';
import { EditAuditResults } from './EditAuditResults';

type PageStep = 'loading' | 'form' | 'progress' | 'audit' | 'error';

interface Props {
  entryId: string;
  onBack: () => void;
}

export function KnowledgeEditPage(props: Props) {
  const [step, setStep] = createSignal<PageStep>('loading');
  const [entry, setEntry] = createSignal<KnowledgeEntry | null>(null);
  const [content, setContent] = createSignal('');
  const [progressMessage, setProgressMessage] = createSignal('');
  const [error, setError] = createSignal('');
  const [auditWarnings, setAuditWarnings] = createSignal<string[]>([]);

  let sseController: AbortController | undefined;

  onMount(async () => {
    try {
      const res = await apiGet<{ data: KnowledgeEntry }>(`/api/knowledge/${props.entryId}`);
      setEntry(res.data);

      const contentRes = await apiGet<{ data: { content: string } }>(`/api/knowledge/${props.entryId}/content`);
      setContent(contentRes.data.content);
      setStep('form');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entry');
      setStep('error');
    }
  });

  function handleSave(data: { title: string; category: string; tags: string[]; content: string }) {
    setStep('progress');
    setProgressMessage('Saving changes...');
    setError('');
    setAuditWarnings([]);

    sseController = connectSSE(`/api/knowledge/${props.entryId}`, data, {
      onEvent: (event, eventData) => {
        const messages: Record<string, string> = {
          'knowledge:edit:started': 'Starting update...',
          'knowledge:edit:loading': 'Loading entry...',
          'knowledge:edit:validating-changes': 'Validating changes...',
          'knowledge:edit:writing-changes': 'Writing changes...',
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
      },
      onResult: (resultData) => {
        const flowResult = resultData as { success: boolean; data?: KnowledgeEditResponse; error?: { message: string } };
        if (flowResult.success && flowResult.data) {
          updateKnowledgeEntry(props.entryId, {
            title: flowResult.data.title,
            updated_at: new Date().toISOString(),
          });
          setStep('audit');
        } else {
          setError(flowResult.error?.message ?? 'Update failed');
          setStep('form');
        }
      },
      onError: (errMsg) => {
        setError(errMsg);
        setStep('form');
      },
    }, 'PUT');
  }

  function handleCancel() {
    sseController?.abort();
    props.onBack();
  }

  return (
    <div class="max-w-2xl mx-auto">
      <Switch>
        <Match when={step() === 'loading'}>
          <div class="py-16 text-center space-y-4">
            <div class="inline-block w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
            <p class="text-sm text-[var(--color-text-muted)]">Loading entry...</p>
          </div>
        </Match>

        <Match when={step() === 'form'}>
          <h2 class="text-xl font-semibold mb-4">Edit Knowledge Entry</h2>
          <EditForm
            initialTitle={entry()?.title ?? ''}
            initialCategory={entry()?.category ?? ''}
            initialTags={entry()?.tags ?? []}
            initialContent={content()}
            error={error()}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </Match>

        <Match when={step() === 'progress'}>
          <div class="py-16 text-center space-y-4">
            <div class="inline-block w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
            <p class="text-sm text-[var(--color-text-muted)]">{progressMessage()}</p>
          </div>
        </Match>

        <Match when={step() === 'audit'}>
          <h2 class="text-xl font-semibold mb-4">Edit Results</h2>
          <EditAuditResults
            entryId={props.entryId}
            filePath={entry()?.file_path ?? ''}
            warnings={auditWarnings()}
            onDone={props.onBack}
          />
        </Match>

        <Match when={step() === 'error'}>
          <div class="py-16 text-center space-y-4">
            <p class="text-[var(--color-error)]">{error()}</p>
            <button
              type="button"
              onClick={props.onBack}
              class="px-4 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              Go Back
            </button>
          </div>
        </Match>
      </Switch>
    </div>
  );
}
