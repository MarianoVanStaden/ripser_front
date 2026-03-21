import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Dayjs } from 'dayjs';
import { adminFlujoCajaApi } from '../api/services/adminFlujoCajaApi';
import type { FlujoCajaResponseEnhanced } from '../types';
import { QUERY_KEYS } from '../utils/queryKeys';

export function useFlujoCaja(fechaDesde: Dayjs | null, fechaHasta: Dayjs | null) {
  const queryClient = useQueryClient();
  const fechaDesdeStr = fechaDesde?.format('YYYY-MM-DD');
  const fechaHastaStr = fechaHasta?.format('YYYY-MM-DD');

  const query = useQuery<FlujoCajaResponseEnhanced, Error>({
    queryKey: QUERY_KEYS.FLUJO_CAJA(fechaDesdeStr, fechaHastaStr),
    queryFn: () =>
      adminFlujoCajaApi.getFlujoCajaEnhanced(fechaDesdeStr, fechaHastaStr),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
  });

  /** Invalida TODAS las variantes de flujo de caja (cualquier rango de fechas). */
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['flujoCaja'] });

  return { ...query, invalidate };
}
