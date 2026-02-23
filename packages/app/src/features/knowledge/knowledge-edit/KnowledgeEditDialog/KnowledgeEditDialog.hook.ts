import { createSignal, onMount } from 'solid-js';
import type { KnowledgeEntry, KnowledgeFrontmatter } from '@nori/shared';
import { apiGet } from '../../../../lib/api';
import { connectSSE } from '../../../../lib/sse';
import { updateKnowledgeEntry } from '../../../../stores/knowledge.store';
import type { Step } from './KnowledgeEditDialog.type';

export const useKnowledgeEditDialog = (entryId: string, onClose: () => void) => {
  const [step, setStep] = createSignal<Step>('loading');
  const [error, setError] = createSignal('');
  const [saveError, setSaveError] = createSignal('');
  const [progressMessage, setProgressMessage] = createSignal('');
  const [entry, setEntry] = createSignal<KnowledgeEntry | null>(null);
  const [content, setContent] = createSignal('');
  const [frontmatter, setFrontmatter] = createSignal<KnowledgeFrontmatter | null>(null);

  onMount(async () => {
    try {
      const entryRes = await apiGet<{ data: KnowledgeEntry }>(`/api/knowledge/${entryId}`);
      const e = entryRes.data;
      if (typeof e.tags === 'string') {
        try { e.tags = JSON.parse(e.tags); } catch { e.tags = []; }
      }
      if (typeof (e as unknown as Record<string, unknown>).required_knowledge === 'string') {
        try { e.required_knowledge = JSON.parse((e as unknown as Record<string, unknown>).required_knowledge as string); } catch { e.required_knowledge = []; }
      }
      if (typeof (e as unknown as Record<string, unknown>).rules === 'string') {
        try { e.rules = JSON.parse((e as unknown as Record<string, unknown>).rules as string); } catch { e.rules = []; }
      }
      e.description = e.description ?? '';
      e.required_knowledge = e.required_knowledge ?? [];
      e.rules = e.rules ?? [];

      const contentRes = await apiGet<{ data: { content: string; frontmatter: KnowledgeFrontmatter } }>(
        `/api/knowledge/${entryId}/content`
      );
      setEntry(e);
      setContent(contentRes.data.content);
      setFrontmatter(contentRes.data.frontmatter);
      setStep('editing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entry');
      setStep('error');
    }
  });

  function handleSave(data: {
    title: string;
    category: string;
    tags: string[];
    description: string;
    required_knowledge: string[];
    rules: string[];
    optional_knowledge?: string[];
    content: string;
  }) {
    setStep('saving');
    setProgressMessage('Saving changes...');
    setSaveError('');

    const ctrl = connectSSE(`/api/knowledge/${entryId}`, data, {
      onEvent: (event) => {
        const messages: Record<string, string> = {
          'knowledge:edit:started': 'Saving changes...',
          'knowledge:edit:writing-changes': 'Writing to vault...',
          'knowledge:edit:auditing': 'Running audit...',
          'knowledge:edit:regenerating-index': 'Rebuilding index...',
          'knowledge:edit:completed': 'Done!',
        };
        setProgressMessage(messages[event] ?? event);
      },
      onResult: (resultData) => {
        interface EditResult {
          success: boolean;
          data?: { entry_id: string; title: string };
          error?: { message: string };
        }
        const isEditResult = (d: unknown): d is EditResult =>
          typeof d === 'object' && d !== null && 'success' in d;

        ctrl?.abort();
        if (!isEditResult(resultData)) return;

        if (resultData.success && resultData.data) {
          updateKnowledgeEntry(entryId, {
            title: data.title,
            category: data.category,
            tags: data.tags,
            description: data.description,
            required_knowledge: data.required_knowledge,
            rules: data.rules,
            updated_at: new Date().toISOString(),
          });
          setStep('done');
        } else {
          setSaveError(resultData.error?.message ?? 'Save failed');
          setStep('editing');
        }
      },
      onError: (errMsg) => {
        ctrl?.abort();
        setSaveError(errMsg);
        setStep('editing');
      },
    }, 'PUT');
  }

  return {
    step,
    error,
    saveError,
    progressMessage,
    entry,
    content,
    frontmatter,
    handleSave,
    onClose,
  };
}
