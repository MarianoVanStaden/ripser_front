import api from '../config';
import type { Compra, CreateCompraDTO, CompraDTO} from '../../types';

export const compraApi = {
  // Get all compras
  getAll: async (): Promise<Compra[]> => {
    const response = await api.get('/api/compras');
    return response.data;
  },

  // Get compra by ID
  getById: async (id: number): Promise<Compra> => {
    const response = await api.get(`/api/compras/${id}`);
    return response.data;
  },

  // Get compras by proveedor
  getByProveedor: async (proveedorId: number): Promise<Compra[]> => {
    const response = await api.get(`/api/compras/proveedor/${proveedorId}`);
    return response.data;
  },

  // Get compras by estado
  getByEstado: async (estado: string): Promise<Compra[]> => {
    const response = await api.get(`/api/compras/estado/${estado}`);
    return response.data;
  },

  // Get total compras for proveedor in date range (fechaInicio, fechaFin as ISO string)
  getTotalProveedor: async (proveedorId: number, fechaInicio: string, fechaFin: string): Promise<string> => {
    const response = await api.get(`/api/compras/total-proveedor/${proveedorId}`, {
      params: { fechaInicio, fechaFin }
    });
    return response.data;
  },

  // Create new compra
  create: async (compra: Compra): Promise<Compra> => {
    const response = await api.post('/api/compras', compra);
    return response.data;
  },

  // Update compra
// In compraApi.ts
async update(id: number, compra: CreateCompraDTO): Promise<CompraDTO> {
  const response = await fetch(`/api/compras/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(compra),
  });
  if (!response.ok) {
    throw new Error('Failed to update compra');
  }
  return response.json();
}
};
