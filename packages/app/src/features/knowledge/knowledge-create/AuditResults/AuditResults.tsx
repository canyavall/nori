import { For, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import type { AuditResultsProps } from './AuditResults.type';


export function AuditResults(props: AuditResultsProps) {
  const navigate = useNavigate();

  function handleViewEntry() {
    props.onContinue();
    navigate(`/knowledge/${props.entryId}`);
  }

  return (
    <div class="space-y-4">
      {/* Success header */}
      <div class="text-center py-2">
        <div class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-500/10 text-green-500 mb-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p class="font-medium">Entry created successfully</p>
        <p class="text-sm text-[var(--color-text-muted)] mt-1">{props.filePath}</p>
      </div>

      {/* Audit results */}
      <Show
        when={props.warnings.length > 0}
        fallback={
          <div class="rounded-md border border-green-500/20 bg-green-500/10 p-3">
            <p class="text-sm text-green-500">Audit passed — no warnings.</p>
          </div>
        }
      >
        <div class="space-y-2">
          <p class="text-sm font-medium">Audit warnings</p>
          <For each={props.warnings}>
            {(warning) => (
              <div class="rounded-md border border-yellow-500/20 bg-yellow-500/10 p-3">
                <p class="text-sm text-yellow-500">{warning}</p>
              </div>
            )}
          </For>
        </div>
      </Show>

      <div class="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleViewEntry}
          class="px-4 py-2 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          View Entry
        </button>
      </div>
    </div>
  );
}
