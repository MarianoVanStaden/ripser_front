import { createContext, useContext } from 'react';
import type { Color } from '../api/services/colorApi';

export interface ColoresContextValue {
  colores: Color[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<Color[]>;
  /** Refresh the catalog and return the freshly-fetched color matching `id`. */
  refreshAndFind: (id: number) => Promise<Color | undefined>;
}

export const ColoresContext = createContext<ColoresContextValue | null>(null);

export function useColores(): ColoresContextValue {
  const ctx = useContext(ColoresContext);
  if (!ctx) {
    throw new Error('useColores must be used inside a <ColoresProvider>');
  }
  return ctx;
}
