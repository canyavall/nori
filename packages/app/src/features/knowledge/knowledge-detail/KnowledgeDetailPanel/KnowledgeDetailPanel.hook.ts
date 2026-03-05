import { createSignal, onMount, onCleanup } from 'solid-js';
import type { KnowledgeEntry, KnowledgeFrontmatter, KnowledgeLlmAuditResult } from '@nori/shared';
import type { ContentViewMode } from '../../../../components/ui/MarkdownContent/MarkdownContent.type';
import { apiGet } from '../../../../lib/api';
import { connectSSE } from '../../../../lib/sse';
import { updateKnowledgeEntry, removeKnowledgeEntry } from '../../../../stores/knowledge.store';
import type { KnowledgeDetailPanelProps } from './KnowledgeDetailPanel.type';

export type PanelStep = 'loading' | 'view' | 'editing' | 'saving' | 'auditing' | 'audit-result' | 'confirm-delete' | 'deleting' | 'deleted' | 'error';

export interface AuditInitialValues {
  tags: string[];
  description: string;
  rules: string[];
  required_knowledge: string[];
  category: string;
}

export const useKnowledgeDetailPanel = (props: KnowledgeDetailPanelProps) => {
  const [step, setStep] = createSignal<PanelStep>('loading');
  const [error, setError] = createSignal('');
  const [saveError, setSaveError] = createSignal('');
  const [progressMessage, setProgressMessage] = createSignal('');
  const [entry, setEntry] = createSignal<KnowledgeEntry | null>(null);
  const [content, setContent] = createSignal('');
  const [frontmatter, setFrontmatter] = createSignal<KnowledgeFrontmatter | null>(null);
  const [contentViewMode, setContentViewMode] = createSignal<ContentViewMode>('markdown');
  const [mainFieldsOpen, setMainFieldsOpen] = createSignal(true);
  const [additionalFieldsOpen, setAdditionalFieldsOpen] = createSignal(false);
  const [deleteError, setDeleteError] = createSignal('');
  const [deleteProgressMessage, setDeleteProgressMessage] = createSignal('');
  const [auditResult, setAuditResult] = createSignal<KnowledgeLlmAuditResult | null>(null);
  const [auditProgressMessage, setAuditProgressMessage] = createSignal('');
  const [auditInitialValues, setAuditInitialValues] = createSignal<AuditInitialValues | null>(null);

  const handleContentViewModeChange = (mode: ContentViewMode) => setContentViewMode(mode);
  const toggleMainFields = () => setMainFieldsOpen((v) => !v);
  const toggleAdditionalFields = () => setAdditionalFieldsOpen((v) => !v);

  let sseController: AbortController | undefined;

  onCleanup(() => {
    sseController?.abort();
  });

  const loadEntry = async () => {
    setStep('loading');
    setError('');
    try {
      const entryRes = await apiGet<{ data: KnowledgeEntry }>(`/api/knowledge/${props.entryId}`);
      const e = entryRes.data;

      const contentRes = await apiGet<{ data: { content: string; frontmatter: KnowledgeFrontmatter } }>(
        `/api/knowledge/${props.entryId}/content`
      );
      setEntry(e);
      setContent(contentRes.data.content);
      setFrontmatter(contentRes.data.frontmatter);
      setStep('view');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entry');
      setStep('error');
    }
  };

  onMount(() => {
    loadEntry();
  });

  function handleEdit(initialValues?: AuditInitialValues) {
    setSaveError('');
    setAuditInitialValues(initialValues ?? null);
    setStep('editing');
  }

  function handleCancelEdit() {
    setSaveError('');
    setAuditInitialValues(null);
    setStep('view');
  }

  function handleSave(data: {
    title: string;
    category: string;
    tags: string[];
    description: string;
    required_knowledge: string[];
    rules: string[];
    content: string;
  }) {
    setStep('saving');
    setProgressMessage('Saving changes...');
    setSaveError('');

    const ctrl = connectSSE(`/api/knowledge/${props.entryId}`, data, {
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
          updateKnowledgeEntry(props.entryId, {
            title: data.title,
            category: data.category,
            tags: data.tags,
            description: data.description,
            required_knowledge: data.required_knowledge,
            rules: data.rules,
            updated_at: new Date().toISOString(),
          });
          props.onSaved?.();
          loadEntry();
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

  function handleAudit() {
    setAuditResult(null);
    setAuditProgressMessage('Starting audit...');
    setStep('auditing');

    sseController?.abort();
    sseController = connectSSE(`/api/knowledge/${props.entryId}/audit`, {}, {
      onEvent: (event) => {
        const messages: Record<string, string> = {
          'knowledge:audit:started': 'Starting audit...',
          'knowledge:audit:loading-entry': 'Loading entry...',
          'knowledge:audit:validating-frontmatter': 'Validating frontmatter...',
          'knowledge:audit:validating-content': 'Checking content quality...',
          'knowledge:audit:checking-originality': 'Checking originality...',
          'knowledge:audit:loading-vault-entries': 'Loading vault entries...',
          'knowledge:audit:calling-llm': 'Running LLM analysis...',
          'knowledge:audit:generating-result': 'Compiling results...',
          'knowledge:audit:completed': 'Audit complete!',
        };
        setAuditProgressMessage(messages[event] ?? event);
      },
      onResult: (resultData) => {
        interface AuditFlowResult {
          success: boolean;
          data?: {
            file_path: string;
            status: string;
            findings: string[];
            llm_result?: KnowledgeLlmAuditResult;
          };
          error?: { message: string };
        }
        const isAuditResult = (d: unknown): d is AuditFlowResult =>
          typeof d === 'object' && d !== null && 'success' in d;

        if (!isAuditResult(resultData)) return;

        if (resultData.success && resultData.data) {
          setAuditResult(resultData.data.llm_result ?? null);
          setStep('audit-result');
        } else {
          setAuditProgressMessage(resultData.error?.message ?? 'Audit failed');
          setStep('view');
        }
      },
      onError: (errMsg) => {
        setAuditProgressMessage(errMsg);
        setStep('view');
      },
    }, 'POST');
  }

  function handleApplySuggestions() {
    const result = auditResult();
    if (!result) return;
    const e = entry();
    const initialValues: AuditInitialValues = {
      tags: result.suggestions.tags.length > 0 ? result.suggestions.tags : (e?.tags ?? []),
      description: result.suggestions.description || (e?.description ?? ''),
      rules: result.suggestions.rules.length > 0 ? result.suggestions.rules : (e?.rules ?? []),
      required_knowledge: result.suggestions.required_knowledge.length > 0
        ? result.suggestions.required_knowledge
        : (e?.required_knowledge ?? []),
      category: result.suggestions.category || (e?.category ?? ''),
    };
    handleEdit(initialValues);
  }

  function handleAuditDismiss() {
    setAuditResult(null);
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

    sseController = connectSSE(`/api/knowledge/${props.entryId}`, {}, {
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
        interface KnowledgeDeleteResult {
          success: boolean;
          data?: { deleted_file_path: string };
          error?: { message: string };
        }
        const isDeleteResult = (d: unknown): d is KnowledgeDeleteResult =>
          typeof d === 'object' && d !== null && 'success' in d;

        sseController?.abort();
        if (!isDeleteResult(resultData)) return;

        if (resultData.success) {
          removeKnowledgeEntry(props.entryId);
          props.onDeleteSuccess?.();
          setStep('deleted');
        } else {
          setDeleteError(resultData.error?.message ?? 'Deletion failed');
          setStep('confirm-delete');
        }
      },
      onError: (errMsg) => {
        sseController?.abort();
        setDeleteError(errMsg);
        setStep('confirm-delete');
      },
    }, 'DELETE');
  }

  return {
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
    auditResult,
    auditProgressMessage,
    auditInitialValues,
    handleContentViewModeChange,
    toggleMainFields,
    toggleAdditionalFields,
    handleEdit,
    handleCancelEdit,
    handleSave,
    handleAudit,
    handleApplySuggestions,
    handleAuditDismiss,
    handleDeleteRequest,
    handleDeleteCancel,
    handleDeleteConfirm,
  };
};
