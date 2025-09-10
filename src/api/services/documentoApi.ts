import api from '../config';
import type {
  DocumentoComercial,
  EstadoDocumento,
  DetalleDocumento,
  MetodoPago,
  DetalleDocumentoDTO,
} from '../../types';

// Narrow DTO for creating presupuesto in current backend
type CreatePresupuestoPayload = {
  clienteId: number;
  usuarioId: number;
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
    throw new Error('Create documento endpoint not implemented in backend');
  },
  // Update documento - Note: This endpoint doesn't exist in backend
  update: async (_id: number, _documentoData: Partial<DocumentoComercial> & { detalles?: DetalleDocumento[] }): Promise<DocumentoComercial> => {
    throw new Error('Update documento endpoint not implemented in backend');
  },
  // Delete documento - Note: This endpoint doesn't exist in backend
  delete: async (_id: number): Promise<void> => {
    throw new Error('Delete documento endpoint not implemented in backend');
  },
  // Change estado of documento
  changeEstado: async (id: number, nuevoEstado: EstadoDocumento): Promise<DocumentoComercial> => {
    const response = await api.put(`/api/documentos/${id}/estado`, nuevoEstado);
    return response.data;
  },
  // Search documentos by numeroDocumento - Note: This endpoint doesn't exist in backend
  searchByNumero: async (_term: string): Promise<DocumentoComercial[]> => {
    throw new Error('Search by numero endpoint not implemented in backend');
  },
  // Get documentos by estado - Note: This endpoint doesn't exist in backend
  getByEstado: async (_estado: EstadoDocumento): Promise<DocumentoComercial[]> => {
    throw new Error('Get by estado endpoint not implemented in backend');
  },
  // Get documentos within a date range - Note: This endpoint doesn't exist in backend
  getByFecha: async (_fechaInicio: string, _fechaFin: string): Promise<DocumentoComercial[]> => {
    throw new Error('Get by fecha endpoint not implemented in backend');
  },
  // Get documentos by tipo
  getByTipo: async (tipo: string): Promise<DocumentoComercial[]> => {
    try {
      const response = await api.get(`/api/documentos/tipo/${encodeURIComponent(tipo)}`);
      return response.data; // Backend returns List<DocumentoComercialDTO>
    } catch (err: any) {
      if (err?.response?.status === 403) {
        console.warn('Sin permisos para documentos; devolviendo lista vacía');
        return [];
      }
      throw err;
    }
  },
  // Get documentos by cliente
  getByCliente: async (clienteId: number): Promise<DocumentoComercial[]> => {
    const response = await api.get(`/api/documentos/cliente/${clienteId}`);
    return response.data;
  },
  // Create new presupuesto
  createPresupuesto: async (presupuesto: CreatePresupuestoPayload): Promise<DocumentoComercial> => {
    const response = await api.post('/api/documentos/presupuesto', presupuesto);
    return response.data;
  },
  // Update estado of presupuesto
  updateEstado: async (id: number, estado: EstadoDocumento): Promise<DocumentoComercial> => {
    const response = await api.put(`/api/documentos/${id}/estado`, estado);
    return response.data;
  },
  // Convert presupuesto to nota de pedido
  convertToNotaPedido: async (dto: {
    presupuestoId: number;
    metodoPago: MetodoPago;
    tipoIva: 'IVA_21' | 'IVA_10_5' | 'EXENTO';
  }): Promise<DocumentoComercial> => {
    const response = await api.post('/api/documentos/nota-pedido', dto);
    return response.data;
  },
  // Convert nota de pedido to factura
  convertToFactura: async (dto: { notaPedidoId: number; descuento?: number }): Promise<DocumentoComercial> => {
    const response = await api.post('/api/documentos/factura', dto);
    return response.data;
  },
};

