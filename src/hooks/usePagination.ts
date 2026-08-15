import { useState, useCallback, useRef } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PageResponse } from '../types/pagination.types';

export interface UsePaginationOptions<T, F = Record<string, unknown>> {
  /** API function that returns a PageResponse */
  fetchFn: (page: number, size: number, sort: string, filters: F) => Promise<PageResponse<T>>;
  /**
   * Namespace de la query key (['<queryKey>', 'page', {...}]). Debe ser el
   * nombre de la entidad ('clientes', 'prestamos'…) para que las mutaciones
   * puedan invalidar con queryClient.invalidateQueries({ queryKey: ['<queryKey>'] }).
   */
  queryKey: string;
  /** Initial page size (default: 20) */
  initialSize?: number;
  /** Default sort expression, e.g. "nombre,asc" */
  defaultSort?: string;
  /** Initial filters object */
  initialFilters?: F;
  /** Whether to fetch on mount (default: true) */
  fetchOnMount?: boolean;
  /** staleTime de react-query (default: el del QueryClient — 5min + invalidación SSE) */
  staleTime?: number;
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

/**
 * Paginación server-side sobre React Query (Etapa 6.4: antes hacía el fetch a
 * mano con useState/useEffect). Misma API pública; ahora la página cachea por
 * (page, size, sort, filters) con keepPreviousData, y `refresh` invalida el
 * namespace completo — cualquier mutación externa puede hacer lo mismo.
 */
export function usePagination<T, F = Record<string, unknown>>(
  options: UsePaginationOptions<T, F>
): UsePaginationReturn<T, F> {
  const {
    fetchFn,
    queryKey,
    initialSize = 20,
    defaultSort = '',
    initialFilters = {} as F,
    fetchOnMount = true,
    staleTime,
  } = options;

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(initialSize);
  const [sort, setSort] = useState(defaultSort);
  const [filters, setFiltersState] = useState<F>(initialFilters);
  // fetchOnMount=false: la query queda deshabilitada hasta el primer cambio
  // de parámetros o refresh() (semántica del hook original).
  const [armed, setArmed] = useState(fetchOnMount);

  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [queryKey, 'page', { page, size, sort, filters }],
    queryFn: () => fetchFnRef.current(page, size, sort, filters),
    enabled: armed,
    placeholderData: keepPreviousData,
    staleTime,
  });

  const error = query.error
    ? ((query.error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (query.error as Error)?.message ||
        'Error al cargar datos')
    : null;

  const arm = useCallback(() => setArmed(true), []);

  const handleChangePage = useCallback((_event: unknown, newPage: number) => {
    arm();
    setPage(newPage);
  }, [arm]);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    arm();
    setSize(parseInt(event.target.value, 10));
    setPage(0);
  }, [arm]);

  const handleSetPage = useCallback((newPage: number) => {
    arm();
    setPage(newPage);
  }, [arm]);

  const handleSetSize = useCallback((newSize: number) => {
    arm();
    setSize(newSize);
    setPage(0);
  }, [arm]);

  const handleSetFilters = useCallback((newFilters: F) => {
    arm();
    setFiltersState(newFilters);
    setPage(0);
  }, [arm]);

  const handleSetSort = useCallback((newSort: string) => {
    arm();
    setSort(newSort);
    setPage(0);
  }, [arm]);

  const refresh = useCallback(() => {
    setArmed(true);
    queryClient.invalidateQueries({ queryKey: [queryKey] });
  }, [queryClient, queryKey]);

  return {
    // Fiel al hook original: ante error la lista queda vacía (no datos stale).
    data: query.error ? [] : (query.data?.content ?? []),
    totalElements: query.data?.totalElements ?? 0,
    totalPages: query.data?.totalPages ?? 0,
    empty: query.data?.empty ?? true,
    page,
    size,
    sort,
    loading: query.isPending && armed,
    error,
    setPage: handleSetPage,
    setSize: handleSetSize,
    setSort: handleSetSort,
    setFilters: handleSetFilters,
    refresh,
    handleChangePage,
    handleChangeRowsPerPage,
  };
}
