import { useState, useEffect, useRef } from 'react';
import { leadApi } from '../api/services';
import { useDebounce } from './useDebounce';
import type { LeadDTO } from '../types/lead.types';

export interface UseLeadSearchOptions {
  /** Si se setea, solo trae leads en esos estados (ej: excluir CONVERTIDO). */
  excludeEstados?: string[];
  /** Tamaño máximo de la lista (default 20). */
  size?: number;
}

export interface UseLeadSearchResult {
  options: LeadDTO[];
  loading: boolean;
  inputValue: string;
  setInputValue: (value: string) => void;
}

/**
 * Typeahead server-side de leads. Espejo de useClienteSearch.
 *
 * Estrategia:
 * - Al montar (input vacío) trae los `size` leads más recientes para que el
 *   dropdown tenga contenido aunque el usuario no haya tipeado.
 * - A partir de 2 caracteres dispara búsqueda server-side (LIKE en nombre/teléfono).
 * - Cancela requests anteriores con AbortController para evitar respuestas
 *   fuera de orden.
 */
export function useLeadSearch(options: UseLeadSearchOptions = {}): UseLeadSearchResult {
  const { excludeEstados, size = 20 } = options;
  const [inputValue, setInputValue] = useState('');
  const [items, setItems] = useState<LeadDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const debouncedInput = useDebounce(inputValue, 300);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);

    leadApi.getAll(
      { page: 0, size, sort: 'fechaPrimerContacto,desc' },
      debouncedInput.trim().length >= 2 ? { busqueda: debouncedInput.trim() } : {}
    )
      .then((res) => {
        let content = res.content;
        if (excludeEstados?.length) {
          content = content.filter((l) => !excludeEstados.includes(l.estadoLead));
        }
        setItems(content);
      })
      .catch((err) => {
        const code = (err as { code?: string }).code;
        if (code === 'ERR_CANCELED') return;
        console.error('useLeadSearch error:', err);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedInput, size]);

  return { options: items, loading, inputValue, setInputValue };
}
