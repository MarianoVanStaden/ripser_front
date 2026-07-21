import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';

/**
 * Igual que `useState`, pero persiste el valor en `sessionStorage` bajo `key` y
 * lo rehidrata al montar. Pensado para búsqueda/filtros de listados: al abrir un
 * detalle y volver, la lista se re-monta y recupera el estado que tenía (durante
 * la sesión del tab), sin depender de la URL.
 *
 * La firma es idéntica a `useState`, así que es un drop-in replace: todos los
 * `setX(...)` existentes siguen funcionando. Usá claves namespaced por pantalla
 * (ej. `clientes:search`, `leads:estados`) para evitar colisiones.
 *
 * Best-effort: si `sessionStorage` no está disponible o el JSON es inválido, cae
 * al valor inicial y no rompe el render.
 */
export function useSessionState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = sessionStorage.getItem(key);
      return raw != null ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* storage lleno / bloqueado (modo privado) — no bloquea la UI */
    }
  }, [key, state]);

  return [state, setState];
}
