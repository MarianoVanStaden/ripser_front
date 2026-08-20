import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResumenCobrosMobile } from '../ResumenCobros';
import type { ResumenFinancieroViaje } from '../../../../types';

// ResumenCobrosMobile es presentacional (sólo props) — se testea el display de
// totales/estados y el gating del botón "Rendir". Fixtures con cast: sólo importan
// los campos que el componente lee.

const entrega = (over: Record<string, unknown> = {}) => ({
  entregaId: 1,
  clienteNombre: 'Cliente A',
  numeroDocumento: 'FAC-1',
  estado: 'ENTREGADA',
  montoEntregaInicial: 250_000,
  ...over,
});

const makeResumen = (over: Partial<ResumenFinancieroViaje> = {}): ResumenFinancieroViaje =>
  ({
    cantidadEntregas: 2,
    totalEntregasIniciales: 500_000,
    totalCobradoConductor: 300_000,
    entregas: [
      entrega({ entregaId: 1, clienteNombre: 'Cliente A', tieneFinanciacion: true, cantidadCuotas: 6, montoCuota: 50_000, montoCobrado: 200_000, estadoCobro: 'COBRADO_PARCIAL' }),
      entrega({ entregaId: 2, clienteNombre: 'Cliente B', numeroDocumento: 'FAC-2' }),
    ],
    ...over,
  }) as unknown as ResumenFinancieroViaje;

describe('ResumenCobrosMobile', () => {
  it('muestra "Cargando" mientras resumen es undefined', () => {
    render(<ResumenCobrosMobile resumen={undefined} />);
    expect(screen.getByText(/cargando cobros/i)).toBeInTheDocument();
  });

  it('muestra el vacío con resumen null o sin entregas', () => {
    const { rerender } = render(<ResumenCobrosMobile resumen={null} />);
    expect(screen.getByText(/sin entregas con información financiera/i)).toBeInTheDocument();

    rerender(<ResumenCobrosMobile resumen={makeResumen({ cantidadEntregas: 0 })} />);
    expect(screen.getByText(/sin entregas con información financiera/i)).toBeInTheDocument();
  });

  it('muestra totales, cantidad de entregas y el detalle con chip de estado y financiación', () => {
    render(<ResumenCobrosMobile resumen={makeResumen()} />);

    expect(screen.getByText('A recaudar')).toBeInTheDocument();
    // Monto formateado es-AR (tolerante a la variante de locale del entorno).
    expect(screen.getByText(/500[.,]000/)).toBeInTheDocument();
    expect(screen.getByText('2 entregas')).toBeInTheDocument();

    // Detalle de entregas
    expect(screen.getByText(/Entrega #1 — Cliente A/)).toBeInTheDocument();
    expect(screen.getByText(/Entrega #2 — Cliente B/)).toBeInTheDocument();
    // Financiación desglosada (6 × cuota)
    expect(screen.getByText(/Financiado \(6 ×/)).toBeInTheDocument();
    // Chip de estado de cobro mapeado (COBRADO_PARCIAL → "Parcial", label único)
    expect(screen.getByText('Parcial')).toBeInTheDocument();
    // La entrega sin estadoCobro cae al estado de entrega
    expect(screen.getByText('Entregada')).toBeInTheDocument();
  });

  it('no muestra "Cobrado" en el resumen cuando el total cobrado es 0', () => {
    render(<ResumenCobrosMobile resumen={makeResumen({ totalCobradoConductor: 0 })} />);
    expect(screen.getByText('A recaudar')).toBeInTheDocument();
    // El label "Cobrado" del bloque de totales no aparece (sí puede haber chips, pero no el h6).
    expect(screen.queryByText(/^Rendir cobros/)).not.toBeInTheDocument();
  });

  describe('gating del botón Rendir', () => {
    it('lo muestra cuando puedeRendir + estado rendible + total cobrado > 0', () => {
      const onRendir = vi.fn();
      render(
        <ResumenCobrosMobile
          resumen={makeResumen()}
          estadoViaje="COMPLETADO"
          puedeRendir
          onRendir={onRendir}
        />,
      );
      const btn = screen.getByRole('button', { name: /rendir cobros/i });
      expect(btn).toBeInTheDocument();
      btn.click();
      expect(onRendir).toHaveBeenCalledOnce();
    });

    it('lo oculta si no puede rendir, si el estado no es rendible o si no hubo cobro', () => {
      // sin permiso
      const { rerender } = render(<ResumenCobrosMobile resumen={makeResumen()} estadoViaje="COMPLETADO" puedeRendir={false} />);
      expect(screen.queryByRole('button', { name: /rendir cobros/i })).not.toBeInTheDocument();

      // estado no rendible
      rerender(<ResumenCobrosMobile resumen={makeResumen()} estadoViaje="EN_CURSO" puedeRendir />);
      expect(screen.queryByRole('button', { name: /rendir cobros/i })).not.toBeInTheDocument();

      // sin cobros
      rerender(<ResumenCobrosMobile resumen={makeResumen({ totalCobradoConductor: 0 })} estadoViaje="COMPLETADO" puedeRendir />);
      expect(screen.queryByRole('button', { name: /rendir cobros/i })).not.toBeInTheDocument();
    });
  });
});
