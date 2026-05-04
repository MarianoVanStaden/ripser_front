// FRONT-003: extracted from DeliveriesPage.tsx — constants y factory para
// el form de entrega.
import type { DeliveryFormData, ReceptorData } from './types';

/** Motivos predefinidos que el operador puede elegir como chips antes de
 *  marcar una entrega como NO_ENTREGADA. */
export const REJECTION_REASONS = [
  'Cliente ausente',
  'Direccion incorrecta',
  'Rechazado por cliente',
  'Horario no disponible',
  'Zona inaccesible',
] as const;

export const initialReceptorData: ReceptorData = {
  nombre: '',
  dni: '',
  observaciones: '',
};

export const initialDeliveryForm: DeliveryFormData = {
  viajeId: '',
  ventaId: '',
  direccionEntrega: '',
  fechaEntrega: '',
  estado: 'PENDIENTE',
  observaciones: '',
  receptorNombre: '',
  receptorDni: '',
};
