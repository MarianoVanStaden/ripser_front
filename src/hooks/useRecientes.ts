import { useCallback } from 'react';
import { usePersistedState } from './usePersistedState';

const MAX_RECIENTES = 8;

/**
 * Pantallas visitadas recientemente (paths), en sessionStorage: relevancia
 * por sesión de trabajo, sin arrastrarse entre días. Lista deduplicada y
 * acotada, con la más reciente primero.
 */
export function useRecientes() {
  const [recientes, setRecientes] = usePersistedState<string[]>('sidebar.recientes', [], 'session');

  const registrar = useCallback(
    (path: string) => {
      setRecientes((prev) => {
        const next = [path, ...prev.filter((p) => p !== path)].slice(0, MAX_RECIENTES);
        // Evita re-render si la lista no cambió (ya era el más reciente).
        if (next.length === prev.length && next.every((p, i) => p === prev[i])) return prev;
        return next;
      });
    },
    [setRecientes],
  );

  return { recientes, registrar };
}
