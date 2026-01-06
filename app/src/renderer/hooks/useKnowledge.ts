import { useState, useEffect, useCallback } from 'react';
import { invokeCommand } from '../lib/api';
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
        // Note: Knowledge endpoints are stubbed (return empty) in MVP
        // See MIGRATION.md: Known Limitations #1

        // Stub: No categories or tags in MVP
        setCategories([]);
        setTags([]);
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
      const { packages: results } = await invokeCommand<{ packages: SearchResult[] }>('/knowledge/search', {
        method: 'GET',
      });
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
      // Stub: Knowledge not implemented in MVP
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    }
  }, []);

  const getAllPackages = useCallback(async (): Promise<Package[]> => {
    try {
      return await invokeCommand<Package[]>('/knowledge/packages');
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
