import type { Component } from 'solid-js';
import { For } from 'solid-js';
import type { DiffViewProps, DiffLine } from './DiffView.type';

function computeDiff(original: string, suggested: string): DiffLine[] {
  const origLines = original.split('\n');
  const suggLines = suggested.split('\n');
  const m = origLines.length;
  const n = suggLines.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (origLines[i - 1] === suggLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to build diff
  const result: DiffLine[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origLines[i - 1] === suggLines[j - 1]) {
      result.unshift({ kind: 'unchanged', text: origLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ kind: 'added', text: suggLines[j - 1] });
      j--;
    } else {
      result.unshift({ kind: 'removed', text: origLines[i - 1] });
      i--;
    }
  }
  return result;
}

const lineStyle = (kind: DiffLine['kind']): string => {
  if (kind === 'added') return 'bg-green-500/15 text-green-300';
  if (kind === 'removed') return 'bg-red-500/15 text-red-300 line-through opacity-60';
  return 'text-[var(--color-text-muted)]';
};

const linePrefix = (kind: DiffLine['kind']): string => {
  if (kind === 'added') return '+';
  if (kind === 'removed') return '-';
  return ' ';
};

export const DiffView: Component<DiffViewProps> = (props) => {
  const lines = () => computeDiff(props.original, props.suggested);

  return (
    <div class="rounded-md border border-[var(--color-border)] overflow-hidden text-xs">
      <div class="flex items-center justify-between px-3 py-1.5 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
        <span class="text-[var(--color-text-muted)] font-medium">Suggested changes</span>
        <div class="flex gap-2">
          <button
            type="button"
            onClick={props.onDismiss}
            class="px-2 py-0.5 rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={props.onApply}
            class="px-2 py-0.5 rounded bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            Apply to editor
          </button>
        </div>
      </div>
      <div class="max-h-48 overflow-y-auto font-mono p-2 bg-[var(--color-bg)]">
        <For each={lines()}>
          {(line) => (
            <div class={`flex gap-2 px-1 rounded ${lineStyle(line.kind)}`}>
              <span class="select-none w-3 shrink-0">{linePrefix(line.kind)}</span>
              <span class="whitespace-pre-wrap break-all">{line.text || '\u00a0'}</span>
            </div>
          )}
        </For>
      </div>
    </div>
  );
};
