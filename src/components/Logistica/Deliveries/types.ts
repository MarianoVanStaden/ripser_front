// FRONT-003: extracted from DeliveriesPage.tsx — types kept colocated to
// the page that owns them.
import type { EstadoEntrega } from '../../../types';

/** Form state for the "Confirmar Entrega" bottom-sheet/drawer. */
export interface ReceptorData {
  nombre: string;
  dni: string;
  observaciones: string;
}

/** Una línea de cobro mixto (efectivo + transferencia + cheques + pagaré, etc.). */
export interface DetalleCobro {
  /** uuid local, solo para key de React — no se envía al backend. */
  id: string;
  metodoPago: string;
  monto: string;
  comprobante: string;
  /** Cantidad de cheques que componen el monto (solo aplica cuando metodoPago = CHEQUE). */
  cantidadCheques?: string;
}

/** Form state for the cobro section inside "Confirmar Entrega": una o más líneas de cobro. */
export interface CobroData {
  detalles: DetalleCobro[];
}

/** Form state for the "Crear/Editar Entrega" bottom-sheet/drawer. */
export interface DeliveryFormData {
  viajeId: string;
  ventaId: string;
  tipoEntrega?: 'FACTURA' | 'ORDEN_SERVICIO' | 'PARADA_LIBRE';
  ordenServicioId?: string;
  // Parada libre (sin factura ni OS): motivo. Solo aplica si tipoEntrega === 'PARADA_LIBRE'.
  tipoParada?: 'GARANTIA' | 'RETIRO_MATERIA_PRIMA' | 'OTRO';
  direccionEntrega: string;
  fechaEntrega: string;
  estado: EstadoEntrega;
  observaciones: string;
  receptorNombre: string;
  receptorDni: string;
}
