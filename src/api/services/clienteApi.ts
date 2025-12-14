import api from '../config';
import type { Cliente, TipoCliente, EstadoCliente } from '../../types';

const BASE_PATH = '/api/clientes';

// A payload type for creating/updating that makes most fields optional
type ClientePayload = Partial<Omit<Cliente, 'id' | 'fechaAlta' | 'fechaActualizacion'>>;

// Interfaz de parámetros de filtro
export interface ClienteFilterParams {
  sucursalId?: number | null;
  tipo?: TipoCliente;
  estado?: EstadoCliente;
  term?: string; // Para búsqueda
}

export const clienteApi = {
  // Get all clients with optional filters
  getAll: async (params?: ClienteFilterParams): Promise<Cliente[]> => {
    const response = await api.get<Cliente[]>(BASE_PATH, { params });
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
