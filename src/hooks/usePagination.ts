import { useState, useEffect, useCallback, useRef } from 'react';
import type { PageResponse } from '../types/pagination.types';

export interface UsePaginationOptions<T, F = Record<string, unknown>> {
  /** API function that returns a PageResponse */
  fetchFn: (page: number, size: number, sort: string, filters: F) => Promise<PageResponse<T>>;
  /** Initial page size (default: 20) */
  initialSize?: number;
  /** Default sort expression, e.g. "nombre,asc" */
  defaultSort?: string;
  /** Initial filters object */
  initialFilters?: F;
  /** Whether to fetch on mount (default: true) */
  fetchOnMount?: boolean;
}

export interface UsePaginationReturn<T, F = Record<string, unknown>> {
  data: T[];
  totalElements: number;
  totalPages: number;
  empty: boolean;
  page: number;
  size: number;
  sort: string;
  loading: boolean;
  error: string | null;
  setPage: (page: number) => void;
  setSize: (size: number) => void;
  setSort: (sort: string) => void;
  setFilters: (filters: F) => void;
  refresh: () => void;
  /** MUI TablePagination onPageChange handler */
  handleChangePage: (event: unknown, newPage: number) => void;
  /** MUI TablePagination onRowsPerPageChange handler */
  handleChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function usePagination<T, F = Record<string, unknown>>(
  options: UsePaginationOptions<T, F>
): UsePaginationReturn<T, F> {
  const {
    fetchFn,
    initialSize = 20,
    defaultSort = '',
    initialFilters = {} as F,
    fetchOnMount = true,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [empty, setEmpty] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(initialSize);
  const [sort, setSort] = useState(defaultSort);
  const [filters, setFiltersState] = useState<F>(initialFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(false);
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchFnRef.current(page, size, sort, filters);
      setData(response.content);
      setTotalElements(response.totalElements);
      setTotalPages(response.totalPages);
      setEmpty(response.empty);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Error al cargar datos';
      console.error('usePagination fetch error:', err);
      setError(message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [page, size, sort, filters]);

  useEffect(() => {
    if (!mountedRef.current && !fetchOnMount) {
      mountedRef.current = true;
      return;
    }
    mountedRef.current = true;
    fetchData();
  }, [fetchData]);

  const handleChangePage = useCallback((_event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSize(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const handleSetSize = useCallback((newSize: number) => {
    setSize(newSize);
    setPage(0);
  }, []);

  const handleSetFilters = useCallback((newFilters: F) => {
    setFiltersState(newFilters);
    setPage(0);
  }, []);

  const handleSetSort = useCallback((newSort: string) => {
    setSort(newSort);
    setPage(0);
  }, []);

  return {
    data,
    totalElements,
    totalPages,
    empty,
    page,
    size,
    sort,
    loading,
    error,
    setPage,
    setSize: handleSetSize,
    setSort: handleSetSort,
    setFilters: handleSetFilters,
    refresh: fetchData,
    handleChangePage,
    handleChangeRowsPerPage,
  };
}
