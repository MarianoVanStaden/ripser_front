import api from '../config';
import type { Banco, BancoCreateDTO } from '../../types';

export const bancoApi = {
  /**
   * GET /api/bancos
   * Obtiene todos los bancos
   */
  getAll: async (): Promise<Banco[]> => {
    const response = await api.get('/api/bancos');
    return response.data;
  },

  /**
   * GET /api/bancos/activos
   * Obtiene solo los bancos activos
   */
  getActivos: async (): Promise<Banco[]> => {
    const response = await api.get('/api/bancos/activos');
    return response.data;
  },

  /**
   * GET /api/bancos/{id}
   * Obtiene un banco por ID
   */
  getById: async (id: number): Promise<Banco> => {
    const response = await api.get(`/api/bancos/${id}`);
    return response.data;
  },

  /**
   * GET /api/bancos/codigo/{codigo}
   * Obtiene un banco por código
   */
  getByCodigo: async (codigo: string): Promise<Banco> => {
    const response = await api.get(`/api/bancos/codigo/${encodeURIComponent(codigo)}`);
    return response.data;
  },

  /**
   * POST /api/bancos
   * Crea un nuevo banco
   */
  create: async (banco: BancoCreateDTO): Promise<Banco> => {
    const response = await api.post('/api/bancos', banco);
    return response.data;
  },

  /**
   * PUT /api/bancos/{id}
   * Actualiza un banco existente
   */
  update: async (id: number, banco: Partial<BancoCreateDTO>): Promise<Banco> => {
    const response = await api.put(`/api/bancos/${id}`, banco);
    return response.data;
  },

  /**
   * DELETE /api/bancos/{id}
   * Elimina lógicamente un banco
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/bancos/${id}`);
  },
};
