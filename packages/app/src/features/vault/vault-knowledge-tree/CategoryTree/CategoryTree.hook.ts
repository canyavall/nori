import { createSignal } from 'solid-js';
import type { CategoryTreeProps } from './CategoryTree.type';

export const useCategoryTree = (props: Pick<CategoryTreeProps, 'categories'>) => {
  const categoryNames = () => Object.keys(props.categories).sort();
  const [collapsed, setCollapsed] = createSignal<Set<string>>(new Set());

  const toggleCategory = (cat: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const isCategoryCollapsed = (cat: string) => collapsed().has(cat);

  return { categoryNames, toggleCategory, isCategoryCollapsed };
};
