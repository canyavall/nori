import { createSignal } from 'solid-js';
import type { SearchFormProps } from './SearchForm.type';

export const useSearchForm = (props: Pick<SearchFormProps, 'initialQuery' | 'onSearch'>) => {
  const [query, setQuery] = createSignal(props.initialQuery);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const q = query().trim();
    if (q) {
      props.onSearch(q);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const isQueryEmpty = () => !query().trim();

  return { query, setQuery, handleSubmit, handleKeyDown, isQueryEmpty };
};
