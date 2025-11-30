import api from '../api';
import type { Sucursal, CreateSucursalDTO, UpdateSucursalDTO } from '../types';

export const sucursalService = {
  /**
   * Get all sucursales for a specific empresa
   */
  getByEmpresa: async (empresaId: number): Promise<Sucursal[]> => {
    const response = await api.get<Sucursal[]>(`/api/sucursales/empresa/${empresaId}`);
    return response.data;
  },

  /**
   * Get sucursal by ID
   */
  getById: async (id: number): Promise<Sucursal> => {
    const response = await api.get<Sucursal>(`/api/sucursales/${id}`);
    return response.data;
  },

  /**
   * Create new sucursal
   */
  create: async (sucursal: CreateSucursalDTO): Promise<Sucursal> => {
    const response = await api.post<Sucursal>('/api/sucursales', sucursal);
    return response.data;
  },

  /**
   * Update sucursal
   */
  update: async (id: number, sucursal: UpdateSucursalDTO): Promise<Sucursal> => {
    const response = await api.put<Sucursal>(`/api/sucursales/${id}`, sucursal);
    return response.data;
  },

  /**
   * Set sucursal as principal (main branch)
   */
  setPrincipal: async (id: number): Promise<Sucursal> => {
    const response = await api.post<Sucursal>(`/api/sucursales/${id}/establecer-principal`, {});
    return response.data;
  },

  /**
   * Delete sucursal (soft delete)
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/sucursales/${id}`);
  }
};
