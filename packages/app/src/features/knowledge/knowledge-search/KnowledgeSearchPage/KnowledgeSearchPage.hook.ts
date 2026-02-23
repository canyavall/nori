import { createSignal } from 'solid-js';
import { apiGet } from '../../../../lib/api';
import type { SearchResultItem } from '../SearchResults/SearchResults.type';

type PageStep = 'form' | 'searching' | 'results';

export const useKnowledgeSearchPage = () => {
  const [step, setStep] = createSignal<PageStep>('form');
  const [query, setQuery] = createSignal('');
  const [results, setResults] = createSignal<SearchResultItem[]>([]);
  const [totalCount, setTotalCount] = createSignal(0);
  const [error, setError] = createSignal('');

  const handleSearch = async (q: string) => {
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
  };

  return { step, query, results, totalCount, error, handleSearch };
};
