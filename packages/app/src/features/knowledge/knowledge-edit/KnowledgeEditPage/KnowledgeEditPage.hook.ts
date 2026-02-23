import { createSignal, onMount } from 'solid-js';
import type { KnowledgeEntry, KnowledgeEditResponse } from '@nori/shared';
import { updateKnowledgeEntry } from '../../../../stores/knowledge.store';
import { apiGet } from '../../../../lib/api';
import { connectSSE } from '../../../../lib/sse';
import type { PageStep, KnowledgeEditPageProps } from './KnowledgeEditPage.type';

export const useKnowledgeEditPage = (props: KnowledgeEditPageProps) => {
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

  const handleSave = (data: { title: string; category: string; tags: string[]; content: string }) => {
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
  };

  const handleCancel = () => {
    sseController?.abort();
    props.onBack();
  };

  return { step, entry, content, progressMessage, error, auditWarnings, handleSave, handleCancel };
};
