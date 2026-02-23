import api from '../config';
import type { ContactoCliente, CreateContactoClienteRequest } from '../../types';
import type { PageResponse, PaginationParams } from '../../types/pagination.types';

export interface ContactoClienteFilterParams {
  clienteId?: number;
  fechaInicio?: string;
  fechaFin?: string;
}

export const contactoClienteApi = {
  // Get all contacts with optional filters (paginated)
  getAll: async (pagination: PaginationParams = {}, params?: ContactoClienteFilterParams): Promise<PageResponse<ContactoCliente>> => {
    const response = await api.get<PageResponse<ContactoCliente>>('/api/contactos-cliente', {
      params: { ...params, ...pagination },
    });
    return response.data;
  },

  /**
   * @deprecated Use getAll({ clienteId }, pagination) instead
   */
  // Get all contacts for a client
  getByClienteId: async (clienteId: number, pagination: PaginationParams = {}): Promise<PageResponse<ContactoCliente>> => {
    return contactoClienteApi.getAll(pagination, { clienteId });
  },

  /**
   * @deprecated Use getAll({ fechaInicio, fechaFin }, pagination) instead
   */
  // Get próximos contactos (date range)
  getProximos: async (fechaInicio: string, fechaFin: string, pagination: PaginationParams = {}): Promise<PageResponse<ContactoCliente>> => {
    return contactoClienteApi.getAll(pagination, { fechaInicio, fechaFin });
  },

  // Create new contact
  create: async (contacto: CreateContactoClienteRequest): Promise<ContactoCliente> => {
    const response = await api.post('/clientes/contactos', contacto);
    return response.data;
  },

  // Update contact
  update: async (id: number, contacto: Partial<CreateContactoClienteRequest>): Promise<ContactoCliente> => {
    const response = await api.put(`/clientes/contactos/${id}`, contacto);
    return response.data;
  },

  // Delete contact
  delete: async (id: number): Promise<void> => {
    await api.delete(`/clientes/contactos/${id}`);
  },
};
