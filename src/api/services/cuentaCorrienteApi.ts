import api from '../config';
import type { CuentaCorriente } from '../../types';

export const cuentaCorrienteApi = {
  // Get cuenta corriente by cliente
  getByCliente: async (clienteId: number): Promise<CuentaCorriente[]> => {
    const response = await api.get(`/api/clientes/cuenta-corriente/cliente/${clienteId}`);
    return response.data;
  },

  // Get saldo by cliente
  getSaldo: async (clienteId: number): Promise<number> => {
    const response = await api.get(`/api/clientes/cuenta-corriente/saldo/${clienteId}`);
    return response.data;
  },

  // Create movimiento
  create: async (movimiento: CuentaCorriente): Promise<CuentaCorriente> => {
    const response = await api.post('/api/clientes/cuenta-corriente', movimiento);
    return response.data;
  },
};
