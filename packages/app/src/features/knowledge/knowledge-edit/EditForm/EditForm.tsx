import { For, Show } from 'solid-js';
import type { EditFormProps } from './EditForm.type';
import { useEditForm } from './EditForm.hook';

export const EditForm = (props: EditFormProps) => {
  const { title, setTitle, category, setCategory, tagsInput, setTagsInput, content, setContent, errors, tags, handleSubmit } = useEditForm(props);

  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-1" for="ke-title">Title</label>
        <input
          id="ke-title"
          type="text"
          value={title()}
          onInput={(e) => setTitle(e.currentTarget.value)}
          placeholder="Entry title"
          class="w-full px-3 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
        />
        <Show when={errors().title}>
          <p class="mt-1 text-xs text-[var(--color-error)]">{errors().title}</p>
        </Show>
      </div>

      <div>
        <label class="block text-sm font-medium mb-1" for="ke-category">Category</label>
        <input
          id="ke-category"
          type="text"
          value={category()}
          onInput={(e) => setCategory(e.currentTarget.value)}
          placeholder="e.g. guide, reference, tutorial"
          class="w-full px-3 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
        />
        <Show when={errors().category}>
          <p class="mt-1 text-xs text-[var(--color-error)]">{errors().category}</p>
        </Show>
      </div>

      <div>
        <label class="block text-sm font-medium mb-1" for="ke-tags">Tags</label>
        <input
          id="ke-tags"
          type="text"
          value={tagsInput()}
          onInput={(e) => setTagsInput(e.currentTarget.value)}
          placeholder="comma, separated, tags"
          class="w-full px-3 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
        />
        <Show when={tags().length > 0}>
          <div class="flex flex-wrap gap-1.5 mt-2">
            <For each={tags()}>
              {(tag) => (
                <span class="px-1.5 py-0.5 rounded text-xs bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                  {tag}
                </span>
              )}
            </For>
          </div>
        </Show>
      </div>

      <div>
        <label class="block text-sm font-medium mb-1" for="ke-content">Content (Markdown)</label>
        <textarea
          id="ke-content"
          rows={14}
          value={content()}
          onInput={(e) => setContent(e.currentTarget.value)}
          placeholder="Write your knowledge entry content in markdown..."
          class="w-full px-3 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] text-sm font-mono focus:outline-none focus:border-[var(--color-accent)] resize-y"
        />
        <Show when={errors().content}>
          <p class="mt-1 text-xs text-[var(--color-error)]">{errors().content}</p>
        </Show>
      </div>

      <Show when={props.error}>
        <div class="p-3 rounded-md bg-[var(--color-error)]/10 border border-[var(--color-error)]/20">
          <p class="text-sm text-[var(--color-error)]">{props.error}</p>
        </div>
      </Show>

      <div class="flex justify-end gap-3 pt-2">
        <button type="button" onClick={props.onCancel}
          class="px-4 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
          Cancel
        </button>
        <button type="submit"
          class="px-4 py-2 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors">
          Save Changes
        </button>
      </div>
    </form>
  );
};
