import { Show } from 'solid-js';
import { useProjectRegisterDialog } from './ProjectRegisterDialog.hook';

export const ProjectRegisterDialog = () => {
  const { path, name, setName, loading, picking, error, handleBrowse, handleSubmit, handleClose, isSubmitDisabled } = useProjectRegisterDialog();

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="w-full max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-xl">
        <div class="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 class="text-base font-semibold">Register Project</h2>
          <button
            type="button"
            onClick={handleClose}
            class="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} class="p-4 space-y-4">
          <div class="space-y-1">
            <label class="text-sm font-medium">Project Folder</label>
            <div class="flex gap-2">
              <input
                type="text"
                value={path()}
                readOnly
                placeholder="No folder selected"
                class="flex-1 px-3 py-2 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none cursor-default"
              />
              <button
                type="button"
                onClick={handleBrowse}
                disabled={picking()}
                class="px-3 py-2 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-sm hover:bg-[var(--color-bg)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                {picking() ? '…' : 'Browse…'}
              </button>
            </div>
            <p class="text-xs text-[var(--color-text-muted)]">
              A <code class="font-mono">.nori/</code> folder will be created inside the selected directory.
            </p>
          </div>

          <div class="space-y-1">
            <label class="text-sm font-medium">Name <span class="text-[var(--color-text-muted)] font-normal">(optional)</span></label>
            <input
              type="text"
              value={name()}
              onInput={(e) => setName(e.currentTarget.value)}
              placeholder="Defaults to folder name"
              class="w-full px-3 py-2 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>

          <Show when={error()}>
            <p class="text-sm text-[var(--color-text-error)]">{error()}</p>
          </Show>

          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              class="px-4 py-2 rounded-md text-sm border border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled()}
              class="px-4 py-2 rounded-md text-sm bg-[var(--color-accent)] text-white font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading() ? 'Registering…' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
