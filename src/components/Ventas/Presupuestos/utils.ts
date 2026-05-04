// FRONT-003: extracted from PresupuestosPage.tsx — pure helpers used by
// the page and its dialogs.
import type { DocumentoComercial, EstadoDocumento, MetodoPago, OpcionFinanciamientoDTO } from '../../../types';
import { EstadoDocumento as EstadoDocumentoEnum } from '../../../types';

type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

/** Maps EstadoDocumento → MUI Chip color. */
export const getStatusColor = (estado: EstadoDocumento): ChipColor => {
  switch (estado) {
    case EstadoDocumentoEnum.PENDIENTE:
      return 'warning';
    case EstadoDocumentoEnum.APROBADO:
      return 'success';
    case EstadoDocumentoEnum.RECHAZADO:
      return 'error';
    case EstadoDocumentoEnum.FACTURADA:
      return 'info';
    default:
      return 'default';
  }
};

/** Human label for an EstadoDocumento (es-AR). */
export const getStatusLabel = (estado: EstadoDocumento): string => {
  switch (estado) {
    case EstadoDocumentoEnum.PENDIENTE:
      return 'Pendiente';
    case EstadoDocumentoEnum.APROBADO:
      return 'Aprobado';
    case EstadoDocumentoEnum.RECHAZADO:
      return 'Rechazado';
    case EstadoDocumentoEnum.FACTURADA:
      return 'Facturada';
    default:
      return estado;
  }
};

/**
 * Normaliza la respuesta de opciones de financiamiento del backend.
 * El BE puede devolver el shape parcial con campos opcionales; este helper
 * filtra null/undefined y completa defaults para que el front opere con
 * un shape estable.
 */
export const normalizeOpcionesFinanciamiento = (
  opciones?: Array<
    Partial<OpcionFinanciamientoDTO> & { esSeleccionada?: boolean; metodoPago?: MetodoPago | string }
  >
): OpcionFinanciamientoDTO[] => {
  if (!Array.isArray(opciones)) return [];
  return opciones
    .filter(
      (
        opcion
      ): opcion is Partial<OpcionFinanciamientoDTO> & {
        esSeleccionada?: boolean;
        metodoPago?: MetodoPago | string;
      } => Boolean(opcion)
    )
    .map((opcion) => ({
      id: opcion.id,
      nombre: opcion.nombre ?? '',
      metodoPago: (opcion.metodoPago ?? 'OTRO') as MetodoPago,
      cantidadCuotas: opcion.cantidadCuotas ?? 0,
      tasaInteres: opcion.tasaInteres ?? 0,
      montoTotal: opcion.montoTotal ?? 0,
      montoCuota: opcion.montoCuota ?? 0,
      descripcion: opcion.descripcion,
      ordenPresentacion: opcion.ordenPresentacion,
      esSeleccionada: opcion.esSeleccionada,
    }));
};

/** "$ 1.234,56" — formato monetario es-AR consistente en toda la página. */
export const formatCurrency = (value: number | null | undefined): string =>
  `$${Number(value ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

/**
 * Devuelve el monto de IVA del presupuesto.  El BE a veces lo manda como
 * `iva` directo, otras veces solo `subtotal` y `total` — este helper
 * cubre ambos casos sin asumir el shape.
 */
export const computeIva = (presupuesto: DocumentoComercial): number => {
  if (typeof presupuesto.iva === 'number' && !Number.isNaN(presupuesto.iva)) {
    return presupuesto.iva;
  }
  if (typeof presupuesto.subtotal === 'number' && typeof presupuesto.total === 'number') {
    const diff = presupuesto.total - presupuesto.subtotal;
    return Number.isFinite(diff) ? diff : 0;
  }
  return 0;
};
