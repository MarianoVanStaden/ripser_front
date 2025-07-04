import api from '../config';
import type { ContactoCliente, CreateContactoClienteRequest } from '../../types';

export const contactoClienteApi = {
  // Get all contacts for a client
  getByClienteId: async (clienteId: number): Promise<ContactoCliente[]> => {
    const response = await api.get(`/clientes/${clienteId}/contactos`);
    return response.data;
  },

  // Get contact by ID
  getById: async (id: number): Promise<ContactoCliente> => {
    const response = await api.get(`/contactos-cliente/${id}`);
    return response.data;
  },

  // Create new contact
  create: async (contacto: CreateContactoClienteRequest): Promise<ContactoCliente> => {
    const response = await api.post('/contactos-cliente', contacto);
    return response.data;
  },

  // Update contact
  update: async (id: number, contacto: Partial<CreateContactoClienteRequest>): Promise<ContactoCliente> => {
    const response = await api.put(`/contactos-cliente/${id}`, contacto);
    return response.data;
  },

  // Delete contact
  delete: async (id: number): Promise<void> => {
    await api.delete(`/contactos-cliente/${id}`);
  },

  // Get contacts by type
  getByTipo: async (tipo: string): Promise<ContactoCliente[]> => {
    const response = await api.get(`/contactos-cliente/tipo/${tipo}`);
    return response.data;
  },

  // Get contacts by date range
  getByDateRange: async (fechaDesde: string, fechaHasta: string): Promise<ContactoCliente[]> => {
    const response = await api.get(`/contactos-cliente/fecha?desde=${fechaDesde}&hasta=${fechaHasta}`);
    return response.data;
  },

  // Get pending contacts (próximo contacto)
  getPending: async (): Promise<ContactoCliente[]> => {
    const response = await api.get('/contactos-cliente/pendientes');
    return response.data;
  }
};
