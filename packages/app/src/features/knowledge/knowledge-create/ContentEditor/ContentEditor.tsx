import type { ContentEditorProps } from './ContentEditor.type';
import { useContentEditor } from './ContentEditor.hook';

export const ContentEditor = (props: ContentEditorProps) => {
  const { content, setContent, handleSave, isContentEmpty } = useContentEditor(props);

  return (
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-1" for="kc-content">
          Content (Markdown)
        </label>
        <textarea
          id="kc-content"
          rows={16}
          value={content()}
          onInput={(e) => setContent(e.currentTarget.value)}
          placeholder="Write your knowledge entry content in markdown..."
          class="w-full px-3 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] text-sm font-mono focus:outline-none focus:border-[var(--color-accent)] resize-y"
        />
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={props.onBack}
          class="px-4 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          disabled={isContentEmpty()}
          onClick={handleSave}
          class="px-4 py-2 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Preview
        </button>
      </div>
    </div>
  );
};
