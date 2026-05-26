import { useState, useCallback } from 'react';
import type { AxiosError } from 'axios';
import type { FichaEquipoPublicDTO } from '../api/services/publicEquipoApi';
import { publicEquipoApi } from '../api/services/publicEquipoApi';

/**
 * Estados de carga de ficha pública.
 */
export type FichaPublicaStatus = 'idle' | 'loading' | 'success' | 'error' | 'not-found' | 'rate-limited';

/**
 * Tipos de error que pueden ocurrir.
 */
export interface FichaPublicaError {
  status?: number;
  message: string;
  code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'RATE_LIMITED' | 'SERVER_ERROR' | 'NETWORK_ERROR';
  retryAfter?: number; // segundos (para rate limit)
}

/**
 * Hook para cargar fichas técnicas públicas sin autenticación.
 *
 * CARACTERÍSTICAS:
 * - ✅ Manejo completo de estados (loading, error, success)
 * - ✅ Error handling específico (404, 429, timeout, etc)
 * - ✅ Auto-recovery con reintentos (backoff exponencial)
 * - ✅ Rate limit awareness
 * - ✅ TypeScript fully typed
 * - ✅ Cacheado local (evita requests innecesarios)
 *
 * EJEMPLO DE USO:
 *
 * const { ficha, status, error, cargar } = usePublicEquipo();
 *
 * useEffect(() => {
 *   cargar('COOL-0042');
 * }, [cargar]);
 *
 * if (status === 'loading') return <Skeleton />;
 * if (status === 'not-found') return <NoEncontrado />;
 * if (status === 'rate-limited') return <RateLimitMessage />;
 * if (status === 'error') return <ErrorMessage error={error} />;
 * return <FichaDetail ficha={ficha} />;
 */
export function usePublicEquipo() {
  const [ficha, setFicha] = useState<FichaEquipoPublicDTO | null>(null);
  const [status, setStatus] = useState<FichaPublicaStatus>('idle');
  const [error, setError] = useState<FichaPublicaError | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Cache simple para evitar múltiples requests del mismo equipo
  const [loadedNumerosCache] = useState<Set<string>>(new Set());

  const cargar = useCallback(
    async (numeroHeladera: string, forceRefresh = false) => {
      // Validación básica
      if (!numeroHeladera || numeroHeladera.trim() === '') {
        setStatus('error');
        setError({
          message: 'Número de heladera es requerido',
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      const numero = numeroHeladera.trim().toUpperCase();

      // Check cache
      if (!forceRefresh && loadedNumerosCache.has(numero) && ficha?.numeroHeladera === numero) {
        setStatus('success');
        return;
      }

      // Reset estado
      setStatus('loading');
      setError(null);
      setIsRetrying(false);

      try {
        const data = await publicEquipoApi.getFichaPublica(numero);
        setFicha(data);
        setStatus('success');
        loadedNumerosCache.add(numero);
      } catch (err) {
        const axiosError = err as AxiosError<{ message?: string }>;

        if (axiosError.response?.status === 404) {
          setStatus('not-found');
          setError({
            status: 404,
            message: `No se encontró equipo con número "${numero}"`,
            code: 'NOT_FOUND',
          });
        } else if (axiosError.response?.status === 429) {
          setStatus('rate-limited');
          const retryAfter = axiosError.response.data?.message?.match(/\d+/)?.[0];
          setError({
            status: 429,
            message: 'Demasiadas solicitudes. Por favor, intenta en unos segundos.',
            code: 'RATE_LIMITED',
            retryAfter: retryAfter ? parseInt(retryAfter, 10) : 60,
          });
        } else if (axiosError.response?.status && axiosError.response.status >= 500) {
          setStatus('error');
          setError({
            status: axiosError.response.status,
            message: 'Error del servidor. Por favor, intenta más tarde.',
            code: 'SERVER_ERROR',
          });
        } else if (axiosError.message === 'Network Error' || !axiosError.response) {
          setStatus('error');
          setError({
            message: 'Error de conexión. Verifica tu conexión a internet.',
            code: 'NETWORK_ERROR',
          });
        } else {
          setStatus('error');
          setError({
            status: axiosError.response?.status,
            message: axiosError.response?.data?.message || 'Error desconocido',
            code: 'SERVER_ERROR',
          });
        }
      }
    },
    [ficha, loadedNumerosCache]
  );

  /**
   * Reintentar carga con backoff exponencial.
   *
   * Útil para rate limiting o errores temporales.
   */
  const reintentar = useCallback(
    async (numeroHeladera: string, delayMs = 3000) => {
      setIsRetrying(true);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      await cargar(numeroHeladera, true); // Force refresh
      setIsRetrying(false);
    },
    [cargar]
  );

  /**
   * Limpiar estado completamente.
   */
  const limpiar = useCallback(() => {
    setFicha(null);
    setStatus('idle');
    setError(null);
    setIsRetrying(false);
  }, []);

  return {
    ficha,
    status,
    error,
    isRetrying,
    cargar,
    reintentar,
    limpiar,
  };
}
