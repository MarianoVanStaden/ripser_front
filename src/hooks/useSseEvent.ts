import { useEffect, useRef } from 'react';
import { APP_SSE_BROWSER_EVENT } from '../lib/sse-contract';

/**
 * Ejecuta `callback` cuando llega uno de los eventos SSE de negocio indicados en
 * `eventNames`. Reusa la única conexión SSE de la app (useFinancialEvents la
 * rebroadcastea como CustomEvent en `window`), por lo que NO abre una conexión nueva.
 *
 * Pensado para vistas que no usan React Query (ej. paneles con `usePagination`):
 * permite refrescar en tiempo real sin migrar a useQuery.
 *
 * - El callback se guarda en un ref → siempre se invoca la última versión sin
 *   re-suscribir el listener (evita churn cuando el callback se recrea por render).
 * - `debounceMs` coalesce ráfagas de eventos en un solo refresh.
 *
 * @example useSseEvent([SSE_EVENTS.CUOTA_ACTUALIZADA, SSE_EVENTS.PAGO_REGISTRADO], refresh);
 */
export function useSseEvent(
  eventNames: readonly string[],
  callback: () => void,
  debounceMs = 500,
): void {
  const cbRef = useRef(callback);
  cbRef.current = callback;
  const namesRef = useRef(eventNames);
  namesRef.current = eventNames;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ event: string }>).detail;
      if (!detail || !namesRef.current.includes(detail.event)) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        cbRef.current();
      }, debounceMs);
    };
    window.addEventListener(APP_SSE_BROWSER_EVENT, handler);
    return () => {
      window.removeEventListener(APP_SSE_BROWSER_EVENT, handler);
      if (timer) clearTimeout(timer);
    };
  }, [debounceMs]);
}
