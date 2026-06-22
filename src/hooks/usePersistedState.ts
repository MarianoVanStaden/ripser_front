import { useCallback, useState } from 'react';

type StorageKind = 'local' | 'session';

function getStorage(kind: StorageKind): Storage | null {
  if (typeof window === 'undefined') return null;
  return kind === 'local' ? window.localStorage : window.sessionStorage;
}

/**
 * Estado de React persistido en localStorage/sessionStorage con serialización
 * JSON tipada. Misma API que `useState` (acepta valor o updater).
 *
 * Es defensivo: si el storage no está disponible (SSR, modo privado, cuota
 * llena) cae a estado en memoria sin romper. Pensado para preferencias de UI
 * de baja frecuencia de escritura (estado del sidebar, etc.), no para datos
 * de servidor (eso es React Query).
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  kind: StorageKind = 'local',
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    const storage = getStorage(kind);
    if (!storage) return defaultValue;
    try {
      const raw = storage.getItem(key);
      return raw != null ? (JSON.parse(raw) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setPersisted = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) => {
        const next = typeof value === 'function' ? (value as (p: T) => T)(prev) : value;
        const storage = getStorage(kind);
        try {
          storage?.setItem(key, JSON.stringify(next));
        } catch {
          // Cuota llena o storage bloqueado: mantenemos el valor en memoria.
        }
        return next;
      });
    },
    [key, kind],
  );

  return [state, setPersisted];
}
