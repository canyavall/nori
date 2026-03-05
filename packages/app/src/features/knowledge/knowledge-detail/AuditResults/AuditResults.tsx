import { For, Show } from 'solid-js';
import type { Component } from 'solid-js';
import type { KnowledgeLlmFinding } from '@nori/shared';
import type { AuditResultsProps } from './AuditResults.type';

const FINDING_LABELS: Record<string, string> = {
  llm_friendly: 'LLM-friendly',
  has_real_knowledge: 'Real knowledge',
  conciseness: 'Conciseness',
  tags: 'Tags',
  description: 'Description',
  rules: 'Rules',
  required_knowledge: 'Required knowledge',
  category: 'Category',
  format: 'Format',
  uniqueness: 'Uniqueness',
};

const statusColor = (s: 'pass' | 'warn' | 'fail' | 'ok') =>
  s === 'pass' || s === 'ok'
    ? 'text-[var(--color-success)]'
    : s === 'warn'
    ? 'text-[var(--color-warning,#f59e0b)]'
    : 'text-[var(--color-error)]';

const statusBg = (s: 'pass' | 'warn' | 'fail') =>
  s === 'pass'
    ? 'bg-[var(--color-success)]/10 border-[var(--color-success)]/30'
    : s === 'warn'
    ? 'bg-[var(--color-warning,#f59e0b)]/10 border-[var(--color-warning,#f59e0b)]/30'
    : 'bg-[var(--color-error)]/10 border-[var(--color-error)]/30';

