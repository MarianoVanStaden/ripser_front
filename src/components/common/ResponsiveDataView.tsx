import type { ReactNode } from 'react';
import { Stack, useMediaQuery, useTheme } from '@mui/material';

export interface ResponsiveDataViewProps<T> {
  items: T[];
  getKey: (item: T) => string | number;
  /** Card por item en viewports chicos. Targets ≥44px, acciones con texto. */
  renderCard: (item: T) => ReactNode;
  /** Tabla existente en desktop — se pasa tal cual, sin tocarla. */
  renderTable: () => ReactNode;
  /** Se muestra (en ambas vistas) cuando items está vacío. */
  emptyState: ReactNode;
  /** Debajo de este breakpoint se usan cards. Default 'md' (<900px). */
  breakpoint?: 'sm' | 'md';
  /** Espaciado entre cards. */
  spacing?: number;
}

/**
 * Patrón único tabla desktop / cards mobile. La tabla desktop se pasa sin
 * modificar (cero regresión); la card muestra los 3-4 campos prioritarios
 * con acciones como botones con texto (nunca solo un ícono con Tooltip).
 * Referencia de card: ComunicacionesInicialesPage.
 */
export function ResponsiveDataView<T>({
  items,
  getKey,
  renderCard,
  renderTable,
  emptyState,
  breakpoint = 'md',
  spacing = 1.5,
}: ResponsiveDataViewProps<T>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down(breakpoint));

  if (items.length === 0) return <>{emptyState}</>;
  if (!isMobile) return <>{renderTable()}</>;
  return (
    <Stack spacing={spacing}>
      {items.map((item) => (
        <div key={getKey(item)}>{renderCard(item)}</div>
      ))}
    </Stack>
  );
}

export default ResponsiveDataView;
