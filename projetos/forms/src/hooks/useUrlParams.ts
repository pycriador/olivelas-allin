import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';

export function useUrlParams(defaultLimit: number = 10) {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.max(1, parseInt(searchParams.get('limit') || String(defaultLimit), 10));

  const getParam = useCallback((key: string, fallback: string = '') => {
    return searchParams.get(key) || fallback;
  }, [searchParams]);

  const setParam = useCallback((key: string, value: string | number | null | undefined) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === null || value === undefined || value === '' || value === 'all') {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
      // Reset page to 1 whenever filters or search terms change
      if (key !== 'page') {
        next.set('page', '1');
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const setPage = useCallback((newPage: number) => {
    setParam('page', Math.max(1, newPage));
  }, [setParam]);

  const setSearch = useCallback((newSearch: string) => {
    setParam('search', newSearch.trim());
  }, [setParam]);

  return {
    searchParams,
    search,
    page,
    limit,
    getParam,
    setParam,
    setPage,
    setSearch,
  };
}
