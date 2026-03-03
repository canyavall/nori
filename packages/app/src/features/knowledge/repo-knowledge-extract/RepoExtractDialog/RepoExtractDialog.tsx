import { For, Show } from 'solid-js';
import type { RepoExtractDialogProps } from './RepoExtractDialog.type';
import { useRepoExtractDialog } from './RepoExtractDialog.hook';

export const RepoExtractDialog = (props: RepoExtractDialogProps) => {
  const {
    state,
    messages,
    proposals,
    progress,
    userReply,
    setUserReply,
    savedCount,
    savingMessage,
    errorMessage,
    includedProposals,
    handleReply,
    handleSkipQuestions,
    updateProposal,
    handleSave,
    handleStart,
    close,
  } = useRepoExtractDialog(() => props.projectPath, () => props.vaultId, props.onClose);

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/60" onClick={close} />
      <div class="relative z-10 w-full max-w-3xl mx-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div class="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
          <h2 class="text-base font-semibold">Analyze Repository</h2>
          <button type="button" onClick={close}
            class="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors text-lg leading-none">
            ✕
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-5">

          {/* Scanning state */}
          <Show when={state() === 'scanning'}>
            <div class="py-12 text-center space-y-4">
              <div class="inline-block w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
              <p class="text-sm text-[var(--color-text-muted)]">{progress()}</p>
            </div>
          </Show>

          {/* Conversation state */}
          <Show when={state() === 'conversation'}>
            <div class="space-y-4">
              <p class="text-sm text-[var(--color-text-muted)]">
                The AI has questions about your repository before generating knowledge entries.
              </p>

              {/* Message thread */}
              <div class="space-y-3 max-h-[40vh] overflow-y-auto">
                <For each={messages()}>
                  {(msg) => (
                    <div class={`rounded-md p-3 text-sm ${
                      msg.role === 'assistant'
                        ? 'bg-[var(--color-bg)] border border-[var(--color-border)]'
                        : 'bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 ml-8'
                    }`}>
                      <span class="block text-xs text-[var(--color-text-muted)] mb-1 font-medium">
                        {msg.role === 'assistant' ? 'AI' : 'You'}
                      </span>
                      <p class="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  )}
                </For>
              </div>

              {/* Reply input */}
              <div class="space-y-3">
                <textarea
                  rows={3}
                  value={userReply()}
                  onInput={(e) => setUserReply(e.currentTarget.value)}
                  placeholder="Type your response..."
                  class="w-full px-3 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-accent)] resize-none"
                />
                <div class="flex justify-between">
                  <button
                    type="button"
                    onClick={handleSkipQuestions}
                    class="px-3 py-1.5 rounded-md text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                  >
                    Skip questions — generate anyway
                  </button>
                  <button
                    type="button"
                    onClick={handleReply}
                    disabled={!userReply().trim()}
                    class="px-4 py-2 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Reply
                  </button>
                </div>
              </div>
            </div>
          </Show>

          {/* Review proposals */}
          <Show when={state() === 'review'}>
            <div class="space-y-4">
              {/* Show any final message from LLM */}
              <Show when={messages().length > 0}>
                <div class="rounded-md p-3 bg-[var(--color-bg)] border border-[var(--color-border)] text-sm">
                  <p class="whitespace-pre-wrap text-[var(--color-text-muted)]">
                    {messages()[messages().length - 1]?.content}
                  </p>
                </div>
              </Show>

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
                      <label class="block text-xs text-[var(--color-text-muted)] mb-1">Description</label>
                      <textarea rows={2} value={proposal.description} disabled={!proposal.included}
                        onInput={(e) => updateProposal(i(), 'description', e.currentTarget.value)}
                        class="w-full px-2.5 py-1.5 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-accent)] resize-none disabled:opacity-50" />
                    </div>

                    <div>
                      <label class="block text-xs text-[var(--color-text-muted)] mb-1">Tags (3-12, kebab-case, comma separated)</label>
                      <input type="text" value={proposal.tagsInput} disabled={!proposal.included}
                        onInput={(e) => updateProposal(i(), 'tags', e.currentTarget.value)}
                        class="w-full px-2.5 py-1.5 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50" />
                    </div>

                    <div>
                      <label class="block text-xs text-[var(--color-text-muted)] mb-1">Rules (one per line)</label>
                      <textarea rows={3} value={proposal.rulesInput} disabled={!proposal.included}
                        onInput={(e) => updateProposal(i(), 'rules', e.currentTarget.value)}
                        class="w-full px-2.5 py-1.5 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-accent)] resize-y disabled:opacity-50" />
                    </div>

                    <div>
                      <label class="block text-xs text-[var(--color-text-muted)] mb-1">Required Knowledge (comma sep.)</label>
                      <input type="text" value={proposal.requiredKnowledgeInput} disabled={!proposal.included}
                        onInput={(e) => updateProposal(i(), 'required_knowledge', e.currentTarget.value)}
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
          <Show when={state() === 'saving'}>
            <div class="py-12 text-center space-y-4">
              <div class="inline-block w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
              <p class="text-sm text-[var(--color-text-muted)]">{savingMessage()}</p>
            </div>
          </Show>

          {/* Done */}
          <Show when={state() === 'done'}>
            <div class="py-10 text-center space-y-3">
              <p class="text-base font-medium">
                {savedCount()} {savedCount() === 1 ? 'entry' : 'entries'} saved
              </p>
              <p class="text-sm text-[var(--color-text-muted)]">Knowledge entries have been extracted and added to your vault.</p>
              <button type="button" onClick={close}
                class="mt-2 px-4 py-2 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors">
                Done
              </button>
            </div>
          </Show>

          {/* Error */}
          <Show when={state() === 'error'}>
            <div class="py-10 text-center space-y-3">
              <div class="p-3 rounded-md bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 mx-auto max-w-md">
                <p class="text-sm text-[var(--color-error)]">{errorMessage()}</p>
              </div>
              <div class="flex justify-center gap-3 mt-4">
                <button type="button" onClick={close}
                  class="px-4 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
                  Close
                </button>
                <button type="button" onClick={handleStart}
                  class="px-4 py-2 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors">
                  Retry
                </button>
              </div>
            </div>
          </Show>
        </div>

        {/* Footer for review step */}
        <Show when={state() === 'review'}>
          <div class="border-t border-[var(--color-border)] p-4 flex items-center justify-between">
            <span class="text-xs text-[var(--color-text-muted)]">
              {includedProposals().length} of {proposals().length} selected
            </span>
            <button type="button" onClick={handleSave} disabled={includedProposals().length === 0}
              class="px-4 py-2 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Save {includedProposals().length} {includedProposals().length === 1 ? 'Entry' : 'Entries'}
            </button>
          </div>
        </Show>
      </div>
    </div>
  );
};
