import { For, Show } from 'solid-js';
import type { KnowledgeCreateDialogProps } from './KnowledgeCreateDialog.type';
import { useKnowledgeCreateDialog } from './KnowledgeCreateDialog.hook';

export const KnowledgeCreateDialog = (props: KnowledgeCreateDialogProps) => {
  const {
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
  } = useKnowledgeCreateDialog(() => props.vaultId);

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/60" onClick={close} />
      <div class="relative z-10 w-full max-w-2xl mx-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div class="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
          <h2 class="text-base font-semibold">Create Knowledge</h2>
          <button type="button" onClick={close}
            class="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors text-lg leading-none">
            ✕
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-5">

          {/* Prompt step */}
          <Show when={step() === 'prompt'}>
            <form onSubmit={handleGenerate} class="space-y-4">
              <p class="text-sm text-[var(--color-text-muted)]">
                Describe what you want to document. The AI will generate structured knowledge entries with suggested titles, categories, and tags.
              </p>
              <div>
                <label class="block text-sm font-medium mb-1.5" for="ai-prompt">Your prompt</label>
                <textarea
                  id="ai-prompt"
                  rows={5}
                  value={prompt()}
                  onInput={(e) => setPrompt(e.currentTarget.value)}
                  placeholder="e.g. How we handle authentication in this project, including JWT tokens, refresh logic, and error handling..."
                  class="w-full px-3 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-accent)] resize-none"
                />
              </div>
              <Show when={error()}>
                <div class="p-3 rounded-md bg-[var(--color-error)]/10 border border-[var(--color-error)]/20">
                  <p class="text-sm text-[var(--color-error)]">{error()}</p>
                </div>
              </Show>
              <div class="flex justify-end gap-3">
                <button type="button" onClick={close}
                  class="px-4 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={!prompt().trim()}
                  class="px-4 py-2 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  Generate
                </button>
              </div>
            </form>
          </Show>

          {/* Generating */}
          <Show when={step() === 'generating'}>
            <div class="py-12 text-center space-y-4">
              <div class="inline-block w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
              <p class="text-sm text-[var(--color-text-muted)]">Generating knowledge proposals...</p>
            </div>
          </Show>

          {/* Review proposals */}
          <Show when={step() === 'review'}>
            <div class="space-y-4">
              <p class="text-sm text-[var(--color-text-muted)]">
                Review and edit the proposals. Uncheck any you don't want to save.
              </p>
              <For each={proposals()}>
                {(proposal, i) => (
                  <div class={`rounded-md border p-4 space-y-3 transition-opacity ${
                    proposal.included ? 'border-[var(--color-border)] bg-[var(--color-bg)]' : 'border-[var(--color-border)]/40 opacity-50'
                  }`}>
                    <div class="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={proposal.included}
                        onChange={(e) => updateProposal(i(), 'included', e.currentTarget.checked)}
                        class="w-4 h-4 accent-[var(--color-accent)]"
                      />
                      <span class="text-xs text-[var(--color-text-muted)] font-semibold uppercase tracking-wide">
                        Entry {i() + 1}
                      </span>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs text-[var(--color-text-muted)] mb-1">Title</label>
                        <input type="text" value={proposal.title} disabled={!proposal.included}
                          onInput={(e) => updateProposal(i(), 'title', e.currentTarget.value)}
                          class="w-full px-2.5 py-1.5 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50" />
                      </div>
                      <div>
                        <label class="block text-xs text-[var(--color-text-muted)] mb-1">Category</label>
                        <input type="text" value={proposal.category} disabled={!proposal.included}
                          onInput={(e) => updateProposal(i(), 'category', e.currentTarget.value)}
                          class="w-full px-2.5 py-1.5 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50" />
                      </div>
                    </div>

                    <div>
                      <label class="block text-xs text-[var(--color-text-muted)] mb-1">Tags (comma separated)</label>
                      <input type="text" value={proposal.tagsInput} disabled={!proposal.included}
                        onInput={(e) => updateProposal(i(), 'tags', e.currentTarget.value)}
                        class="w-full px-2.5 py-1.5 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50" />
                    </div>

                    <div>
                      <label class="block text-xs text-[var(--color-text-muted)] mb-1">Content (Markdown)</label>
                      <textarea rows={7} value={proposal.content} disabled={!proposal.included}
                        onInput={(e) => updateProposal(i(), 'content', e.currentTarget.value)}
                        class="w-full px-2.5 py-1.5 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text)] text-sm font-mono focus:outline-none focus:border-[var(--color-accent)] resize-y disabled:opacity-50" />
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>

          {/* Saving */}
          <Show when={step() === 'saving'}>
            <div class="py-12 text-center space-y-4">
              <div class="inline-block w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
              <p class="text-sm text-[var(--color-text-muted)]">{savingMessage()}</p>
            </div>
          </Show>

          {/* Done */}
          <Show when={step() === 'done'}>
            <div class="py-10 text-center space-y-3">
              <p class="text-base font-medium">
                {savedCount()} {savedCount() === 1 ? 'entry' : 'entries'} saved
              </p>
              <p class="text-sm text-[var(--color-text-muted)]">Knowledge entries have been added to your vault.</p>
              <button type="button" onClick={close}
                class="mt-2 px-4 py-2 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors">
                Done
              </button>
            </div>
          </Show>
        </div>

        {/* Footer for review step */}
        <Show when={step() === 'review'}>
          <div class="border-t border-[var(--color-border)] p-4 flex items-center justify-between">
            <button type="button" onClick={() => setStep('prompt')}
              class="px-4 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
              ← Back
            </button>
            <div class="flex items-center gap-3">
              <span class="text-xs text-[var(--color-text-muted)]">
                {includedProposals().length} of {proposals().length} selected
              </span>
              <button type="button" onClick={handleSave} disabled={includedProposals().length === 0}
                class="px-4 py-2 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                Save {includedProposals().length} {includedProposals().length === 1 ? 'Entry' : 'Entries'}
              </button>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}
