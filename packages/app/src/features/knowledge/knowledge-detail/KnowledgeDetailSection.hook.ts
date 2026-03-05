import { createSignal, onMount, onCleanup } from 'solid-js';
import { useParams, useNavigate } from '@solidjs/router';
import type { KnowledgeEntry, KnowledgeFrontmatter, KnowledgeLlmAuditResult } from '@nori/shared';
import type { ContentViewMode } from '../../../components/ui/MarkdownContent/MarkdownContent.type';
import { apiGet } from '../../../lib/api';
import { connectSSE } from '../../../lib/sse';
import { updateKnowledgeEntry, removeKnowledgeEntry } from '../../../stores/knowledge.store';

export type PageStep = 'loading' | 'view' | 'editing' | 'saving' | 'audit' | 'auditing' | 'audit-result' | 'confirm-delete' | 'deleting' | 'deleted' | 'error';

export interface EntryData {
  entry: KnowledgeEntry;
  content: string;
  frontmatter: KnowledgeFrontmatter;
}

export interface AuditInitialValues {
  tags: string[];
  description: string;
  rules: string[];
  required_knowledge: string[];
  category: string;
}

export const useKnowledgeDetailSection = () => {
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
  const [contentViewMode, setContentViewMode] = createSignal<ContentViewMode>('markdown');
  const [mainFieldsOpen, setMainFieldsOpen] = createSignal(true);
  const [additionalFieldsOpen, setAdditionalFieldsOpen] = createSignal(false);
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

  onMount(async () => {
    try {
      const entryRes = await apiGet<{ data: KnowledgeEntry }>(`/api/knowledge/${params.id}`);
      const entry = entryRes.data;

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

  function handleEdit(initialValues?: AuditInitialValues) {
    setSaveError('');
    if (initialValues) {
      setAuditInitialValues(initialValues);
    } else {
      setAuditInitialValues(null);
    }
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
    setProgressMessage('Starting update...');
    setSaveError('');
    setAuditWarnings([]);

    const body = {
      title: data.title,
      category: data.category,
      tags: data.tags,
      description: data.description,
      required_knowledge: data.required_knowledge,
      rules: data.rules,
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
          const msg = typeof eventData.message === 'string' ? eventData.message : undefined;
          if (msg) {
            setAuditWarnings((prev) => [...prev, msg]);
          }
        }

        if (event === 'knowledge:edit:completed') {
          const filePath = typeof eventData.file_path === 'string' ? eventData.file_path : undefined;
          if (filePath) setSavedFilePath(filePath);
        }
      },
      onResult: (resultData) => {
        interface KnowledgeEditResult {
          success: boolean;
          data?: { entry_id: string; file_path: string; title: string };
          error?: { message: string };
        }
        const isEditResult = (d: unknown): d is KnowledgeEditResult =>
          typeof d === 'object' && d !== null && 'success' in d;

        if (!isEditResult(resultData)) return;

        if (resultData.success && resultData.data) {
          const resp = resultData.data;
          setSavedFilePath(resp.file_path);

          const current = entryData();
          if (current) {
            const updatedEntry: KnowledgeEntry = {
              ...current.entry,
              title: body.title,
              category: body.category,
              tags: body.tags,
              description: body.description,
              required_knowledge: body.required_knowledge,
              rules: body.rules,
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
                description: body.description,
                required_knowledge: body.required_knowledge,
                rules: body.rules,
                updated: new Date().toISOString(),
              },
            });
            updateKnowledgeEntry(params.id, {
              title: body.title,
              category: body.category,
              tags: body.tags,
              description: body.description,
              required_knowledge: body.required_knowledge,
              rules: body.rules,
              updated_at: new Date().toISOString(),
            });
          }

          setStep('audit');
        } else {
          setSaveError(resultData.error?.message ?? 'Update failed');
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

  function handleAudit() {
    setAuditResult(null);
    setAuditProgressMessage('Starting audit...');
    setStep('auditing');

    sseController?.abort();
    sseController = connectSSE(`/api/knowledge/${params.id}/audit`, {}, {
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
    const initialValues: AuditInitialValues = {
      tags: result.suggestions.tags.length > 0 ? result.suggestions.tags : (entryData()?.entry.tags ?? []),
      description: result.suggestions.description || (entryData()?.entry.description ?? ''),
      rules: result.suggestions.rules.length > 0 ? result.suggestions.rules : (entryData()?.entry.rules ?? []),
      required_knowledge: result.suggestions.required_knowledge.length > 0
        ? result.suggestions.required_knowledge
        : (entryData()?.entry.required_knowledge ?? []),
      category: result.suggestions.category || (entryData()?.entry.category ?? ''),
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
        interface KnowledgeDeleteResult {
          success: boolean;
          data?: { deleted_file_path: string };
          error?: { message: string };
        }
        const isDeleteResult = (d: unknown): d is KnowledgeDeleteResult =>
          typeof d === 'object' && d !== null && 'success' in d;

        if (!isDeleteResult(resultData)) return;

        if (resultData.success) {
          removeKnowledgeEntry(params.id);
          setStep('deleted');
        } else {
          setDeleteError(resultData.error?.message ?? 'Deletion failed');
          setStep('confirm-delete');
        }
      },
      onError: (errMsg) => {
        setDeleteError(errMsg);
        setStep('confirm-delete');
      },
    }, 'DELETE');
  }

  function navigateToKnowledge() {
    navigate('/knowledge');
  }

  return {
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
  };
};
