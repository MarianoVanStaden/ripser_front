// FRONT-003: extracted from ComprasPedidosPage.tsx — types kept colocated.
import type { Dayjs } from 'dayjs';
import type { TipoIvaCompra } from '../../../types/compra.types';

export type MetodoPagoCompra =
  | ''
  | 'EFECTIVO'
  | 'TARJETA_CREDITO'
  | 'TARJETA_DEBITO'
  | 'TRANSFERENCIA'
  | 'CHEQUE'
  | 'FINANCIACION_PROPIA';

export interface NewOrdenItem {
  productoId: string;
  nombreProductoTemporal: string;
  descripcionProductoTemporal: string;
  codigoProductoTemporal: string;
  categoriaId: string;
  esProductoNuevo: boolean;
  cantidad: number;
  precioUnitario: number;
  /** Aclaración para el proveedor a nivel de línea (color/terminación). */
  observaciones: string;
}

/** Form state for the "Crear/Editar Orden de Compra" dialog. */
export interface NewOrdenForm {
  supplierId: string;
  fechaEntregaEstimada: Dayjs;
  observaciones: string;
  estado: string;
  metodoPago: MetodoPagoCompra;
  tipoIva: TipoIvaCompra;
  items: NewOrdenItem[];
}

export interface PriceChange {
  productoId: number;
  nombreProducto: string;
  /** Costo anterior persistido (Producto.costo, ya con IVA si vino de una OC con IVA). */
  precioAnterior: number;
  /** Costo bruto (neto + IVA) que se persistirá si shouldUpdate. */
  precioNuevo: number;
  /** Precio neto ingresado en la OC (sin IVA), sólo informativo. */
  netoNuevo: number;
  shouldUpdate: boolean;
}

export interface RecepcionItem {
  detalleCompraId: number;
  productoId: number;
  productoNombre: string;
  cantidadCompra: number;
  cantidadRecibida: number;
  cantidadPendiente: number;
  observaciones: string;
  /** Unidad física del stock del producto (MT2 | METROS | KILOS | UNIDAD). */
  unidadMedida?: string;
  /** Unidades base por unidad de compra recibida. null/undefined = 1. */
  factorConversion?: number | null;
}
