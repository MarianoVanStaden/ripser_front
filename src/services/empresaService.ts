import api from '../api';
import type { Empresa, CreateEmpresaDTO, UpdateEmpresaDTO } from '../types';

export const empresaService = {
  /**
   * Get all empresas
   */
  getAll: async (): Promise<Empresa[]> => {
    const response = await api.get<Empresa[]>('/api/empresas');
    return response.data;
  },

  /**
   * Get only active empresas
   */
  getActive: async (): Promise<Empresa[]> => {
    const response = await api.get<Empresa[]>('/api/empresas/activas');
    return response.data;
  },

  /**
   * Get empresa by ID
   */
  getById: async (id: number): Promise<Empresa> => {
    const response = await api.get<Empresa>(`/api/empresas/${id}`);
    return response.data;
  },

  /**
   * Create new empresa
   */
  create: async (empresa: CreateEmpresaDTO): Promise<Empresa> => {
    const response = await api.post<Empresa>('/api/empresas', empresa);
    return response.data;
  },

  /**
   * Update empresa
   */
  update: async (id: number, empresa: UpdateEmpresaDTO): Promise<Empresa> => {
    const response = await api.put<Empresa>(`/api/empresas/${id}`, empresa);
    return response.data;
  },

  /**
   * Suspend empresa
   */
  suspend: async (id: number): Promise<Empresa> => {
    const response = await api.post<Empresa>(`/api/empresas/${id}/suspender`, {});
    return response.data;
  },

  /**
   * Reactivate empresa
   */
  reactivate: async (id: number): Promise<Empresa> => {
    const response = await api.post<Empresa>(`/api/empresas/${id}/reactivar`, {});
    return response.data;
  },

  /**
   * Delete empresa (soft delete)
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/empresas/${id}`);
  }
};
