import { createSignal, createMemo } from 'solid-js';
import type { KnowledgeProposal, KnowledgeCreateResponse } from '@nori/shared';
import { setCreateOpen, addKnowledgeEntry } from '../../../../stores/knowledge.store';
import { connectSSE } from '../../../../lib/sse';
import { apiPost } from '../../../../lib/api';
import type { Step, EditableProposal } from './KnowledgeCreateDialog.type';

export const useKnowledgeCreateDialog = (vaultId: () => string) => {
  const [step, setStep] = createSignal<Step>('prompt');
  const [prompt, setPrompt] = createSignal('');
  const [error, setError] = createSignal('');
  const [proposals, setProposals] = createSignal<EditableProposal[]>([]);
  const [savedCount, setSavedCount] = createSignal(0);
  const [savingMessage, setSavingMessage] = createSignal('');

  function close() {
    setCreateOpen(false);
  }

  async function handleGenerate(e: Event) {
    e.preventDefault();
    if (!prompt().trim()) return;

    setError('');
    setStep('generating');

    try {
      const res = await apiPost<{ data: { proposals: KnowledgeProposal[] } }>(
        '/api/knowledge/ai-generate',
        { vault_id: vaultId(), prompt: prompt() }
      );
      const editable: EditableProposal[] = res.data.proposals.map((p) => ({
        ...p,
        included: true,
        tagsInput: p.tags.join(', '),
        requiredKnowledgeInput: p.required_knowledge.join(', '),
        rulesInput: p.rules.join('\n'),
      }));
      setProposals(editable);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
      setStep('prompt');
    }
  }

  function updateProposal(index: number, field: string, value: string | boolean) {
    setProposals((prev) => prev.map((p, i) => {
      if (i !== index) return p;
      if (field === 'tags') {
        const tags = (value as string).split(',').map((t) => t.trim()).filter(Boolean);
        return { ...p, tagsInput: value as string, tags };
      }
      if (field === 'required_knowledge') {
        const items = (value as string).split(',').map((t) => t.trim()).filter(Boolean);
        return { ...p, requiredKnowledgeInput: value as string, required_knowledge: items };
      }
      if (field === 'rules') {
        const items = (value as string).split('\n').map((t) => t.trim()).filter(Boolean);
        return { ...p, rulesInput: value as string, rules: items };
      }
      return { ...p, [field]: value };
    }));
  }

  const includedProposals = createMemo(() => proposals().filter((p) => p.included));

  async function handleSave() {
    const toSave = includedProposals();
    if (toSave.length === 0) return;

    setStep('saving');
    setSavedCount(0);

    for (let i = 0; i < toSave.length; i++) {
      const p = toSave[i];
      setSavingMessage(`Saving "${p.title}" (${i + 1}/${toSave.length})...`);

      await new Promise<void>((resolve) => {
        const ctrl = connectSSE('/api/knowledge', {
          vault_id: vaultId(),
          title: p.title,
          category: p.category,
          tags: p.tags,
          description: p.description,
          required_knowledge: p.required_knowledge,
          rules: p.rules,
          content: p.content,
        }, {
          onEvent: () => {},
          onResult: (resultData) => {
            interface CreateResult {
              success: boolean;
              data?: KnowledgeCreateResponse;
              error?: { message: string };
            }
            const isCreateResult = (d: unknown): d is CreateResult =>
              typeof d === 'object' && d !== null && 'success' in d;

            if (isCreateResult(resultData) && resultData.success && resultData.data) {
              addKnowledgeEntry({
                id: resultData.data.entry_id,
                vault_id: vaultId(),
                file_path: resultData.data.file_path,
                title: resultData.data.title,
                category: p.category,
                tags: p.tags,
                description: p.description,
                required_knowledge: p.required_knowledge,
                rules: p.rules,
                content_hash: '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
              setSavedCount((n) => n + 1);
            }
            ctrl?.abort();
            resolve();
          },
          onError: () => {
            ctrl?.abort();
            resolve();
          },
        });
      });
    }

    setStep('done');
  }

  return {
    step,
    setStep,
    prompt,
    setPrompt,
    error,
    proposals,
    savedCount,
    savingMessage,
    includedProposals,
    close,
    handleGenerate,
    updateProposal,
    handleSave,
  };
}
