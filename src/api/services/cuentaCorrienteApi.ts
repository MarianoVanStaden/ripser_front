import api from '../config';
import type { CuentaCorriente, CreateMovimientoPayload } from '../../types';

export const cuentaCorrienteApi = {
  /**
   * Fetches all account movements for a specific client.
   */
  getByClienteId: async (clienteId: number): Promise<CuentaCorriente[]> => {
    const res = await api.get(`/api/cuentas-corriente/cliente/${clienteId}`);
    return res.data;
  },

  /**
   * Creates a new account movement.
   */
  create: async (movimiento: CreateMovimientoPayload): Promise<CuentaCorriente> => {
    const response = await api.post(`/api/cuentas-corriente`, movimiento);
    return response.data;
  },
};