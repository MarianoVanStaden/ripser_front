import api from '../config';
import type { ProveedorProductoDTO, CreateProveedorProductoDTO } from '../../types';

export const proveedorProductoApi = {
  getByProveedor: async (proveedorId: number): Promise<ProveedorProductoDTO[]> => {
    const response = await api.get(`/api/proveedor-producto/proveedor/${proveedorId}`);
    return response.data;
  },

  getActivosByProveedor: async (proveedorId: number): Promise<ProveedorProductoDTO[]> => {
    const response = await api.get(`/api/proveedor-producto/proveedor/${proveedorId}/activos`);
    return response.data;
  },

  create: async (data: CreateProveedorProductoDTO): Promise<ProveedorProductoDTO> => {
    const response = await api.post('/api/proveedor-producto', data);
    return response.data;
  },

  activar: async (id: number): Promise<ProveedorProductoDTO> => {
    const response = await api.patch(`/api/proveedor-producto/${id}/activar`);
    return response.data;
  },

  desactivar: async (id: number): Promise<ProveedorProductoDTO> => {
    const response = await api.patch(`/api/proveedor-producto/${id}/desactivar`);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/proveedor-producto/${id}`);
  },
};
