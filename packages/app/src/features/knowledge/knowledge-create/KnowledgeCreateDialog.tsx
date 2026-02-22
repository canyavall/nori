import { createSignal, Match, Switch } from 'solid-js';
import type { KnowledgeEntry, KnowledgeCreateResponse } from '@nori/shared';
import { setCreateOpen, addKnowledgeEntry } from '../../../stores/knowledge.store';
import { connectSSE } from '../../../lib/sse';
import { FrontmatterForm } from './FrontmatterForm';
import { ContentEditor } from './ContentEditor';
import { KnowledgePreview } from './KnowledgePreview';
import { AuditResults } from './AuditResults';

type WizardStep = 'frontmatter' | 'editor' | 'preview' | 'progress' | 'audit';

interface Props {
  vaultId: string;
}

export function KnowledgeCreateDialog(props: Props) {
  const [step, setStep] = createSignal<WizardStep>('frontmatter');
  const [title, setTitle] = createSignal('');
  const [category, setCategory] = createSignal('');
  const [tags, setTags] = createSignal<string[]>([]);
  const [content, setContent] = createSignal('');
  const [progressMessage, setProgressMessage] = createSignal('');
  const [error, setError] = createSignal('');
  const [auditWarnings, setAuditWarnings] = createSignal<string[]>([]);
  const [createdEntryId, setCreatedEntryId] = createSignal('');
  const [createdFilePath, setCreatedFilePath] = createSignal('');

  let sseController: AbortController | undefined;

  function close() {
    sseController?.abort();
    setCreateOpen(false);
  }

  function handleFrontmatterNext(data: { title: string; category: string; tags: string[] }) {
    setTitle(data.title);
    setCategory(data.category);
    setTags(data.tags);
    setError('');
    setStep('editor');
  }

  function handleContentSave(text: string) {
    setContent(text);
    setStep('preview');
  }

  function handleConfirm() {
    setStep('progress');
    setProgressMessage('Starting creation...');
    setError('');
    setAuditWarnings([]);

    const body = {
      vault_id: props.vaultId,
      title: title(),
      category: category(),
      tags: tags(),
      content: content(),
    };

    sseController = connectSSE('/api/knowledge', body, {
      onEvent: (event, eventData) => {
        const messages: Record<string, string> = {
          'knowledge:create:started': 'Starting creation...',
          'knowledge:create:validating-frontmatter': 'Validating frontmatter...',
          'knowledge:create:validating-content': 'Validating content...',
          'knowledge:create:writing-file': 'Writing file to vault...',
          'knowledge:create:auditing': 'Running quality audit...',
          'knowledge:create:regenerating-index': 'Rebuilding search index...',
          'knowledge:create:completed': 'Creation complete!',
        };
        setProgressMessage(messages[event] ?? event);

        if (event === 'knowledge:create:audit-warning' || event === 'knowledge:create:index-warning') {
          const msg = (eventData as { message?: string }).message;
          if (msg) {
            setAuditWarnings((prev) => [...prev, msg]);
          }
        }

        if (event === 'knowledge:create:completed') {
          const data = eventData as { entry_id?: string; file_path?: string; title?: string };
          if (data.entry_id) setCreatedEntryId(data.entry_id);
          if (data.file_path) setCreatedFilePath(data.file_path);
        }
      },
      onResult: (data) => {
        const flowResult = data as { success: boolean; data?: KnowledgeCreateResponse; error?: { message: string } };
        if (flowResult.success && flowResult.data) {
          const resp = flowResult.data;
          setCreatedEntryId(resp.id);
          setCreatedFilePath(resp.file_path);

          const entry: KnowledgeEntry = {
            id: resp.id,
            vault_id: props.vaultId,
            file_path: resp.file_path,
            title: resp.title,
            category: category(),
            tags: tags(),
            content_hash: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          addKnowledgeEntry(entry);
          setStep('audit');
        } else {
          setError(flowResult.error?.message ?? 'Creation failed');
          setStep('frontmatter');
        }
      },
      onError: (errMsg) => {
        setError(errMsg);
        setStep('frontmatter');
      },
    });
  }

  const stepLabel = () => {
    const labels: Record<WizardStep, string> = {
      frontmatter: 'Metadata',
      editor: 'Content',
      preview: 'Preview',
      progress: 'Creating...',
      audit: 'Results',
    };
    return labels[step()];
  };

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div class="absolute inset-0 bg-black/50" onClick={close} />

      {/* Dialog */}
      <div class="relative w-full max-w-2xl rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-xl">
        <div class="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h3 class="text-lg font-semibold">Create Knowledge Entry</h3>
          <span class="text-xs text-[var(--color-text-muted)]">{stepLabel()}</span>
        </div>

        <div class="p-4">
          <Switch>
            <Match when={step() === 'frontmatter'}>
              <FrontmatterForm
                initialTitle={title()}
                initialCategory={category()}
                initialTags={tags()}
                error={error()}
                onNext={handleFrontmatterNext}
                onCancel={close}
              />
            </Match>

            <Match when={step() === 'editor'}>
              <ContentEditor
                initialContent={content()}
                onSave={handleContentSave}
                onBack={() => setStep('frontmatter')}
              />
            </Match>

            <Match when={step() === 'preview'}>
              <KnowledgePreview
                title={title()}
                category={category()}
                tags={tags()}
                content={content()}
                onConfirm={handleConfirm}
                onEdit={() => setStep('editor')}
              />
            </Match>

            <Match when={step() === 'progress'}>
              <div class="py-8 text-center space-y-4">
                <div class="inline-block w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                <p class="text-sm text-[var(--color-text-muted)]">{progressMessage()}</p>
              </div>
            </Match>

            <Match when={step() === 'audit'}>
              <AuditResults
                entryId={createdEntryId()}
                filePath={createdFilePath()}
                warnings={auditWarnings()}
                onContinue={close}
              />
            </Match>
          </Switch>
        </div>
      </div>
    </div>
  );
}
