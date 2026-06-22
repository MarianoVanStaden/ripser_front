import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { useNavigation } from './useNavigation';

export interface FlatNavItem {
  text: string;
  path: string;
  /** Título del módulo que contiene el ítem (para mostrar contexto). */
  moduleTitle: string;
  icon: ReactNode;
}

/**
 * Aplana las secciones visibles (ya filtradas por permisos en useNavigation)
 * a una lista de ítems. Base del Command Palette y de Favoritos/Recientes:
 * cualquier pantalla fuera del alcance del rol simplemente no aparece acá.
 */
export function useNavItemsFlat(): FlatNavItem[] {
  const secciones = useNavigation();
  return useMemo(() => {
    const flat: FlatNavItem[] = [];
    for (const section of secciones) {
      for (const item of section.items) {
        flat.push({
          text: item.text,
          path: item.path,
          moduleTitle: section.title,
          icon: item.icon,
        });
      }
    }
    return flat;
  }, [secciones]);
}
