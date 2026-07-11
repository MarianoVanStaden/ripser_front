import api from '../config';
import type { DetalleCobroDTO, EntregaViaje, EstadoEntrega, ResumenFinancieroViaje } from '../../types';

export interface RegistrarCobroPayload {
  entregaId: number;
  detallesCobro: DetalleCobroDTO[];
}

export interface RedirigirEntregaPayload {
  clienteDestinoId?: number;
  direccionEntrega?: string;
  receptorNombre?: string;
  receptorDni?: string;
  observaciones?: string;
}

export const entregaViajeApi = {
  // Get all entregas
  getAll: async (): Promise<EntregaViaje[]> => {
    const response = await api.get('/api/entregas-viaje');
    return response.data;
  },

  // Get entrega by ID
  getById: async (id: number): Promise<EntregaViaje> => {
    const response = await api.get(`/api/entregas-viaje/${id}`);
    return response.data;
  },

  // Create new entrega
  create: async (entrega: Partial<EntregaViaje>): Promise<EntregaViaje> => {
    const response = await api.post('/api/entregas-viaje', entrega);
    return response.data;
  },

  // Update entrega
  update: async (id: number, entrega: Partial<EntregaViaje>): Promise<EntregaViaje> => {
    const response = await api.put(`/api/entregas-viaje/${id}`, entrega);
    return response.data;
  },

  // Delete entrega
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/entregas-viaje/${id}`);
  },

  // Get entregas by viaje
  getByViaje: async (viajeId: number): Promise<EntregaViaje[]> => {
    const response = await api.get(`/api/entregas-viaje/viaje/${viajeId}`);
    return response.data;
  },

  // Get entregas by venta
  getByVenta: async (ventaId: number): Promise<EntregaViaje[]> => {
    const response = await api.get(`/api/entregas-viaje/venta/${ventaId}`);
    return response.data;
  },

  // Get entregas by orden de servicio
  getByOrden: async (ordenId: number): Promise<EntregaViaje[]> => {
    const response = await api.get(`/api/entregas-viaje/orden/${ordenId}`);
    return response.data;
  },

  // Get entregas by estado
  getByEstado: async (estado: EstadoEntrega): Promise<EntregaViaje[]> => {
    const response = await api.get(`/api/entregas-viaje/estado/${estado}`);
    return response.data;
  },

  // Get entregas by fecha range
  getByFecha: async (fechaInicio: string, fechaFin: string): Promise<EntregaViaje[]> => {
    const response = await api.get('/api/entregas-viaje/por-fecha', {
      params: { fechaInicio, fechaFin }
    });
    return response.data;
  },

  // Marcar como entregada
  marcarComoEntregada: async (
    id: number,
    receptorNombre: string,
    receptorDni: string,
    observaciones?: string
  ): Promise<EntregaViaje> => {
    const response = await api.patch(`/api/entregas-viaje/${id}/entregar`, null, {
      params: { receptorNombre, receptorDni, observaciones }
    });
    return response.data;
  },

  // Marcar como no entregada
  marcarComoNoEntregada: async (id: number, motivo: string): Promise<EntregaViaje> => {
    const response = await api.patch(`/api/entregas-viaje/${id}/no-entregar`, null, {
      params: { motivo }
    });
    return response.data;
  },

  // Reprogramar entrega
  reprogramar: async (id: number, nuevaFecha: string): Promise<EntregaViaje> => {
    const response = await api.patch(`/api/entregas-viaje/${id}/reprogramar`, null, {
      params: { nuevaFecha }
    });
    return response.data;
  },

  // Quitar la entrega del viaje (revierte equipos, factura vuelve al pool del Tablero de Armado)
  quitarDelViaje: async (id: number): Promise<EntregaViaje | void> => {
    const response = await api.patch(`/api/entregas-viaje/${id}/quitar-del-viaje`);
    return response.data;
  },

  // Reasignar/redirigir logísticamente la entrega a otro cliente y/o dirección
  redirigir: async (id: number, payload: RedirigirEntregaPayload): Promise<EntregaViaje> => {
    const response = await api.patch(`/api/entregas-viaje/${id}/redirigir`, payload);
    return response.data;
  },

  // === NUEVOS ENDPOINTS DE INTEGRACIÓN ===

  // Agregar factura a entrega
  agregarFactura: async (entregaId: number, documentoComercialId: number): Promise<EntregaViaje> => {
    const response = await api.post('/api/entregas-viaje/agregar-factura', {
      entregaId,
      documentoComercialId
    });
    return response.data;
  },

  // Obtener entregas disponibles (sin factura asignada)
  getDisponibles: async (): Promise<EntregaViaje[]> => {
    const response = await api.get('/api/entregas-viaje/disponibles');
    return response.data;
  },

  // Obtener detalles completos de una entrega
  getDetalles: async (id: number): Promise<any> => {
    const response = await api.get(`/api/entregas-viaje/${id}/detalles`);
    return response.data;
  },

  // Confirmar entrega (marca como ENTREGADA o NO_ENTREGADA)
  confirmarEntrega: async (
    entregaId: number,
    estado: 'ENTREGADA' | 'NO_ENTREGADA',
    receptorNombre: string,
    receptorDni: string,
    observaciones?: string,
    detallesCobro?: DetalleCobroDTO[]
  ): Promise<EntregaViaje> => {
    const response = await api.post('/api/entregas-viaje/confirmar-entrega', {
      entregaId,
      estado,
      receptorNombre,
      receptorDni,
      observaciones,
      ...(detallesCobro && detallesCobro.length > 0 && { detallesCobro }),
    });
    return response.data;
  },

  // Registrar cobro del conductor (standalone — para entregas ya confirmadas)
  registrarCobro: async (
    id: number,
    payload: RegistrarCobroPayload
  ): Promise<EntregaViaje> => {
    const response = await api.patch(`/api/entregas-viaje/${id}/registrar-cobro`, payload);
    return response.data;
  },

  /**
   * Resumen financiero del viaje: monto a cobrar en cada entrega y total acumulado.
   * Endpoint: GET /api/entregas-viaje/viaje/{viajeId}/resumen-financiero
   */
  getResumenFinanciero: async (viajeId: number): Promise<ResumenFinancieroViaje> => {
    const response = await api.get(`/api/entregas-viaje/viaje/${viajeId}/resumen-financiero`);
    return response.data;
  },
};
