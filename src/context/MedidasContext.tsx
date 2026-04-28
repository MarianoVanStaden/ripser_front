import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { medidaApi } from '../api/services/medidaApi';
import type { Medida } from '../api/services/medidaApi';
import { useAuth } from './AuthContext';
import { MedidasContext, type MedidasContextValue } from './useMedidas';

interface MedidasProviderProps {
  children: ReactNode;
  onlyActive?: boolean;
}

export function MedidasProvider({ children, onlyActive = false }: MedidasProviderProps) {
  const { token } = useAuth();
  const [medidas, setMedidas] = useState<Medida[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onlyActiveRef = useRef(onlyActive);
  onlyActiveRef.current = onlyActive;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await medidaApi.list(onlyActiveRef.current ? true : undefined);
      setMedidas(list);
      return list;
    } catch (err) {
      console.error('Error loading medidas:', err);
      setError('No se pudieron cargar las medidas');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAndFind = useCallback(async (id: number) => {
    const list = await refresh();
    return list.find((m) => m.id === id);
  }, [refresh]);

  useEffect(() => {
    if (!token) {
      setMedidas([]);
      return;
    }
    void refresh();
  }, [token, refresh]);

  const value = useMemo<MedidasContextValue>(() => ({
    medidas,
    loading,
    error,
    refresh,
    refreshAndFind,
  }), [medidas, loading, error, refresh, refreshAndFind]);

  return <MedidasContext.Provider value={value}>{children}</MedidasContext.Provider>;
}
