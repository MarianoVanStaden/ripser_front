// FRONT-003: extracted from ComprasPedidosPage.tsx — types kept colocated.
import type { Dayjs } from 'dayjs';

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
}

/** Form state for the "Crear/Editar Orden de Compra" dialog. */
export interface NewOrdenForm {
  supplierId: string;
  fechaEntregaEstimada: Dayjs;
  observaciones: string;
  estado: string;
  metodoPago: MetodoPagoCompra;
  items: NewOrdenItem[];
}

export interface PriceChange {
  productoId: number;
  nombreProducto: string;
  precioAnterior: number;
  precioNuevo: number;
  shouldUpdate: boolean;
}

export interface RecepcionItem {
  detalleCompraId: number;
  productoId: number;
  productoNombre: string;
  cantidadCompra: number;
  cantidadRecibida: number;
  observaciones: string;
}
