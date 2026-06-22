import { createContext, useContext } from 'react';

export interface SidebarContextValue {
  /** Títulos de los módulos actualmente expandidos. */
  openModules: string[];
  /** Si true, se permiten varios módulos abiertos a la vez (default: false = accordion). */
  multiOpen: boolean;
  /** ¿Está expandido el módulo `id` (su título)? */
  isModuleOpen: (id: string) => boolean;
  /** Alterna expandido/colapsado respetando el modo accordion/multi. */
  toggleModule: (id: string) => void;
  /** Garantiza que el módulo `id` quede expandido (usado para auto-expandir la ruta activa). */
  openModule: (id: string) => void;
  /** Cambia la preferencia accordion (un módulo) ↔ multi (varios). */
  setMultiOpen: (value: boolean) => void;
  /** Modo mini: el sidebar se colapsa a un rail de iconos con flyout (sólo desktop). */
  mini: boolean;
  /** Alterna full ↔ mini. */
  toggleMini: () => void;
}

export const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error('useSidebar must be used inside a <SidebarProvider>');
  }
  return ctx;
}
