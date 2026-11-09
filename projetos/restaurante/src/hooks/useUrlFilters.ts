import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

interface UseUrlFiltersOptions {
  defaultPageSize?: number;
}

export function useUrlFilters(options: UseUrlFiltersOptions = {}) {
  const { defaultPageSize = 10 } = options;
  const [searchParams, setSearchParams] = useSearchParams();

  const page = useMemo(() => {
    const p = parseInt(searchParams.get('page') || '1', 10);
    return isNaN(p) || p < 1 ? 1 : p;
  }, [searchParams]);

  const pageSize = useMemo(() => {
    const s = parseInt(searchParams.get('pageSize') || String(defaultPageSize), 10);
    return isNaN(s) || s < 1 ? defaultPageSize : s;
  }, [searchParams, defaultPageSize]);

  const search = useMemo(() => searchParams.get('search') || '', [searchParams]);
  const status = useMemo(() => searchParams.get('status') || '', [searchParams]);
  const role = useMemo(() => searchParams.get('role') || '', [searchParams]);
  const action = useMemo(() => searchParams.get('action') || '', [searchParams]);
  const sortBy = useMemo(() => searchParams.get('sortBy') || '', [searchParams]);
  const sortDir = useMemo(() => (searchParams.get('sortDir') === 'asc' ? 'asc' : 'desc'), [searchParams]);

  const setFilter = useCallback(
    (key: string, value: string | null) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value && value.trim()) {
          next.set(key, value.trim());
        } else {
          next.delete(key);
        }
        // Changing filter resets page to 1
        if (key !== 'page') {
          next.set('page', '1');
        }
        return next;
      });
    },
    [setSearchParams]
  );

  const setMultipleFilters = useCallback(
    (updates: Record<string, string | null>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(updates).forEach(([key, val]) => {
          if (val && val.trim()) {
            next.set(key, val.trim());
          } else {
            next.delete(key);
          }
        });
        next.set('page', '1');
        return next;
      });
    },
    [setSearchParams]
  );

  const setPage = useCallback(
    (newPage: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('page', String(newPage));
        return next;
      });
    },
    [setSearchParams]
  );

  const setPageSize = useCallback(
    (newPageSize: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('pageSize', String(newPageSize));
        next.set('page', '1');
        return next;
      });
    },
    [setSearchParams]
  );

  const resetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  return {
    page,
    pageSize,
    search,
    status,
    role,
    action,
    sortBy,
    sortDir,
    searchParams,
    setFilter,
    setMultipleFilters,
    setPage,
    setPageSize,
    resetFilters,
  };
}
