import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import type { ClaudeSkill } from '@nori/shared';
import { CodeEditor } from '../../../components/ui/CodeEditor/CodeEditor';

interface SkillEditorProps {
  skill: ClaudeSkill;
  content: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  error: string;
}

export const SkillEditor: Component<SkillEditorProps> = (props) => {
  return (
    <div>
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-xl font-semibold">{props.skill.name}</h2>
          <p class="text-sm text-[var(--color-text-muted)] font-mono">{props.skill.path}</p>
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            onClick={props.onCancel}
            class="px-3 py-1.5 text-sm rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={props.onSave}
            disabled={props.saving}
            class="px-3 py-1.5 text-sm rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors"
          >
            {props.saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <Show when={props.error}>
        <p class="text-sm text-[var(--color-text-error)] mb-3">{props.error}</p>
      </Show>

      <CodeEditor
        value={props.content}
        onChange={props.onChange}
        language="markdown"
      />
    </div>
  );
};
