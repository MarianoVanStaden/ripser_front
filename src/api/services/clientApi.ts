import api from '../config';
import type { Cliente, CreateClientRequest, SegmentoCliente } from '../../types';

export const clientApi = {
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
  create: async (client: CreateClientRequest): Promise<Cliente> => {
    const response = await api.post('/api/clientes', client);
    return response.data;
  },

  // Update client
  update: async (id: number, client: Partial<CreateClientRequest>): Promise<Cliente> => {
    const response = await api.put(`/api/clientes/${id}`, client);
    return response.data;
  },

  // Delete client
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/clientes/${id}`);
  },

  // Search clients by name
  search: async (nombre: string): Promise<Cliente[]> => {
    const response = await api.get(`/api/clientes/buscar/${encodeURIComponent(nombre)}`);
    return response.data;
  },

  // Get clients by estado
  getByEstado: async (estado: string): Promise<Cliente[]> => {
    const response = await api.get(`/api/clientes/estado/${estado}`);
    return response.data;
  },

  // Get clients by tipo
  getByTipo: async (tipo: string): Promise<Cliente[]> => {
    const response = await api.get(`/api/clientes/tipo/${tipo}`);
    return response.data;
  },

  // Get clients by ciudad
  getByCiudad: async (ciudad: string): Promise<Cliente[]> => {
    const response = await api.get(`/api/clientes/ciudad/${encodeURIComponent(ciudad)}`);
    return response.data;
  },

  // Get clients with saldo excedido
  getSaldoExcedido: async (): Promise<Cliente[]> => {
    const response = await api.get('/api/clientes/saldo-excedido');
    return response.data;
  },

  // ========== SEGMENTACIÓN Y MÉTRICAS ==========

  // Get clients by segmento
  getBySegmento: async (segmento: SegmentoCliente): Promise<Cliente[]> => {
    const response = await api.get(`/api/clientes/segmento/${segmento}`);
    return response.data;
  },

  // Get clients en riesgo de churn
  getClientesEnRiesgoChurn: async (): Promise<Cliente[]> => {
    const response = await api.get('/api/clientes/en-riesgo-churn');
    return response.data;
  },

  // Get clientes VIP
  getClientesVIP: async (): Promise<Cliente[]> => {
    const response = await api.get('/api/clientes/segmento/VIP');
    return response.data;
  },

  // Get clientes Premium
  getClientesPremium: async (): Promise<Cliente[]> => {
    const response = await api.get('/api/clientes/segmento/PREMIUM');
    return response.data;
  },

  // Actualizar métricas del cliente (recalcular)
  actualizarMetricas: async (clienteId: number): Promise<any> => {
    const response = await api.post(`/api/clientes/${clienteId}/actualizar-metricas`);
    return response.data;
  },

  // ========== ESTADÍSTICAS ==========

  // Obtener estadísticas del dashboard
  getStatistics: async (): Promise<any> => {
    const response = await api.get('/api/dashboard/clientes/statistics');
    return response.data;
  },
};
