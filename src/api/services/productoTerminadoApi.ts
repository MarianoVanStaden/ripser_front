import api from '../config';
import type { ProductoTerminado } from '../../types';

export const productoTerminadoApi = {
  // Get all productos terminados
  getAll: async (): Promise<ProductoTerminado[]> => {
    const response = await api.get('/api/productos');
    return response.data;
  },

  // Get productos activos
  getActivos: async (): Promise<ProductoTerminado[]> => {
    const response = await api.get('/api/productos/activos');
    return response.data;
  },

  // Get producto by ID
  getById: async (id: number): Promise<ProductoTerminado> => {
    const response = await api.get(`/api/productos/${id}`);
    return response.data;
  },

  // Get producto by codigo
  getByCodigo: async (codigo: string): Promise<ProductoTerminado> => {
    const response = await api.get(`/api/productos/codigo/${codigo}`);
    return response.data;
  },

  // Get productos by categoria
  getByCategoria: async (categoriaId: number): Promise<ProductoTerminado[]> => {
    const response = await api.get(`/api/productos/categoria/${categoriaId}`);
    return response.data;
  },

  // Buscar productos por nombre
  buscar: async (nombre: string): Promise<ProductoTerminado[]> => {
    const response = await api.get(`/api/productos/buscar/${nombre}`);
    return response.data;
  },

  // Get productos bajo stock
  getBajoStock: async (): Promise<ProductoTerminado[]> => {
    const response = await api.get('/api/productos/bajo-stock');
    return response.data;
  },

  // Get productos con garantia
  getConGarantia: async (): Promise<ProductoTerminado[]> => {
    const response = await api.get('/api/productos/con-garantia');
    return response.data;
  },

  // Create new producto terminado
  create: async (producto: ProductoTerminado): Promise<ProductoTerminado> => {
    const response = await api.post('/api/productos', producto);
    return response.data;
  },

  // Update producto terminado
  update: async (id: number, producto: ProductoTerminado): Promise<ProductoTerminado> => {
    const response = await api.put(`/api/productos/${id}`, producto);
    return response.data;
  },

  // Delete producto terminado
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/productos/${id}`);
  }
};
