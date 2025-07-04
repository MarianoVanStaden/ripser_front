import api from '../config';
import type { CuentaCorriente, CreateCuentaCorrienteRequest } from '../../types';

export const cuentaCorrienteApi = {
  // Get current account movements for a client
  getByClienteId: async (clienteId: number): Promise<CuentaCorriente[]> => {
    const response = await api.get(`/clientes/${clienteId}/cuenta-corriente`);
    return response.data;
  },

  // Get movement by ID
  getById: async (id: number): Promise<CuentaCorriente> => {
    const response = await api.get(`/cuenta-corriente/${id}`);
    return response.data;
  },

  // Create new movement
  create: async (movimiento: CreateCuentaCorrienteRequest): Promise<CuentaCorriente> => {
    const response = await api.post('/cuenta-corriente', movimiento);
    return response.data;
  },

  // Update movement
  update: async (id: number, movimiento: Partial<CreateCuentaCorrienteRequest>): Promise<CuentaCorriente> => {
    const response = await api.put(`/cuenta-corriente/${id}`, movimiento);
    return response.data;
  },

  // Delete movement
  delete: async (id: number): Promise<void> => {
    await api.delete(`/cuenta-corriente/${id}`);
  },

  // Get movements by date range
  getByDateRange: async (clienteId: number, fechaDesde: string, fechaHasta: string): Promise<CuentaCorriente[]> => {
    const response = await api.get(`/clientes/${clienteId}/cuenta-corriente/fecha?desde=${fechaDesde}&hasta=${fechaHasta}`);
    return response.data;
  },

  // Get movements by type
  getByTipo: async (clienteId: number, tipo: string): Promise<CuentaCorriente[]> => {
    const response = await api.get(`/clientes/${clienteId}/cuenta-corriente/tipo/${tipo}`);
    return response.data;
  },

  // Get client balance
  getBalance: async (clienteId: number): Promise<{ saldo: number }> => {
    const response = await api.get(`/clientes/${clienteId}/saldo`);
    return response.data;
  },

  // Get account summary
  getSummary: async (clienteId: number): Promise<{
    saldoActual: number;
    totalDebitos: number;
    totalCreditos: number;
    ultimoMovimiento: string;
  }> => {
    const response = await api.get(`/clientes/${clienteId}/cuenta-corriente/resumen`);
    return response.data;
  }
};
