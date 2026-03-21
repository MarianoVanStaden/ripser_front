import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cuentaCorrienteApi } from '../api/services/cuentaCorrienteApi';
import type { CuentaCorriente } from '../types';
import { QUERY_KEYS } from '../utils/queryKeys';

export function useCuentaCorrienteCliente(clienteId: number | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery<CuentaCorriente[], Error>({
    queryKey: QUERY_KEYS.CUENTA_CLIENTE(clienteId ?? 0),
    queryFn: async () => {
      const data = await cuentaCorrienteApi.getByClienteId(clienteId!);
      return data.content;
    },
    enabled: !!clienteId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.CUENTA_CLIENTE(clienteId ?? 0),
    });

  return { ...query, invalidate };
}
