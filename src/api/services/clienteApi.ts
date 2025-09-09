import api from '../config';
import type { Cliente } from '../../types';

const BASE_PATH = '/clientes';

// A payload type for creating/updating that makes most fields optional
type ClientePayload = Partial<Omit<Cliente, 'id' | 'fechaAlta' | 'fechaActualizacion'>>;

export const clienteApi = {
  // Get all clients
  getAll: async (): Promise<Cliente[]> => {
    const response = await api.get<Cliente[]>(BASE_PATH);
    return response.data;
  },

  // Get client by ID
  getById: async (id: number): Promise<Cliente> => {
    const response = await api.get<Cliente>(`${BASE_PATH}/${id}`);
    return response.data;
  },

  // Create new client
  create: async (clienteData: ClientePayload): Promise<Cliente> => {
    const response = await api.post<Cliente>(BASE_PATH, clienteData);
    return response.data;
  },

  // Update client
  update: async (id: number, clienteData: ClientePayload): Promise<Cliente> => {
    const response = await api.put<Cliente>(`${BASE_PATH}/${id}`, clienteData);
    return response.data;
  },

  // Delete client
  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },

  // Search clients
  search: async (term: string): Promise<Cliente[]> => {
    // Assuming a search endpoint exists on the backend
    const response = await api.get<Cliente[]>(`${BASE_PATH}/search`, { params: { q: term } });
    return response.data;
  },
};
