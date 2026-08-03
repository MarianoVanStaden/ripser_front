import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';
import theme from '../theme';

// QueryClient AISLADO por render: retry:false para que los estados isError se
// resuelvan al instante en el test, y gcTime:0 para no filtrar caché entre tests
// (un cliente compartido produce fallos dependientes del orden).
export const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Rutas iniciales del MemoryRouter (default: ['/']). */
  routerProps?: MemoryRouterProps;
  /** Permite inyectar un QueryClient propio para inspeccionar la caché. */
  queryClient?: QueryClient;
}

export interface RenderWithProvidersResult extends RenderResult {
  queryClient: QueryClient;
}

/**
 * Render con todos los providers de la app (React Query aislado + Router + MUI
 * theme + LocalizationProvider dayjs). Usar en tests de componente/integración
 * en vez de armar los providers a mano en cada archivo.
 */
export function renderWithProviders(
  ui: ReactElement,
  { routerProps, queryClient, ...renderOptions }: RenderWithProvidersOptions = {},
): RenderWithProvidersResult {
  const client = queryClient ?? createTestQueryClient();

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <MemoryRouter {...routerProps}>{children}</MemoryRouter>
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );

  return {
    queryClient: client,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// Re-export para que los tests importen todo desde un solo lugar.
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
