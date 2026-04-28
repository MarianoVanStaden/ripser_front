import { createContext, useContext } from 'react';
import type { Medida } from '../api/services/medidaApi';

export interface MedidasContextValue {
  medidas: Medida[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<Medida[]>;
  refreshAndFind: (id: number) => Promise<Medida | undefined>;
}

export const MedidasContext = createContext<MedidasContextValue | null>(null);

export function useMedidas(): MedidasContextValue {
  const ctx = useContext(MedidasContext);
  if (!ctx) {
    throw new Error('useMedidas must be used inside a <MedidasProvider>');
  }
  return ctx;
}
