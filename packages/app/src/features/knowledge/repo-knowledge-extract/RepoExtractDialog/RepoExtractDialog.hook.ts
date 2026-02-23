import { createSignal, createMemo } from 'solid-js';
import type { KnowledgeProposal, KnowledgeCreateResponse } from '@nori/shared';
import { addKnowledgeEntry } from '../../../../stores/knowledge.store';
import { connectSSE } from '../../../../lib/sse';
import type { RepoExtractState, ConversationMessage, EditableProposal } from './RepoExtractDialog.type';

export const useRepoExtractDialog = (
  projectPath: () => string,
  vaultId: () => string,
  onClose: () => void
) => {
  const [state, setState] = createSignal<RepoExtractState>('scanning');
  const [sessionId, setSessionId] = createSignal('');
  const [messages, setMessages] = createSignal<ConversationMessage[]>([]);
  const [proposals, setProposals] = createSignal<EditableProposal[]>([]);
  const [progress, setProgress] = createSignal('Scanning repository...');
  const [userReply, setUserReply] = createSignal('');
  const [savedCount, setSavedCount] = createSignal(0);
  const [savingMessage, setSavingMessage] = createSignal('');
  const [errorMessage, setErrorMessage] = createSignal('');

  function toEditable(p: KnowledgeProposal): EditableProposal {
    return {
      ...p,
      included: true,
      tagsInput: p.tags.join(', '),
      requiredKnowledgeInput: p.required_knowledge.join(', '),
      rulesInput: p.rules.join('\n'),
      optionalKnowledgeInput: (p.optional_knowledge ?? []).join(', '),
    };
  }

  function handleStart() {
    setState('scanning');
    setProgress('Scanning repository...');
    setMessages([]);

    const ctrl = connectSSE('/api/knowledge/repo-extract', {
      project_path: projectPath(),
      vault_id: vaultId(),
    }, {
      onEvent: (event, data) => {
        if (event === 'repo-extract:scanning') {
          setProgress('Scanning repository files...');
        } else if (event === 'repo-extract:scan-complete') {
          setProgress(`Found ${data.file_count} files in ${(data.categories_found as string[])?.length ?? 0} categories`);
        } else if (event === 'repo-extract:llm-thinking') {
          setProgress(String(data.message ?? 'Analyzing...'));
        } else if (event === 'repo-extract:questions') {
          // Will be handled in onResult
        } else if (event === 'repo-extract:proposals-ready') {
          setProgress(`${data.proposal_count} proposals ready`);
        }
      },
      onResult: (resultData) => {
        ctrl?.abort();
        interface ExtractResult {
          success: boolean;
          data?: {
            session_id: string;
            status: 'questions' | 'proposals';
            questions?: string[];
            proposals?: KnowledgeProposal[];
            message?: string;
          };
          error?: { message: string };
        }
        const isResult = (d: unknown): d is ExtractResult =>
          typeof d === 'object' && d !== null && 'success' in d;

        if (!isResult(resultData) || !resultData.success || !resultData.data) {
          const msg = isResult(resultData) && resultData.error
            ? resultData.error.message
            : 'Extraction failed';
          setErrorMessage(msg);
          setState('error');
          return;
        }

        const res = resultData.data;
        setSessionId(res.session_id);

        if (res.status === 'questions') {
          // Show conversation with LLM questions
          const assistantMsg: ConversationMessage = {
            role: 'assistant',
            content: res.message ?? '',
          };
          setMessages([assistantMsg]);
          setState('conversation');
        } else if (res.status === 'proposals' && res.proposals) {
          setProposals(res.proposals.map(toEditable));
          if (res.message) {
            setMessages([{ role: 'assistant', content: res.message }]);
          }
          setState('review');
        }
      },
      onError: (error) => {
        ctrl?.abort();
        setErrorMessage(error);
        setState('error');
      },
    });
  }

  function handleReply() {
    const reply = userReply().trim();
    if (!reply || !sessionId()) return;

    // Add user message to conversation
    setMessages((prev) => [...prev, { role: 'user', content: reply }]);
    setUserReply('');
    setState('scanning');
    setProgress('Analyzing your response...');

    const ctrl = connectSSE(`/api/knowledge/repo-extract/${sessionId()}/reply`, {
      session_id: sessionId(),
      user_reply: reply,
    }, {
      onEvent: (event, data) => {
        if (event === 'repo-extract:llm-thinking') {
          setProgress(String(data.message ?? 'Thinking...'));
        }
      },
      onResult: (resultData) => {
        ctrl?.abort();
        interface ReplyResult {
          success: boolean;
          data?: {
            session_id: string;
            status: 'questions' | 'proposals';
            questions?: string[];
            proposals?: KnowledgeProposal[];
            message?: string;
          };
          error?: { message: string };
        }
        const isResult = (d: unknown): d is ReplyResult =>
          typeof d === 'object' && d !== null && 'success' in d;

        if (!isResult(resultData) || !resultData.success || !resultData.data) {
          const msg = isResult(resultData) && resultData.error
            ? resultData.error.message
            : 'Reply failed';
          setErrorMessage(msg);
          setState('error');
          return;
        }

        const res = resultData.data;

        if (res.status === 'questions') {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: res.message ?? '' },
          ]);
          setState('conversation');
        } else if (res.status === 'proposals' && res.proposals) {
          if (res.message) {
            setMessages((prev) => [...prev, { role: 'assistant', content: res.message! }]);
          }
          setProposals(res.proposals.map(toEditable));
          setState('review');
        }
      },
      onError: (error) => {
        ctrl?.abort();
        setErrorMessage(error);
        setState('error');
      },
    });
  }

  function handleSkipQuestions() {
    handleReply();
    // If no reply text, send a "skip" instruction
    if (!userReply().trim()) {
      setUserReply('Please skip the questions and generate proposals with your best judgment.');
      // Small delay to let signal update, then trigger reply
      setTimeout(() => handleReply(), 0);
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
      if (field === 'optional_knowledge') {
        const items = (value as string).split(',').map((t) => t.trim()).filter(Boolean);
        return { ...p, optionalKnowledgeInput: value as string, optional_knowledge: items.length > 0 ? items : undefined };
      }
      return { ...p, [field]: value };
    }));
  }

  const includedProposals = createMemo(() => proposals().filter((p) => p.included));

  async function handleSave() {
    const toSave = includedProposals();
    if (toSave.length === 0) return;

    setState('saving');
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
          optional_knowledge: p.optional_knowledge,
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

    setState('done');
  }

  // Auto-start extraction on mount
  handleStart();

  return {
    state,
    setState,
    sessionId,
    messages,
    proposals,
    progress,
    userReply,
    setUserReply,
    savedCount,
    savingMessage,
    errorMessage,
    includedProposals,
    handleStart,
    handleReply,
    handleSkipQuestions,
    updateProposal,
    handleSave,
    close: onClose,
  };
};
