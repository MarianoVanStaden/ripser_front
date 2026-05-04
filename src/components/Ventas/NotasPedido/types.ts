// FRONT-003: extracted from NotasPedidoPage.tsx — types kept colocated to
// the page that owns them (not promoted to /src/types/ because they're not
// shared across modules).
import type { EstadoDocumento, MetodoPago } from '../../../types';

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
  nuevoEstado: EstadoDocumento;
}

/**
 * Form state for the "Datos de Financiación Propia" dialog (BillingDialog),
 * shown before facturar when the nota's metodoPago is FINANCIAMIENTO o
 * FINANCIACION_PROPIA.  These values shape the cuotas + entrega inicial
 * payload that the backend uses to materializar la factura.
 */
export interface BillingForm {
  cantidadCuotas: number;
  tipoFinanciacion: string;
  primerVencimiento: string;
  entregarInicial: boolean;
  usePorcentaje: boolean;
  porcentajeEntregaInicial: number;
  montoEntregaInicial: number;
  tasaInteres: number;
}
