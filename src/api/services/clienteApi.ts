import api from '../config';
import type { Cliente, TipoCliente, EstadoCliente, PageResponse, PaginationParams } from '../../types';

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
  // Get all clients with optional filters (paginated)
  getAll: async (pagination: PaginationParams = {}, params?: ClienteFilterParams): Promise<PageResponse<Cliente>> => {
    const response = await api.get<PageResponse<Cliente>>(BASE_PATH, {
      params: { ...params, ...pagination },
    });
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

  // Search clients (paginated)
  search: async (term: string, pagination: PaginationParams = {}): Promise<PageResponse<Cliente>> => {
    // Use getAll with term filter
    return clienteApi.getAll(pagination, { term });
  },
};