const StatusIcon: Component<{ status: 'pass' | 'warn' | 'fail' }> = (props) => {
  if (props.status === 'pass') {
    return (
      <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-label="Pass">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (props.status === 'warn') {
    return (
      <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-label="Warning">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    );
  }
  return (
    <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-label="Fail">
      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
};

const FindingRow: Component<{ label: string; finding: KnowledgeLlmFinding }> = (props) => (
  <div class="flex items-start gap-2 py-2 border-b border-[var(--color-border)] last:border-0">
    <span class={`mt-0.5 ${statusColor(props.finding.status)}`}>
      <StatusIcon status={props.finding.status} />
    </span>
    <div class="min-w-0">
      <span class="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">{props.label}</span>
      <p class="text-sm text-[var(--color-text)] mt-0.5">{props.finding.message}</p>
    </div>
  </div>
);

export const AuditResults: Component<AuditResultsProps> = (props) => {
  const r = () => props.result;

  const hasSuggestions = () =>
    r().suggestions.tags.length > 0 ||
    r().suggestions.description ||
    r().suggestions.rules.length > 0 ||
    r().suggestions.required_knowledge.length > 0 ||
    r().suggestions.category;

  return (
    <div class="space-y-4">
      {/* Overall score header */}
      <div class={`flex items-center justify-between p-4 rounded-lg border ${statusBg(r().overall_status)}`}>
        <div>
          <p class={`text-sm font-semibold ${statusColor(r().overall_status)}`}>
            {r().overall_status === 'pass' ? 'Passed' : r().overall_status === 'warn' ? 'Warnings' : 'Failed'}
          </p>
          <p class="text-sm text-[var(--color-text)] mt-0.5">{r().summary}</p>
        </div>
        <div class="text-right shrink-0 ml-4">
          <p class={`text-2xl font-bold ${statusColor(r().overall_status)}`}>{r().overall_score}</p>
          <p class="text-xs text-[var(--color-text-muted)]">/ 100</p>
        </div>
      </div>

      {/* Token count */}
      <div class="flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
        <span class={`text-sm font-medium ${statusColor(r().token_status)}`}>
          ~{r().token_estimate.toLocaleString()} tokens
        </span>
        <span class="text-xs text-[var(--color-text-muted)]">
          {r().token_status === 'ok' && '(within limit)'}
          {r().token_status === 'warn' && '(approaching limit — consider trimming)'}
          {r().token_status === 'fail' && '(too large — split recommended)'}
        </span>
      </div>

      {/* 10-check findings grid */}
      <div class="border border-[var(--color-border)] rounded-lg overflow-hidden">
        <p class="px-4 py-2 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
          Quality Checks
        </p>
        <div class="px-4 divide-y divide-[var(--color-border)]">
          <For each={Object.entries(r().findings)}>
            {([key, finding]) => (
              <FindingRow label={FINDING_LABELS[key] ?? key} finding={finding as KnowledgeLlmFinding} />
            )}
          </For>
        </div>
      </div>

      {/* Similar entries */}
      <Show when={r().suggestions.similar_entries.length > 0}>
        <div class="border border-[var(--color-warning,#f59e0b)]/30 rounded-lg overflow-hidden">
          <p class="px-4 py-2 text-xs font-medium text-[var(--color-warning,#f59e0b)] uppercase tracking-wide bg-[var(--color-warning,#f59e0b)]/10 border-b border-[var(--color-warning,#f59e0b)]/30">
            Similar entries found
          </p>
          <div class="px-4 py-3 space-y-2">
            <For each={r().suggestions.similar_entries}>
              {(entry) => (
                <div>
                  <p class="text-sm font-medium text-[var(--color-text)]">{entry.title}</p>
                  <p class="text-xs text-[var(--color-text-muted)]">{entry.reason}</p>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* Split recommendation */}
      <Show when={r().suggestions.split_recommended}>
        <div class="p-3 rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/5">
          <p class="text-sm font-medium text-[var(--color-error)]">Split recommended</p>
          <Show when={r().suggestions.split_rationale}>
            <p class="text-xs text-[var(--color-text-muted)] mt-1">{r().suggestions.split_rationale}</p>
          </Show>
        </div>
      </Show>

      {/* Suggestions panel */}
      <Show when={hasSuggestions()}>
        <div class="border border-[var(--color-border)] rounded-lg overflow-hidden">
          <p class="px-4 py-2 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
            Suggested improvements
          </p>
          <div class="px-4 py-3 space-y-3">
            <Show when={r().suggestions.description}>
              <div>
                <p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-1">Description</p>
                <p class="text-sm text-[var(--color-text)]">{r().suggestions.description}</p>
              </div>
            </Show>
            <Show when={r().suggestions.category}>
              <div>
                <p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-1">Category</p>
                <p class="text-sm text-[var(--color-text)]">{r().suggestions.category}</p>
              </div>
            </Show>
            <Show when={r().suggestions.tags.length > 0}>
              <div>
                <p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">Tags</p>
                <div class="flex flex-wrap gap-1.5">
                  <For each={r().suggestions.tags}>
                    {(tag) => (
                      <span class="px-1.5 py-0.5 rounded text-xs bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                        {tag}
                      </span>
                    )}
                  </For>
                </div>
              </div>
            </Show>
            <Show when={r().suggestions.rules.length > 0}>
              <div>
                <p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-1">Rules</p>
                <ul class="text-xs text-[var(--color-text-muted)] list-disc list-inside space-y-0.5">
                  <For each={r().suggestions.rules}>{(rule) => <li>{rule}</li>}</For>
                </ul>
              </div>
            </Show>
            <Show when={r().suggestions.required_knowledge.length > 0}>
              <div>
                <p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">Required knowledge</p>
                <div class="flex flex-wrap gap-1.5">
                  <For each={r().suggestions.required_knowledge}>
                    {(item) => (
                      <span class="px-1.5 py-0.5 rounded text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">
                        {item}
                      </span>
                    )}
                  </For>
                </div>
              </div>
            </Show>
          </div>
        </div>
      </Show>

      {/* Footer actions */}
      <div class="flex gap-2 justify-end pt-2">
        <button
          type="button"
          onClick={props.onDismiss}
          class="px-4 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          Dismiss
        </button>
        <Show when={hasSuggestions()}>
          <button
            type="button"
            onClick={props.onApplySuggestions}
            class="px-4 py-2 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            Apply Suggestions
          </button>
        </Show>
      </div>
    </div>
  );
};
