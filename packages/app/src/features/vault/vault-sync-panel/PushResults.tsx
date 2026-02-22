import { Show } from 'solid-js';

interface Props {
  filesPushed: number;
  commitHash: string;
  onDone: () => void;
}

export function PushResults(props: Props) {
  return (
    <div class="space-y-4">
      <div class="text-center py-2">
        <Show
          when={props.filesPushed > 0}
          fallback={
            <>
              <div class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] mb-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p class="font-medium">Nothing to push</p>
              <p class="text-sm text-[var(--color-text-muted)] mt-1">No local changes to push.</p>
            </>
          }
        >
          <div class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-500/10 text-green-500 mb-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p class="font-medium">Push completed</p>
          <p class="text-sm text-[var(--color-text-muted)] mt-1">
            {props.filesPushed} file{props.filesPushed !== 1 ? 's' : ''} pushed
          </p>
          <Show when={props.commitHash}>
            <p class="text-xs text-[var(--color-text-muted)] font-mono mt-1">
              {props.commitHash.slice(0, 8)}
            </p>
          </Show>
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
