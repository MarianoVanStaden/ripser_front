import api from '../config';
import type { Cliente, CreateClienteRequest } from '../../types';

export const clienteApi = {
  // Get all clients
  getAll: async (): Promise<Cliente[]> => {
    const response = await api.get('/api/clientes');
    return response.data;
  },

  // Get client by ID
  getById: async (id: number): Promise<Cliente> => {
    const response = await api.get(`/api/clientes/${id}`);
    return response.data;
  },

  // Create new client
  create: async (cliente: CreateClienteRequest): Promise<Cliente> => {
    const response = await api.post('/api/clientes', cliente);
    return response.data;
  },

  // Update client
  update: async (id: number, cliente: Partial<CreateClienteRequest>): Promise<Cliente> => {
    const response = await api.put(`/api/clientes/${id}`, cliente);
    return response.data;
  },

  // Delete client
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/clientes/${id}`);
  },

  // Search clients
  search: async (query: string): Promise<Cliente[]> => {
    const response = await api.get(`/api/clientes/buscar?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Get clients by state
  getByEstado: async (estado: string): Promise<Cliente[]> => {
    const response = await api.get(`/api/clientes/estado/${estado}`);
    return response.data;
  },

  // Get clients by type
  getByTipo: async (tipo: string): Promise<Cliente[]> => {
    const response = await api.get(`/api/clientes/tipo/${tipo}`);
    return response.data;
  },

  // Update client credit limit
  updateCreditLimit: async (id: number, limite: number): Promise<Cliente> => {
    const response = await api.put(`/api/clientes/${id}/limite-credito`, { limiteCredito: limite });
    return response.data;
  },

  // Update client state
  updateEstado: async (id: number, estado: string): Promise<Cliente> => {
    const response = await api.put(`/api/clientes/${id}/estado`, { estado });
    return response.data;
  }
};
