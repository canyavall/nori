import { Match, Switch } from 'solid-js';
import { EditForm } from '../EditForm/EditForm';
import { EditAuditResults } from '../EditAuditResults/EditAuditResults';
import type { KnowledgeEditPageProps } from './KnowledgeEditPage.type';
import { useKnowledgeEditPage } from './KnowledgeEditPage.hook';

export const KnowledgeEditPage = (props: KnowledgeEditPageProps) => {
  const { step, entry, content, progressMessage, error, auditWarnings, handleSave, handleCancel } = useKnowledgeEditPage(props);

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
            initialDescription={entry()?.description ?? ''}
            initialRequiredKnowledge={entry()?.required_knowledge ?? []}
            initialRules={entry()?.rules ?? []}
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
};
