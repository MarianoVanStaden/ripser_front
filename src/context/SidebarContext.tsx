import { useCallback, useMemo, useRef, type ReactNode } from 'react';
import { usePersistedState } from '../hooks/usePersistedState';
import { SidebarContext, type SidebarContextValue } from './useSidebar';

/**
 * Estado de UI del sidebar (módulos expandidos + modo accordion/multi),
 * persistido en localStorage. Deliberadamente NO contiene nada que cambie en
 * cada navegación (la ruta activa se resuelve aparte en el Sidebar) para no
 * re-renderizar el árbol al navegar.
 */
export function SidebarProvider({ children }: { children: ReactNode }) {
  const [multiOpen, setMultiOpenState] = usePersistedState<boolean>('sidebar.multiOpen', false);
  const [openModules, setOpenModules] = usePersistedState<string[]>('sidebar.openModules', []);
  const [mini, setMini] = usePersistedState<boolean>('sidebar.mini', false);

  // Ref para leer el valor actual de multiOpen dentro de callbacks estables
  // sin recrearlos (los callbacks alimentan componentes memoizados).
  const multiOpenRef = useRef(multiOpen);
  multiOpenRef.current = multiOpen;

  const openModule = useCallback(
    (id: string) => {
      setOpenModules((prev) => {
        if (prev.includes(id)) return prev;
        return multiOpenRef.current ? [...prev, id] : [id];
      });
    },
    [setOpenModules],
  );

  const toggleModule = useCallback(
    (id: string) => {
      setOpenModules((prev) => {
        if (prev.includes(id)) return prev.filter((m) => m !== id);
        return multiOpenRef.current ? [...prev, id] : [id];
      });
    },
    [setOpenModules],
  );

  const setMultiOpen = useCallback(
    (value: boolean) => {
      setMultiOpenState(value);
      // Al volver a modo accordion, dejamos como mucho un módulo abierto.
      if (!value) {
        setOpenModules((prev) => (prev.length > 1 ? prev.slice(0, 1) : prev));
      }
    },
    [setMultiOpenState, setOpenModules],
  );

  const isModuleOpen = useCallback((id: string) => openModules.includes(id), [openModules]);

  const toggleMini = useCallback(() => setMini((prev) => !prev), [setMini]);

  const value = useMemo<SidebarContextValue>(
    () => ({ openModules, multiOpen, isModuleOpen, toggleModule, openModule, setMultiOpen, mini, toggleMini }),
    [openModules, multiOpen, isModuleOpen, toggleModule, openModule, setMultiOpen, mini, toggleMini],
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}
