import api from '../config';
import type { Client, CreateClientRequest } from '../../types';

export const clientApi = {
  // Get all clients
  getAll: async (): Promise<Client[]> => {
    const response = await api.get('/api/clientes'); // <-- updated to match backend
    return response.data;
  },

  // Get client by ID
  getById: async (id: number): Promise<Client> => {
    const response = await api.get(`/api/clientes/${id}`); // <-- updated
    return response.data;
  },

  // Create new client
  create: async (client: CreateClientRequest): Promise<Client> => {
    const response = await api.post('/api/clientes', client); // <-- updated
    return response.data;
  },

  // Update client
  update: async (id: number, client: Partial<CreateClientRequest>): Promise<Client> => {
    const response = await api.put(`/api/clientes/${id}`, client); // <-- updated
    return response.data;
  },

  // Delete client
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/clientes/${id}`); // <-- updated
  },

  // Search clients by name
  search: async (nombre: string): Promise<Client[]> => {
    const response = await api.get(`/api/clientes/buscar/${encodeURIComponent(nombre)}`); // <-- updated
    return response.data;
  },

  // Get clients by estado
  getByEstado: async (estado: string): Promise<Client[]> => {
    const response = await api.get(`/api/clientes/estado/${estado}`);
    return response.data;
  },

  // Get clients by tipo
  getByTipo: async (tipo: string): Promise<Client[]> => {
    const response = await api.get(`/api/clientes/tipo/${tipo}`);
    return response.data;
  },

  // Get clients by ciudad
  getByCiudad: async (ciudad: string): Promise<Client[]> => {
    const response = await api.get(`/api/clientes/ciudad/${encodeURIComponent(ciudad)}`);
    return response.data;
  },

  // Get clients with saldo excedido
  getSaldoExcedido: async (): Promise<Client[]> => {
    const response = await api.get('/api/clientes/saldo-excedido');
    return response.data;
  }
};
