import { For, Show } from 'solid-js';
import type { KnowledgePreviewProps } from './KnowledgePreview.type';


export const KnowledgePreview = (props: KnowledgePreviewProps) => {
  return (
    <div class="space-y-4">
      {/* Frontmatter summary */}
      <div class="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-3 space-y-2">
        <div class="flex items-start justify-between">
          <h4 class="font-medium">{props.title}</h4>
          <span class="px-2 py-0.5 rounded text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">
            {props.category}
          </span>
        </div>
        <Show when={props.tags.length > 0}>
          <div class="flex flex-wrap gap-1.5">
            <For each={props.tags}>
              {(tag) => (
                <span class="px-1.5 py-0.5 rounded text-xs bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                  {tag}
                </span>
              )}
            </For>
          </div>
        </Show>
      </div>

      {/* Content preview */}
      <div>
        <p class="text-sm font-medium mb-1">Content</p>
        <pre class="whitespace-pre-wrap font-mono text-sm rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-3 max-h-64 overflow-y-auto">
          {props.content}
        </pre>
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={props.onEdit}
          class="px-4 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={props.onConfirm}
          class="px-4 py-2 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          Create Entry
        </button>
      </div>
    </div>
  );
}
