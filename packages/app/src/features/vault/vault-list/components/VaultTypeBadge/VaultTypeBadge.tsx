import type { Component } from 'solid-js';

export const VaultTypeBadge: Component<{ type: 'git' | 'local' }> = (props) => (
  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">
    {props.type}
  </span>
);
