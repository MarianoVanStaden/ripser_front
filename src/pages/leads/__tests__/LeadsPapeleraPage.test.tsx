import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, within, waitFor, userEvent } from '../../../test/renderWithProviders';
import LeadsPapeleraPage from '../LeadsPapeleraPage';

vi.mock('../../../api/services/leadApi', () => ({
  leadApi: { getDeleted: vi.fn(), restore: vi.fn() },
}));
vi.mock('../../../context/TenantContext', () => ({ useTenant: vi.fn() }));
vi.mock('../../../hooks/usePermisos', () => ({ usePermisos: vi.fn() }));

import { leadApi } from '../../../api/services/leadApi';
import { useTenant } from '../../../context/TenantContext';
import { usePermisos } from '../../../hooks/usePermisos';

const mockedLeadApi = vi.mocked(leadApi);
const mockedUseTenant = vi.mocked(useTenant);
const mockedUsePermisos = vi.mocked(usePermisos);

const makeLead = (o: Record<string, unknown> = {}) => ({
  id: 7,
  nombre: 'Juan',
  telefono: '111',
  estadoLead: 'NUEVO',
  deletedAt: '2026-07-01T10:00:00',
  deletedByUsername: 'admin',
  ...o,
});

const grantPermission = () => {
  mockedUseTenant.mockReturnValue({ esSuperAdmin: false } as never);
  mockedUsePermisos.mockReturnValue({ tieneRol: () => true } as never);
};

describe('LeadsPapeleraPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('permisos', () => {
    it('sin permiso: muestra aviso y NO pega al backend (query deshabilitada)', () => {
      mockedUseTenant.mockReturnValue({ esSuperAdmin: false } as never);
      mockedUsePermisos.mockReturnValue({ tieneRol: () => false } as never);

      renderWithProviders(<LeadsPapeleraPage />);

      expect(screen.getByText(/No tenés permisos para ver la papelera/i)).toBeInTheDocument();
      expect(mockedLeadApi.getDeleted).not.toHaveBeenCalled();
    });
  });

  describe('estados de carga', () => {
    it('lista vacía → mensaje "La papelera está vacía"', async () => {
      grantPermission();
      mockedLeadApi.getDeleted.mockResolvedValue({ content: [], totalElements: 0 } as never);

      renderWithProviders(<LeadsPapeleraPage />);

      expect(await screen.findByText(/La papelera está vacía/i)).toBeInTheDocument();
    });

    it('error del backend → alerta con botón Reintentar', async () => {
      grantPermission();
      mockedLeadApi.getDeleted.mockRejectedValue(new Error('boom'));

      renderWithProviders(<LeadsPapeleraPage />);

      expect(await screen.findByText(/Error al cargar la papelera/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reintentar/i })).toBeInTheDocument();
    });
  });

  describe('restaurar lead', () => {
    it('invalida la query ["leads"] tras restaurar (la lista principal refleja el cambio)', async () => {
      grantPermission();
      mockedLeadApi.getDeleted.mockResolvedValue({ content: [makeLead()], totalElements: 1 } as never);
      mockedLeadApi.restore.mockResolvedValue({ nombre: 'Juan' } as never);

      const { queryClient } = renderWithProviders(<LeadsPapeleraPage />);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const row = (await screen.findByText('Juan')).closest('tr')!;
      await userEvent.setup().click(within(row).getByRole('button'));

      await waitFor(() => {
        expect(mockedLeadApi.restore).toHaveBeenCalledWith(7);
        // Clave namespaced correcta: invalida TODO lo de leads (papelera + listado).
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['leads'] });
      });
      expect(await screen.findByText(/restaurado/i)).toBeInTheDocument();
    });

    it('doble-submit: el botón queda deshabilitado mientras la restauración está en vuelo', async () => {
      grantPermission();
      mockedLeadApi.getDeleted.mockResolvedValue({ content: [makeLead()], totalElements: 1 } as never);
      // Restore que no resuelve → mutación queda pending.
      let resolveRestore: (v: unknown) => void = () => {};
      mockedLeadApi.restore.mockReturnValue(new Promise((r) => { resolveRestore = r; }) as never);

      renderWithProviders(<LeadsPapeleraPage />);
      const row = (await screen.findByText('Juan')).closest('tr')!;
      const btn = within(row).getByRole('button');

      await userEvent.setup().click(btn);
      await waitFor(() => expect(btn).toBeDisabled());

      resolveRestore({ nombre: 'Juan' });
      await waitFor(() => expect(btn).not.toBeDisabled());
    });
  });
});
