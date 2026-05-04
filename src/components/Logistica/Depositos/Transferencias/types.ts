// FRONT-003: extracted from TransferenciasPage.tsx — types kept colocated to
// the page that owns them.
import type { Dayjs } from 'dayjs';

export interface NewTransferenciaItem {
  tipo: 'PRODUCTO' | 'EQUIPO';
  productoId?: number;
  equipoFabricadoId?: number;
  cantidad?: number;
  productoNombre?: string;
  equipoNumero?: string;
}

/** Form state for the "Crear Transferencia" dialog. */
export interface NewTransferenciaForm {
  depositoOrigenId: number | '';
  depositoDestinoId: number | '';
  fechaTransferencia: Dayjs;
  observaciones: string;
  items: NewTransferenciaItem[];
}

export interface RecepcionDistribucion {
  depositoId: number;
  depositoNombre: string;
  cantidad: number;
}

/** One row in the "Confirmar Recepción" dialog — el operador puede recibir
 *  cantidad parcial y distribuirla entre varios depósitos. */
export interface ItemRecepcion {
  detalleId: number;
  productoId?: number;
  equipoFabricadoId?: number;
  nombreItem: string;
  cantidadSolicitada: number;
  cantidadRecibida: number;
  distribuciones: RecepcionDistribucion[];
  observaciones: string;
}

export interface RecepcionForm {
  fechaRecepcion: Dayjs;
  items: ItemRecepcion[];
  usarDistribucionMultiple: boolean;
}
