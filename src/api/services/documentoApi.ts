import api from '../config';
import type {
  DocumentoComercial,
  EstadoDocumento,
  DetalleDocumento,
  MetodoPago,
  DetalleDocumentoDTO,
  OpcionFinanciamiento,
  CreateOpcionFinanciamientoDTO
  
} from '../../types';

// Narrow DTO for creating presupuesto in current backend
type CreatePresupuestoPayload = {
  clienteId: number;
  usuarioId: number;
  tipoIva: 'IVA_21' | 'IVA_10_5' | 'EXENTO';
  observaciones?: string;
  detalles: DetalleDocumentoDTO[];
};

export const documentoApi = {


  // Get all documentos - Note: This endpoint doesn't exist in backend, using getByTipo instead
  getAll: async (): Promise<DocumentoComercial[]> => {
    // Since backend doesn't have a getAll, we'll get all presupuestos as a workaround
    return await documentoApi.getByTipo('PRESUPUESTO');
  },
  // Get documento by ID
  getById: async (id: number): Promise<DocumentoComercial> => {
    const response = await api.get(`/api/documentos/${id}`);
    return response.data;
  },
  // Create new documento - Note: This endpoint doesn't exist in backend
  create: async (_documentoData: Partial<DocumentoComercial> & { detalles: DetalleDocumento[] }): Promise<DocumentoComercial> => {
  void _documentoData;
  throw new Error('Create documento endpoint not implemented in backend');
  },
  // Update documento - Note: This endpoint doesn't exist in backend
  update: async (_id: number, _documentoData: Partial<DocumentoComercial> & { detalles?: DetalleDocumento[] }): Promise<DocumentoComercial> => {
  void _id; void _documentoData;
  throw new Error('Update documento endpoint not implemented in backend');
  },
  // Delete documento - Note: This endpoint doesn't exist in backend
  delete: async (_id: number): Promise<void> => {
  void _id;
  throw new Error('Delete documento endpoint not implemented in backend');
  },
  // Change estado of documento
  changeEstado: async (id: number, nuevoEstado: EstadoDocumento): Promise<DocumentoComercial> => {
    const response = await api.put(`/api/documentos/${id}/estado`, nuevoEstado);
    return response.data;
  },
  // Search documentos by numeroDocumento - Note: This endpoint doesn't exist in backend
  searchByNumero: async (_term: string): Promise<DocumentoComercial[]> => {
  void _term;
  throw new Error('Search by numero endpoint not implemented in backend');
  },
  // Get documentos by estado - Note: This endpoint doesn't exist in backend
  getByEstado: async (_estado: EstadoDocumento): Promise<DocumentoComercial[]> => {
  void _estado;
  throw new Error('Get by estado endpoint not implemented in backend');
  },
  // Get documentos within a date range - Note: This endpoint doesn't exist in backend
  getByFecha: async (_fechaInicio: string, _fechaFin: string): Promise<DocumentoComercial[]> => {
  void _fechaInicio; void _fechaFin;
  throw new Error('Get by fecha endpoint not implemented in backend');
  },
  // Get documentos by tipo
  getByTipo: async (tipo: string): Promise<DocumentoComercial[]> => {
    try {
      const response = await api.get<DocumentoComercial[]>(`/api/documentos/tipo/${encodeURIComponent(tipo)}`);
      return response.data; // Backend returns List<DocumentoComercialDTO>
    } catch (err) {
      // Narrow axios error shape safely without using 'any'
      const status = typeof err === 'object' && err !== null && 'response' in err
        ? (err as { response?: { status?: number } }).response?.status
        : undefined;
      if (status === 403) {
        console.warn('Sin permisos para documentos; devolviendo lista vacía');
        return [];
      }
      throw err;
    }
  },
  // Get documentos by cliente
  getByCliente: async (clienteId: number): Promise<DocumentoComercial[]> => {
    const response = await api.get<DocumentoComercial[]>(`/api/documentos/cliente/${clienteId}`);
    return response.data;
  },
  // Update estado of presupuesto
  updateEstado: async (id: number, estado: EstadoDocumento): Promise<DocumentoComercial> => {
    // Backend expects just the string value, not wrapped in an object
    const response = await api.put<DocumentoComercial>(`/api/documentos/${id}/estado`, JSON.stringify(estado), {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  },
  // Convert presupuesto to nota de pedido
  convertToNotaPedido: async (dto: {
    presupuestoId: number;
    metodoPago: MetodoPago;
    tipoIva: 'IVA_21' | 'IVA_10_5' | 'EXENTO';
  }): Promise<DocumentoComercial> => {
    const response = await api.post<DocumentoComercial>('/api/documentos/nota-pedido', dto);
    return response.data;
  },
  // Convert nota de pedido to factura
  convertToFactura: async (dto: { notaPedidoId: number; descuento?: number }): Promise<DocumentoComercial> => {
    const response = await api.post<DocumentoComercial>('/api/documentos/factura', dto);
    return response.data;
  },

  // Obtener presupuestos
  getPresupuestos: async (): Promise<DocumentoComercial[]> => {
    try {
      const response = await api.get<DocumentoComercial[]>(`/api/documentos/tipo/PRESUPUESTO`);
      return response.data;
    } catch (error) {
      console.error('Error fetching presupuestos:', error);
      throw error;
    }
  },


  // Obtener opciones de financiamiento de un presupuesto
  getOpcionesFinanciamiento: async (presupuestoId: number): Promise<OpcionFinanciamiento[]> => {
    try {
      const response = await api.get<OpcionFinanciamiento[]>(`/api/opciones-financiamiento/documento/${presupuestoId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching opciones:', error);
      throw error;
    }
  },

  // Seleccionar opción de financiamiento
  selectFinanciamiento: async (presupuestoId: number, opcionId: number): Promise<DocumentoComercial> => {
    try {
      const response = await api.put<DocumentoComercial>(
        `/api/documentos/presupuesto/${presupuestoId}/opcion-financiamiento/${opcionId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error selecting financiamiento:', error);
      throw error;
    }
  },

  // Crear presupuesto con opciones de financiamiento
  createPresupuesto: async (presupuestoData: CreatePresupuestoPayload): Promise<DocumentoComercial> => {
    try {
      const response = await api.post<DocumentoComercial>(`/api/documentos/presupuesto`, {
        ...presupuestoData,
        tipoIva: presupuestoData.tipoIva ?? 'IVA_21',
      });
      return response.data;
    } catch (error) {
      console.error('Error creating presupuesto:', error);
      throw error;
    }
  },

  // Crear opción de financiamiento personalizada
  createOpcionFinanciamiento: async (
    presupuestoId: number,
    opcionData: CreateOpcionFinanciamientoDTO
  ): Promise<OpcionFinanciamiento> => {
    try {
      const response = await api.post<OpcionFinanciamiento>(
        `/api/opciones-financiamiento/documento/${presupuestoId}`,
        opcionData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating opcion:', error);
      throw error;
    }
  },

  // Actualizar opción de financiamiento
  updateOpcionFinanciamiento: async (
    opcionId: number,
    opcionData: Partial<CreateOpcionFinanciamientoDTO>
  ): Promise<OpcionFinanciamiento> => {
    try {
      const response = await api.put<OpcionFinanciamiento>(
        `/api/opciones-financiamiento/${opcionId}`,
        opcionData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating opcion:', error);
      throw error;
    }
  },

  // Eliminar opción de financiamiento
  deleteOpcionFinanciamiento: async (opcionId: number): Promise<boolean> => {
    try {
      await api.delete(`/api/opciones-financiamiento/${opcionId}`);
      return true;
    } catch (error) {
      console.error('Error deleting opcion:', error);
      throw error;
    }
  },
};

