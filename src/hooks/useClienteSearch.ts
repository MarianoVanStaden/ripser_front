import { useState, useEffect, useRef } from 'react';
import { clienteApi } from '../api/services';
import { useDebounce } from './useDebounce';
import type { Cliente } from '../types';

export interface UseClienteSearchResult {
  options: Cliente[];
  loading: boolean;
  inputValue: string;
  setInputValue: (value: string) => void;
}

export function useClienteSearch(): UseClienteSearchResult {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);

  const debouncedInput = useDebounce(inputValue, 300);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (debouncedInput.length < 3) {
      setOptions([]);
      return;
    }

    // Cancelar request anterior si el usuario sigue escribiendo
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);

    clienteApi
      .searchByQuery(debouncedInput, 10, abortRef.current.signal)
      .then((response) => {
        setOptions(response.content);
      })
      .catch((err) => {
        // Ignorar errores de cancelación
        const isCanceled =
          err?.name === 'CanceledError' ||
          err?.code === 'ERR_CANCELED' ||
          err?.name === 'AbortError';
        if (!isCanceled) {
          console.error('Error buscando clientes:', err);
        }
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      abortRef.current?.abort();
    };
  }, [debouncedInput]);

  // Limpiar resultados cuando el input queda vacío
  useEffect(() => {
    if (!inputValue) setOptions([]);
  }, [inputValue]);

  return { options, loading, inputValue, setInputValue };
}
