import { For, Show } from 'solid-js';
import type { ConflictResolverProps } from './ConflictResolver.type';


export function ConflictResolver(props: ConflictResolverProps) {
  return (
    <div class="space-y-4">
      <div class="text-center py-2">
        <div class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-500/10 text-yellow-500 mb-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="font-medium">Merge Conflicts Detected</p>
        <p class="text-sm text-[var(--color-text-muted)] mt-1">
          {props.conflictFiles.length} file{props.conflictFiles.length !== 1 ? 's have' : ' has'} conflicts that need manual resolution.
        </p>
      </div>

      <Show when={props.conflictFiles.length > 0}>
        <div class="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-3 space-y-1 max-h-48 overflow-y-auto">
          <For each={props.conflictFiles}>
            {(file) => (
              <p class="text-sm font-mono text-[var(--color-text-muted)] truncate">{file}</p>
            )}
          </For>
        </div>
      </Show>

      <div class="rounded-md border border-yellow-500/20 bg-yellow-500/10 p-3">
        <p class="text-sm text-yellow-500">
          Open your vault directory to resolve these conflicts manually, then push the resolved changes.
        </p>
        <Show when={props.vaultPath}>
          <p class="text-xs text-yellow-500/70 font-mono mt-1 truncate">{props.vaultPath}</p>
        </Show>
      </div>

      <div class="flex justify-end pt-2">
        <button type="button" onClick={props.onDone}
          class="px-4 py-2 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors">
          Done
        </button>
      </div>
    </div>
  );
}
