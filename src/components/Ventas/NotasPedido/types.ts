// FRONT-003: extracted from NotasPedidoPage.tsx — types kept colocated to
// the page that owns them (not promoted to /src/types/ because they're not
// shared across modules).
import type { MetodoPago } from '../../../types';

export type TipoIva = 'IVA_21' | 'IVA_10_5' | 'EXENTO';

export type TipoDescuento = 'NONE' | 'PORCENTAJE' | 'MONTO_FIJO';

/**
 * Form state for the "Convertir Presupuesto a Nota de Pedido" dialog.
 * The fields mirror the columns the backend expects when creating a nota
 * de pedido from an existing presupuesto.
 */
export interface ConvertFormData {
  presupuestoId: string;
  metodoPago: MetodoPago;
  tipoIva: TipoIva;
  descuentoTipo: TipoDescuento;
  descuentoValor: number;
}

/**
 * Form state for the "Editar Nota de Pedido" dialog.  Only descuento and
 * observaciones are editable post-creation, and only while the nota is
 * still PENDIENTE — the dialog enforces that on the parent side.
 */
export interface EditNotaForm {
  descuentoTipo: TipoDescuento;
  descuentoValor: number;
  observaciones: string;
}
