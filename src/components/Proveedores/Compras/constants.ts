// FRONT-003: extracted from ComprasPedidosPage.tsx — constants y factory
// para el form de orden de compra.
import dayjs from 'dayjs';
import type { NewOrdenForm, NewOrdenItem } from './types';

export const initialOrdenItem: NewOrdenItem = {
  productoId: '',
  nombreProductoTemporal: '',
  descripcionProductoTemporal: '',
  codigoProductoTemporal: '',
  categoriaId: '',
  esProductoNuevo: false,
  cantidad: 1,
  precioUnitario: 0,
};

/** Factory for a fresh "Nueva Orden de Compra" form (fechaEntrega = today + 15d). */
export const createInitialNewOrden = (): NewOrdenForm => ({
  supplierId: '',
  fechaEntregaEstimada: dayjs().add(15, 'day'),
  observaciones: '',
  estado: 'PENDIENTE',
  metodoPago: '',
  items: [{ ...initialOrdenItem }],
});
