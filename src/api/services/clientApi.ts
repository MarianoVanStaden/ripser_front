import api from '../config';
import type { Client, CreateClientRequest } from '../../types';

export const clientApi = {
  // Get all clients
  getAll: async (): Promise<Client[]> => {
    const response = await api.get('/api/clients');
    return response.data;
  },

  // Get client by ID
  getById: async (id: number): Promise<Client> => {
    const response = await api.get(`/api/clients/${id}`);
    return response.data;
  },

  // Create new client
  create: async (client: CreateClientRequest): Promise<Client> => {
    const response = await api.post('/api/clients', client);
    return response.data;
  },

  // Update client
  update: async (id: number, client: Partial<CreateClientRequest>): Promise<Client> => {
    const response = await api.put(`/api/clients/${id}`, client);
    return response.data;
  },

  // Delete client
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/clients/${id}`);
  },

  // Search clients
  search: async (query: string): Promise<Client[]> => {
    const response = await api.get(`/api/clients/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }
};
