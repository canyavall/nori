import { Match, Switch } from 'solid-js';
import { SearchForm } from '../SearchForm/SearchForm';
import { SearchResults } from '../SearchResults/SearchResults';
import { useKnowledgeSearchPage } from './KnowledgeSearchPage.hook';

export const KnowledgeSearchPage = () => {
  const { step, query, results, totalCount, error, handleSearch } = useKnowledgeSearchPage();

  return (
    <div class="max-w-2xl mx-auto space-y-6">
      <h2 class="text-xl font-semibold">Search Knowledge</h2>

      <SearchForm
        initialQuery={query()}
        onSearch={handleSearch}
      />

      {error() && (
        <div class="p-3 rounded-md bg-[var(--color-error)]/10 border border-[var(--color-error)]/20">
          <p class="text-sm text-[var(--color-error)]">{error()}</p>
        </div>
      )}

      <Switch>
        <Match when={step() === 'searching'}>
          <div class="py-12 text-center space-y-4">
            <div class="inline-block w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
            <p class="text-sm text-[var(--color-text-muted)]">Searching...</p>
          </div>
        </Match>

        <Match when={step() === 'results'}>
          <SearchResults
            results={results()}
            totalCount={totalCount()}
            query={query()}
          />
        </Match>
      </Switch>
    </div>
  );
};
