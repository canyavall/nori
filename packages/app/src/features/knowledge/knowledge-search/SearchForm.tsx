import { createSignal } from 'solid-js';

interface Props {
  initialQuery: string;
  onSearch: (query: string) => void;
}

export function SearchForm(props: Props) {
  const [query, setQuery] = createSignal(props.initialQuery);

  function handleSubmit(e: Event) {
    e.preventDefault();
    const q = query().trim();
    if (q) {
      props.onSearch(q);
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  }

  return (
    <div class="flex gap-2">
      <input
        type="text"
        value={query()}
        onInput={(e) => setQuery(e.currentTarget.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search knowledge entries..."
        class="flex-1 px-3 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!query().trim()}
        class="px-4 py-2 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Search
      </button>
    </div>
  );
}
