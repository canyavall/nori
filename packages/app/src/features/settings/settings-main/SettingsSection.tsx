import { Show } from 'solid-js';
import type { Component } from 'solid-js';
import { ThemeSwitcher } from '../settings-theme/ThemeSwitcher';
import { useSettingsSection } from './SettingsSection.hook';

export const SettingsSection: Component = () => {
  const { checking, detail, subscriptionLabel, runCheck } = useSettingsSection();

  return (
    <div class="p-6 max-w-2xl mx-auto">
      <h2 class="text-xl font-semibold mb-6">Settings</h2>

      {/* Appearance */}
      <section class="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5 mb-4">
        <h3 class="font-medium mb-3">Appearance</h3>
        <ThemeSwitcher />
      </section>

      {/* Anthropic Access */}
      <section class="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5 mb-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-medium">Anthropic Access</h3>
          <button
            type="button"
            onClick={runCheck}
            disabled={checking()}
            class="px-3 py-1.5 rounded-md text-xs text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)] disabled:opacity-50 transition-colors"
          >
            {checking() ? 'Checking…' : 'Re-check'}
          </button>
        </div>

        <Show when={checking()}>
          <div class="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <div class="w-3 h-3 rounded-full bg-gray-400 animate-pulse" />
            <span>Checking Anthropic access…</span>
          </div>
        </Show>

        <Show when={!checking() && detail()}>
          {/* Authenticated */}
          <Show when={detail()?.has_anthropic_access}>
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
                <span class="text-sm font-medium text-green-500">Access confirmed</span>
                <span class="px-2 py-0.5 rounded text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">
                  {subscriptionLabel()}
                </span>
              </div>
              <Show when={detail()?.anthropic_email}>
                <p class="text-sm text-[var(--color-text-muted)] pl-5">{detail()?.anthropic_email}</p>
              </Show>
              <Show when={detail()?.anthropic_access_type === 'api_key'}>
                <p class="text-xs text-[var(--color-text-muted)] pl-5">Authenticated via <code class="font-mono">ANTHROPIC_API_KEY</code></p>
              </Show>
              <Show when={detail()?.anthropic_access_type === 'cli_auth'}>
                <p class="text-xs text-[var(--color-text-muted)] pl-5">Authenticated via Claude CLI</p>
              </Show>
            </div>
          </Show>

          {/* Not authenticated */}
          <Show when={!detail()?.has_anthropic_access}>
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
                <span class="text-sm text-red-500">No Anthropic access detected</span>
              </div>
              <div class="text-sm text-[var(--color-text-muted)] space-y-2 pl-5">
                <p class="font-medium text-[var(--color-text)]">To fix this, do one of:</p>
                <div class="space-y-1">
                  <p class="font-medium text-xs uppercase tracking-wide text-[var(--color-text-muted)]">Option A — Claude CLI</p>
                  <ol class="list-decimal list-inside space-y-1 pl-1 text-xs">
                    <li>Install: <code class="font-mono bg-[var(--color-bg-tertiary)] px-1 rounded">npm install -g @anthropic-ai/claude-code</code></li>
                    <li>Login: <code class="font-mono bg-[var(--color-bg-tertiary)] px-1 rounded">claude auth login</code></li>
                  </ol>
                </div>
                <div class="space-y-1">
                  <p class="font-medium text-xs uppercase tracking-wide text-[var(--color-text-muted)]">Option B — API key</p>
                  <p class="text-xs">Set <code class="font-mono bg-[var(--color-bg-tertiary)] px-1 rounded">ANTHROPIC_API_KEY</code> in your environment before launching Nori.</p>
                </div>
              </div>
            </div>
          </Show>
        </Show>
      </section>

      {/* Claude CLI */}
      <section class="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5 mb-4">
        <h3 class="font-medium mb-3">Claude CLI</h3>
        <Show when={checking()}>
          <div class="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <div class="w-3 h-3 rounded-full bg-gray-400 animate-pulse" />
            <span>Checking…</span>
          </div>
        </Show>
        <Show when={!checking() && detail()}>
          <Show
            when={detail()?.cli_installed}
            fallback={
              <div class="flex items-center gap-2 text-sm text-red-500">
                <div class="w-3 h-3 rounded-full bg-red-500" />
                <span>Not installed</span>
              </div>
            }
          >
            <div class="flex items-center gap-2 text-sm">
              <div class="w-3 h-3 rounded-full bg-green-500" />
              <span class="text-green-500">Installed</span>
              <Show when={detail()?.cli_version}>
                <span class="text-[var(--color-text-muted)] font-mono text-xs">{detail()?.cli_version}</span>
              </Show>
            </div>
          </Show>
        </Show>
      </section>

      {/* About */}
      <section class="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5">
        <h3 class="font-medium mb-3">About</h3>
        <p class="text-sm text-[var(--color-text-muted)]">Nori v0.1.0</p>
        <p class="text-xs text-[var(--color-text-muted)] mt-1">AI-assisted development with knowledge vault management</p>
      </section>
    </div>
  );
}
