import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { Package, SearchQuery, SearchResult } from '../types/knowledge';

export function useKnowledge(vaultPath?: string) {
  const [packages, setPackages] = useState<SearchResult[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Index knowledge when vault path changes
  useEffect(() => {
    const indexKnowledge = async () => {
      try {
        setLoading(true);
        await invoke('index_knowledge', { vaultPath: vaultPath || null });

        // Load categories and tags
        const [cats, tgs] = await Promise.all([
          invoke<string[]>('get_categories'),
          invoke<string[]>('get_tags'),
        ]);

        setCategories(cats);
        setTags(tgs);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    indexKnowledge();
  }, [vaultPath]);

  const search = useCallback(async (query: SearchQuery) => {
    try {
      setLoading(true);
      setError(null);
      const results = await invoke<SearchResult[]>('search_knowledge', { query });
      setPackages(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getPackage = useCallback(async (name: string): Promise<Package | null> => {
    try {
      return await invoke<Package>('get_package', { name });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    }
  }, []);

  const getAllPackages = useCallback(async (): Promise<Package[]> => {
    try {
      return await invoke<Package[]>('get_all_packages');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return [];
    }
  }, []);

  return {
    packages,
    categories,
    tags,
    loading,
    error,
    search,
    getPackage,
    getAllPackages,
  };
}
