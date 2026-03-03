/* @refresh reload */
import { render } from 'solid-js/web';
import { Router, Route } from '@solidjs/router';
import { createSignal, Show, onMount } from 'solid-js';
import './styles/app.css';
import { App } from './App';
import { VaultsPage } from './pages/VaultsPage';
import { VaultDetailPage } from './pages/VaultDetailPage';
import { KnowledgePage } from './pages/KnowledgePage';
import { SessionsPage } from './pages/SessionsPage';
import { KnowledgeDetailPage } from './pages/KnowledgeDetailPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { SkillsPage } from './pages/SkillsPage';
import { RulesPage } from './pages/RulesPage';
import { HooksPage } from './pages/HooksPage';
import { McpsPage } from './pages/McpsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ensureServer } from './lib/server';

function Root() {
  const [ready, setReady] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  onMount(() => {
    ensureServer()
      .then(() => setReady(true))
      .catch((err) => setError(err.message));
  });

  return (
    <Show
      when={ready()}
      fallback={
        <div class="flex h-screen items-center justify-center">
          <Show
            when={!error()}
            fallback={
              <div class="text-center space-y-2">
                <p class="text-[var(--color-text-error)]">Failed to connect to server</p>
                <p class="text-sm text-[var(--color-text-muted)]">{error()}</p>
              </div>
            }
          >
            <div class="text-center space-y-2">
              <p class="text-[var(--color-text-muted)]">Starting Nori server...</p>
            </div>
          </Show>
        </div>
      }
    >
      <Router root={App}>
        <Route path="/" component={ProjectsPage} />
        <Route path="/vaults" component={VaultsPage} />
        <Route path="/vaults/:id" component={VaultDetailPage} />
        <Route path="/knowledge" component={KnowledgePage} />
        <Route path="/knowledge/:id" component={KnowledgeDetailPage} />
        <Route path="/sessions" component={SessionsPage} />
        <Route path="/projects" component={ProjectsPage} />
        <Route path="/project/skills" component={SkillsPage} />
        <Route path="/project/rules" component={RulesPage} />
        <Route path="/project/hooks" component={HooksPage} />
        <Route path="/project/mcps" component={McpsPage} />
        <Route path="/settings" component={SettingsPage} />
      </Router>
    </Show>
  );
}

const root = document.getElementById('root');

render(() => <Root />, root!);
