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

  // Búsqueda paginada por término. Usa el endpoint /search del backend
  // (que sí indexa nombre/apellido/email/etc.) en lugar de /api/clientes
  // con `term`, que el backend ignora silenciosamente.
  search: async (
    term: string,
    pagination: PaginationParams = {},
    extra?: Omit<ClienteFilterParams, 'term'>
  ): Promise<PageResponse<Cliente>> => {
    const response = await api.get<PageResponse<Cliente>>(`${BASE_PATH}/search`, {
      params: { q: term, ...extra, ...pagination },
    });
    return response.data;
  },

  // Typeahead search — hits GET /api/clientes/search?q=...&page=0&size=10
  searchByQuery: async (q: string, size = 10, signal?: AbortSignal): Promise<PageResponse<Cliente>> => {
    const response = await api.get<PageResponse<Cliente>>(`${BASE_PATH}/search`, {
      params: { q, page: 0, size },
      signal,
    });
    return response.data;
  },
};
