import { useEffect, useState } from 'react';
import { parametroSistemaApi } from '../api/services/parametroSistemaApi';

interface State<T> {
  value: T;
  loading: boolean;
  error: string | null;
}

export function useParametroSistema<T>(
  clave: string,
  defaultValue: T,
  parser: (raw: string) => T,
): State<T> {
  const [state, setState] = useState<State<T>>({
    value: defaultValue,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const param = await parametroSistemaApi.getByClave(clave);
        if (cancelled) return;
        const parsed = param?.valor ? parser(param.valor) : defaultValue;
        setState({ value: parsed, loading: false, error: null });
      } catch (error: any) {
        if (cancelled) return;
        const status = error?.response?.status;
        if (status === 404) {
          setState({ value: defaultValue, loading: false, error: null });
          return;
        }
        setState({
          value: defaultValue,
          loading: false,
          error: error?.response?.data?.message ?? error?.message ?? 'Error',
        });
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [clave]);

  return state;
}

export const parseIntOr = (fallback: number) => (raw: string): number => {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};
