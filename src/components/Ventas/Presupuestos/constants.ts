// FRONT-003: extracted from PresupuestosPage.tsx — pure constants used by
// the page and its sub-components.
import { EstadoDocumento as EstadoDocumentoEnum } from '../../../types';
import type { DetalleForm, FormData } from './types';

/** Default state for the "Crear Presupuesto" dialog form. */
export const initialFormData: FormData = {
  clienteId: '',
  leadId: '',
  usuarioId: '',
  fechaEmision: new Date().toISOString().split('T')[0],
  observaciones: '',
  estado: EstadoDocumentoEnum.PENDIENTE,
  tipoIva: 'EXENTO',
  descuentoTipo: 'NONE',
  descuentoValor: 0,
};

/** Default for a fresh línea de detalle (defaults to EQUIPO since fabricación es el flujo dominante). */
export const initialDetalle: DetalleForm = {
  tipoItem: 'EQUIPO',
  productoId: '',
  recetaId: '',
  colorId: undefined,
  colorNombre: undefined,
  medidaId: undefined,
  medidaNombre: undefined,
  descripcion: '',
  cantidad: 1,
  precioUnitario: 0,
  subtotal: 0,
};
