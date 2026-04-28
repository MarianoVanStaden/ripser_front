import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { colorApi, type Color } from '../api/services/colorApi';
import { useAuth } from './AuthContext';

/**
 * Context that holds the cached list of colors (the parameterizable
 * catalog managed via /api/colores). The list rarely changes, so we cache
 * it once per session and expose `refresh()` for callers that just
 * mutated the catalog.
 */
interface ColoresContextValue {
  colores: Color[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<Color[]>;
  /** Refresh the catalog and return the freshly-fetched color matching `id`. */
  refreshAndFind: (id: number) => Promise<Color | undefined>;
}

const ColoresContext = createContext<ColoresContextValue | null>(null);

interface ColoresProviderProps {
  children: ReactNode;
  /** When true, only active colors are loaded. */
  onlyActive?: boolean;
}

export function ColoresProvider({ children, onlyActive = false }: ColoresProviderProps) {
  const { token } = useAuth();
  const [colores, setColores] = useState<Color[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // We need stable filter semantics across renders so the loader doesn't
  // thrash. The provider is meant to be mounted near the app root.
  const onlyActiveRef = useRef(onlyActive);
  onlyActiveRef.current = onlyActive;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await colorApi.list(onlyActiveRef.current ? true : undefined);
      setColores(list);
      return list;
    } catch (err) {
      console.error('Error loading colors:', err);
      setError('No se pudieron cargar los colores');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAndFind = useCallback(async (id: number) => {
    const list = await refresh();
    return list.find((c) => c.id === id);
  }, [refresh]);

  useEffect(() => {
    if (!token) {
      setColores([]);
      return;
    }
    void refresh();
  }, [token, refresh]);

  const value = useMemo<ColoresContextValue>(() => ({
    colores,
    loading,
    error,
    refresh,
    refreshAndFind,
  }), [colores, loading, error, refresh, refreshAndFind]);

  return <ColoresContext.Provider value={value}>{children}</ColoresContext.Provider>;
}

export function useColores(): ColoresContextValue {
  const ctx = useContext(ColoresContext);
  if (!ctx) {
    throw new Error('useColores must be used inside a <ColoresProvider>');
  }
  return ctx;
}
