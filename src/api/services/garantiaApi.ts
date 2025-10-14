import api from '../api';

// ==================== TYPES ====================
export interface GarantiaDTO {
  id: number;
  producto: {
    id: number;
    nombre: string;
  };
  venta: {
    id: number;
    numeroComprobante?: string;
  };
  numeroSerie: string;
  fechaCompra: string; // LocalDate
  fechaVencimiento: string; // LocalDate
  estado: 'VIGENTE' | 'VENCIDA' | 'ANULADA';
  observaciones?: string;
}

export interface GarantiaCreateDTO {
  productoId: number;
  ventaId: number;
  numeroSerie: string;
  fechaCompra: string;
  fechaVencimiento: string;
  estado: 'VIGENTE' | 'VENCIDA' | 'ANULADA';
  observaciones?: string;
}

// ==================== GARANTIAS API ====================
export const garantiaApi = {
  // GET /api/garantias
  findAll: async (): Promise<GarantiaDTO[]> => {
    const response = await api.get('/api/garantias');
    return response.data;
  },

  // GET /api/garantias/{id}
  findById: async (id: number): Promise<GarantiaDTO> => {
    const response = await api.get(`/api/garantias/${id}`);
    return response.data;
  },

  // POST /api/garantias
  create: async (data: GarantiaCreateDTO): Promise<GarantiaDTO> => {
    const response = await api.post('/api/garantias', data);
    return response.data;
  },

  // PUT /api/garantias/{id}/anular
  anular: async (id: number): Promise<GarantiaDTO> => {
    const response = await api.put(`/api/garantias/${id}/anular`);
    return response.data;
  },

  // GET /api/garantias/producto/{productoId}
  findByProductoId: async (productoId: number): Promise<GarantiaDTO[]> => {
    const response = await api.get(`/api/garantias/producto/${productoId}`);
    return response.data;
  },

  // GET /api/garantias/venta/{ventaId}
  findByVentaId: async (ventaId: number): Promise<GarantiaDTO[]> => {
    const response = await api.get(`/api/garantias/venta/${ventaId}`);
    return response.data;
  },
};
