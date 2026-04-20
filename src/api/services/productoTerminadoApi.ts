import api from '../config';
import type { ProductoTerminado } from '../../types';

const BASE = '/api/productos-terminados';

export const productoTerminadoApi = {
  getAll: async (): Promise<ProductoTerminado[]> => {
    const response = await api.get(BASE);
    return response.data;
  },

  getActivos: async (): Promise<ProductoTerminado[]> => {
    const response = await api.get(`${BASE}/activos`);
    return response.data;
  },

  getById: async (id: number): Promise<ProductoTerminado> => {
    const response = await api.get(`${BASE}/${id}`);
    return response.data;
  },

  getByCodigo: async (codigo: string): Promise<ProductoTerminado> => {
    const response = await api.get(`${BASE}/codigo/${codigo}`);
    return response.data;
  },

  getByCategoria: async (categoriaId: number): Promise<ProductoTerminado[]> => {
    const response = await api.get(`${BASE}/categoria/${categoriaId}`);
    return response.data;
  },

  getBajoStock: async (): Promise<ProductoTerminado[]> => {
    const response = await api.get(`${BASE}/bajo-stock`);
    return response.data;
  },

  create: async (producto: Omit<ProductoTerminado, 'id' | 'fechaCreacion' | 'tipoEntidad'>): Promise<ProductoTerminado> => {
    const response = await api.post(BASE, producto);
    return response.data;
  },

  update: async (id: number, producto: Partial<ProductoTerminado>): Promise<ProductoTerminado> => {
    const response = await api.put(`${BASE}/${id}`, producto);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },
};

export default productoTerminadoApi;
