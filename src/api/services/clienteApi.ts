import api from '../config';
import type { Cliente, CreateClienteRequest } from '../../types';

export const clienteApi = {
  // Get all clients
  getAll: async (): Promise<Cliente[]> => {
    const response = await api.get('/clientes');
    return response.data;
  },

  // Get client by ID
  getById: async (id: number): Promise<Cliente> => {
    const response = await api.get(`/clientes/${id}`);
    return response.data;
  },

  // Create new client
  create: async (cliente: CreateClienteRequest): Promise<Cliente> => {
    const response = await api.post('/clientes', cliente);
    return response.data;
  },

  // Update client
  update: async (id: number, cliente: Partial<CreateClienteRequest>): Promise<Cliente> => {
    const response = await api.put(`/clientes/${id}`, cliente);
    return response.data;
  },

  // Delete client
  delete: async (id: number): Promise<void> => {
    await api.delete(`/clientes/${id}`);
  },

  // Search clients
  search: async (query: string): Promise<Cliente[]> => {
    const response = await api.get(`/clientes/buscar?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Get clients by state
  getByEstado: async (estado: string): Promise<Cliente[]> => {
    const response = await api.get(`/clientes/estado/${estado}`);
    return response.data;
  },

  // Get clients by type
  getByTipo: async (tipo: string): Promise<Cliente[]> => {
    const response = await api.get(`/clientes/tipo/${tipo}`);
    return response.data;
  },

  // Update client credit limit
  updateCreditLimit: async (id: number, limite: number): Promise<Cliente> => {
    const response = await api.put(`/clientes/${id}/limite-credito`, { limiteCredito: limite });
    return response.data;
  },

  // Update client state
  updateEstado: async (id: number, estado: string): Promise<Cliente> => {
    const response = await api.put(`/clientes/${id}/estado`, { estado });
    return response.data;
  }
};
