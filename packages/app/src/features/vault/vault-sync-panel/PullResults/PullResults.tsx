import { For, Show } from 'solid-js';
import type { PullResultsProps } from './PullResults.type';


export function PullResults(props: PullResultsProps) {
  return (
    <div class="space-y-4">
      <div class="text-center py-2">
        <Show
          when={!props.hasConflicts}
          fallback={
            <div class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-500/10 text-yellow-500 mb-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          }
        >
          <div class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-500/10 text-green-500 mb-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </Show>
        <p class="font-medium">
          {props.hasConflicts ? 'Pull completed with conflicts' : 'Pull completed'}
        </p>
        <p class="text-sm text-[var(--color-text-muted)] mt-1">
          {props.filesChanged} file{props.filesChanged !== 1 ? 's' : ''} changed
        </p>
      </div>

      <Show when={props.hasConflicts}>
        <div class="rounded-md border border-yellow-500/20 bg-yellow-500/10 p-3 space-y-2">
          <p class="text-sm text-yellow-500">
            Conflicts were detected during merge. Some files may need manual resolution in your vault directory.
          </p>
          <Show when={props.onViewConflicts}>
            <button
              type="button"
              onClick={props.onViewConflicts}
              class="text-xs text-yellow-500 underline hover:text-yellow-400 transition-colors"
            >
              View conflict details
            </button>
          </Show>
        </div>
      </Show>

      <Show when={props.warnings.length > 0}>
        <div class="space-y-2">
          <p class="text-sm font-medium">Warnings</p>
          <For each={props.warnings}>
            {(warning) => (
              <div class="rounded-md border border-yellow-500/20 bg-yellow-500/10 p-3">
                <p class="text-sm text-yellow-500">{warning}</p>
              </div>
            )}
          </For>
        </div>
      </Show>

      <Show when={!props.hasConflicts && props.warnings.length === 0}>
        <div class="rounded-md border border-green-500/20 bg-green-500/10 p-3">
          <p class="text-sm text-green-500">Pull successful — no warnings.</p>
        </div>
      </Show>

      <div class="flex justify-end pt-2">
        <button type="button" onClick={props.onDone}
          class="px-4 py-2 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors">
          Done
        </button>
      </div>
    </div>
  );
}
