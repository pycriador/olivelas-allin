import { useState, useEffect, useCallback, useMemo } from 'react';

export interface UseUrlPaginationOptions<T> {
  items: T[];
  filterFn?: (item: T, searchQuery: string, activeFilter: string) => boolean;
  defaultItemsPerPage?: number;
  pageParamKey?: string;
  searchParamKey?: string;
  filterParamKey?: string;
  defaultFilter?: string;
}

export function useUrlPagination<T>({
  items,
  filterFn,
  defaultItemsPerPage = 6,
  pageParamKey = 'page',
  searchParamKey = 'q',
  filterParamKey = 'filter',
  defaultFilter = 'all',
}: UseUrlPaginationOptions<T>) {
  // Helper to read search params
  const getSearchParams = useCallback(() => {
    if (typeof window === 'undefined') return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }, []);

  // Initial values from URL
  const initialPage = () => {
    const params = getSearchParams();
    const p = parseInt(params.get(pageParamKey) || '1', 10);
    return isNaN(p) || p < 1 ? 1 : p;
  };

  const initialSearch = () => {
    const params = getSearchParams();
    return params.get(searchParamKey) || '';
  };

  const initialFilter = () => {
    const params = getSearchParams();
    return params.get(filterParamKey) || defaultFilter;
  };

  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [activeFilter, setActiveFilter] = useState<string>(initialFilter);
  const [itemsPerPage, setItemsPerPage] = useState<number>(defaultItemsPerPage);

  // Sync to URL
  const updateUrl = useCallback(
    (page: number, search: string, filter: string) => {
      if (typeof window === 'undefined') return;

      const url = new URL(window.location.href);
      const params = url.searchParams;

      // Page
      if (page > 1) {
        params.set(pageParamKey, page.toString());
      } else {
        params.delete(pageParamKey);
      }

      // Search
      if (search && search.trim() !== '') {
        params.set(searchParamKey, search.trim());
      } else {
        params.delete(searchParamKey);
      }

      // Filter
      if (filter && filter !== defaultFilter) {
        params.set(filterParamKey, filter);
      } else {
        params.delete(filterParamKey);
      }

      const newUrl = `${url.pathname}${params.toString() ? `?${params.toString()}` : ''}${url.hash}`;
      window.history.replaceState(null, '', newUrl);
    },
    [pageParamKey, searchParamKey, filterParamKey, defaultFilter]
  );

  // Listen to popstate (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const params = getSearchParams();
      const p = parseInt(params.get(pageParamKey) || '1', 10);
      setCurrentPage(isNaN(p) || p < 1 ? 1 : p);
      setSearchQuery(params.get(searchParamKey) || '');
      setActiveFilter(params.get(filterParamKey) || defaultFilter);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [getSearchParams, pageParamKey, searchParamKey, filterParamKey, defaultFilter]);

  // Setters that update URL
  const setPage = useCallback(
    (page: number) => {
      setCurrentPage(page);
      updateUrl(page, searchQuery, activeFilter);
    },
    [searchQuery, activeFilter, updateUrl]
  );

  const setSearch = useCallback(
    (q: string) => {
      setSearchQuery(q);
      setCurrentPage(1);
      updateUrl(1, q, activeFilter);
    },
    [activeFilter, updateUrl]
  );

  const setFilter = useCallback(
    (f: string) => {
      setActiveFilter(f);
      setCurrentPage(1);
      updateUrl(1, searchQuery, f);
    },
    [searchQuery, updateUrl]
  );

  // Filter items using optional filterFn
  const filteredItems = useMemo(() => {
    if (!filterFn) return items;
    return items.filter((item) => filterFn(item, searchQuery, activeFilter));
  }, [items, filterFn, searchQuery, activeFilter]);

  // Calculate pagination
  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // If current page is beyond total pages (e.g. after filter), clamp it
  const effectivePage = useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      return totalPages;
    }
    return Math.max(1, currentPage);
  }, [currentPage, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (effectivePage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, effectivePage, itemsPerPage]);

  return {
    currentPage: effectivePage,
    totalPages,
    totalItems,
    itemsPerPage,
    paginatedItems,
    searchQuery,
    activeFilter,
    setPage,
    setSearch,
    setFilter,
    setItemsPerPage,
  };
}
