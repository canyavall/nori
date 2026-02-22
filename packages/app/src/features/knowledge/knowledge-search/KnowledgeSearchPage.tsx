import { createSignal, Match, Switch } from 'solid-js';
import { apiGet } from '../../../lib/api';
import { SearchForm } from './SearchForm';
import { SearchResults, type SearchResultItem } from './SearchResults';

type PageStep = 'form' | 'searching' | 'results';

export function KnowledgeSearchPage() {
  const [step, setStep] = createSignal<PageStep>('form');
  const [query, setQuery] = createSignal('');
  const [results, setResults] = createSignal<SearchResultItem[]>([]);
  const [totalCount, setTotalCount] = createSignal(0);
  const [error, setError] = createSignal('');

  async function handleSearch(q: string) {
    setQuery(q);
    setStep('searching');
    setError('');

    try {
      const res = await apiGet<{ data: { results: SearchResultItem[]; total_count: number } }>(
        `/api/knowledge/search?q=${encodeURIComponent(q)}`
      );
      setResults(res.data.results);
      setTotalCount(res.data.total_count);
      setStep('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setStep('form');
    }
  }

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
}
