import api from '../config';
import type { ContactoCliente, CreateContactoClienteRequest } from '../../types';

export const contactoClienteApi = {
  // Get all contacts for a client
  getByClienteId: async (clienteId: number): Promise<ContactoCliente[]> => {
    const response = await api.get(`/clientes/contactos/cliente/${clienteId}`);
    return response.data;
  },

  // Get próximos contactos (date range)
  getProximos: async (fechaInicio: string, fechaFin: string): Promise<ContactoCliente[]> => {
    const response = await api.get(`/clientes/contactos/proximos?fechaInicio=${encodeURIComponent(fechaInicio)}&fechaFin=${encodeURIComponent(fechaFin)}`);
    return response.data;
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
};
