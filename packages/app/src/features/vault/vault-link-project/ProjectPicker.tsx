import { createSignal } from 'solid-js';

interface Props {
  vaultName: string;
  onSelect: (projectPath: string) => void;
  onBack: () => void;
}

export function ProjectPicker(props: Props) {
  const [projectPath, setProjectPath] = createSignal('');
  const [error, setError] = createSignal('');

  function handleSubmit(e: Event) {
    e.preventDefault();
    const path = projectPath().trim();
    if (!path) {
      setError('Project path is required');
      return;
    }
    setError('');
    props.onSelect(path);
  }

  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      <p class="text-sm text-[var(--color-text-muted)]">
        Link <span class="font-medium text-[var(--color-text)]">{props.vaultName}</span> to a project:
      </p>

      <div>
        <label class="block text-sm font-medium mb-1" for="project_path">
          Project Directory
        </label>
        <input
          id="project_path"
          type="text"
          value={projectPath()}
          onInput={(e) => setProjectPath(e.currentTarget.value)}
          placeholder="/path/to/your/project"
          class="w-full px-3 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
        />
        {error() && <p class="mt-1 text-xs text-[var(--color-error)]">{error()}</p>}
      </div>

      <div class="flex justify-between">
        <button
          type="button"
          onClick={props.onBack}
          class="px-4 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          class="px-4 py-2 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          Link
        </button>
      </div>
    </form>
  );
}
