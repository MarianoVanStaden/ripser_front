import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// La página unifica dos resúmenes (créditos + cobranzas) y los carga con
// Promise.allSettled: si uno falla, el otro se muestra igual. Estos tests fijan
// esa tolerancia a fallos parciales (ver project_resumen_creditos_cobranzas_unificado).

vi.mock('../../../api/services/prestamoPersonalApi', () => ({
  prestamoPersonalApi: { getResumen: vi.fn() },
}));
vi.mock('../../../api/services/gestionCobranzaApi', () => ({
  gestionCobranzaApi: { getResumen: vi.fn(), ejecutarMotor: vi.fn() },
}));
vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ user: { nombre: 'Test' } }),
}));
vi.mock('../../../hooks/usePermisos', () => ({
  usePermisos: () => ({ esAdmin: false }),
}));
vi.mock('../../../hooks/useSseEvent', () => ({
  useSseEvent: () => {},
}));

import { prestamoPersonalApi } from '../../../api/services/prestamoPersonalApi';
import { gestionCobranzaApi } from '../../../api/services/gestionCobranzaApi';
import { PrestamosResumenPage } from '../PrestamosResumenPage';
import type { ResumenCobranzaDTO } from '../../../types/cobranza.types';

const prestamos = vi.mocked(prestamoPersonalApi, true);
const cobranza = vi.mocked(gestionCobranzaApi, true);

const resumenPrestamos = {
  totalPrestamos: 3,
  prestamosActivos: 2,
  prestamosFinalizados: 0,
  prestamosEnMora: 1,
  prestamosEnLegal: 0,
  montoTotalPrestado: 6000,
  montoTotalCobrado: 1500,
  montoTotalPendiente: 4500,
  cuotasVencidas: 0,
  cuotasProximasAVencer: 4,
  prestamosNormales: 0,
  prestamosLegales: 0,
  prestamosPagoConMora: 0,
  prestamosAltoRiesgo: 0,
  prestamosConSeguimiento: 0,
  prestamosDudosos: 0,
  prestamosMorosos: 0,
  prestamosIrrecuperables: 0,
};

const resumenCobranza: ResumenCobranzaDTO = {
  totalGestionesActivas: 5,
  totalMontoPendiente: 12345,
  gestionesPorEstado: {} as any,
  promesasIncumplidas: 0,
  promesasVigentesHoy: 0,
  gestionesVencidasHoy: 0,
  recordatoriosPendientesAgente: 0,
  sinGestionConMora: 2,
  cuotasVencidasTotal: 7,
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <PrestamosResumenPage />
    </MemoryRouter>,
  );

// Markers exclusivos de cada resumen para distinguir qué sección se pintó.
const MARKER_PRESTAMOS = 'Panorama General';
const MARKER_COBRANZA = 'Gestiones por Estado';

describe('PrestamosResumenPage (unificada, carga tolerante a fallos parciales)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('con ambos resúmenes OK muestra las dos secciones y sin error', async () => {
    prestamos.getResumen.mockResolvedValue(resumenPrestamos);
    cobranza.getResumen.mockResolvedValue(resumenCobranza);

    renderPage();

    expect(await screen.findByText(MARKER_PRESTAMOS)).toBeInTheDocument();
    expect(await screen.findByText(MARKER_COBRANZA)).toBeInTheDocument();
    expect(screen.queryByText(/no se pudo cargar el resumen/i)).not.toBeInTheDocument();
  });

  it('si falla cobranzas, igual muestra créditos y avisa que falló cobranzas', async () => {
    prestamos.getResumen.mockResolvedValue(resumenPrestamos);
    cobranza.getResumen.mockRejectedValue(new Error('500'));

    renderPage();

    // La sección de créditos se pinta igual.
    expect(await screen.findByText(MARKER_PRESTAMOS)).toBeInTheDocument();
    // El error nombra solo a cobranzas.
    const alerta = await screen.findByText(/no se pudo cargar el resumen de cobranzas/i);
    expect(alerta).toBeInTheDocument();
    // La sección de cobranza NO aparece.
    expect(screen.queryByText(MARKER_COBRANZA)).not.toBeInTheDocument();
  });

  it('si fallan los créditos, igual muestra cobranzas y avisa que fallaron créditos', async () => {
    prestamos.getResumen.mockRejectedValue(new Error('500'));
    cobranza.getResumen.mockResolvedValue(resumenCobranza);

    renderPage();

    expect(await screen.findByText(MARKER_COBRANZA)).toBeInTheDocument();
    expect(await screen.findByText(/no se pudo cargar el resumen de créditos/i)).toBeInTheDocument();
    expect(screen.queryByText(MARKER_PRESTAMOS)).not.toBeInTheDocument();
  });

  it('si fallan los dos, el error nombra créditos y cobranzas y no pinta ninguna sección', async () => {
    prestamos.getResumen.mockRejectedValue(new Error('500'));
    cobranza.getResumen.mockRejectedValue(new Error('500'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/no se pudo cargar el resumen de créditos y cobranzas/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(MARKER_PRESTAMOS)).not.toBeInTheDocument();
    expect(screen.queryByText(MARKER_COBRANZA)).not.toBeInTheDocument();
  });
});
