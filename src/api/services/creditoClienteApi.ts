import api from '../config';
import type { CreditoCliente, CreditoCreateDTO } from '../../types';
import type { PageResponse, PaginationParams } from '../../types/pagination.types';

export const creditoClienteApi = {
  // Get all creditos
  getAll: async (pagination: PaginationParams = {}): Promise<PageResponse<CreditoCliente>> => {
    const response = await api.get<PageResponse<CreditoCliente>>('/api/creditos-cliente', {
      params: { ...pagination },
    });
    return response.data;
  },

  // Get credito by ID
  getById: async (id: number): Promise<CreditoCliente> => {
    const response = await api.get(`/api/creditos-cliente/${id}`);
    return response.data;
  },

  // Create new credito
  create: async (credito: CreditoCreateDTO): Promise<CreditoCliente> => {
    const response = await api.post('/api/creditos-cliente', credito);
    return response.data;
  },

  // Anular credito
  anular: async (id: number): Promise<CreditoCliente> => {
    const response = await api.put(`/api/creditos-cliente/${id}/anular`);
    return response.data;
  },

  // Get creditos by cliente ID
  getByClienteId: async (clienteId: number): Promise<CreditoCliente[]> => {
    const response = await api.get(`/api/creditos-cliente/cliente/${clienteId}`);
    return response.data;
  },
};
