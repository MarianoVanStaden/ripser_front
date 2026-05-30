// FRONT-003: extracted from DeliveriesPage.tsx — types kept colocated to
// the page that owns them.
import type { EstadoEntrega } from '../../../types';

/** Form state for the "Confirmar Entrega" bottom-sheet/drawer. */
export interface ReceptorData {
  nombre: string;
  dni: string;
  observaciones: string;
}

/** Form state for the cobro section inside "Confirmar Entrega". */
export interface CobroData {
  /** Monto efectivamente cobrado. Empty string = campo vacío (sin informar). */
  montoCobrado: string;
  metodoPago: string;
  comprobante: string;
}

/** Form state for the "Crear/Editar Entrega" bottom-sheet/drawer. */
export interface DeliveryFormData {
  viajeId: string;
  ventaId: string;
  tipoEntrega?: 'FACTURA' | 'ORDEN_SERVICIO';
  ordenServicioId?: string;
  direccionEntrega: string;
  fechaEntrega: string;
  estado: EstadoEntrega;
  observaciones: string;
  receptorNombre: string;
  receptorDni: string;
}
