import { useCallback } from 'react';
import { usePersistedState } from './usePersistedState';

/**
 * Pantallas favoritas del usuario, guardadas como lista de paths en
 * localStorage. Se resuelven contra el índice de navegación filtrado por
 * permisos: si un favorito deja de estar permitido, no se renderiza.
 */
export function useFavoritos() {
  const [favoritos, setFavoritos] = usePersistedState<string[]>('sidebar.favoritos', []);

  const isFavorito = useCallback((path: string) => favoritos.includes(path), [favoritos]);

  const toggleFavorito = useCallback(
    (path: string) => {
      setFavoritos((prev) =>
        prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path],
      );
    },
    [setFavoritos],
  );

  return { favoritos, isFavorito, toggleFavorito };
}
