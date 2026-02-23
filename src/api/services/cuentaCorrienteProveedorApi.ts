import api from '../config';
import type { CuentaCorrienteProveedor, CreateMovimientoProveedorPayload } from '../../types';
import type { PageResponse, PaginationParams } from '../../types/pagination.types';

export const cuentaCorrienteProveedorApi = {
  // Get all movimientos
  getAll: async (pagination: PaginationParams = {}): Promise<PageResponse<CuentaCorrienteProveedor>> => {
    const response = await api.get<PageResponse<CuentaCorrienteProveedor>>('/api/cuenta-corriente-proveedor', {
      params: { ...pagination },
    });
    return response.data;
  },

  // Get movimiento by ID
  getById: async (id: number): Promise<CuentaCorrienteProveedor> => {
    const response = await api.get(`/api/cuenta-corriente-proveedor/${id}`);
    return response.data;
  },

  // Get movimientos by proveedor
  getByProveedorId: async (proveedorId: number): Promise<CuentaCorrienteProveedor[]> => {
    const response = await api.get(`/api/cuenta-corriente-proveedor/proveedor/${proveedorId}`);
    return response.data;
  },

  // Create movimiento
  create: async (payload: CreateMovimientoProveedorPayload): Promise<CuentaCorrienteProveedor> => {
    const response = await api.post('/api/cuenta-corriente-proveedor', payload);
    return response.data;
  },

  // Delete movimiento
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/cuenta-corriente-proveedor/${id}`);
  },
};
