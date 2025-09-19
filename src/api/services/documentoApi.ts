import api from '../config';
import type {
  DocumentoComercial,
  EstadoDocumento,
  DetalleDocumentoDTO,
  MetodoPago,
  OpcionFinanciamiento,
  CreateOpcionFinanciamientoDTO,
} from '../../types';

// Narrow DTO for creating presupuesto in current backend
type CreatePresupuestoPayload = {
  clienteId: number;
  usuarioId: number;
  observaciones?: string;
  detalles: DetalleDocumentoDTO[];
};

export const documentoApi = {
  // Get documentos by tipo
  getByTipo: async (tipo: string): Promise<DocumentoComercial[]> => {
    try {
      console.log('Making request to get documentos by tipo:', tipo);
  const response = await api.get(`/api/documentos/tipo/${encodeURIComponent(tipo)}`);
      console.log('Successfully retrieved documentos:', response.data?.length || 0, 'items');
      return response.data;
    } catch (err: any) {
      console.error('Error in getByTipo:', err?.response?.status, err?.response?.data);
      if (err?.response?.status === 403) {
        console.warn('Sin permisos para documentos; devolviendo lista vacía');
        throw new Error('No tiene permisos para acceder a los documentos');
      }
      throw err;
    }
  },

  // Get documento by ID
  getById: async (id: number): Promise<DocumentoComercial> => {
  const response = await api.get(`/api/documentos/${id}`);
    return response.data;
  },

  // Get documentos by cliente
  getByCliente: async (clienteId: number): Promise<DocumentoComercial[]> => {
  const response = await api.get(`/api/documentos/cliente/${clienteId}`);
    return response.data;
  },

  // Create new presupuesto
  createPresupuesto: async (presupuesto: CreatePresupuestoPayload): Promise<DocumentoComercial> => {
    try {
  const response = await api.post('/api/documentos/presupuesto', presupuesto);
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 403) {
        throw new Error('No tiene permisos para crear presupuestos');
      }
      throw err;
    }
  },

  // Update estado of presupuesto
  updateEstado: async (id: number, estado: EstadoDocumento): Promise<DocumentoComercial> => {
    try {
  const response = await api.put(`/api/documentos/${id}/estado`, { estado });
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 403) {
        throw new Error('No tiene permisos para actualizar el estado del documento');
      }
      throw err;
    }
  },

  // Convert presupuesto to nota de pedido
  convertToNotaPedido: async (dto: {
    presupuestoId: number;
    metodoPago: MetodoPago;
    tipoIva: 'IVA_21' | 'IVA_10_5' | 'EXENTO';
  }): Promise<DocumentoComercial> => {
    try {
  const response = await api.post('/api/documentos/nota-pedido', dto);
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 403) {
        throw new Error('No tiene permisos para convertir presupuestos');
      }
      throw err;
    }
  },

  // Convert nota de pedido to factura
  convertToFactura: async (dto: { notaPedidoId: number; descuento?: number }): Promise<DocumentoComercial> => {
    try {
  const response = await api.post('/api/documentos/factura', dto);
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 403) {
        throw new Error('No tiene permisos para convertir a factura');
      }
      throw err;
    }
  },

  // Seleccionar opción de financiamiento
  selectFinanciamiento: async (presupuestoId: number, opcionId: number): Promise<DocumentoComercial> => {
    try {
  const response = await api.put(`/api/documentos/presupuesto/${presupuestoId}/opcion-financiamiento/${opcionId}`);
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 403) {
        throw new Error('No tiene permisos para seleccionar opciones de financiamiento');
      }
      throw err;
    }
  },


// Obtener opciones de financiamiento de un presupuesto
getOpcionesFinanciamiento: async (presupuestoId: number): Promise<OpcionFinanciamiento[]> => {
  try {
    const response = await api.get(`/opciones-financiamiento/documento/${presupuestoId}`);
    return response.data;
  } catch (err: any) {
    if (err?.response?.status === 403) {
      throw new Error('No tiene permisos para obtener opciones de financiamiento');
    }
    throw err;
  }
},

// Crear opción de financiamiento personalizada
createOpcionFinanciamiento: async (presupuestoId: number, opcion: CreateOpcionFinanciamientoDTO): Promise<OpcionFinanciamiento> => {
  try {
    const response = await api.post(`/opciones-financiamiento/documento/${presupuestoId}`, opcion);
    return response.data;
  } catch (err: any) {
    if (err?.response?.status === 403) {
      throw new Error('No tiene permisos para crear opciones de financiamiento');
    }
    throw err;
  }
},

// Actualizar opción de financiamiento
updateOpcionFinanciamiento: async (presupuestoId: number, opcionId: number, opcion: Partial<OpcionFinanciamiento>): Promise<OpcionFinanciamiento> => {
  try {
    const response = await api.put(`/opciones-financiamiento/${opcionId}`, opcion);
    return response.data;
  } catch (err: any) {
    if (err?.response?.status === 403) {
      throw new Error('No tiene permisos para actualizar opciones de financiamiento');
    }
    throw err;
  }
},

// Eliminar opción de financiamiento
deleteOpcionFinanciamiento: async (presupuestoId: number, opcionId: number): Promise<void> => {
  try {
    await api.delete(`/opciones-financiamiento/${opcionId}`);
  } catch (err: any) {
    if (err?.response?.status === 403) {
      throw new Error('No tiene permisos para eliminar opciones de financiamiento');
    }
    throw err;
  }
},
};

export default documentoApi;

